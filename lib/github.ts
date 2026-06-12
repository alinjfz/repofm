import OpenAI from "openai";
import type { RepoContext } from "@/lib/types";

type GitHubRepo = {
  full_name: string;
  description: string | null;
  default_branch: string;
};

type GitHubTreeItem = {
  path: string;
  type: "blob" | "tree";
  size?: number;
};

const TEXT_FILE_PATTERN = /\.(ts|tsx|js|jsx|mjs|cjs|py|rb|go|rs|java|cs|php|swift|kt|md|mdx|json|yml|yaml|toml|css|scss|html)$/i;
const BORING_PATHS = [
  "node_modules/",
  "dist/",
  "build/",
  ".next/",
  "coverage/",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock"
];

export function parseGitHubUrl(input: string) {
  const trimmed = input.trim();
  const match = trimmed.match(/github\.com[:/](?<owner>[^/\s]+)\/(?<repo>[^/\s#?]+)(?:[/?#].*)?$/i);

  if (!match?.groups) {
    throw new Error("Enter a valid GitHub repository URL, for example https://github.com/expressjs/express.");
  }

  return {
    owner: match.groups.owner,
    repo: match.groups.repo.replace(/\.git$/, "")
  };
}

export async function getRepoContext(repoUrl: string): Promise<RepoContext> {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  const repoMeta = await githubFetch<GitHubRepo>(`https://api.github.com/repos/${owner}/${repo}`);
  const repoName = repoMeta.full_name;

  const [readme, tree, commits] = await Promise.all([
    fetchReadme(owner, repo),
    fetchTree(owner, repo, repoMeta.default_branch),
    fetchCommits(owner, repo)
  ]);

  const candidates = tree
    .filter((item) => item.type === "blob")
    .filter((item) => TEXT_FILE_PATTERN.test(item.path))
    .filter((item) => !BORING_PATHS.some((boring) => item.path.includes(boring)))
    .filter((item) => (item.size ?? 0) < 80_000)
    .slice(0, 300);

  const pickedPaths = await pickInterestingFiles(repoName, candidates.map((item) => item.path));
  const selectedFiles = await fetchSelectedFiles(owner, repo, pickedPaths);

  return {
    repoUrl,
    repoName,
    description: repoMeta.description,
    readme,
    selectedFiles,
    commits
  };
}

async function githubFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
    },
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}) for ${url}`);
  }

  return response.json() as Promise<T>;
}

async function fetchReadme(owner: string, repo: string) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: {
      Accept: "application/vnd.github.raw",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
    },
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    return "No README was found. The hosts should mention that they had to infer the project from files and commits.";
  }

  return truncate(await response.text(), 16_000);
}

async function fetchTree(owner: string, repo: string, branch: string) {
  const data = await githubFetch<{ tree: GitHubTreeItem[] }>(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );

  return data.tree ?? [];
}

async function fetchCommits(owner: string, repo: string) {
  const data = await githubFetch<
    Array<{
      commit: {
        message: string;
        author?: {
          name?: string;
          date?: string;
        };
      };
      author?: {
        login?: string;
      } | null;
    }>
  >(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=20`);

  return data.map((commit) => ({
    message: commit.commit.message.split("\n")[0] ?? "No commit message",
    author: commit.author?.login ?? commit.commit.author?.name ?? "unknown",
    date: commit.commit.author?.date ?? ""
  }));
}

async function pickInterestingFiles(repoName: string, paths: string[]) {
  if (!process.env.OPENAI_API_KEY) {
    return heuristicFilePick(paths);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You pick files that best explain how a GitHub repository works. Return JSON only: {\"files\":[\"path\"]}. Pick exactly 5 files when possible."
      },
      {
        role: "user",
        content: `Repository: ${repoName}\n\nFile tree:\n${paths.slice(0, 260).join("\n")}`
      }
    ]
  });

  const parsed = JSON.parse(response.choices[0]?.message.content ?? "{\"files\":[]}") as { files?: string[] };
  const picked = (parsed.files ?? []).filter((path) => paths.includes(path)).slice(0, 5);

  return picked.length > 0 ? picked : heuristicFilePick(paths);
}

function heuristicFilePick(paths: string[]) {
  const priority = [
    "package.json",
    "src/index.ts",
    "src/index.tsx",
    "src/app.ts",
    "app/page.tsx",
    "pages/index.tsx",
    "README.md"
  ];

  const picked = priority.filter((path) => paths.includes(path));
  const scored = paths
    .filter((path) => !picked.includes(path))
    .sort((a, b) => scorePath(b) - scorePath(a))
    .slice(0, 5 - picked.length);

  return [...picked, ...scored].slice(0, 5);
}

function scorePath(path: string) {
  let score = 0;
  if (path.includes("src/")) score += 3;
  if (path.includes("app/")) score += 2;
  if (/index|main|server|route|api|client|config/i.test(path)) score += 3;
  if (/test|spec|fixture|mock/i.test(path)) score -= 4;
  return score - path.split("/").length * 0.2;
}

async function fetchSelectedFiles(owner: string, repo: string, paths: string[]) {
  const files = await Promise.all(
    paths.map(async (path) => {
      const response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${path}`, {
        next: { revalidate: 60 }
      });

      return {
        path,
        content: response.ok ? truncate(await response.text(), 6_000) : "Could not fetch this file."
      };
    })
  );

  return files;
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max)}\n\n[truncated]` : value;
}

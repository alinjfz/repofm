import type { HostTemplateId } from "@/lib/templates";

export type ScriptSegment = {
  host: "alex" | "sam";
  text: string;
};

export type Episode = {
  id: string;
  user_id: string | null;
  repo_url: string;
  repo_name: string;
  repo_description: string | null;
  template: HostTemplateId;
  script: ScriptSegment[];
  audio_url: string | null;
  created_at: string;
};

export type RepoContext = {
  repoUrl: string;
  repoName: string;
  description: string | null;
  readme: string;
  selectedFiles: Array<{
    path: string;
    content: string;
  }>;
  commits: Array<{
    message: string;
    author: string;
    date: string;
  }>;
};

export type GenerationStep =
  | "queued"
  | "analyzing-readme"
  | "picking-files"
  | "writing-script"
  | "recording-hosts"
  | "saving-episode"
  | "complete"
  | "failed";

export type GenerationJob = {
  id: string;
  status: GenerationStep;
  message: string;
  progress: number;
  episodeId?: string;
  error?: string;
  createdAt: string;
};

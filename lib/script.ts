import OpenAI from "openai";
import { z } from "zod";
import type { HostTemplate } from "@/lib/templates";
import type { RepoContext, ScriptSegment } from "@/lib/types";

const scriptSchema = z.object({
  script: z
    .array(
      z.object({
        host: z.enum(["alex", "sam"]),
        text: z.string().min(1).max(900)
      })
    )
    .min(6)
    .max(16)
});

export async function generatePodcastScript(context: RepoContext, template: HostTemplate): Promise<ScriptSegment[]> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackScript(context, template);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You write short, funny, technically accurate two-host podcast scripts for developers.",
          "Return JSON only in this shape: {\"script\":[{\"host\":\"alex\",\"text\":\"...\"},{\"host\":\"sam\",\"text\":\"...\"}]}",
          "Use 8 to 12 turns total. Keep it around 3 minutes. Avoid markdown.",
          "Hosts are addressed internally as alex and sam.",
          template.systemPersona
        ].join("\n")
      },
      {
        role: "user",
        content: buildPrompt(context)
      }
    ]
  });

  const parsed = scriptSchema.safeParse(JSON.parse(response.choices[0]?.message.content ?? "{}"));

  if (!parsed.success) {
    return fallbackScript(context, template);
  }

  return parsed.data.script;
}

function buildPrompt(context: RepoContext) {
  return [
    `Repo: ${context.repoName}`,
    `Description: ${context.description ?? "No description provided."}`,
    "",
    "README:",
    context.readme,
    "",
    "Selected files:",
    context.selectedFiles.map((file) => `--- ${file.path} ---\n${file.content}`).join("\n\n"),
    "",
    "Recent commits:",
    context.commits.map((commit) => `- ${commit.message} (${commit.author}, ${commit.date})`).join("\n")
  ].join("\n");
}

function fallbackScript(context: RepoContext, template: HostTemplate): ScriptSegment[] {
  const files = context.selectedFiles.map((file) => file.path).join(", ") || "a few likely entry points";
  const latestCommit = context.commits[0]?.message ?? "the latest commits";

  return [
    {
      host: "alex",
      text: `Welcome to RepoFM. Today we are opening up ${context.repoName}, a project described as ${context.description ?? "a mysterious public repository"}.`
    },
    {
      host: "sam",
      text: `I love when a repo arrives with lore. My first question is always: is this architecture, or did someone just keep adding folders until morale improved?`
    },
    {
      host: "alex",
      text: `The README gives us the front door, and the most useful files to inspect are ${files}. That usually tells us where the app starts, how it is configured, and what the maintainers care about.`
    },
    {
      host: "sam",
      text: `Recent activity includes "${latestCommit}", which is either responsible maintenance or the sound of a codebase asking for a spa weekend.`
    },
    {
      host: "alex",
      text: `In practical terms, ${context.repoName} seems built around a clear developer workflow: explain the core idea quickly, expose the important primitives, and keep contributors close to the source.`
    },
    {
      host: "sam",
      text: template.id === "explainer-roaster"
        ? "And yes, I will roast it gently: every famous repo has at least one file that looks like it was named during a fire drill."
        : "My skeptical note is simple: the more magical a project feels, the more the edge cases need boring, excellent documentation."
    },
    {
      host: "alex",
      text: `The big takeaway: this repo has enough surface area to teach from, enough history to discuss, and enough personality to make a good shareable audio tour.`
    },
    {
      host: "sam",
      text: "That is RepoFM doing its job: less tab archaeology, more useful context, and exactly enough jokes to survive dependency management."
    }
  ];
}

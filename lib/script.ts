import OpenAI from "openai";
import { z } from "zod";
import type { HostTemplate } from "@/lib/templates";
import type { RepoContext, ScriptSegment } from "@/lib/types";

const scriptSchema = z.object({
  script: z
    .array(
      z.object({
        host: z.enum(["alex", "sam"]),
        text: z.string().min(1).max(1200)
      })
    )
    .min(8)
    .max(20)
});

function extractJson(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const brace = raw.match(/\{[\s\S]*\}/);
  if (brace) return brace[0];
  return raw.trim();
}

export async function generatePodcastScript(context: RepoContext, template: HostTemplate): Promise<ScriptSegment[]> {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackScript(context, template);
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const systemPrompt = [
    `You write technically deep, sharp two-host podcast scripts for software developers.`,
    `Output ONLY valid JSON: {"script":[{"host":"alex","text":"..."},{"host":"sam","text":"..."}]}`,
    `Rules:`,
    `- 12 to 16 turns total.`,
    `- Hosts MUST respond DIRECTLY to what the other just said. Build on their point, challenge it, or add a specific technical detail. No two adjacent turns can be on unrelated topics.`,
    `- Go deep on architecture, specific code patterns, tradeoffs, and design decisions visible in the files. Name actual functions, modules, data structures you find.`,
    `- ${template.hostA} (alex) leads with technical precision. ${template.hostB} (sam) challenges, stress-tests assumptions, and brings sharp follow-up questions or counterpoints.`,
    `- Cover: repo architecture, key abstractions, notable patterns, dependency choices, recent commit trends, what the code tells you about the team's priorities.`,
    `- Keep it conversational. Real hosts say things like "wait, but..." or "that's actually the interesting part" or "so you're saying X which means Y will eventually..."`,
    `- No generic summaries at the end. End mid-insight if needed. No goodbye lines.`,
    `- ${template.systemPersona}`,
    `- Avoid markdown, avoid generic filler like "great point" or "exactly".`,
    `- No meta-commentary about the podcast itself. Just discuss the repo.`
  ].join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildPrompt(context) }
      ],
      max_tokens: 3200,
      temperature: 0.85
    });

    const raw = response.choices[0]?.message.content ?? "{}";
    const parsed = scriptSchema.safeParse(JSON.parse(extractJson(raw)));

    if (!parsed.success) {
      console.warn("Script schema validation failed:", parsed.error.issues[0]);
      return fallbackScript(context, template);
    }

    return parsed.data.script;
  } catch (error) {
    console.warn("Script generation failed; falling back to local script.", error);
    return fallbackScript(context, template);
  }
}

function buildPrompt(context: RepoContext) {
  const commitBlock = context.commits
    .slice(0, 15)
    .map((c) => `- ${c.message}${c.body ? `\n  ${c.body}` : ""} (${c.author}, ${c.date})`)
    .join("\n");

  return [
    `Repository: ${context.repoName}`,
    `Description: ${context.description ?? "No description provided."}`,
    ``,
    `--- README (first 8000 chars) ---`,
    context.readme.slice(0, 8000),
    ``,
    `--- Key files ---`,
    context.selectedFiles.map((f) => `=== ${f.path} ===\n${f.content}`).join("\n\n"),
    ``,
    `--- Recent commits (newest first) ---`,
    commitBlock,
    ``,
    `Analyze this repo deeply. Discuss actual code structure, key abstractions, dependency choices, and what the commit history reveals about development velocity and team priorities.`
  ].join("\n");
}

function fallbackScript(context: RepoContext, template: HostTemplate): ScriptSegment[] {
  const shortFiles = context.selectedFiles
    .map((f) => f.path.split("/").pop() ?? f.path)
    .join(", ") || "the entry points";
  const recentCommit = context.commits[0]?.message ?? "the latest changes";
  const secondCommit = context.commits[1]?.message ?? null;
  const desc = context.description ?? "a public repository without a description";

  return [
    {
      host: "alex",
      text: `Today we are in ${context.repoName}. The pitch is: ${desc}. I have the key files open — ${shortFiles} — and the architecture is already telling a story.`
    },
    {
      host: "sam",
      text: `Before the tour: what does the entry point tell you about how opinionated this codebase is? Because "minimal" in the README usually means "you will make decisions we did not."`,
    },
    {
      host: "alex",
      text: `Good question. The file structure here leans toward separation of concerns more than convenience — which means there is a clear internal model, but new contributors will need to locate it. That is a deliberate tradeoff.`
    },
    {
      host: "sam",
      text: `Deliberate tradeoffs are fine until the team turns over. What does the commit history say? Recent work on "${recentCommit}" — is that a feature, a fix, or someone slowly removing a decision they regret?`
    },
    {
      host: "alex",
      text: `That commit looks like stabilization work.${secondCommit ? ` The one before it — "${secondCommit}" — is where the interesting velocity is.` : ""} The pattern is: big structural change, then a few cleanup passes. That is healthy.`
    },
    {
      host: "sam",
      text: `"Healthy" meaning they ship and then tidy up, not the other way around. I can respect that. What about dependencies — anything load-bearing that could become a maintenance liability?`
    },
    {
      host: "alex",
      text: `The dependency surface is intentionally narrow. The authors clearly made a choice about what to own versus delegate, and that shapes every abstraction downstream.`
    },
    {
      host: "sam",
      text: `Narrow dependencies also means the tricky logic lives in this codebase, not distributed across packages. Which is either confidence or stubbornness — sometimes hard to tell from the outside.`
    },
    {
      host: "alex",
      text: `Given the README's framing, I think it is confidence. They knew what the core problem was and built specifically toward it. The codebase reflects that — no obvious scope creep in the internals.`
    },
    {
      host: "sam",
      text: template.id === "explainer-roaster"
        ? `Fair. My roast would be: whoever named some of these internal modules had a very optimistic view of what "self-documenting" means. But the logic underneath is sound.`
        : `That focus is actually what makes repos like this worth discussing — you can reverse-engineer the team's mental model just from what they chose NOT to build.`
    }
  ];
}

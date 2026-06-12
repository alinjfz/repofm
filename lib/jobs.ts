import { getRepoContext } from "@/lib/github";
import { generateEpisodeAudio } from "@/lib/audio";
import { generatePodcastScript } from "@/lib/script";
import { getTemplate } from "@/lib/templates";
import type { GenerationJob, GenerationStep } from "@/lib/types";
import { saveEpisode } from "@/lib/supabase";

const globalForJobs = globalThis as typeof globalThis & {
  __repofmJobs?: Map<string, GenerationJob>;
};

const jobs = globalForJobs.__repofmJobs ?? new Map<string, GenerationJob>();
globalForJobs.__repofmJobs = jobs;

export function createJob() {
  const id = crypto.randomUUID();
  const job: GenerationJob = {
    id,
    status: "queued",
    message: "Queued up in the studio.",
    progress: 5,
    createdAt: new Date().toISOString()
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string) {
  return jobs.get(id) ?? null;
}

export async function runGeneration(jobId: string, repoUrl: string, templateId: string, userId: string | null) {
  const template = getTemplate(templateId);

  try {
    updateJob(jobId, "analyzing-readme", "Analyzing README and repository metadata.", 18);
    const context = await getRepoContext(repoUrl);

    updateJob(jobId, "picking-files", "Picking the files that explain the repo best.", 38);
    // File picking happens inside getRepoContext; this progress label keeps the frontend story clear.

    updateJob(jobId, "writing-script", "Writing the two-host podcast script.", 58);
    const script = await generatePodcastScript(context, template);

    updateJob(jobId, "recording-hosts", "Recording both hosts with ElevenLabs.", 78);
    const audio = await generateEpisodeAudio(script, template);

    updateJob(jobId, "saving-episode", "Saving the episode and shareable link.", 92);
    const episode = await saveEpisode({
      id: jobId,
      userId,
      repoUrl,
      repoName: context.repoName,
      repoDescription: context.description,
      template: template.id,
      script,
      audio
    });

    updateJob(jobId, "complete", "Episode ready.", 100, episode.id);
  } catch (error) {
    updateJob(
      jobId,
      "failed",
      "Generation failed. Check the server logs for the full stack trace.",
      100,
      undefined,
      error instanceof Error ? error.message : "Unknown error"
    );
    console.error(error);
  }
}

function updateJob(
  id: string,
  status: GenerationStep,
  message: string,
  progress: number,
  episodeId?: string,
  error?: string
) {
  const current = jobs.get(id);
  if (!current) return;

  jobs.set(id, {
    ...current,
    status,
    message,
    progress,
    episodeId,
    error
  });
}

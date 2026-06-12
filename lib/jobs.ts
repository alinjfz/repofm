import { getRepoContext } from "@/lib/github";
import { generateEpisodeAudio } from "@/lib/audio";
import { generatePodcastScript } from "@/lib/script";
import { getTemplate } from "@/lib/templates";
import type { GenerationJob, GenerationStep } from "@/lib/types";
import { saveEpisode, getSupabaseAdmin } from "@/lib/supabase";

// In-memory fallback for local dev (no Supabase configured)
const localJobs = new Map<string, GenerationJob>();

export async function createJob(): Promise<GenerationJob> {
  const id = crypto.randomUUID();
  const job: GenerationJob = {
    id,
    status: "queued",
    message: "Queued up in the studio.",
    progress: 5,
    createdAt: new Date().toISOString()
  };

  localJobs.set(id, job);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("generation_jobs").insert({
      id: job.id,
      status: job.status,
      message: job.message,
      progress: job.progress,
      created_at: job.createdAt
    });
    if (error) console.error("Failed to insert job into Supabase:", error.message);
  }

  return job;
}

export async function getJob(id: string): Promise<GenerationJob | null> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("generation_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      return {
        id: data.id,
        status: data.status as GenerationStep,
        message: data.message,
        progress: data.progress,
        episodeId: data.episode_id ?? undefined,
        error: data.error ?? undefined,
        createdAt: data.created_at
      };
    }
  }

  return localJobs.get(id) ?? null;
}

export async function runGeneration(jobId: string, repoUrl: string, templateId: string, userId: string | null) {
  const template = getTemplate(templateId);

  try {
    await updateJob(jobId, "analyzing-readme", "Analyzing README and repository metadata.", 18);
    const context = await getRepoContext(repoUrl);

    await updateJob(jobId, "picking-files", "Picking the files that explain the repo best.", 38);

    await updateJob(jobId, "writing-script", "Writing the two-host podcast script.", 58);
    const script = await generatePodcastScript(context, template);

    await updateJob(jobId, "recording-hosts", "Recording both hosts with ElevenLabs.", 78);
    const audio = await generateEpisodeAudio(script, template);

    await updateJob(jobId, "saving-episode", "Saving the episode and shareable link.", 92);
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

    await updateJob(jobId, "complete", "Episode ready.", 100, episode.id);
  } catch (error) {
    await updateJob(
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

async function updateJob(
  id: string,
  status: GenerationStep,
  message: string,
  progress: number,
  episodeId?: string,
  error?: string
) {
  const patch: GenerationJob = {
    id,
    status,
    message,
    progress,
    episodeId,
    error,
    createdAt: localJobs.get(id)?.createdAt ?? new Date().toISOString()
  };

  localJobs.set(id, patch);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error: dbError } = await supabase
      .from("generation_jobs")
      .update({
        status,
        message,
        progress,
        episode_id: episodeId ?? null,
        error: error ?? null
      })
      .eq("id", id);

    if (dbError) console.warn("Failed to update job in Supabase:", dbError.message);
  }
}

import { getRepoContext } from "@/lib/github";
import { generateEpisodeAudio } from "@/lib/audio";
import { generatePodcastScript } from "@/lib/script";
import { getTemplate } from "@/lib/templates";
import type { Episode } from "@/lib/types";
import { saveEpisode } from "@/lib/supabase";

export async function runGeneration(
  id: string,
  repoUrl: string,
  templateId: string,
  userId: string | null
): Promise<Episode> {
  const template = getTemplate(templateId);
  const context = await getRepoContext(repoUrl);
  const script = await generatePodcastScript(context, template);
  const audio = await generateEpisodeAudio(script, template);

  return saveEpisode({
    id,
    userId,
    repoUrl,
    repoName: context.repoName,
    repoDescription: context.description,
    template: template.id,
    script,
    audio
  });
}

import type { HostTemplate } from "@/lib/templates";
import type { ScriptSegment } from "@/lib/types";

export async function generateEpisodeAudio(script: ScriptSegment[], template: HostTemplate) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return null;
  }

  const chunks = await Promise.all(
    script.map((segment) => textToSpeech(segment.text, template.voices[segment.host]))
  );

  return Buffer.concat(chunks);
}

async function textToSpeech(text: string, voiceId: string) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
      "Content-Type": "application/json",
      Accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.48,
        similarity_boost: 0.78,
        style: 0.35,
        use_speaker_boost: true
      }
    })
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS failed with status ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

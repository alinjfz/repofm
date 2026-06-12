import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { z } from "zod";
import { createJob, runGeneration } from "@/lib/jobs";

export const runtime = "nodejs";
export const maxDuration = 300;

const generateSchema = z.object({
  repoUrl: z.string().url(),
  template: z.string().default("explainer-roaster")
});

export async function POST(request: Request) {
  const parsed = generateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Send a valid GitHub repo URL and template." }, { status: 400 });
  }

  const session = await getSession();
  const job = await createJob();

  runGeneration(job.id, parsed.data.repoUrl, parsed.data.template, session?.user?.sub ?? null);

  return NextResponse.json({ jobId: job.id });
}

import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";

export function GET(_request: Request, { params }: { params: { id: string } }) {
  const job = getJob(params.id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(job);
}

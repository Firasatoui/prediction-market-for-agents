import { NextResponse } from "next/server";
import { computeAllPerformance } from "@/lib/performance";

export const dynamic = "force-dynamic";

export async function GET() {
  const agents = await computeAllPerformance();
  return NextResponse.json({ agents });
}

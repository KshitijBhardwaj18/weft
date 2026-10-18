import { execFile } from "node:child_process";
import { promisify } from "node:util";

// Rebuilds the demo graphs from scripts/seed.mjs, so every visitor can start from the Countdown plan.
export async function POST() {
  await promisify(execFile)(process.execPath, ["scripts/seed.mjs"], { cwd: process.cwd(), env: process.env });
  return Response.json({ ok: true });
}

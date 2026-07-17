import { NextResponse } from "next/server";
import { pinJsonToIpfs } from "../../../../lib/pinata";

const MAX_FIELD_LENGTH = 6_000;
const MAX_ARRAY_ITEMS = 12;

type ReportInput = {
  missionId?: unknown;
  signalId?: unknown;
  agentId?: unknown;
  title?: unknown;
  summary?: unknown;
  workPerformed?: unknown;
  evidenceLinks?: unknown;
  limitations?: unknown;
};

function cleanString(value: unknown, field: string, required = false) {
  if (typeof value !== "string") {
    if (required) throw new Error(`${field} is required.`);
    return "";
  }

  const cleaned = value.trim();
  if (required && !cleaned) throw new Error(`${field} is required.`);
  if (cleaned.length > MAX_FIELD_LENGTH) throw new Error(`${field} is too long.`);
  return cleaned;
}

function cleanStringArray(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return [];
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split("\n")
      : null;

  if (!source) throw new Error(`${field} must be a list of strings.`);

  const cleaned = source
    .map((item) => cleanString(item, field))
    .filter(Boolean)
    .slice(0, MAX_ARRAY_ITEMS);

  return Array.from(new Set(cleaned));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReportInput;
    const missionId = cleanString(body.missionId, "missionId", true);
    const signalId = cleanString(body.signalId, "signalId");
    const agentId = cleanString(body.agentId, "agentId");
    const title = cleanString(body.title, "title", true);
    const summary = cleanString(body.summary, "summary", true);
    const workPerformed = cleanString(body.workPerformed, "workPerformed", true);
    const limitations = cleanString(body.limitations, "limitations");
    const evidenceLinks = cleanStringArray(body.evidenceLinks, "evidenceLinks");

    const report = {
      schema: "callsign.report.v1",
      missionId,
      signalId,
      agentId,
      title,
      summary,
      workPerformed,
      evidenceLinks,
      limitations,
      createdAt: new Date().toISOString(),
    };

    const upload = await pinJsonToIpfs({
      name: `callsign-report-${missionId}-${Date.now()}.json`,
      content: report,
      keyvalues: {
        app: "CALLSIGN",
        schema: "callsign.report.v1",
        missionId,
      },
    });

    return NextResponse.json({
      cid: upload.cid,
      ipfsUri: upload.ipfsUri,
      report,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid report upload request." },
      { status: 400 },
    );
  }
}

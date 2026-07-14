import { NextResponse } from "next/server";
import { pinJsonToIpfs } from "../../../../lib/pinata";

const MAX_FIELD_LENGTH = 4_000;
const MAX_ARRAY_ITEMS = 20;

type MetadataInput = {
  title?: unknown;
  description?: unknown;
  urgency?: unknown;
  tags?: unknown;
  location?: unknown;
  requestedCapabilities?: unknown;
  evidenceLinks?: unknown;
  budget?: unknown;
};

function cleanString(value: unknown, field: string, required = false) {
  if (typeof value !== "string") {
    if (required) throw new Error(`${field} is required.`);
    return "";
  }

  const cleaned = value.trim();
  if (required && !cleaned) throw new Error(`${field} is required.`);
  if (cleaned.length > MAX_FIELD_LENGTH) {
    throw new Error(`${field} is too long.`);
  }

  return cleaned;
}

function cleanStringArray(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return [];
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
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
    const body = (await request.json()) as MetadataInput;
    const title = cleanString(body.title, "title", true);
    const description = cleanString(body.description, "description", true);
    const urgency = cleanString(body.urgency, "urgency", true);
    const location = cleanString(body.location, "location");
    const budget = cleanString(body.budget, "budget");
    const tags = cleanStringArray(body.tags, "tags");
    const requestedCapabilities = cleanStringArray(
      body.requestedCapabilities,
      "requestedCapabilities",
    );
    const evidenceLinks = cleanStringArray(body.evidenceLinks, "evidenceLinks");

    if (!tags.length) throw new Error("At least one tag is required.");
    if (!requestedCapabilities.length) {
      throw new Error("At least one requested capability is required.");
    }

    const metadata = {
      schema: "callsign.signal.v1",
      title,
      description,
      urgency,
      tags,
      location,
      requestedCapabilities,
      evidenceLinks,
      budget,
      createdAt: new Date().toISOString(),
    };

    const upload = await pinJsonToIpfs({
      name: `callsign-signal-${Date.now()}.json`,
      content: metadata,
      keyvalues: {
        app: "CALLSIGN",
        schema: "callsign.signal.v1",
      },
    });

    return NextResponse.json({
      cid: upload.cid,
      ipfsUri: upload.ipfsUri,
      metadata,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid upload request." },
      { status: 400 },
    );
  }
}

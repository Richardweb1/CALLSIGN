import { NextResponse } from "next/server";
import { pinJsonToIpfs } from "../../../../lib/pinata";

type FinalizeRequest = {
  signalId?: unknown;
  agentId?: unknown;
  draft?: {
    plan?: unknown;
    permissions?: unknown;
    riskLevel?: unknown;
    etaHours?: unknown;
    price?: unknown;
  };
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(value: unknown, field: string) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array.`);
  return value.map((item) => cleanString(item)).filter(Boolean).slice(0, 8);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FinalizeRequest;
    const signalId = cleanString(body.signalId);
    const agentId = cleanString(body.agentId);
    const plan = cleanStringArray(body.draft?.plan, "plan");
    const permissions = cleanStringArray(body.draft?.permissions, "permissions");

    if (!signalId) throw new Error("signalId is required.");
    if (!plan.length) throw new Error("Ritual draft plan is required.");
    if (!permissions.length) throw new Error("Ritual draft permissions are required.");

    const [planUpload, permissionUpload] = await Promise.all([
      pinJsonToIpfs({
        name: `callsign-ritual-plan-${signalId}-${Date.now()}.json`,
        content: {
          schema: "callsign.plan.v1",
          source: "ritual-llm-precompile",
          signalId,
          agentId,
          plan,
          analysis: body.draft,
        },
        keyvalues: {
          app: "CALLSIGN",
          schema: "callsign.plan.v1",
        },
      }),
      pinJsonToIpfs({
        name: `callsign-ritual-permissions-${signalId}-${Date.now()}.json`,
        content: {
          schema: "callsign.permissions.v1",
          source: "ritual-llm-precompile",
          signalId,
          agentId,
          permissions,
          riskLevel: body.draft?.riskLevel,
        },
        keyvalues: {
          app: "CALLSIGN",
          schema: "callsign.permissions.v1",
        },
      }),
    ]);

    return NextResponse.json({
      planURI: planUpload.ipfsUri,
      permissionURI: permissionUpload.ipfsUri,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to finalize Ritual draft." },
      { status: 400 },
    );
  }
}

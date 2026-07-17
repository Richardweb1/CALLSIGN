import { NextResponse } from "next/server";
import { pinJsonToIpfs } from "../../../../lib/pinata";
import {
  LLM_PRECOMPILE,
  RITUAL_MODEL,
  encodeJsonResponseFormat,
  encodeRitualLlmRequest,
} from "../../../../lib/ritualLlm";

type AnalyzeRequest = {
  signalId?: unknown;
  agentId?: unknown;
  signal?: {
    title?: unknown;
    budget?: unknown;
    tags?: unknown;
    problemURI?: unknown;
  };
  metadata?: {
    title?: unknown;
    description?: unknown;
    urgency?: unknown;
    location?: unknown;
    requestedCapabilities?: unknown;
    evidenceLinks?: unknown;
    budget?: unknown;
  };
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanString(item)).filter(Boolean).slice(0, 20);
}

function estimateRisk(urgency: string, capabilities: string[], evidenceLinks: string[]) {
  const joined = `${urgency} ${capabilities.join(" ")}`.toLowerCase();
  let risk = 2;
  if (joined.includes("critical") || joined.includes("security") || joined.includes("wallet")) risk += 1;
  if (joined.includes("admin") || joined.includes("private") || joined.includes("fund")) risk += 1;
  if (evidenceLinks.length >= 3) risk -= 1;
  return Math.min(5, Math.max(1, risk));
}

function estimateEtaHours(urgency: string, capabilities: string[]) {
  const base = urgency.toLowerCase() === "critical" ? 6 : urgency.toLowerCase() === "high" ? 12 : 24;
  return base + Math.min(24, capabilities.length * 4);
}

function estimatePrice(budget: string, riskLevel: number, etaHours: number) {
  const numericBudget = Number(budget);
  if (Number.isFinite(numericBudget) && numericBudget > 0) {
    return String(Math.max(0.001, Math.round(numericBudget * 0.85 * 1000) / 1000));
  }
  return String(Math.round((0.01 + riskLevel * 0.01 + etaHours * 0.0005) * 1000) / 1000);
}

async function pinJson(name: string, content: unknown) {
  const upload = await pinJsonToIpfs({
    name,
    content,
    keyvalues: {
      app: "CALLSIGN",
      schema: "callsign.proposal-analysis.v1",
    },
  });
  return upload.ipfsUri;
}

function buildPrompt(input: {
  signalId: string;
  agentId: string;
  title: string;
  description: string;
  urgency: string;
  tags: string[];
  location: string;
  capabilities: string[];
  evidenceLinks: string[];
  budget: string;
}) {
  return [
    {
      role: "system",
      content:
        "You are CALLSIGN's Ritual-native responder analyst. Return strict JSON with keys plan, permissions, riskLevel, etaHours, price, confidence, assumptions. Keep permissions minimal and flag unsafe access.",
    },
    {
      role: "user",
      content: JSON.stringify(input),
    },
  ];
}

const offerDraftSchema = {
  type: "object",
  properties: {
    plan: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
    permissions: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
    riskLevel: { type: "integer", minimum: 1, maximum: 5 },
    etaHours: { type: "integer", minimum: 1, maximum: 720 },
    price: { type: "string" },
    confidence: { type: "string" },
  },
  required: ["plan", "permissions", "riskLevel", "etaHours", "price", "confidence"],
  additionalProperties: false,
};

function encodeRitualLlmInput(messages: unknown[]) {
  const executor = process.env.RITUAL_LLM_EXECUTOR as `0x${string}` | undefined;
  if (!executor) return undefined;

  return encodeRitualLlmRequest({
    executor,
    messages,
    responseFormatData: encodeJsonResponseFormat(offerDraftSchema),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeRequest;
    const signalId = cleanString(body.signalId);
    const agentId = cleanString(body.agentId);
    const title = cleanString(body.metadata?.title) || cleanString(body.signal?.title);
    const description = cleanString(body.metadata?.description);
    const urgency = cleanString(body.metadata?.urgency) || "Normal";
    const tags = cleanStringArray(body.signal?.tags);
    const location = cleanString(body.metadata?.location);
    const capabilities = cleanStringArray(body.metadata?.requestedCapabilities);
    const evidenceLinks = cleanStringArray(body.metadata?.evidenceLinks);
    const budget = cleanString(body.metadata?.budget) || cleanString(body.signal?.budget);

    if (!signalId) throw new Error("signalId is required.");
    if (!title || !description) throw new Error("Resolved signal metadata is required.");

    const riskLevel = estimateRisk(urgency, capabilities, evidenceLinks);
    const etaHours = estimateEtaHours(urgency, capabilities);
    const price = estimatePrice(budget, riskLevel, etaHours);
    const plan = [
      `Triage signal #${signalId}: confirm scope, success criteria, and evidence.`,
      `Execute the requested capabilities: ${capabilities.length ? capabilities.join(", ") : "general investigation"}.`,
      "Return a concise report with findings, actions taken, residual risk, and next recommended step.",
    ];
    const permissions = [
      "Read-only access to public evidence links and submitted metadata.",
      "No custody of funds, private keys, seed phrases, or admin credentials.",
      "Explicit approval required before any write action, transaction, or external account change.",
    ];
    const messages = buildPrompt({
      signalId,
      agentId,
      title,
      description,
      urgency,
      tags,
      location,
      capabilities,
      evidenceLinks,
      budget,
    });
    const encodedLlmInput = encodeRitualLlmInput(messages);
    const draft = {
      schema: "callsign.proposal-analysis.v1",
      source: encodedLlmInput ? "ritual-llm-precompile-ready" : "local-risk-draft",
      ritual: {
        chainId: 1979,
        precompile: LLM_PRECOMPILE,
        model: RITUAL_MODEL,
        executor: process.env.RITUAL_LLM_EXECUTOR,
        encodedLlmInput,
      },
      signalId,
      agentId,
      plan,
      permissions,
      riskLevel,
      etaHours,
      price,
      confidence: encodedLlmInput ? "requires-wallet-precompile-transaction" : "heuristic-until-executor-configured",
      assumptions: [
        "The agent will review this draft before submitting a transaction.",
        "Permissions stay read-only unless the signal owner approves more access.",
      ],
      createdAt: new Date().toISOString(),
    };

    if (encodedLlmInput) {
      return NextResponse.json({
        draft,
        ritualTransaction: {
          to: LLM_PRECOMPILE,
          data: encodedLlmInput,
          gas: "5000000",
        },
      });
    }

    let planURI: string | undefined;
    let permissionURI: string | undefined;
    try {
      [planURI, permissionURI] = await Promise.all([
        pinJson(`callsign-plan-${signalId}-${Date.now()}.json`, {
          schema: "callsign.plan.v1",
          signalId,
          agentId,
          plan,
          analysis: draft,
        }),
        pinJson(`callsign-permissions-${signalId}-${Date.now()}.json`, {
          schema: "callsign.permissions.v1",
          signalId,
          agentId,
          permissions,
          riskLevel,
        }),
      ]);
    } catch (pinError) {
      return NextResponse.json({
        draft,
        planURI,
        permissionURI,
        warning: pinError instanceof Error ? pinError.message : "Unable to pin proposal draft.",
      });
    }

    return NextResponse.json({ draft, planURI, permissionURI });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to analyze signal." },
      { status: 400 },
    );
  }
}

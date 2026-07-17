import {
  decodeAbiParameters,
  encodeAbiParameters,
  keccak256,
  parseAbiParameters,
  toHex,
  type Hex,
  type TransactionReceipt,
} from "viem";

export const LLM_PRECOMPILE = "0x0000000000000000000000000000000000000802";
export const RITUAL_MODEL = "zai-org/GLM-4.7-FP8";
export const PRECOMPILE_CALLED_TOPIC = keccak256(toHex("PrecompileCalled(address,bytes,bytes)"));

const REQUEST_ABI = [
  "address, bytes[], uint256, bytes[], bytes,",
  "string, string, int256, string, bool, int256, string, string,",
  "uint256, bool, int256, string, bytes, int256, string, string, bool,",
  "int256, bytes, bytes, int256, int256, string, bool,",
  "(string,string,string)",
].join("");

export type RitualLlmCompletion = {
  content: string;
  finishReason: string;
  model: string;
  usage?: {
    promptTokens: string;
    completionTokens: string;
    totalTokens: string;
  };
};

export function encodeRitualLlmRequest({
  executor,
  messages,
  responseFormatData = "0x",
}: {
  executor: `0x${string}`;
  messages: unknown[];
  responseFormatData?: Hex;
}) {
  return encodeAbiParameters(parseAbiParameters(REQUEST_ABI), [
    executor,
    [],
    300n,
    [],
    "0x",
    JSON.stringify(messages),
    RITUAL_MODEL,
    0n,
    "",
    false,
    4096n,
    "",
    "",
    1n,
    true,
    0n,
    "medium",
    responseFormatData,
    -1n,
    "auto",
    "",
    false,
    700n,
    "0x",
    "0x",
    -1n,
    1000n,
    "callsign",
    false,
    ["", "", ""],
  ]);
}

export function encodeJsonResponseFormat(schema: Record<string, unknown>) {
  const jsonSchemaData = encodeAbiParameters(parseAbiParameters("string, string, string, string"), [
    "callsign_offer_draft",
    "CALLSIGN offer draft with plan, permissions, risk, ETA, and price.",
    JSON.stringify(schema),
    "true",
  ]);

  return encodeAbiParameters(parseAbiParameters("string, bytes"), ["json_schema", jsonSchemaData]);
}

export function extractRitualLlmResult(receipt: TransactionReceipt) {
  for (const log of receipt.logs) {
    if (log.topics[0] !== PRECOMPILE_CALLED_TOPIC) continue;

    const [address, , output] = decodeAbiParameters(
      parseAbiParameters("address, bytes, bytes"),
      log.data,
    );

    if ((address as string).toLowerCase() !== LLM_PRECOMPILE.toLowerCase()) continue;

    try {
      const [, actualOutput] = decodeAbiParameters(parseAbiParameters("bytes, bytes"), output as Hex);
      return actualOutput as Hex;
    } catch {
      return output as Hex;
    }
  }

  return undefined;
}

export function decodeRitualLlmCompletion(resultHex: Hex): RitualLlmCompletion {
  const [hasError, completionData, , errorMessage] = decodeAbiParameters(
    parseAbiParameters("bool, bytes, bytes, string, (string,string,string)"),
    resultHex,
  );

  if (hasError) throw new Error(errorMessage || "Ritual LLM returned an error.");

  const [, , , model, , , choicesCount, choicesData, usageData] = decodeAbiParameters(
    parseAbiParameters("string, string, uint256, string, string, string, uint256, bytes[], bytes"),
    completionData as Hex,
  );

  if (choicesCount === 0n || !choicesData.length) {
    throw new Error("Ritual LLM returned no choices.");
  }

  const [, finishReason, messageData] = decodeAbiParameters(
    parseAbiParameters("uint256, string, bytes"),
    choicesData[0] as Hex,
  );
  const [, content] = decodeAbiParameters(
    parseAbiParameters("string, string, string, uint256, bytes[]"),
    messageData as Hex,
  );

  let usage: RitualLlmCompletion["usage"];
  if ((usageData as Hex).length > 2) {
    const [promptTokens, completionTokens, totalTokens] = decodeAbiParameters(
      parseAbiParameters("uint256, uint256, uint256"),
      usageData as Hex,
    );
    usage = {
      promptTokens: promptTokens.toString(),
      completionTokens: completionTokens.toString(),
      totalTokens: totalTokens.toString(),
    };
  }

  return {
    content,
    finishReason,
    model,
    usage,
  };
}

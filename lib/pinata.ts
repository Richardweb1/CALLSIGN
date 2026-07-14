const PINATA_V3_UPLOAD_ENDPOINT = "https://uploads.pinata.cloud/v3/files";
const PINATA_LEGACY_JSON_ENDPOINT = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

type PinJsonOptions = {
  name: string;
  content: unknown;
  keyvalues?: Record<string, string>;
};

function getPinataToken() {
  const token = process.env.PINATA_JWT;
  if (!token) {
    throw new Error("PINATA_JWT is not configured on the server.");
  }
  return token;
}

function getCid(result: Record<string, unknown>) {
  return (
    (typeof result.cid === "string" && result.cid) ||
    (typeof result.IpfsHash === "string" && result.IpfsHash) ||
    (typeof result.data === "object" &&
      result.data !== null &&
      "cid" in result.data &&
      typeof result.data.cid === "string" &&
      result.data.cid) ||
    ""
  );
}

function getPinataError(result: unknown, fallback: string) {
  if (typeof result === "object" && result !== null) {
    if (
      "error" in result &&
      typeof result.error === "object" &&
      result.error !== null &&
      "details" in result.error &&
      typeof result.error.details === "string"
    ) {
      return result.error.details;
    }

    if ("message" in result && typeof result.message === "string") {
      return result.message;
    }
  }

  return fallback;
}

async function pinJsonWithV3(token: string, { name, content }: PinJsonOptions) {
  const json = JSON.stringify(content);
  const file = new File([new Blob([json], { type: "application/json" })], name, {
    type: "application/json",
  });
  const formData = new FormData();
  formData.append("file", file);
  formData.append("network", "public");

  const response = await fetch(PINATA_V3_UPLOAD_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const cid = getCid(result);

  if (!response.ok || !cid) {
    throw new Error(getPinataError(result, response.statusText || "Pinata V3 upload failed."));
  }

  return { cid, ipfsUri: `ipfs://${cid}`, result };
}

async function pinJsonWithLegacy(token: string, { name, content, keyvalues }: PinJsonOptions) {
  const response = await fetch(PINATA_LEGACY_JSON_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: content,
      pinataMetadata: {
        name,
        keyvalues,
      },
    }),
  });
  const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const cid = getCid(result);

  if (!response.ok || !cid) {
    throw new Error(getPinataError(result, response.statusText || "Pinata legacy upload failed."));
  }

  return { cid, ipfsUri: `ipfs://${cid}`, result };
}

export async function pinJsonToIpfs(options: PinJsonOptions) {
  const token = getPinataToken();

  try {
    return await pinJsonWithV3(token, options);
  } catch (v3Error) {
    try {
      return await pinJsonWithLegacy(token, options);
    } catch (legacyError) {
      const v3Message = v3Error instanceof Error ? v3Error.message : "Pinata V3 upload failed.";
      const legacyMessage =
        legacyError instanceof Error ? legacyError.message : "Pinata legacy upload failed.";
      throw new Error(`${v3Message} Legacy fallback: ${legacyMessage}`);
    }
  }
}

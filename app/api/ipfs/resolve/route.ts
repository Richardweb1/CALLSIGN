import { NextResponse } from "next/server";

const GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
];

async function resolveHttpUri(uri: string) {
  const response = await fetch(uri, { next: { revalidate: 60 } });
  if (!response.ok) {
    return NextResponse.json({
      uri,
      gateway: uri,
      data: null,
      warning: "HTTP metadata was not available.",
      status: response.status,
    });
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await response.json();
    return NextResponse.json({ uri, gateway: uri, data: json });
  }

  const text = await response.text();
  return NextResponse.json({ uri, gateway: uri, data: text });
}

function normalizeCidOrUri(value: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("cid or uri is required.");

  if (trimmed.startsWith("ipfs://")) {
    return trimmed.replace("ipfs://", "").replace(/^ipfs\//, "");
  }

  if (trimmed.includes("/ipfs/")) {
    return trimmed.split("/ipfs/")[1].split(/[?#]/)[0];
  }

  return trimmed.split(/[?#]/)[0];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("uri") || searchParams.get("cid") || "";

  try {
    if (input.startsWith("http://") || input.startsWith("https://")) {
      return resolveHttpUri(input);
    }

    const cid = normalizeCidOrUri(input);

    for (const gateway of GATEWAYS) {
      try {
        const response = await fetch(`${gateway}${cid}`, {
          next: { revalidate: 60 },
        });

        if (!response.ok) continue;

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const json = await response.json();
          return NextResponse.json({ cid, gateway, data: json });
        }

        const text = await response.text();
        return NextResponse.json({ cid, gateway, data: text });
      } catch {
        continue;
      }
    }

    return NextResponse.json(
      { error: "Unable to resolve IPFS metadata from available gateways.", cid },
      { status: 502 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid IPFS URI." },
      { status: 400 },
    );
  }
}

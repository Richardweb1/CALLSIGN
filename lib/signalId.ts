export function normalizeSignalId(value: string) {
  const match = value.match(/\d+/u);
  return match?.[0] || "";
}

export function makeSignalReference(signalId: string, ipfsUri?: string) {
  const cid = (ipfsUri || "").replace(/^ipfs:\/\//u, "");
  const suffix = cid ? cid.slice(0, 12).toUpperCase() : "PENDING";
  return `CS-${signalId}-${suffix}`;
}

"use client";

import { useMemo, useState } from "react";
import { parseEther } from "viem";
import { agentRepublicAbi } from "../lib/agentRepublicAbi";
import { agentRepublicAddress } from "../lib/contract";
import { getWalletClient, publicClient } from "../lib/viem";

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function PublishIntentForm() {
  const [agentId, setAgentId] = useState("1");
  const [intentType, setIntentType] = useState("1");
  const [title, setTitle] = useState("Need a Ritual explainer thread");
  const [descriptionURI, setDescriptionURI] = useState("ipfs://intent-details");
  const [tags, setTags] = useState("writing, ritual, content");
  const [budget, setBudget] = useState("1");
  const [pending, setPending] = useState(false);
  const [txHash, setTxHash] = useState<string>();

  const parsedTags = useMemo(() => parseTags(tags), [tags]);

  async function submit() {
    setPending(true);
    try {
      const { walletClient, account } = await getWalletClient();
      const { request } = await publicClient.simulateContract({
        account,
        address: agentRepublicAddress,
        abi: agentRepublicAbi,
        functionName: "publishIntent",
        args: [
          BigInt(agentId || "0"),
          Number(intentType),
          title,
          descriptionURI,
          parsedTags,
          parseEther(budget || "0"),
          0n,
        ],
      });
      const hash = await walletClient.writeContract(request);
      setTxHash(hash);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card">
      <h2>Publish Intent</h2>
      <div className="form">
        <label className="field">
          <span>Agent ID</span>
          <input
            className="input"
            value={agentId}
            onChange={(event) => setAgentId(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Intent type</span>
          <select
            className="input"
            value={intentType}
            onChange={(event) => setIntentType(event.target.value)}
          >
            <option value="0">Offer - I can do X</option>
            <option value="1">Request - I need Y</option>
          </select>
        </label>
        <label className="field">
          <span>Title</span>
          <input
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Description URI</span>
          <input
            className="input"
            value={descriptionURI}
            onChange={(event) => setDescriptionURI(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Tags, comma-separated</span>
          <input
            className="input"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Budget, informational until mission escrow</span>
          <input
            className="input"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
          />
        </label>
        <button className="btn" disabled={pending} onClick={submit}>
          {pending ? "Publishing..." : "Publish Intent"}
        </button>
        {txHash ? <p className="muted">Transaction sent: {txHash}</p> : null}
      </div>
    </div>
  );
}

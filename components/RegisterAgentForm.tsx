"use client";

import { useMemo, useState } from "react";
import { agentRepublicAbi } from "../lib/agentRepublicAbi";
import { agentRepublicAddress } from "../lib/contract";
import { getWalletClient, publicClient } from "../lib/viem";

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function RegisterAgentForm() {
  const [name, setName] = useState("BuilderFox");
  const [profileURI, setProfileURI] = useState("ipfs://agent-profile");
  const [systemPromptURI, setSystemPromptURI] = useState("ipfs://system-prompt");
  const [tags, setTags] = useState("solidity, ritual, frontend");
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
        functionName: "registerAgent",
        args: [account, name, profileURI, systemPromptURI, parsedTags],
      });
      const hash = await walletClient.writeContract(request);
      setTxHash(hash);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card">
      <h2>Register Agent</h2>
      <div className="form">
        <label className="field">
          <span>Agent name</span>
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Profile URI</span>
          <input
            className="input"
            value={profileURI}
            onChange={(event) => setProfileURI(event.target.value)}
          />
        </label>
        <label className="field">
          <span>System prompt URI</span>
          <input
            className="input"
            value={systemPromptURI}
            onChange={(event) => setSystemPromptURI(event.target.value)}
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
        <button className="btn" disabled={pending} onClick={submit}>
          {pending ? "Registering..." : "Create Agent Passport"}
        </button>
        {txHash ? <p className="muted">Transaction sent: {txHash}</p> : null}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { parseEther } from "viem";
import { callsignAbi } from "../lib/callsignAbi";
import { callsignAddress } from "../lib/contract";
import { sendLegacyContractTransaction } from "../lib/viem";

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function BroadcastSignalForm() {
  const [title, setTitle] = useState("Need daily Ritual wallet activity summary");
  const [problemURI, setProblemURI] = useState("ipfs://signal-problem");
  const [tags, setTags] = useState("wallet, report, monitoring");
  const [budget, setBudget] = useState("1");
  const [pending, setPending] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [error, setError] = useState<string>();
  const parsedTags = useMemo(() => parseTags(tags), [tags]);

  async function submit() {
    setPending(true);
    setError(undefined);
    try {
      const args = [title, problemURI, parsedTags, parseEther(budget || "0"), 0n] as const;
      setTxHash(
        await sendLegacyContractTransaction({
        address: callsignAddress,
        abi: callsignAbi,
        functionName: "broadcastSignal",
        args,
        }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setError(message.includes("User rejected") ? "Transaction cancelled in wallet." : message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card action-card primary-action-card surface-in delay-4">
      <span className="kicker">Broadcast</span>
      <h2>Send a problem signal</h2>
      <p className="muted">
        Describe the outcome you need. Sovereign agents can respond with plans,
        risk, permissions, and price.
      </p>
      <div className="form">
        <label className="field">
          <span>Signal title</span>
          <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>Problem URI</span>
          <input className="input" value={problemURI} onChange={(event) => setProblemURI(event.target.value)} />
        </label>
        <label className="field">
          <span>Tags</span>
          <input className="input" value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
        <label className="field">
          <span>Budget in RITUAL</span>
          <input className="input" value={budget} onChange={(event) => setBudget(event.target.value)} />
        </label>
        <button className="btn" disabled={pending} onClick={submit}>
          {pending ? "Broadcasting..." : "Broadcast Signal"}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
        {txHash ? <p className="muted tx">Tx: {txHash}</p> : null}
      </div>
    </div>
  );
}

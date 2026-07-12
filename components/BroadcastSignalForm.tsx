"use client";

import { useMemo, useState } from "react";
import { parseEther, parseEventLogs } from "viem";
import { callsignAbi } from "../lib/callsignAbi";
import { callsignAddress } from "../lib/contract";
import { sendLegacyContractTransaction, waitForTransaction } from "../lib/viem";

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function BroadcastSignalForm() {
  const [title, setTitle] = useState("");
  const [problemURI, setProblemURI] = useState("");
  const [tags, setTags] = useState("");
  const [budget, setBudget] = useState("");
  const [pending, setPending] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [createdSignalId, setCreatedSignalId] = useState<string>();
  const [error, setError] = useState<string>();
  const parsedTags = useMemo(() => parseTags(tags), [tags]);

  async function submit() {
    setPending(true);
    setError(undefined);
    try {
      const args = [title, problemURI, parsedTags, parseEther(budget || "0"), 0n] as const;
      setCreatedSignalId(undefined);
      const hash = await sendLegacyContractTransaction({
        address: callsignAddress,
        abi: callsignAbi,
        functionName: "broadcastSignal",
        args,
      });
      setTxHash(hash);
      const receipt = await waitForTransaction(hash);
      const [event] = parseEventLogs({
        abi: callsignAbi,
        eventName: "SignalBroadcast",
        logs: receipt.logs,
      });
      if (event?.args.signalId !== undefined) {
        setCreatedSignalId(event.args.signalId.toString());
      }
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
          <input className="input" placeholder="Describe the problem you want solved" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>Problem URI</span>
          <input className="input" placeholder="ipfs://... or https://..." value={problemURI} onChange={(event) => setProblemURI(event.target.value)} />
        </label>
        <label className="field">
          <span>Tags</span>
          <input className="input" placeholder="security, wallet, report" value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
        <label className="field">
          <span>Budget in RITUAL</span>
          <input className="input" placeholder="0.1" value={budget} onChange={(event) => setBudget(event.target.value)} />
        </label>
        <button className="btn" disabled={pending} onClick={submit}>
          {pending ? "Broadcasting..." : "Broadcast Signal"}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
        {createdSignalId ? (
          <div className="success-box">
            <span className="kicker">Next step</span>
            <strong>Signal ID: {createdSignalId}</strong>
            <p className="muted">Use this ID when an agent submits a proposal.</p>
          </div>
        ) : null}
        {txHash ? <p className="muted tx">Tx: {txHash}</p> : null}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { parseEventLogs } from "viem";
import { callsignAbi } from "../lib/callsignAbi";
import { callsignAddress } from "../lib/contract";
import { getInjectedAccount, sendLegacyContractTransaction, waitForTransaction } from "../lib/viem";

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function RegisterResponderForm() {
  const [name, setName] = useState("");
  const [capabilityURI, setCapabilityURI] = useState("");
  const [tags, setTags] = useState("");
  const [pending, setPending] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [createdAgent, setCreatedAgent] = useState<{
    id: string;
    contract: string;
  }>();
  const [error, setError] = useState<string>();
  const parsedTags = useMemo(() => parseTags(tags), [tags]);

  async function submit() {
    setPending(true);
    setError(undefined);
    try {
      const account = await getInjectedAccount();
      const args = [account, name, capabilityURI, parsedTags] as const;
      setCreatedAgent(undefined);
      const hash = await sendLegacyContractTransaction({
          address: callsignAddress,
          abi: callsignAbi,
          functionName: "registerAgent",
          args,
      });
      setTxHash(hash);
      const receipt = await waitForTransaction(hash);
      const [event] = parseEventLogs({
        abi: callsignAbi,
        eventName: "AgentRegistered",
        logs: receipt.logs,
      });
      if (event?.args.agentId !== undefined) {
        setCreatedAgent({
          id: event.args.agentId.toString(),
          contract: event.args.agentContract,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setError(message.includes("User rejected") ? "Transaction cancelled in wallet." : message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card action-card surface-in delay-5">
      <span className="kicker">Responder</span>
      <h2>Register agent capability</h2>
      <p className="muted">
        Deploy a Sovereign Agent contract with a public capability profile so it
        can answer matching signals.
      </p>
      <div className="form">
        <label className="field">
          <span>Agent name</span>
          <input className="input" placeholder="Your agent name" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field">
          <span>Capability URI</span>
          <input className="input" placeholder="ipfs://... or https://..." value={capabilityURI} onChange={(event) => setCapabilityURI(event.target.value)} />
        </label>
        <label className="field">
          <span>Tags</span>
          <input className="input" placeholder="monitoring, reports, alerts" value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
        <button className="btn secondary" disabled={pending} onClick={submit}>
          {pending ? "Registering..." : "Register Responder"}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
        {createdAgent ? (
          <div className="success-box">
            <span className="kicker">Next step</span>
            <strong>Agent ID: {createdAgent.id}</strong>
            <p className="muted tx">Sovereign Agent: {createdAgent.contract}</p>
            <p className="muted">Use this Agent ID when submitting a proposal.</p>
          </div>
        ) : null}
        {txHash ? <p className="muted tx">Tx: {txHash}</p> : null}
      </div>
    </div>
  );
}

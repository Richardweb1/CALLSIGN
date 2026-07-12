"use client";

import { useMemo, useState } from "react";
import { callsignAbi } from "../lib/callsignAbi";
import { callsignAddress } from "../lib/contract";
import { getInjectedAccount, sendLegacyContractTransaction } from "../lib/viem";

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function RegisterResponderForm() {
  const [name, setName] = useState("ReporterAgent");
  const [capabilityURI, setCapabilityURI] = useState("ipfs://agent-capabilities");
  const [tags, setTags] = useState("wallet, reports, alerts");
  const [pending, setPending] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [error, setError] = useState<string>();
  const parsedTags = useMemo(() => parseTags(tags), [tags]);

  async function submit() {
    setPending(true);
    setError(undefined);
    try {
      const account = await getInjectedAccount();
      const args = [account, name, capabilityURI, parsedTags] as const;
      setTxHash(
        await sendLegacyContractTransaction({
          address: callsignAddress,
          abi: callsignAbi,
          functionName: "registerAgent",
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
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field">
          <span>Capability URI</span>
          <input className="input" value={capabilityURI} onChange={(event) => setCapabilityURI(event.target.value)} />
        </label>
        <label className="field">
          <span>Tags</span>
          <input className="input" value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
        <button className="btn secondary" disabled={pending} onClick={submit}>
          {pending ? "Registering..." : "Register Responder"}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
        {txHash ? <p className="muted tx">Tx: {txHash}</p> : null}
      </div>
    </div>
  );
}

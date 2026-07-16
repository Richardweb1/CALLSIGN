"use client";

import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import { callsignAbi } from "../lib/callsignAbi";
import { callsignAddress } from "../lib/contract";
import {
  getConnectedAccount,
  getInjectedAccount,
  getTransactionErrorMessage,
  sendLegacyContractTransaction,
  waitForTransaction,
} from "../lib/viem";

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
  const [connectedAccount, setConnectedAccount] = useState<Address>();
  const [pending, setPending] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [createdAgent, setCreatedAgent] = useState<{
    id: string;
    contract: string;
  }>();
  const [error, setError] = useState<string>();
  const parsedTags = useMemo(() => parseTags(tags), [tags]);
  const normalizedName = name.trim();
  const effectiveName = normalizedName || "CALLSIGN Agent";
  const generatedCapabilityURI = useMemo(() => {
    const params = new URLSearchParams({
      name: effectiveName,
      skills: parsedTags.join(", ") || "general agent response",
    });
    return `https://callsignritual.vercel.app/demo/agent/capability?${params.toString()}`;
  }, [effectiveName, parsedTags]);
  const effectiveCapabilityURI = capabilityURI.trim() || generatedCapabilityURI;

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      try {
        const account = await getConnectedAccount();
        if (!cancelled) setConnectedAccount(account);
      } catch {
        if (!cancelled) setConnectedAccount(undefined);
      }
    }

    void loadAccount();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit() {
    setPending(true);
    setError(undefined);
    try {
      const account = await getInjectedAccount();
      setConnectedAccount(account);
      if (/^0x[a-fA-F0-9]{40}$/.test(normalizedName)) {
        throw new Error("Agent name should be a readable name, not your wallet address.");
      }
      if (!parsedTags.length) {
        throw new Error("Add at least one skill, for example: wallet, report, monitoring.");
      }
      const args = [account, effectiveName, effectiveCapabilityURI, parsedTags] as const;
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
      setError(getTransactionErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card action-card surface-in delay-5">
      <span className="kicker">Step 1 · Setup</span>
      <h2>Register your agent</h2>
      <p className="muted">
        Do this once per wallet. CALLSIGN will create your responder profile and give
        you an Agent ID for future offers.
      </p>
      <div className="mini-help single-help">
        <span>
          Owner wallet: {connectedAccount ? `${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}` : "Connect wallet first"}
        </span>
      </div>
      <div className="form">
        <label className="field">
          <span>Agent name optional</span>
          <input className="input" placeholder="Example: WalletReportAgent" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field">
          <span>Skills</span>
          <input className="input" placeholder="wallet, report, monitoring" value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
        <details className="advanced-options">
          <summary>Optional capability link</summary>
          <p className="muted">
            Leave this empty and CALLSIGN will generate a simple public capability link from your skills.
          </p>
          <label className="field">
            <span>Capability link</span>
            <input className="input" placeholder={generatedCapabilityURI} value={capabilityURI} onChange={(event) => setCapabilityURI(event.target.value)} />
          </label>
        </details>
        <button className="btn" disabled={pending} onClick={submit}>
          {pending ? "Registering..." : "Register Agent"}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
        {createdAgent ? (
          <div className="success-box">
            <span className="kicker">Next step</span>
            <strong>Agent ID: {createdAgent.id}</strong>
            <p className="muted tx">Sovereign Agent: {createdAgent.contract}</p>
            <p className="muted">Copy this Agent ID and use it on the response form.</p>
          </div>
        ) : null}
        {txHash ? <p className="muted tx">Tx: {txHash}</p> : null}
      </div>
    </div>
  );
}

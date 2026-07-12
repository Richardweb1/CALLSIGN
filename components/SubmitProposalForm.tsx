"use client";

import { useState } from "react";
import { parseEther, parseEventLogs } from "viem";
import { callsignAbi } from "../lib/callsignAbi";
import { callsignAddress } from "../lib/contract";
import { sovereignAgentAbi } from "../lib/sovereignAgentAbi";
import { publicClient, sendLegacyContractTransaction, waitForTransaction } from "../lib/viem";

export function SubmitProposalForm() {
  const [signalId, setSignalId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [planURI, setPlanURI] = useState("");
  const [permissionURI, setPermissionURI] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [price, setPrice] = useState("");
  const [etaHours, setEtaHours] = useState("");
  const [pending, setPending] = useState(false);
  const [agentPending, setAgentPending] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [createdProposalId, setCreatedProposalId] = useState<string>();
  const [error, setError] = useState<string>();

  async function submit() {
    setPending(true);
    setError(undefined);
    try {
      const args = [
        BigInt(signalId || "0"),
        BigInt(agentId || "0"),
        planURI,
        permissionURI,
        Number(riskLevel),
        parseEther(price || "0"),
        BigInt(Number(etaHours || "0") * 3600),
      ] as const;
      setCreatedProposalId(undefined);
      const hash = await sendLegacyContractTransaction({
          address: callsignAddress,
          abi: callsignAbi,
          functionName: "submitProposal",
          args,
      });
      setTxHash(hash);
      const receipt = await waitForTransaction(hash);
      const [event] = parseEventLogs({
        abi: callsignAbi,
        eventName: "ProposalSubmitted",
        logs: receipt.logs,
      });
      if (event?.args.proposalId !== undefined) {
        setCreatedProposalId(event.args.proposalId.toString());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setError(message.includes("User rejected") ? "Transaction cancelled in wallet." : message);
    } finally {
      setPending(false);
    }
  }

  async function submitViaSovereignAgent() {
    setAgentPending(true);
    setError(undefined);
    try {
      const agent = await publicClient.readContract({
        address: callsignAddress,
        abi: callsignAbi,
        functionName: "getAgent",
        args: [BigInt(agentId || "0")],
      });

      const agentContract = agent.agentWallet;
      const args = [
        BigInt(signalId || "0"),
        planURI,
        permissionURI,
        Number(riskLevel),
        parseEther(price || "0"),
        BigInt(Number(etaHours || "0") * 3600),
      ] as const;

      setCreatedProposalId(undefined);
      const hash = await sendLegacyContractTransaction({
          address: agentContract,
          abi: sovereignAgentAbi,
          functionName: "propose",
          args,
      });
      setTxHash(hash);
      const receipt = await waitForTransaction(hash);
      const [event] = parseEventLogs({
        abi: callsignAbi,
        eventName: "ProposalSubmitted",
        logs: receipt.logs,
      });
      if (event?.args.proposalId !== undefined) {
        setCreatedProposalId(event.args.proposalId.toString());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setError(message.includes("User rejected") ? "Transaction cancelled in wallet." : message);
    } finally {
      setAgentPending(false);
    }
  }

  return (
    <div className="card action-card surface-in delay-6">
      <span className="kicker">Respond</span>
      <h2>Submit agent proposal</h2>
      <p className="muted">
        Agents answer a signal with plan, permission footprint, price, and risk.
      </p>
      <div className="form compact-form">
        <div className="form-grid">
          <label className="field">
            <span>Signal ID</span>
            <input className="input" placeholder="Signal ID" value={signalId} onChange={(event) => setSignalId(event.target.value)} />
          </label>
          <label className="field">
            <span>Agent ID</span>
            <input className="input" placeholder="Agent ID" value={agentId} onChange={(event) => setAgentId(event.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Plan URI</span>
          <input className="input" placeholder="ipfs://... or https://..." value={planURI} onChange={(event) => setPlanURI(event.target.value)} />
        </label>
        <label className="field">
          <span>Permission URI</span>
          <input className="input" placeholder="ipfs://... or https://..." value={permissionURI} onChange={(event) => setPermissionURI(event.target.value)} />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Risk 1-5</span>
            <input className="input" placeholder="1" value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)} />
          </label>
          <label className="field">
            <span>Price</span>
            <input className="input" placeholder="0.1" value={price} onChange={(event) => setPrice(event.target.value)} />
          </label>
          <label className="field">
            <span>ETA hours</span>
            <input className="input" placeholder="24" value={etaHours} onChange={(event) => setEtaHours(event.target.value)} />
          </label>
        </div>
        <button className="btn secondary" disabled={pending} onClick={submit}>
          {pending ? "Submitting..." : "Submit Proposal"}
        </button>
        <button className="btn agent-btn" disabled={agentPending} onClick={submitViaSovereignAgent}>
          {agentPending ? "Agent proposing..." : "Propose via Sovereign Agent"}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
        {createdProposalId ? (
          <div className="success-box">
            <span className="kicker">Proposal created</span>
            <strong>Proposal ID: {createdProposalId}</strong>
            <p className="muted">The user can now review and accept this agent plan.</p>
          </div>
        ) : null}
        {txHash ? <p className="muted tx">Tx: {txHash}</p> : null}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { formatEther, parseEther, parseEventLogs } from "viem";
import { callsignAbi } from "../lib/callsignAbi";
import { callsignAddress } from "../lib/contract";
import { decodeRitualLlmCompletion, extractRitualLlmResult } from "../lib/ritualLlm";
import { sovereignAgentAbi } from "../lib/sovereignAgentAbi";
import {
  getTransactionErrorMessage,
  publicClient,
  sendLegacyTransaction,
  sendLegacyContractTransaction,
  waitForTransaction,
} from "../lib/viem";

type ProposalSignalContext = {
  signalId?: string;
  title?: string;
  problemURI?: string;
  budget?: string;
  tags?: string[];
  metadata?: {
    title?: string;
    description?: string;
    urgency?: string;
    location?: string;
    requestedCapabilities?: string[];
    evidenceLinks?: string[];
    budget?: string;
  };
};

type AnalysisDraft = {
  source?: string;
  plan?: string[];
  permissions?: string[];
  riskLevel?: number;
  etaHours?: number;
  price?: string;
  confidence?: string;
  ritual?: {
    precompile?: string;
    executor?: string;
    model?: string;
    encodedLlmInput?: string;
  };
};

type RitualTransaction = {
  to: `0x${string}`;
  data: `0x${string}`;
  gas: string;
};

export function SubmitProposalForm({
  selectedSignalId,
  signalContext,
}: {
  selectedSignalId?: string;
  signalContext?: ProposalSignalContext;
}) {
  const [signalId, setSignalId] = useState(signalContext?.signalId || selectedSignalId || "");
  const [agentId, setAgentId] = useState("");
  const [planURI, setPlanURI] = useState("");
  const [permissionURI, setPermissionURI] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [price, setPrice] = useState("");
  const [etaHours, setEtaHours] = useState("");
  const [analysisPending, setAnalysisPending] = useState(false);
  const [analysisDraft, setAnalysisDraft] = useState<AnalysisDraft>();
  const [analysisWarning, setAnalysisWarning] = useState<string>();
  const [ritualTxHash, setRitualTxHash] = useState<string>();
  const [loadedMissionTitle, setLoadedMissionTitle] = useState<string>();
  const [pending, setPending] = useState(false);
  const [agentPending, setAgentPending] = useState(false);
  const [txHash, setTxHash] = useState<string>();
  const [createdProposalId, setCreatedProposalId] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (signalContext?.signalId) setSignalId(signalContext.signalId);
  }, [signalContext?.signalId]);

  useEffect(() => {
    if (selectedSignalId) {
      setSignalId(selectedSignalId);
      setLoadedMissionTitle(undefined);
      setAnalysisDraft(undefined);
      setAnalysisWarning(undefined);
    }
  }, [selectedSignalId]);

  async function resolveSignalContext() {
    if (signalContext?.metadata) return signalContext;
    if (!signalId) throw new Error("Mission ID is required.");

    const signal = await publicClient.readContract({
      address: callsignAddress,
      abi: callsignAbi,
      functionName: "getSignal",
      args: [BigInt(signalId)],
    });

    let metadata: ProposalSignalContext["metadata"];
    if (signal.problemURI) {
      const response = await fetch(`/api/ipfs/resolve?uri=${encodeURIComponent(signal.problemURI)}`);
      if (response.ok) {
        const resolved = await response.json();
        if (resolved?.data && typeof resolved.data === "object") {
          metadata = resolved.data;
        }
      }
    }

    const title = metadata?.title || signal.title;
    setLoadedMissionTitle(title);

    return {
      signalId,
      title,
      problemURI: signal.problemURI,
      budget: metadata?.budget || formatEther(signal.budget),
      tags: [...signal.tags],
      metadata,
    };
  }

  async function analyzeSignal() {
    setAnalysisPending(true);
    setError(undefined);
    setAnalysisWarning(undefined);
    try {
      const resolvedSignal = await resolveSignalContext();
      const response = await fetch("/api/ritual/analyze-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId,
          agentId,
          signal: {
            title: resolvedSignal.title,
            problemURI: resolvedSignal.problemURI,
            budget: resolvedSignal.budget,
            tags: resolvedSignal.tags,
          },
          metadata: resolvedSignal.metadata,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to analyze signal.");

      setAnalysisDraft(result.draft);
      if (result.ritualTransaction) {
        await runRitualPrecompile(result.ritualTransaction, result.draft);
        return;
      }
      if (result.planURI) setPlanURI(result.planURI);
      if (result.permissionURI) setPermissionURI(result.permissionURI);
      if (result.draft?.riskLevel) setRiskLevel(String(result.draft.riskLevel));
      if (result.draft?.price) setPrice(result.draft.price);
      if (result.draft?.etaHours) setEtaHours(String(result.draft.etaHours));
      if (result.warning) setAnalysisWarning(result.warning);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to analyze signal.");
    } finally {
      setAnalysisPending(false);
    }
  }

  async function runRitualPrecompile(ritualTransaction: RitualTransaction, fallbackDraft: AnalysisDraft) {
    setAnalysisWarning("Wallet will send a real Ritual LLM precompile transaction to 0x0802.");
    const hash = await sendLegacyTransaction({
      to: ritualTransaction.to,
      data: ritualTransaction.data,
      gas: BigInt(ritualTransaction.gas),
    });
    setRitualTxHash(hash);
    const receipt = await waitForTransaction(hash);
    const resultHex = extractRitualLlmResult(receipt);
    if (!resultHex) {
      throw new Error("Ritual LLM transaction settled without a decoded precompile result. Check the explorer and try again after settlement.");
    }

    const completion = decodeRitualLlmCompletion(resultHex);
    const parsed = JSON.parse(completion.content) as AnalysisDraft;
    const nextDraft = {
      ...fallbackDraft,
      ...parsed,
      source: "ritual-llm-precompile",
      ritual: fallbackDraft.ritual,
      confidence: parsed.confidence || `finish_reason:${completion.finishReason}`,
    };
    setAnalysisDraft(nextDraft);

    const uploadResponse = await fetch("/api/ritual/finalize-offer-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signalId,
        agentId,
        draft: nextDraft,
      }),
    });
    const uploadResult = await uploadResponse.json();
    if (!uploadResponse.ok) throw new Error(uploadResult.error || "Unable to pin Ritual draft.");

    if (uploadResult.planURI) setPlanURI(uploadResult.planURI);
    if (uploadResult.permissionURI) setPermissionURI(uploadResult.permissionURI);
    if (nextDraft.riskLevel) setRiskLevel(String(nextDraft.riskLevel));
    if (nextDraft.price) setPrice(nextDraft.price);
    if (nextDraft.etaHours) setEtaHours(String(nextDraft.etaHours));
    setAnalysisWarning(`Ritual LLM executed on-chain. Model: ${completion.model}.`);
  }

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
      setError(getTransactionErrorMessage(err));
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
      setError(getTransactionErrorMessage(err));
    } finally {
      setAgentPending(false);
    }
  }

  return (
    <div className="card action-card surface-in delay-6">
      <span className="kicker">Step 2 · Offer</span>
      <h2>Answer a mission</h2>
      <p className="muted">
        Choose a mission above or paste a Mission ID, then add your Agent ID. Ritual-assisted
        draft reads the mission metadata and suggests plan, permissions, risk, price, and ETA.
      </p>
      <div className="mini-help">
        <span>Mission ID is filled when you click Answer this mission.</span>
        <span>Agent ID comes from Step 1 after registration.</span>
      </div>
      <div className="form compact-form">
        <div className="form-grid">
          <label className="field">
            <span>Mission ID</span>
            <input className="input" placeholder="Example: 8" value={signalId} onChange={(event) => setSignalId(event.target.value)} />
          </label>
          <label className="field">
            <span>Agent ID</span>
            <input className="input" placeholder="Example: 7" value={agentId} onChange={(event) => setAgentId(event.target.value)} />
          </label>
        </div>
        <button className="btn secondary" disabled={analysisPending || !signalId} onClick={analyzeSignal}>
          {analysisPending ? "Analyzing..." : "Draft Ritual-assisted offer"}
        </button>
        {loadedMissionTitle ? (
          <p className="notice">Loaded mission: {loadedMissionTitle}</p>
        ) : null}
        {analysisDraft ? (
          <div className="analysis-box">
            <div className="row-head">
              <span className="kicker">Ritual analysis</span>
              <span className="pill">{analysisDraft.source || "draft"}</span>
            </div>
            <p className="muted">
              Precompile {analysisDraft.ritual?.precompile || "0x0802"} · {analysisDraft.ritual?.model || "GLM"}
              {analysisDraft.ritual?.executor ? ` · Executor ${analysisDraft.ritual.executor}` : ""}
            </p>
            <strong>Plan</strong>
            <ul>
              {(analysisDraft.plan || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <strong>Permissions</strong>
            <ul>
              {(analysisDraft.permissions || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {analysisWarning ? <p className="error-text">{analysisWarning}</p> : null}
          </div>
        ) : null}
        <label className="field">
          <span>Plan link</span>
          <input className="input" placeholder="Use Ritual draft or paste your plan link" value={planURI} onChange={(event) => setPlanURI(event.target.value)} />
        </label>
        <label className="field">
          <span>Permission link</span>
          <input className="input" placeholder="Use Ritual draft or paste permission scope link" value={permissionURI} onChange={(event) => setPermissionURI(event.target.value)} />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>Risk level 1-5</span>
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
        <button className="btn agent-btn" disabled={agentPending} onClick={submitViaSovereignAgent}>
          {agentPending ? "Submitting offer..." : "Submit Offer via Agent"}
        </button>
        <details className="advanced-options">
          <summary>Technical fallback</summary>
          <p className="muted">
            Use this only if the sovereign agent route is unavailable. Most agents should use
            the main offer button above.
          </p>
          <button className="btn secondary" disabled={pending} onClick={submit}>
            {pending ? "Submitting..." : "Submit Direct Response"}
          </button>
        </details>
        {error ? <p className="error-text">{error}</p> : null}
        {createdProposalId ? (
          <div className="success-box">
            <span className="kicker">Response created</span>
            <strong>Response ID: {createdProposalId}</strong>
            <p className="muted">The user can now review and accept this agent response.</p>
          </div>
        ) : null}
        {ritualTxHash ? <p className="muted tx">Ritual LLM tx: {ritualTxHash}</p> : null}
        {txHash ? <p className="muted tx">Tx: {txHash}</p> : null}
      </div>
    </div>
  );
}

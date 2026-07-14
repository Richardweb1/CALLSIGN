"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { callsignAbi } from "../lib/callsignAbi";
import { callsignAddress } from "../lib/contract";
import {
  formatDeadline,
  formatRitual,
  missionStatusLabels,
  proposalStatusLabels,
  shortAddress,
  signalStatusLabels,
} from "../lib/callsignFormat";
import { makeSignalReference, normalizeSignalId } from "../lib/signalId";
import {
  getTransactionErrorMessage,
  publicClient,
  sendLegacyContractTransaction,
  waitForTransaction,
} from "../lib/viem";
import { SubmitProposalForm } from "./SubmitProposalForm";

type SignalMetadata = {
  title?: string;
  description?: string;
  urgency?: string;
  location?: string;
  requestedCapabilities?: string[];
  evidenceLinks?: string[];
};

type SignalData = Awaited<ReturnType<typeof getSignalData>>;
type ProposalData = Awaited<ReturnType<typeof getProposalData>>;
type MissionData = Awaited<ReturnType<typeof getMissionData>>;

async function getSignalData(id: bigint) {
  return publicClient.readContract({
    address: callsignAddress,
    abi: callsignAbi,
    functionName: "getSignal",
    args: [id],
  });
}

async function getProposalData(id: bigint) {
  return publicClient.readContract({
    address: callsignAddress,
    abi: callsignAbi,
    functionName: "getProposal",
    args: [id],
  });
}

async function getMissionData(id: bigint) {
  return publicClient.readContract({
    address: callsignAddress,
    abi: callsignAbi,
    functionName: "getMission",
    args: [id],
  });
}

export function SignalDetailClient({ id }: { id: string }) {
  const normalizedId = useMemo(() => normalizeSignalId(decodeURIComponent(id)), [id]);
  const signalId = useMemo(() => BigInt(normalizedId || "0"), [normalizedId]);
  const [signal, setSignal] = useState<SignalData>();
  const [metadata, setMetadata] = useState<SignalMetadata>();
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [mission, setMission] = useState<MissionData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [actionPending, setActionPending] = useState<string>();
  const [reportURI, setReportURI] = useState("");
  const [rating, setRating] = useState("5");
  const isMissionActive = mission?.status === 0;
  const isMissionReported = mission?.status === 1;
  const isMissionCompleted = mission?.status === 2;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!normalizedId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(undefined);
      try {
        const signalResult = await getSignalData(signalId);
        const proposalIds = await publicClient.readContract({
          address: callsignAddress,
          abi: callsignAbi,
          functionName: "getSignalProposalIds",
          args: [signalId],
        });
        const proposalResults = await Promise.all(
          proposalIds.map((proposalId) => getProposalData(proposalId)),
        );
        const missionIds = await publicClient.readContract({
          address: callsignAddress,
          abi: callsignAbi,
          functionName: "getAllMissionIds",
        });
        const recentMissions = await Promise.all(
          [...missionIds].reverse().slice(0, 20).map((missionId) => getMissionData(missionId)),
        );
        const signalMission = recentMissions.find((item) => item.signalId === signalId);

        let resolvedMetadata: SignalMetadata | undefined;
        if (signalResult.problemURI) {
          const response = await fetch(
            `/api/ipfs/resolve?uri=${encodeURIComponent(signalResult.problemURI)}`,
          );
          if (response.ok) {
            const resolved = await response.json();
            if (resolved?.data && typeof resolved.data === "object") {
              resolvedMetadata = resolved.data;
            }
          }
        }

        if (!cancelled) {
          setSignal(signalResult);
          setProposals(proposalResults);
          setMission(signalMission);
          setMetadata(resolvedMetadata);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load signal.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [signalId, normalizedId]);

  async function acceptProposal(proposal: ProposalData) {
    setActionPending(`accept-${proposal.id.toString()}`);
    setError(undefined);
    try {
      const hash = await sendLegacyContractTransaction({
        address: callsignAddress,
        abi: callsignAbi,
        functionName: "acceptProposal",
        args: [proposal.id],
        value: proposal.price,
      });
      await waitForTransaction(hash);
      window.location.reload();
    } catch (err) {
      setError(getTransactionErrorMessage(err));
    } finally {
      setActionPending(undefined);
    }
  }

  async function submitMissionReport() {
    if (!mission) return;
    setActionPending("report");
    setError(undefined);
    try {
      const hash = await sendLegacyContractTransaction({
        address: callsignAddress,
        abi: callsignAbi,
        functionName: "submitReport",
        args: [mission.id, reportURI],
      });
      await waitForTransaction(hash);
      window.location.reload();
    } catch (err) {
      setError(getTransactionErrorMessage(err));
    } finally {
      setActionPending(undefined);
    }
  }

  async function completeMission() {
    if (!mission) return;
    setActionPending("complete");
    setError(undefined);
    try {
      const hash = await sendLegacyContractTransaction({
        address: callsignAddress,
        abi: callsignAbi,
        functionName: "completeMission",
        args: [mission.id, Number(rating)],
      });
      await waitForTransaction(hash);
      window.location.reload();
    } catch (err) {
      setError(getTransactionErrorMessage(err));
    } finally {
      setActionPending(undefined);
    }
  }

  return (
    <main className="shell animated-shell">
      <nav className="nav surface-in">
        <Link className="brand" href="/">
          <div className="brand-mark">CS</div>
          <div>
            <div>CALLSIGN</div>
            <div className="muted">Signal detail</div>
          </div>
        </Link>
        <Link className="btn secondary" href="/">
          Back to dispatch
        </Link>
      </nav>

      {loading ? <div className="card">Loading signal...</div> : null}
      {error ? <div className="error-text">{error}</div> : null}
      {!normalizedId ? (
        <div className="card empty-state">
          Invalid reference code. Paste the reference you received after submit.
        </div>
      ) : null}

      {signal && normalizedId ? (
        <>
          <section className="card detail-hero surface-in">
            <span className="kicker">
              {makeSignalReference(signal.id.toString(), signal.problemURI)}
            </span>
            <h1>{signal.title}</h1>
            <p className="lead">
              {metadata?.description || "No resolved IPFS description yet."}
            </p>
            <div className="detail-grid">
              <div>
                <span className="muted">Creator</span>
                <strong>{shortAddress(signal.creator)}</strong>
              </div>
              <div>
                <span className="muted">Status</span>
                <strong>{signalStatusLabels[signal.status] || "Unknown"}</strong>
              </div>
              <div>
                <span className="muted">Budget</span>
                <strong>{formatRitual(signal.budget)}</strong>
              </div>
              <div>
                <span className="muted">Deadline</span>
                <strong>{formatDeadline(signal.deadline)}</strong>
              </div>
            </div>
            <div className="tag-row">
              {signal.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="two detail-sections">
            <div className="card surface-in delay-1">
              <span className="kicker">Metadata</span>
              <h2>Requested outcome</h2>
              <p className="muted">Urgency: {metadata?.urgency || "Not specified"}</p>
              <p className="muted">Location: {metadata?.location || "Not specified"}</p>
              <h3>Requested capabilities</h3>
              <div className="tag-row">
                {(metadata?.requestedCapabilities || []).map((capability) => (
                  <span className="tag" key={capability}>
                    {capability}
                  </span>
                ))}
              </div>
              <h3>Evidence links</h3>
              <div className="link-list">
                {(metadata?.evidenceLinks || []).length ? (
                  metadata?.evidenceLinks?.map((link) => (
                    <a href={link} target="_blank" key={link}>
                      {link}
                    </a>
                  ))
                ) : (
                  <span className="muted">No evidence links attached.</span>
                )}
              </div>
            </div>

            <div className="card surface-in delay-2">
              <span className="kicker">Responses</span>
              <h2>Agent responses</h2>
              <div className="list">
                {proposals.length ? (
                  proposals.map((proposal) => (
                    <div className="row" key={proposal.id.toString()}>
                      <div className="row-head">
                        <div>
                          <span className="kicker">Response #{proposal.id.toString()}</span>
                          <strong>Agent #{proposal.agentId.toString()}</strong>
                        </div>
                        <span className="status-dot">
                          {proposalStatusLabels[proposal.status] || "Unknown"}
                        </span>
                      </div>
                      <p className="muted">
                        Risk {proposal.riskLevel} · {formatRitual(proposal.price)} ·
                        ETA {Number(proposal.etaSeconds) / 3600}h
                      </p>
                      <div className="link-list">
                        <a href={proposal.planURI} target="_blank">
                          Plan URI
                        </a>
                        {proposal.permissionURI ? (
                          <a href={proposal.permissionURI} target="_blank">
                            Permission URI
                          </a>
                        ) : null}
                      </div>
                      {signal.status === 0 && proposal.status === 0 ? (
                        <button
                          className="btn"
                          disabled={Boolean(actionPending)}
                          onClick={() => acceptProposal(proposal)}
                        >
                          {actionPending === `accept-${proposal.id.toString()}`
                            ? "Accepting..."
                            : `Accept response (${formatRitual(proposal.price)})`}
                        </button>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="row empty-state">No proposals yet.</div>
                )}
              </div>
            </div>
          </section>

          {mission ? (
            <section className="card mission-card surface-in delay-3">
              <span className="kicker">Mission</span>
              <h2>Mission #{mission.id.toString()}</h2>
              <div className="detail-grid">
                <div>
                  <span className="muted">Status</span>
                  <strong>{missionStatusLabels[mission.status] || "Unknown"}</strong>
                </div>
                <div>
                  <span className="muted">Agent</span>
                  <strong>#{mission.agentId.toString()}</strong>
                </div>
                <div>
                  <span className="muted">Escrow</span>
                  <strong>{formatRitual(mission.escrowAmount)}</strong>
                </div>
                <div>
                  <span className="muted">Response</span>
                  <strong>#{mission.proposalId.toString()}</strong>
                </div>
              </div>
              {mission.latestReportURI ? (
                <p className="muted tx">
                  Latest report:{" "}
                  <a href={mission.latestReportURI} target="_blank">
                    {mission.latestReportURI}
                  </a>
                </p>
              ) : null}
              {isMissionCompleted ? (
                <div className="success-box responder-detail">
                  <span className="kicker">Completed</span>
                  <strong>Mission finished and escrow released.</strong>
                  <p className="muted">No further action is needed for this request.</p>
                </div>
              ) : null}
              {isMissionReported ? (
                <div className="mission-actions">
                  <label className="field">
                    <span>User rating 1-5</span>
                    <input
                      className="input"
                      value={rating}
                      onChange={(event) => setRating(event.target.value)}
                    />
                  </label>
                  <button className="btn" disabled={Boolean(actionPending)} onClick={completeMission}>
                    {actionPending === "complete" ? "Completing..." : "Complete mission and pay agent"}
                  </button>
                </div>
              ) : null}
              {isMissionActive ? (
                <details className="technical-details responder-detail">
                  <summary>Agent delivery tools</summary>
                  <div className="mission-actions">
                    <label className="field">
                      <span>Agent report URI</span>
                      <input
                        className="input"
                        placeholder="ipfs://... or https://..."
                        value={reportURI}
                        onChange={(event) => setReportURI(event.target.value)}
                      />
                    </label>
                    <button
                      className="btn secondary"
                      disabled={Boolean(actionPending) || !reportURI}
                      onClick={submitMissionReport}
                    >
                      {actionPending === "report" ? "Submitting report..." : "Submit mission report"}
                    </button>
                  </div>
                </details>
              ) : null}
            </section>
          ) : null}

          <details className="agent-tools surface-in delay-4">
            <summary>
              <span>
                Responder workspace
                <small>Advanced: only agents use this to analyze and submit an answer.</small>
              </span>
            </summary>
            <section className="agent-tool-grid">
              <SubmitProposalForm
                signalContext={{
                  signalId: signal.id.toString(),
                  title: signal.title,
                  problemURI: signal.problemURI,
                  budget: formatRitual(signal.budget).replace(" RITUAL", ""),
                  tags: [...signal.tags],
                  metadata,
                }}
              />
            </section>
          </details>
        </>
      ) : null}
    </main>
  );
}

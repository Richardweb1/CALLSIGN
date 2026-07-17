"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { callsignAbi } from "../lib/callsignAbi";
import { formatDeadline, formatRitual, signalStatusLabels } from "../lib/callsignFormat";
import { callsignAddress } from "../lib/contract";
import { makeSignalReference } from "../lib/signalId";
import { publicClient } from "../lib/viem";
import { RegisterResponderForm } from "./RegisterResponderForm";
import { SubmitProposalForm } from "./SubmitProposalForm";

type Signal = Awaited<ReturnType<typeof readSignal>>;

async function readSignal(id: bigint) {
  return publicClient.readContract({
    address: callsignAddress,
    abi: callsignAbi,
    functionName: "getSignal",
    args: [id],
  });
}

async function readOfferCount(signalId: bigint) {
  const ids = await publicClient.readContract({
    address: callsignAddress,
    abi: callsignAbi,
    functionName: "getSignalProposalIds",
    args: [signalId],
  });
  return ids.length;
}

export function AgentMissionWorkspace() {
  const [missions, setMissions] = useState<Array<{ signal: Signal; offerCount: number }>>([]);
  const [selectedSignalId, setSelectedSignalId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(undefined);
      try {
        const ids = await publicClient.readContract({
          address: callsignAddress,
          abi: callsignAbi,
          functionName: "getAllSignalIds",
        });
        const recent = [...ids].reverse().slice(0, 30);
        const settled = await Promise.allSettled(recent.map(readSignal));
        const openSignals = settled
          .flatMap((result) => (result.status === "fulfilled" ? [result.value] : []))
          .filter((signal) => signal.status === 0)
          .slice(0, 8);
        const withCounts = await Promise.all(
          openSignals.map(async (signal) => ({
            signal,
            offerCount: await readOfferCount(signal.id),
          })),
        );

        if (!cancelled) setMissions(withCounts);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load open missions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="agent-workspace-grid">
      <div className="card agent-mission-picker surface-in delay-2">
        <div className="row-head">
          <div>
            <span className="kicker">Open missions</span>
            <h2>Answer one of these</h2>
          </div>
          <Link className="btn secondary" href="/missions">
            Browse all
          </Link>
        </div>
        <p className="muted">
          Choose a live mission to fill the offer form automatically. Agents submit scoped offers first;
          work happens off-app until the report flow is added.
        </p>
        {error ? <p className="error-text">{error}</p> : null}
        {loading ? <div className="row empty-state">Loading open missions...</div> : null}
        {!loading && missions.length ? (
          <div className="agent-mission-list">
            {missions.map(({ signal, offerCount }) => {
              const id = signal.id.toString();
              const selected = selectedSignalId === id;
              return (
                <article className={`agent-mission-row${selected ? " selected" : ""}`} key={id}>
                  <div>
                    <span className="kicker">{makeSignalReference(id, signal.problemURI)}</span>
                    <h3>{signal.title}</h3>
                    <p className="muted">
                      {signal.tags[0] || "Mission"} · {formatRitual(signal.budget)} · {formatDeadline(signal.deadline)}
                    </p>
                  </div>
                  <div className="agent-mission-actions">
                    <span className="status-dot">{signalStatusLabels[signal.status]}</span>
                    <span className="muted">{offerCount} offers</span>
                    <button className="btn secondary" type="button" onClick={() => setSelectedSignalId(id)}>
                      {selected ? "Selected" : "Answer this mission"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
        {!loading && !missions.length ? (
          <div className="row empty-state">No open missions found yet.</div>
        ) : null}
      </div>

      <div className="two action-grid agent-tool-grid standalone-agent-grid">
        <RegisterResponderForm />
        <SubmitProposalForm selectedSignalId={selectedSignalId} />
      </div>
    </section>
  );
}

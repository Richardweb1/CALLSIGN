"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { callsignAbi } from "../lib/callsignAbi";
import { callsignAddress } from "../lib/contract";
import { formatDeadline, formatRitual, signalStatusLabels } from "../lib/callsignFormat";
import { makeSignalReference } from "../lib/signalId";
import { publicClient } from "../lib/viem";

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

export function OpenMissionsPreview() {
  const [missions, setMissions] = useState<Array<{ signal: Signal; offerCount: number }>>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const ids = await publicClient.readContract({
          address: callsignAddress,
          abi: callsignAbi,
          functionName: "getAllSignalIds",
        });
        const recent = [...ids].reverse().slice(0, 12);
        const settledSignals = await Promise.allSettled(recent.map(readSignal));
        const openSignals = settledSignals
          .flatMap((result) => (result.status === "fulfilled" ? [result.value] : []))
          .filter((signal) => signal.status === 0)
          .slice(0, 3);
        const withCounts = await Promise.all(
          openSignals.map(async (signal) => ({
            signal,
            offerCount: await readOfferCount(signal.id),
          })),
        );

        if (!cancelled) {
          setMissions(withCounts);
          setError(undefined);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load missions.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="open-missions surface-in delay-4" id="missions">
      <div className="section-title">
        <h2>Open missions</h2>
        <Link className="muted" href="/missions">
          Browse all missions
        </Link>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="mission-card-grid">
        {missions.length ? (
          missions.map(({ signal, offerCount }) => (
            <article className="mission-preview-card" key={signal.id.toString()}>
              <span className="kicker">{makeSignalReference(signal.id.toString(), signal.problemURI)}</span>
              <h3>{signal.title}</h3>
              <div className="mission-preview-meta">
                <span>{signal.tags[0] || "Mission"}</span>
                <span>{formatRitual(signal.budget)}</span>
                <span>{formatDeadline(signal.deadline)}</span>
                <span>{offerCount} offers</span>
              </div>
              <div className="row-head">
                <span className="status-dot">{signalStatusLabels[signal.status]}</span>
                <Link className="btn secondary" href={`/missions/${signal.id.toString()}`}>
                  View Mission
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="row empty-state">No open missions found yet.</div>
        )}
      </div>
    </section>
  );
}

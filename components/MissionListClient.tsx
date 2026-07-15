"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { callsignAbi } from "../lib/callsignAbi";
import { callsignAddress } from "../lib/contract";
import { formatDeadline, formatRitual, shortAddress, signalStatusLabels } from "../lib/callsignFormat";
import { makeSignalReference } from "../lib/signalId";
import { publicClient } from "../lib/viem";

type Signal = Awaited<ReturnType<typeof readSignal>>;
type MissionListMode = "all" | "mine";

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

export function MissionListClient({ mode = "all" }: { mode?: MissionListMode }) {
  const [signals, setSignals] = useState<Array<{ signal: Signal; offerCount: number }>>([]);
  const [account, setAccount] = useState<Address>();
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function loadAccount() {
      const ethereum = window.ethereum;
      if (!ethereum) return;
      const accounts = (await ethereum.request({ method: "eth_accounts" })) as Address[];
      setAccount(accounts[0]);
      const handleAccountsChanged = (nextAccounts: unknown) => {
        const [nextAccount] = Array.isArray(nextAccounts) ? (nextAccounts as Address[]) : [];
        setAccount(nextAccount);
      };
      ethereum.on?.("accountsChanged", handleAccountsChanged);
    }

    loadAccount();
  }, []);

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
        const recent = [...ids].reverse().slice(0, 80);
        const settled = await Promise.allSettled(recent.map(readSignal));
        const allSignals = settled.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : [],
        );
        const normalizedAccount = account?.toLowerCase();
        const visibleSignals =
          mode === "mine"
            ? normalizedAccount
              ? allSignals.filter((signal) => signal.creator.toLowerCase() === normalizedAccount)
              : []
            : allSignals.filter((signal) => signal.status === 0);
        const withCounts = await Promise.all(
          visibleSignals.map(async (signal) => ({
            signal,
            offerCount: await readOfferCount(signal.id),
          })),
        );
        if (!cancelled) setSignals(withCounts);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load missions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [account, mode]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    signals.forEach(({ signal }) => {
      if (signal.tags[0]) unique.add(signal.tags[0]);
    });
    return ["all", ...Array.from(unique)];
  }, [signals]);

  const filteredSignals = signals.filter(({ signal }) => {
    const statusMatches = statusFilter === "all" || String(signal.status) === statusFilter;
    const categoryMatches = categoryFilter === "all" || signal.tags[0] === categoryFilter;
    return statusMatches && categoryMatches;
  });

  return (
    <section className="mission-list-shell">
      <div className="mission-filters">
        <label className="field">
          <span>Status</span>
          <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {signalStatusLabels.map((label, index) => (
              <option value={String(index)} key={label}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Category</span>
          <select className="input" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            {categories.map((category) => (
              <option value={category} key={category}>
                {category === "all" ? "All categories" : category}
              </option>
            ))}
          </select>
        </label>
        {mode === "mine" ? (
          <div className="wallet-pill">
            {account ? `Connected as ${shortAddress(account)}` : "Connect wallet to view your missions"}
          </div>
        ) : null}
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <div className="row empty-state">Loading missions...</div> : null}
      {!loading && mode === "mine" && !account ? (
        <div className="row empty-state">Connect your wallet to view your missions.</div>
      ) : null}
      {!loading && filteredSignals.length ? (
        <div className="mission-list">
          {filteredSignals.map(({ signal, offerCount }) => (
            <article className="mission-list-card" key={signal.id.toString()}>
              <div>
                <span className="kicker">{makeSignalReference(signal.id.toString(), signal.problemURI)}</span>
                <h3>{signal.title}</h3>
                <p className="muted">
                  {signal.tags[0] || "Mission"} · {formatRitual(signal.budget)} · {formatDeadline(signal.deadline)}
                </p>
              </div>
              <div className="mission-list-meta">
                <span className="status-dot">{signalStatusLabels[signal.status]}</span>
                <span className="muted">{offerCount} offers</span>
                <Link className="btn secondary" href={`/missions/${signal.id.toString()}`}>
                  View Mission
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
      {!loading && !filteredSignals.length && (mode !== "mine" || account) ? (
        <div className="row empty-state">No missions found for the current filters.</div>
      ) : null}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { callsignAbi } from "../lib/callsignAbi";
import { callsignAddress } from "../lib/contract";
import { formatRitual, shortAddress, signalStatusLabels } from "../lib/callsignFormat";
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

export function CallsignOverview() {
  const [missionIds, setMissionIds] = useState<bigint[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [account, setAccount] = useState<Address>();
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
      try {
        const [allSignals, allMissions] = await Promise.all([
          publicClient.readContract({
            address: callsignAddress,
            abi: callsignAbi,
            functionName: "getAllSignalIds",
          }),
          publicClient.readContract({
            address: callsignAddress,
            abi: callsignAbi,
            functionName: "getAllMissionIds",
          }),
        ]);

        const recentSignalIds = [...allSignals].reverse().slice(0, 20);
        const recentSignalResults = await Promise.allSettled(recentSignalIds.map(readSignal));
        const recentSignals = recentSignalResults.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : [],
        );
        const normalizedAccount = account?.toLowerCase();
        const ownedSignals = normalizedAccount
          ? recentSignals.filter(
              (signal) =>
                signal.creator.toLowerCase() === normalizedAccount && signal.status === 0,
            )
          : [];

        if (!cancelled) {
          setMissionIds([...allMissions]);
          setSignals(ownedSignals);
          setError(undefined);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not read CALLSIGN data.");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [account]);

  return (
    <>
      <div className="grid stats-grid">
        <div className="stat stat-hot surface-in delay-1">
          <strong>{signals.length}</strong>
          <span className="muted">Your requests</span>
        </div>
        <div className="stat surface-in delay-2">
          <strong>{missionIds.length}</strong>
          <span className="muted">Missions on CALLSIGN</span>
        </div>
      </div>
      {error ? <p className="error-text">{error}</p> : null}

      <div className="section-title surface-in delay-2">
        <h2>Your latest submission</h2>
        <span className="muted">
          {account ? `Connected as ${shortAddress(account)}` : "Connect wallet to view your signals"}
        </span>
      </div>
      <div className="list surface-in delay-3">
        {!account ? (
          <div className="row empty-state">
            Connect your wallet to see the signals you submitted and their results.
          </div>
        ) : signals.length ? (
          <>
            <Link className="row latest-row" href={`/signals/${signals[0].id.toString()}`}>
              <div className="row-head">
                <div>
                  <span className="kicker">
                    {makeSignalReference(signals[0].id.toString(), signals[0].problemURI)}
                  </span>
                  <strong>{signals[0].title}</strong>
                  <div className="muted">
                    {signalStatusLabels[signals[0].status]} · budget {formatRitual(signals[0].budget)}
                  </div>
                </div>
                <span className="status-dot">Open result</span>
              </div>
              <div className="tag-row">
                {signals[0].tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
            {signals.length > 1 ? (
              <p className="muted overview-note">
                Showing your latest signal. You have {signals.length} submissions on this wallet.
                Use the reference checker below to open older results.
              </p>
            ) : null}
          </>
        ) : (
          <div className="row empty-state">
            No signals found for this wallet yet. Submit a problem signal below, then reconnect later to find the result here.
          </div>
        )}
      </div>
    </>
  );
}

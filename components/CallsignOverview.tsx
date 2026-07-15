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
        const allSignals = await publicClient.readContract({
          address: callsignAddress,
          abi: callsignAbi,
          functionName: "getAllSignalIds",
        });

        const recentSignalIds = [...allSignals].reverse().slice(0, 20);
        const recentSignalResults = await Promise.allSettled(recentSignalIds.map(readSignal));
        const recentSignals = recentSignalResults.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : [],
        );
        const normalizedAccount = account?.toLowerCase();
        const ownedSignals = normalizedAccount
          ? recentSignals.filter(
              (signal) => signal.creator.toLowerCase() === normalizedAccount,
            )
          : [];

        if (!cancelled) {
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
      {error ? <p className="error-text">{error}</p> : null}

      <div className="section-title surface-in delay-2">
        <h2>Find results from your wallet</h2>
        <span className="muted">
          {account ? `Connected as ${shortAddress(account)}` : "Connect wallet to view your missions"}
        </span>
      </div>
      <div className="list compact-wallet-list surface-in delay-3">
        {!account ? (
          <div className="row empty-state">
            Connect your wallet to see the latest mission you posted.
          </div>
        ) : signals.length ? (
          <>
            <Link className="row latest-row" href={`/missions/${signals[0].id.toString()}`}>
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
                Showing your latest mission. Use My Missions to view all {signals.length} missions from this wallet.
              </p>
            ) : null}
          </>
        ) : (
          <div className="row empty-state">
            No missions found for this wallet yet. Post a mission below, then reconnect later to find it here.
          </div>
        )}
      </div>
    </>
  );
}

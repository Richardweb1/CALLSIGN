"use client";

import { useEffect, useState } from "react";
import type { Address } from "viem";
import { getConnectedAccount, getWalletClient } from "../lib/viem";

export function ConnectWallet() {
  const [address, setAddress] = useState<Address>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function syncConnectedAccount() {
      try {
        const account = await getConnectedAccount();
        if (!cancelled) setAddress(account);
      } catch {
        if (!cancelled) setAddress(undefined);
      }
    }

    function handleAccountsChanged(accounts: unknown) {
      const [account] = Array.isArray(accounts) ? accounts : [];
      setAddress(typeof account === "string" ? (account as Address) : undefined);
    }

    void syncConnectedAccount();
    window.ethereum?.on?.("accountsChanged", handleAccountsChanged);

    return () => {
      cancelled = true;
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  async function connect() {
    setPending(true);
    try {
      const { account } = await getWalletClient();
      setAddress(account);
    } finally {
      setPending(false);
    }
  }

  if (address) {
    return (
      <div className="nav-actions">
        <span className="pill">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button className="btn secondary" onClick={() => setAddress(undefined)}>
          Hide
        </button>
      </div>
    );
  }

  return (
    <button className="btn" disabled={pending} onClick={connect}>
      {pending ? "Connecting..." : "Connect wallet"}
    </button>
  );
}

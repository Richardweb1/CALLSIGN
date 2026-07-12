"use client";

import { useState } from "react";
import type { Address } from "viem";
import { getWalletClient } from "../lib/viem";

export function ConnectWallet() {
  const [address, setAddress] = useState<Address>();
  const [pending, setPending] = useState(false);

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
          Disconnect
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

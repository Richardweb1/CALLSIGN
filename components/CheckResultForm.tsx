"use client";

import { useState } from "react";
import { normalizeSignalId } from "../lib/signalId";

export function CheckResultForm() {
  const [signalId, setSignalId] = useState("");
  const cleanSignalId = normalizeSignalId(signalId);

  return (
    <div className="check-form">
      <input
        className="input"
        placeholder="Reference code, example CS-7-BAFK..."
        value={signalId}
        onChange={(event) => setSignalId(event.target.value)}
      />
      <a
        className="btn secondary"
        href={cleanSignalId ? `/signals/${cleanSignalId}` : "#signal-result-id"}
        onClick={(event) => {
          if (!cleanSignalId) event.preventDefault();
        }}
      >
        Check status
      </a>
    </div>
  );
}

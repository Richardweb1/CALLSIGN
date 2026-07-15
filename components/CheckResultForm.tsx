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
        placeholder="Example: CS-1042"
        value={signalId}
        onChange={(event) => setSignalId(event.target.value)}
      />
      <div className="check-actions">
        <a
          className="btn"
          href={cleanSignalId ? `/missions/${cleanSignalId}` : "#find-mission"}
          onClick={(event) => {
            if (!cleanSignalId) event.preventDefault();
          }}
        >
          Find Mission
        </a>
        <a className="btn secondary" href="/my-missions">
          View My Missions
        </a>
      </div>
    </div>
  );
}

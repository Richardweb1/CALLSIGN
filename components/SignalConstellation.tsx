"use client";

import { useState } from "react";

const details = {
  signal: {
    title: "Signal",
    meta: "Problem broadcast",
    body: "A user publishes the outcome they need, budget, tags, and deadline.",
  },
  plan: {
    title: "Plan",
    meta: "Agent proposal",
    body: "Responder agents compete with execution plan, ETA, and price.",
  },
  permission: {
    title: "Permission",
    meta: "Safety footprint",
    body: "Every proposal declares exactly what access it needs before execution.",
  },
  mission: {
    title: "Mission",
    meta: "Accepted responder",
    body: "The selected agent starts work, submits reports, and earns reputation.",
  },
  reporter: {
    title: "ReporterAgent",
    meta: "1 RIT/day · Low risk",
    body: "Best for daily wallet summaries and simple read-only monitoring.",
  },
  analyst: {
    title: "AnalystAgent",
    meta: "3 RIT/week · Deep report",
    body: "Best for slower but richer risk analysis and weekly strategy reports.",
  },
  ops: {
    title: "OpsAgent",
    meta: "Read-only scope",
    body: "Best for operational checks that should not move funds or mutate state.",
  },
} as const;

type DetailKey = keyof typeof details;

export function SignalConstellation() {
  const [active, setActive] = useState<DetailKey | null>(null);
  const item = active ? details[active] : null;

  return (
    <div
      className="signal-visual"
      aria-label="Interactive CALLSIGN signal dispatch map"
      onMouseLeave={() => setActive(null)}
    >
      <div className="radar-grid" />
      <div className="sweep" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <div className="orbital-dot dot-one" />
      <div className="orbital-dot dot-two" />
      <div className="orbital-dot dot-three" />

      <button
        className="signal-core interactive-node"
        onClick={() => setActive("signal")}
        onMouseEnter={() => setActive("signal")}
      >
        <span>CALLSIGN</span>
        <small>Problem broadcast network</small>
      </button>

      <button
        className="proposal-card proposal-alpha interactive-node"
        onClick={() => setActive("reporter")}
        onMouseEnter={() => setActive("reporter")}
      >
        <b>ReporterAgent</b>
        <span>1 RIT/day · Low risk</span>
      </button>
      <button
        className="proposal-card proposal-beta interactive-node"
        onClick={() => setActive("analyst")}
        onMouseEnter={() => setActive("analyst")}
      >
        <b>AnalystAgent</b>
        <span>3 RIT/week · Deep report</span>
      </button>
      <button
        className="proposal-card proposal-gamma interactive-node"
        onClick={() => setActive("ops")}
        onMouseEnter={() => setActive("ops")}
      >
        <b>OpsAgent</b>
        <span>Needs read-only scope</span>
      </button>

      <button
        className="ping ping-a interactive-node"
        onClick={() => setActive("signal")}
        onMouseEnter={() => setActive("signal")}
      >
        Signal
      </button>
      <button
        className="ping ping-b interactive-node"
        onClick={() => setActive("plan")}
        onMouseEnter={() => setActive("plan")}
      >
        Plan
      </button>
      <button
        className="ping ping-c interactive-node"
        onClick={() => setActive("permission")}
        onMouseEnter={() => setActive("permission")}
      >
        Permission
      </button>
      <button
        className="ping ping-d interactive-node"
        onClick={() => setActive("mission")}
        onMouseEnter={() => setActive("mission")}
      >
        Mission
      </button>

      <div className="beam beam-a" />
      <div className="beam beam-b" />
      <div className="beam beam-c" />
      <div className="data-packet packet-a" />
      <div className="data-packet packet-b" />
      <div className="data-packet packet-c" />

      {item ? (
        <aside className="signal-info-panel" key={active}>
          <button
            className="signal-info-close"
            type="button"
            aria-label="Close signal detail"
            onClick={() => setActive(null)}
          >
            ×
          </button>
          <span>{item.meta}</span>
          <strong>{item.title}</strong>
          <p>{item.body}</p>
        </aside>
      ) : null}
    </div>
  );
}

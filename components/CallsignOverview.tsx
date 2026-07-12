"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { callsignAbi } from "../lib/callsignAbi";
import { callsignAddress } from "../lib/contract";
import { publicClient } from "../lib/viem";

type Agent = {
  id: bigint;
  owner: `0x${string}`;
  agentWallet: `0x${string}`;
  name: string;
  capabilityURI: string;
  tags: readonly string[];
  reputation: bigint;
  missionsCompleted: bigint;
  active: boolean;
  createdAt: bigint;
};

type Signal = {
  id: bigint;
  creator: `0x${string}`;
  title: string;
  problemURI: string;
  tags: readonly string[];
  budget: bigint;
  deadline: bigint;
  status: number;
  acceptedProposalId: bigint;
  createdAt: bigint;
};

const signalStatus = ["Open", "Assigned", "Closed", "Expired"];

export function CallsignOverview() {
  const [agentIds, setAgentIds] = useState<readonly bigint[]>([]);
  const [signalIds, setSignalIds] = useState<readonly bigint[]>([]);
  const [missionIds, setMissionIds] = useState<readonly bigint[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [loadedAgentIds, loadedSignalIds, loadedMissionIds] =
        await Promise.all([
          publicClient.readContract({
            address: callsignAddress,
            abi: callsignAbi,
            functionName: "getAllAgentIds",
          }),
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

      const loadedAgents = await Promise.all(
        loadedAgentIds.slice(-5).map((id) =>
          publicClient.readContract({
            address: callsignAddress,
            abi: callsignAbi,
            functionName: "getAgent",
            args: [id],
          }),
        ),
      );

      const loadedSignals = await Promise.all(
        loadedSignalIds.slice(-5).map((id) =>
          publicClient.readContract({
            address: callsignAddress,
            abi: callsignAbi,
            functionName: "getSignal",
            args: [id],
          }),
        ),
      );

      if (!cancelled) {
        setAgentIds(loadedAgentIds);
        setSignalIds(loadedSignalIds);
        setMissionIds(loadedMissionIds);
        setAgents(loadedAgents as Agent[]);
        setSignals(loadedSignals as Signal[]);
      }
    }

    load().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="grid stats-grid">
        <div className="stat stat-hot surface-in delay-1">
          <strong>{signalIds.length}</strong>
          <span className="muted">Broadcast signals</span>
        </div>
        <div className="stat surface-in delay-2">
          <strong>{agentIds.length}</strong>
          <span className="muted">Responder agents</span>
        </div>
        <div className="stat surface-in delay-3">
          <strong>{missionIds.length}</strong>
          <span className="muted">Active missions</span>
        </div>
      </div>

      <div className="section-title surface-in delay-2">
        <h2>Open transmissions</h2>
        <span className="muted">Problems waiting for agent proposals</span>
      </div>
      <div className="list surface-in delay-3">
        {signals.length === 0 ? (
          <div className="row empty-state">
            No signals yet. Broadcast the first problem and let agents respond.
          </div>
        ) : (
          signals.map((signal) => (
            <div className="row signal-row" key={signal.id.toString()}>
              <div className="row-head">
                <div>
                  <span className="kicker">Signal #{signal.id.toString()}</span>
                  <strong>{signal.title}</strong>
                  <div className="muted">
                    {signalStatus[signal.status] ?? "Unknown"} · budget{" "}
                    {formatEther(signal.budget)} RITUAL
                  </div>
                </div>
                <span className="status-dot">LIVE</span>
              </div>
              <div className="tag-row">
                {signal.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="section-title surface-in delay-2">
        <h2>Responder agents</h2>
        <span className="muted">Agents ready to answer calls</span>
      </div>
      <div className="list surface-in delay-3">
        {agents.length === 0 ? (
          <div className="row empty-state">
            No responders yet. Register an agent capability profile.
          </div>
        ) : (
          agents.map((agent) => (
            <div className="row" key={agent.id.toString()}>
              <div className="row-head">
                <div>
                  <span className="kicker">Responder #{agent.id.toString()}</span>
                  <strong>{agent.name}</strong>
                  <div className="muted">
                    rep {agent.reputation.toString()} · completed{" "}
                    {agent.missionsCompleted.toString()}
                  </div>
                </div>
                <span className="pill">
                  {agent.agentWallet.slice(0, 6)}...{agent.agentWallet.slice(-4)}
                </span>
              </div>
              <div className="tag-row">
                {agent.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { agentRepublicAbi } from "../lib/agentRepublicAbi";
import { agentRepublicAddress } from "../lib/contract";
import { publicClient } from "../lib/viem";

type AgentRecord = {
  id: bigint;
  owner: `0x${string}`;
  agentWallet: `0x${string}`;
  name: string;
  profileURI: string;
  systemPromptURI: string;
  tags: readonly string[];
  memoryURI: string;
  reputation: bigint;
  missionsCompleted: bigint;
  active: boolean;
  createdAt: bigint;
};

type IntentRecord = {
  id: bigint;
  agentId: bigint;
  intentType: number;
  title: string;
  descriptionURI: string;
  tags: readonly string[];
  budget: bigint;
  deadline: bigint;
  active: boolean;
  createdAt: bigint;
};

export function RepublicOverview() {
  const [agentIds, setAgentIds] = useState<readonly bigint[]>([]);
  const [intentIds, setIntentIds] = useState<readonly bigint[]>([]);
  const [missionIds, setMissionIds] = useState<readonly bigint[]>([]);
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [intents, setIntents] = useState<IntentRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [loadedAgentIds, loadedIntentIds, loadedMissionIds] =
        await Promise.all([
          publicClient.readContract({
            address: agentRepublicAddress,
            abi: agentRepublicAbi,
            functionName: "getAllAgentIds",
          }),
          publicClient.readContract({
            address: agentRepublicAddress,
            abi: agentRepublicAbi,
            functionName: "getAllIntentIds",
          }),
          publicClient.readContract({
            address: agentRepublicAddress,
            abi: agentRepublicAbi,
            functionName: "getAllMissionIds",
          }),
        ]);

      const loadedAgents = await Promise.all(
        loadedAgentIds.slice(-6).map((id) =>
          publicClient.readContract({
            address: agentRepublicAddress,
            abi: agentRepublicAbi,
            functionName: "getAgent",
            args: [id],
          }),
        ),
      );

      const loadedIntents = await Promise.all(
        loadedIntentIds.slice(-6).map((id) =>
          publicClient.readContract({
            address: agentRepublicAddress,
            abi: agentRepublicAbi,
            functionName: "getIntent",
            args: [id],
          }),
        ),
      );

      if (!cancelled) {
        setAgentIds(loadedAgentIds);
        setIntentIds(loadedIntentIds);
        setMissionIds(loadedMissionIds);
        setAgents(loadedAgents as AgentRecord[]);
        setIntents(loadedIntents as IntentRecord[]);
      }
    }

    load().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="grid">
        <div className="stat">
          <strong>{agentIds.length}</strong>
          <span className="muted">Sovereign agent passports</span>
        </div>
        <div className="stat">
          <strong>{intentIds.length}</strong>
          <span className="muted">Published intents</span>
        </div>
        <div className="stat">
          <strong>{missionIds.length}</strong>
          <span className="muted">Missions formed</span>
        </div>
      </div>

      <div className="section-title">
        <h2>Latest agents</h2>
        <span className="muted">Agent passports on Ritual</span>
      </div>
      <div className="list">
        {agents.length === 0 ? (
          <div className="row muted">No agents yet. Register the first one.</div>
        ) : (
          agents.map((agent) => (
            <div className="row" key={agent.id.toString()}>
              <div className="row-head">
                <div>
                  <strong>
                    #{agent.id.toString()} {agent.name}
                  </strong>
                  <div className="muted">
                    wallet {agent.agentWallet.slice(0, 6)}...
                    {agent.agentWallet.slice(-4)}
                  </div>
                </div>
                <span className="pill">rep {agent.reputation.toString()}</span>
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

      <div className="section-title">
        <h2>Latest intents</h2>
        <span className="muted">Needs and offers</span>
      </div>
      <div className="list">
        {intents.length === 0 ? (
          <div className="row muted">No intents yet. Publish one from an agent.</div>
        ) : (
          intents.map((intent) => (
            <div className="row" key={intent.id.toString()}>
              <div className="row-head">
                <div>
                  <strong>
                    #{intent.id.toString()} {intent.title}
                  </strong>
                  <div className="muted">
                    Agent #{intent.agentId.toString()} ·{" "}
                    {intent.intentType === 0 ? "Offering" : "Requesting"}
                  </div>
                </div>
                <span className="pill">{formatEther(intent.budget)} RITUAL</span>
              </div>
              <div className="tag-row">
                {intent.tags.map((tag) => (
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

"use client";

import { useMemo, useState } from "react";
import { parseEther, parseEventLogs } from "viem";
import { callsignAbi } from "../lib/callsignAbi";
import { callsignAddress } from "../lib/contract";
import { makeSignalReference } from "../lib/signalId";
import {
  getTransactionErrorMessage,
  sendLegacyContractTransaction,
  waitForTransaction,
} from "../lib/viem";

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function BroadcastSignalForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Development");
  const [offerDeadline, setOfferDeadline] = useState("3 days");
  const [urgency, setUrgency] = useState("Normal");
  const [tags, setTags] = useState("");
  const [location, setLocation] = useState("");
  const [requestedCapabilities, setRequestedCapabilities] = useState("");
  const [evidenceLinks, setEvidenceLinks] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [budget, setBudget] = useState("");
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<string>();
  const [txHash, setTxHash] = useState<string>();
  const [createdSignalId, setCreatedSignalId] = useState<string>();
  const [createdIpfsUri, setCreatedIpfsUri] = useState<string>();
  const [error, setError] = useState<string>();
  const parsedTags = useMemo(() => parseTags(tags), [tags]);
  const parsedCapabilities = useMemo(
    () => parseTags(requestedCapabilities),
    [requestedCapabilities],
  );
  const parsedEvidence = useMemo(
    () =>
      evidenceLinks
        .split("\n")
        .map((link) => link.trim())
        .filter(Boolean),
    [evidenceLinks],
  );
  const referenceCode = createdSignalId
    ? makeSignalReference(createdSignalId, createdIpfsUri)
    : "";

  async function submit() {
    setPending(true);
    setError(undefined);
    setProgress("Preparing mission");
    try {
      setCreatedSignalId(undefined);
      setCreatedIpfsUri(undefined);
      const missionTags = Array.from(new Set([category.toLowerCase(), ...parsedTags]));
      const missionCapabilities = parsedCapabilities.length
        ? parsedCapabilities
        : [category.toLowerCase(), "agent response"];

      setProgress("Uploading mission details");
      const uploadResponse = await fetch("/api/ipfs/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          offerDeadline,
          urgency,
          tags: missionTags,
          location,
          requestedCapabilities: missionCapabilities,
          evidenceLinks: parsedEvidence,
          extraInstructions,
          budget,
        }),
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || "Could not upload signal metadata.");
      }

      const args = [
        title,
        uploadResult.ipfsUri as string,
        missionTags,
        parseEther(budget || "0"),
        0n,
      ] as const;
      setProgress("Creating on-chain signal");
      const hash = await sendLegacyContractTransaction({
        address: callsignAddress,
        abi: callsignAbi,
        functionName: "broadcastSignal",
        args,
      });
      setTxHash(hash);
      setCreatedIpfsUri(uploadResult.ipfsUri);
      setProgress("Confirming transaction");
      const receipt = await waitForTransaction(hash);
      const [event] = parseEventLogs({
        abi: callsignAbi,
        eventName: "SignalBroadcast",
        logs: receipt.logs,
      });
      if (event?.args.signalId !== undefined) {
        setCreatedSignalId(event.args.signalId.toString());
      }
      setProgress("Mission published");
    } catch (err) {
      setError(getTransactionErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card action-card primary-action-card surface-in delay-4">
      <span className="kicker">Post Mission</span>
      <h2>Post a mission</h2>
      <p className="muted">
        Describe what you need. Agents can review your mission and send you an offer.
      </p>
      <p className="safety-note">
        Mission details may be publicly accessible. Do not include passwords, private keys,
        credentials, personal data, or confidential files.
      </p>
      <div className="submit-steps" aria-label="Mission submit steps">
        <span><b>1</b> Describe mission</span>
        <span><b>2</b> Set budget</span>
        <span><b>3</b> Post on Ritual</span>
      </div>
      <div className="form">
        <label className="field">
          <span>1. What do you need?</span>
          <input className="input" placeholder="Example: Review my smart contract" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>Describe the result you expect</span>
          <textarea className="input textarea" placeholder="Describe the task, expected result, and any important requirements." value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>2. Mission type</span>
            <select className="input" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option>Research</option>
              <option>Development</option>
              <option>Security</option>
              <option>Automation</option>
              <option>Data Analysis</option>
              <option>Other</option>
            </select>
          </label>
          <label className="field">
            <span>Offer window</span>
            <select className="input" value={offerDeadline} onChange={(event) => setOfferDeadline(event.target.value)}>
              <option>24 hours</option>
              <option>3 days</option>
              <option>7 days</option>
              <option>Custom</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>3. Budget in RITUAL</span>
          <input className="input" placeholder="0.1" value={budget} onChange={(event) => setBudget(event.target.value)} />
        </label>
        <details className="advanced-options">
          <summary>Optional details for better agent offers</summary>
          <div className="form advanced-options-grid">
            <div className="form-grid">
              <label className="field">
                <span>Urgency</span>
                <select className="input" value={urgency} onChange={(event) => setUrgency(event.target.value)}>
                  <option>Low</option>
                  <option>Normal</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </label>
              <label className="field">
                <span>Location optional</span>
                <input className="input" placeholder="Website, repo, city, protocol..." value={location} onChange={(event) => setLocation(event.target.value)} />
              </label>
            </div>
            <label className="field">
              <span>Tags</span>
              <input className="input" placeholder="security, wallet, report" value={tags} onChange={(event) => setTags(event.target.value)} />
            </label>
            <label className="field">
              <span>Required capabilities</span>
              <input className="input" placeholder="qa, monitoring, frontend review" value={requestedCapabilities} onChange={(event) => setRequestedCapabilities(event.target.value)} />
            </label>
            <label className="field">
              <span>Evidence links optional</span>
              <textarea className="input textarea small-textarea" placeholder="One URL per line" value={evidenceLinks} onChange={(event) => setEvidenceLinks(event.target.value)} />
            </label>
            <label className="field">
              <span>Extra instructions</span>
              <textarea className="input textarea small-textarea" placeholder="Anything agents should know before sending an offer." value={extraInstructions} onChange={(event) => setExtraInstructions(event.target.value)} />
            </label>
          </div>
        </details>
        <button className="btn" disabled={pending} onClick={submit}>
          {pending ? progress || "Posting..." : "Post Mission"}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
        {createdSignalId ? (
          <div className="success-box">
            <span className="kicker">Your mission is live.</span>
            <strong>{title}</strong>
            <p className="muted">Current status: Open</p>
            <p className="muted">Reference ID: {referenceCode}</p>
            <p className="muted">Budget: {budget || "0"} RITUAL</p>
            <p className="muted">Offer deadline: {offerDeadline}</p>
            <div className="success-actions">
              <a className="btn secondary" href={`/signals/${createdSignalId}`}>
                View Mission
              </a>
              <button className="btn secondary" type="button" onClick={() => navigator.clipboard?.writeText(referenceCode)}>
                Copy Reference ID
              </button>
              <a className="btn secondary" href={`/signals/${createdSignalId}`}>
                Share Mission
              </a>
            </div>
            <p className="muted">
              Your request is saved. Reconnect the same wallet later and CALLSIGN will show it
              under your latest submission.
            </p>
            <details className="technical-details">
              <summary>Technical receipt</summary>
              <p className="muted">On-chain signal: #{createdSignalId}</p>
              {createdIpfsUri ? <p className="muted">Metadata: {createdIpfsUri}</p> : null}
            </details>
          </div>
        ) : null}
        {txHash ? <p className="muted tx">Tx: {txHash}</p> : null}
      </div>
    </div>
  );
}

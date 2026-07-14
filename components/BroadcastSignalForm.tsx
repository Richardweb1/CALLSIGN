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
  const [urgency, setUrgency] = useState("Normal");
  const [tags, setTags] = useState("");
  const [location, setLocation] = useState("");
  const [requestedCapabilities, setRequestedCapabilities] = useState("");
  const [evidenceLinks, setEvidenceLinks] = useState("");
  const [budget, setBudget] = useState("");
  const [pending, setPending] = useState(false);
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
    try {
      setCreatedSignalId(undefined);
      setCreatedIpfsUri(undefined);

      const uploadResponse = await fetch("/api/ipfs/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          urgency,
          tags: parsedTags,
          location,
          requestedCapabilities: parsedCapabilities,
          evidenceLinks: parsedEvidence,
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
        parsedTags,
        parseEther(budget || "0"),
        0n,
      ] as const;
      const hash = await sendLegacyContractTransaction({
        address: callsignAddress,
        abi: callsignAbi,
        functionName: "broadcastSignal",
        args,
      });
      setTxHash(hash);
      setCreatedIpfsUri(uploadResult.ipfsUri);
      const receipt = await waitForTransaction(hash);
      const [event] = parseEventLogs({
        abi: callsignAbi,
        eventName: "SignalBroadcast",
        logs: receipt.logs,
      });
      if (event?.args.signalId !== undefined) {
        setCreatedSignalId(event.args.signalId.toString());
      }
    } catch (err) {
      setError(getTransactionErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card action-card primary-action-card surface-in delay-4">
      <span className="kicker">Submit</span>
      <h2>Submit a problem</h2>
      <p className="muted">
        Submit the problem once. CALLSIGN uploads the details to IPFS, then your wallet saves
        the request on Ritual so you can check results later.
      </p>
      <p className="safety-note">
        Do not include private keys, seed phrases, passwords, admin credentials, or private user data.
      </p>
      <div className="form">
        <label className="field">
          <span>Signal title</span>
          <input className="input" placeholder="Describe the problem you want solved" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea className="input textarea" placeholder="Explain the issue, goal, expected output, and constraints" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
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
          <span>Requested capabilities</span>
          <input className="input" placeholder="qa, monitoring, frontend review" value={requestedCapabilities} onChange={(event) => setRequestedCapabilities(event.target.value)} />
        </label>
        <label className="field">
          <span>Evidence links optional</span>
          <textarea className="input textarea small-textarea" placeholder="One URL per line" value={evidenceLinks} onChange={(event) => setEvidenceLinks(event.target.value)} />
        </label>
        <label className="field">
          <span>Budget in RITUAL</span>
          <input className="input" placeholder="0.1" value={budget} onChange={(event) => setBudget(event.target.value)} />
        </label>
        <button className="btn" disabled={pending} onClick={submit}>
          {pending ? "Submitting..." : "Submit Problem"}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
        {createdSignalId ? (
          <div className="success-box">
            <span className="kicker">Saved</span>
            <strong>Reference: {referenceCode}</strong>
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

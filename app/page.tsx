import { BroadcastSignalForm } from "../components/BroadcastSignalForm";
import { CallsignOverview } from "../components/CallsignOverview";
import { ConnectWallet } from "../components/ConnectWallet";
import { RegisterResponderForm } from "../components/RegisterResponderForm";
import { SignalConstellation } from "../components/SignalConstellation";
import { SubmitProposalForm } from "../components/SubmitProposalForm";
import { callsignAddress } from "../lib/contract";

export default function Home() {
  return (
    <main className="shell animated-shell">
      <nav className="nav surface-in">
        <div className="brand">
          <div className="brand-mark">CS</div>
          <div>
            <div>CALLSIGN</div>
            <div className="muted">Signal dispatch for autonomous Ritual work</div>
          </div>
        </div>
        <ConnectWallet />
      </nav>

      <section className="hero">
        <div className="card hero-copy">
          <div className="hero-noise" />
          <span className="eyebrow">Ritual Chain · Signal Dispatch · Agent Responders</span>
          <h1>Broadcast a problem. Let sovereign agents respond.</h1>
          <p className="lead">
            CALLSIGN turns messy requests into open signals. Ritual agents read
            the call, return executable proposals, and expose the exact scope,
            risk, price, and ETA before any mission begins.
          </p>
          <div className="signal-compose">
            <span className="signal-dot" />
            <div>
              <strong>Live signal pattern</strong>
              <p>Problem → responder proposals → permission footprint → mission report.</p>
            </div>
          </div>
          <div className="hero-actions">
            <a className="btn" href="#broadcast">
              Broadcast Signal
            </a>
            <a
              className="btn secondary"
              href={`https://explorer.ritualfoundation.org/address/${callsignAddress}`}
              target="_blank"
            >
              View contract
            </a>
          </div>
          <div className="feature-strip">
            <span><b>01</b> Problem first</span>
            <span><b>02</b> Agent proposals</span>
            <span><b>03</b> Permission footprint</span>
            <span><b>04</b> Mission reports</span>
          </div>
        </div>

        <div className="hero-visual">
          <SignalConstellation />
        </div>
      </section>

      <section className="contract-ribbon surface-in delay-2">
        <div>
          <span className="muted">Live CallsignRegistry contract</span>
          <strong>{callsignAddress}</strong>
        </div>
        <a
          className="btn secondary"
          href={`https://explorer.ritualfoundation.org/address/${callsignAddress}`}
          target="_blank"
        >
          Explorer
        </a>
      </section>

      <CallsignOverview />

      <div className="section-title surface-in delay-3" id="broadcast">
        <h2>Operate the dispatch network</h2>
        <span className="muted">Broadcast, register, respond</span>
      </div>
      <section className="three action-grid">
        <BroadcastSignalForm />
        <RegisterResponderForm />
        <SubmitProposalForm />
      </section>
    </main>
  );
}

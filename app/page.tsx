import { BroadcastSignalForm } from "../components/BroadcastSignalForm";
import { CallsignOverview } from "../components/CallsignOverview";
import { CheckResultForm } from "../components/CheckResultForm";
import { ConnectWallet } from "../components/ConnectWallet";
import { RegisterResponderForm } from "../components/RegisterResponderForm";
import { SignalConstellation } from "../components/SignalConstellation";
import { SubmitProposalForm } from "../components/SubmitProposalForm";

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
            Submit a problem once, then reconnect the same wallet later to see
            agent responses, risk, price, ETA, and delivery status in one place.
          </p>
          <div className="signal-compose">
            <span className="signal-dot" />
            <div>
              <strong>Live signal pattern</strong>
              <p>Problem → agent answer → user approval → delivered result.</p>
            </div>
          </div>
          <div className="hero-actions">
            <a className="btn" href="#broadcast">
              Submit Problem
            </a>
          </div>
          <div className="feature-strip">
            <span><b>01</b> Problem first</span>
            <span><b>02</b> Agent answers</span>
            <span><b>03</b> Review answer</span>
            <span><b>04</b> Receive result</span>
          </div>
        </div>

        <div className="hero-visual">
          <SignalConstellation />
        </div>
      </section>

      <CallsignOverview />

      <div className="section-title surface-in delay-3" id="broadcast">
        <h2>Submit a problem</h2>
        <span className="muted">Upload once, then return with your wallet to see results</span>
      </div>
      <section className="user-flow-card surface-in delay-3">
        <div className="flow-copy">
          <span className="kicker">Simple user flow</span>
          <h3>What happens after submit?</h3>
          <div className="flow-steps">
            <div>
              <b>1</b>
              <span>Connect wallet and submit your problem.</span>
            </div>
            <div>
              <b>2</b>
              <span>CALLSIGN uploads the details to IPFS and saves your request on-chain.</span>
            </div>
            <div>
              <b>3</b>
              <span>Reconnect the same wallet later and open your result.</span>
            </div>
          </div>
        </div>
        <div className="result-check">
          <span className="kicker">Check later</span>
          <h3>Already submitted?</h3>
          <p className="muted">Paste your reference code to open the result page directly.</p>
          <CheckResultForm />
        </div>
      </section>
      <section className="single-action-grid">
        <BroadcastSignalForm />
      </section>

      <details className="agent-tools surface-in delay-4">
        <summary>
          <span>
            Responder tools
            <small>Advanced: only for agents who answer user requests</small>
          </span>
        </summary>
        <section className="two action-grid agent-tool-grid">
          <RegisterResponderForm />
          <SubmitProposalForm />
        </section>
      </details>
    </main>
  );
}

import { BroadcastSignalForm } from "../components/BroadcastSignalForm";
import { CallsignOverview } from "../components/CallsignOverview";
import { CheckResultForm } from "../components/CheckResultForm";
import { ConnectWallet } from "../components/ConnectWallet";

export default function Home() {
  return (
    <main className="shell animated-shell">
      <nav className="nav surface-in">
        <div className="brand">
          <div className="brand-mark">CS</div>
          <div>
            <div>CALLSIGN</div>
            <div className="muted">The Ritual-native marketplace for agent missions</div>
          </div>
        </div>
        <div className="nav-links">
          <a href="#post-mission">Post Mission</a>
          <a href="/my-missions">My Missions</a>
          <a href="/agents">Agents</a>
        </div>
        <ConnectWallet />
      </nav>

      <section className="hero">
        <div className="card hero-copy">
          <div className="hero-noise" />
          <span className="eyebrow">Ritual-native mission marketplace</span>
          <h1>Tell agents what you need.</h1>
          <p className="lead">
            Post a mission, receive agent offers, compare price and risk, and start securely
            through an on-chain flow.
          </p>
          <div className="hero-actions">
            <a className="btn" href="#post-mission">
              Post a Mission
            </a>
            <a className="btn secondary" href="#find-mission">
              Find My Mission
            </a>
          </div>
          <div className="trust-strip">
            <span>On-chain mission flow</span>
            <span>IPFS-backed metadata</span>
            <span>Escrow-based execution</span>
          </div>
        </div>

      </section>

      <section id="my-missions">
        <CallsignOverview />
      </section>

      <div className="section-title surface-in delay-3" id="post-mission">
        <h2>Post a mission</h2>
        <span className="muted">Upload once, then return with your wallet to see results</span>
      </div>
      <section className="single-action-grid">
        <BroadcastSignalForm />
      </section>

      <section className="find-mission-card surface-in delay-3" id="find-mission">
        <div className="result-check">
          <span className="kicker">Find your mission</span>
          <h3>Enter your CALLSIGN Reference ID or use your connected wallet.</h3>
          <CheckResultForm />
        </div>
      </section>

      <footer className="footer surface-in delay-4">
        <div>
          <strong>CALLSIGN</strong>
          <p className="muted">The Ritual-native marketplace for agent missions.</p>
        </div>
        <div className="footer-links">
          <a href="/agents">Agents</a>
          <a href="#post-mission">Post Mission</a>
          <a href="/my-missions">My Missions</a>
          <a href="https://github.com/Richardweb1/CALLSIGN" target="_blank">GitHub</a>
          <span>Built on Ritual</span>
        </div>
      </footer>
    </main>
  );
}

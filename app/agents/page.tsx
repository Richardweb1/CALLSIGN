import Link from "next/link";
import { ConnectWallet } from "../../components/ConnectWallet";
import { RegisterResponderForm } from "../../components/RegisterResponderForm";
import { SubmitProposalForm } from "../../components/SubmitProposalForm";

export default function AgentsPage() {
  return (
    <main className="shell animated-shell">
      <nav className="nav surface-in">
        <Link className="brand" href="/">
          <div className="brand-mark">CS</div>
          <div>
            <div>CALLSIGN</div>
            <div className="muted">Agent workspace</div>
          </div>
        </Link>
        <div className="nav-links">
          <Link href="/#post-mission">Post Mission</Link>
          <Link href="/#my-missions">My Missions</Link>
          <Link href="/agents">Agents</Link>
        </div>
        <ConnectWallet />
      </nav>

      <section className="card agent-intro surface-in">
        <span className="eyebrow">Agent tools</span>
        <h1>Work on CALLSIGN missions.</h1>
        <p className="lead">
          Agents only need two steps: register a responder profile once, then use that
          Agent ID to send offers on open missions.
        </p>
        <div className="agent-flow">
          <div>
            <b>1</b>
            <strong>Register once</strong>
            <span>Create your public agent profile and receive an Agent ID.</span>
          </div>
          <div>
            <b>2</b>
            <strong>Pick a mission</strong>
            <span>Open a mission from the marketplace and copy its Mission ID.</span>
          </div>
          <div>
            <b>3</b>
            <strong>Submit an offer</strong>
            <span>Use Ritual analysis, review the draft, then send your offer.</span>
          </div>
        </div>
      </section>

      <div className="section-title surface-in delay-1">
        <h2>Agent workflow</h2>
        <span className="muted">
          Need work to answer? <Link href="/missions">Browse open missions</Link>.
        </span>
      </div>
      <section className="two action-grid agent-tool-grid standalone-agent-grid">
        <RegisterResponderForm />
        <SubmitProposalForm />
      </section>
    </main>
  );
}

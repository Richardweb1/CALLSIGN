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
          <Link href="/">Missions</Link>
          <Link href="/#post-mission">Post Mission</Link>
          <Link href="/#my-missions">My Missions</Link>
        </div>
        <ConnectWallet />
      </nav>

      <section className="card agent-intro surface-in">
        <span className="eyebrow">Agent tools</span>
        <h1>Answer missions with scoped offers.</h1>
        <p className="lead">
          Register a responder profile, review open missions, use Ritual-assisted analysis,
          and submit an offer through the sovereign agent flow.
        </p>
      </section>

      <section className="two action-grid agent-tool-grid standalone-agent-grid">
        <RegisterResponderForm />
        <SubmitProposalForm />
      </section>
    </main>
  );
}

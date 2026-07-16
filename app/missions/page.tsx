import Link from "next/link";
import { ConnectWallet } from "../../components/ConnectWallet";
import { MissionListClient } from "../../components/MissionListClient";

export default function MissionsPage() {
  return (
    <main className="shell animated-shell">
      <nav className="nav surface-in">
        <Link className="brand" href="/">
          <div className="brand-mark">CS</div>
          <div>
            <div>CALLSIGN</div>
            <div className="muted">Open missions</div>
          </div>
        </Link>
        <div className="nav-links">
          <Link href="/#post-mission">Post Mission</Link>
          <Link href="/my-missions">My Missions</Link>
          <Link href="/agents">Agents</Link>
        </div>
        <ConnectWallet />
      </nav>

      <section className="card agent-intro surface-in">
        <span className="eyebrow">Mission marketplace</span>
        <h1>Browse open missions.</h1>
        <p className="lead">
          Find work posted by users, review the budget and deadline, then open a mission to prepare an offer.
        </p>
      </section>

      <MissionListClient mode="all" />
    </main>
  );
}

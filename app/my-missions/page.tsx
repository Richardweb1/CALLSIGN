import Link from "next/link";
import { ConnectWallet } from "../../components/ConnectWallet";
import { MissionListClient } from "../../components/MissionListClient";

export default function MyMissionsPage() {
  return (
    <main className="shell animated-shell">
      <nav className="nav surface-in">
        <Link className="brand" href="/">
          <div className="brand-mark">CS</div>
          <div>
            <div>CALLSIGN</div>
            <div className="muted">My missions</div>
          </div>
        </Link>
        <div className="nav-links">
          <Link href="/missions">Missions</Link>
          <Link href="/agents">Agents</Link>
          <Link href="/#post-mission">Post Mission</Link>
          <Link href="/my-missions">My Missions</Link>
        </div>
        <ConnectWallet />
      </nav>

      <section className="card agent-intro surface-in">
        <span className="eyebrow">Wallet missions</span>
        <h1>Track what you posted.</h1>
        <p className="lead">
          Reconnect the same wallet to see missions you created, their offers, and mission status.
        </p>
      </section>

      <MissionListClient mode="mine" />
    </main>
  );
}

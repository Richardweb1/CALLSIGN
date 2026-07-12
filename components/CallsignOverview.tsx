"use client";

export function CallsignOverview() {
  return (
    <>
      <div className="grid stats-grid">
        <div className="stat stat-hot surface-in delay-1">
          <strong>0</strong>
          <span className="muted">Broadcast signals</span>
        </div>
        <div className="stat surface-in delay-2">
          <strong>0</strong>
          <span className="muted">Responder agents</span>
        </div>
        <div className="stat surface-in delay-3">
          <strong>0</strong>
          <span className="muted">Active missions</span>
        </div>
      </div>

      <div className="section-title surface-in delay-2">
        <h2>Open transmissions</h2>
        <span className="muted">Problems waiting for agent proposals</span>
      </div>
      <div className="list surface-in delay-3">
        <div className="row empty-state">
          No public signals yet. Broadcast the first problem and let agents respond.
        </div>
      </div>

      <div className="section-title surface-in delay-2">
        <h2>Responder agents</h2>
        <span className="muted">Agents ready to answer calls</span>
      </div>
      <div className="list surface-in delay-3">
        <div className="row empty-state">
          No responders yet. Register an agent capability profile.
        </div>
      </div>
    </>
  );
}

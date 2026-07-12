export function AgentOrbit() {
  return (
    <div className="orbit-card" aria-label="Animated agent coordination orbit">
      <div className="orbit-grid" />
      <div className="orbit-ring ring-one" />
      <div className="orbit-ring ring-two" />
      <div className="orbit-core">
        <span>AR</span>
        <small>Republic Core</small>
      </div>
      <div className="orbit-node node-a">Need</div>
      <div className="orbit-node node-b">Offer</div>
      <div className="orbit-node node-c">Mission</div>
      <div className="orbit-node node-d">Memory</div>
      <div className="orbit-line line-a" />
      <div className="orbit-line line-b" />
      <div className="orbit-line line-c" />
    </div>
  );
}

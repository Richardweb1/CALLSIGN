const fs = require("fs");
const path = require("path");

const artifactPath = path.join(
  process.cwd(),
  "artifacts",
  "contracts",
  "CallsignSovereignAgent.sol",
  "CallsignSovereignAgent.json",
);

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const outputPath = path.join(process.cwd(), "lib", "sovereignAgentAbi.ts");

fs.writeFileSync(
  outputPath,
  `export const sovereignAgentAbi = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`,
);

console.log(`Wrote ${outputPath}`);

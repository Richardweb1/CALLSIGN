const fs = require("fs");
const path = require("path");

const artifactPath = path.join(
  process.cwd(),
  "artifacts",
  "contracts",
  "CallsignRegistry.sol",
  "CallsignRegistry.json",
);

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const outputPath = path.join(process.cwd(), "lib", "callsignAbi.ts");

fs.writeFileSync(
  outputPath,
  `export const callsignAbi = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`,
);

console.log(`Wrote ${outputPath}`);

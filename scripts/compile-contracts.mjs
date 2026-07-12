import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const contractFiles = ["AgentRepublic.sol", "CallsignRegistry.sol"];
const sources = Object.fromEntries(
  contractFiles.map((file) => [
    file,
    {
      content: fs.readFileSync(path.join(process.cwd(), "contracts", file), "utf8"),
    },
  ]),
);

const input = {
  language: "Solidity",
  sources,
  settings: {
    viaIR: true,
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = output.errors ?? [];
const fatal = errors.filter((error) => error.severity === "error");

for (const error of errors) {
  console.log(error.formattedMessage);
}

if (fatal.length > 0) {
  process.exit(1);
}

for (const file of contractFiles) {
  for (const [name, contract] of Object.entries(output.contracts[file])) {
    console.log(`${name} compiled successfully`);
    console.log(`ABI entries: ${contract.abi.length}`);
    console.log(`Bytecode bytes: ${contract.evm.bytecode.object.length / 2}`);
  }
}

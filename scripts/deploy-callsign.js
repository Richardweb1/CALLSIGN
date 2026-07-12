const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  if (!deployer) {
    throw new Error("No deployer signer found. Set PRIVATE_KEY in .env.");
  }

  const network = await hre.ethers.provider.getNetwork();
  console.log("Deploying CallsignRegistry");
  console.log("Network:", network.name, Number(network.chainId));
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "RITUAL");

  const CallsignRegistry = await hre.ethers.getContractFactory("CallsignRegistry");
  const callsign = await CallsignRegistry.deploy();

  await callsign.waitForDeployment();

  const address = await callsign.getAddress();
  const deploymentTx = callsign.deploymentTransaction();

  console.log("CallsignRegistry deployed:", address);
  if (deploymentTx) {
    console.log("Deployment tx:", deploymentTx.hash);
  }
  console.log(
    "Explorer:",
    `https://explorer.ritualfoundation.org/address/${address}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

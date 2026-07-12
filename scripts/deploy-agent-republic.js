const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  if (!deployer) {
    throw new Error(
      "No deployer signer found. Set PRIVATE_KEY in .env before deploying."
    );
  }

  const network = await hre.ethers.provider.getNetwork();
  console.log("Deploying AgentRepublic");
  console.log("Network:", network.name, Number(network.chainId));
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "RITUAL");

  const AgentRepublic = await hre.ethers.getContractFactory("AgentRepublic");
  const agentRepublic = await AgentRepublic.deploy();

  await agentRepublic.waitForDeployment();

  const address = await agentRepublic.getAddress();
  const deploymentTx = agentRepublic.deploymentTransaction();

  console.log("AgentRepublic deployed:", address);
  if (deploymentTx) {
    console.log("Deployment tx:", deploymentTx.hash);
  }
  console.log(
    "Explorer:",
    `https://explorer.ritualfoundation.org/address/${address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

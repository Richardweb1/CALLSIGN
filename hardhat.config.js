require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const RITUAL_RPC_URL =
  process.env.RITUAL_RPC_URL || "https://rpc.ritualfoundation.org";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

/** @type import("hardhat/config").HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    ritual: {
      url: RITUAL_RPC_URL,
      chainId: 1979,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};

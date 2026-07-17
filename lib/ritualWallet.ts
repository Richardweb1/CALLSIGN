export const ritualWalletAddress = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948";

export const ritualWalletAbi = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "lockDuration", type: "uint256" }],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

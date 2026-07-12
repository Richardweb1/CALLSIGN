export const agentRepublicAddress =
  "0x3bbd220c3D239aFADdD63B7176183D13CF45C9F5" as const;

export const callsignAddress =
  "0x3054c6eFf17661d2067ad6CC3cB506fCeEC39BFB" as const;

export const ritualChain = {
  id: 1979,
  name: "Ritual Chain",
  nativeCurrency: {
    decimals: 18,
    name: "RITUAL",
    symbol: "RITUAL",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.ritualfoundation.org"],
    },
    public: {
      http: ["https://rpc.ritualfoundation.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Ritual Explorer",
      url: "https://explorer.ritualfoundation.org",
    },
  },
} as const;

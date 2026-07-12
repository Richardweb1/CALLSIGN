import {
  createPublicClient,
  createWalletClient,
  custom,
  encodeFunctionData,
  http,
  toHex,
  type Address,
  type Abi,
} from "viem";
import { ritualChain } from "./contract";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const publicClient = createPublicClient({
  chain: ritualChain,
  transport: http(ritualChain.rpcUrls.default.http[0]),
});

export async function getWalletClient() {
  if (!window.ethereum) {
    throw new Error("No injected wallet found. Install MetaMask or Rabby.");
  }

  const walletClient = createWalletClient({
    chain: ritualChain,
    transport: custom(window.ethereum),
  });

  const [account] = await walletClient.requestAddresses();
  return { walletClient, account: account as Address };
}

export async function getInjectedAccount() {
  if (!window.ethereum) {
    throw new Error("No injected wallet found. Install MetaMask or Rabby.");
  }

  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as Address[];

  if (!accounts[0]) {
    throw new Error("No wallet account selected.");
  }

  return accounts[0];
}

export async function sendLegacyContractTransaction<
  const abi extends Abi,
  functionName extends string,
>({
  abi,
  address,
  functionName,
  args,
}: {
  abi: abi;
  address: Address;
  functionName: functionName;
  args: readonly unknown[];
}) {
  if (!window.ethereum) {
    throw new Error("No injected wallet found. Install MetaMask or Rabby.");
  }

  const account = await getInjectedAccount();
  const data = encodeFunctionData({
    abi,
    functionName,
    args,
  } as never);

  const [gas, gasPrice] = await Promise.all([
    publicClient.estimateGas({
      account,
      to: address,
      data,
    }),
    publicClient.getGasPrice(),
  ]);

  const hash = (await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: account,
        to: address,
        data,
        gas: toHex(gas),
        gasPrice: toHex(gasPrice),
      },
    ],
  })) as `0x${string}`;

  return hash;
}

export async function waitForTransaction(hash: `0x${string}`) {
  return publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
}

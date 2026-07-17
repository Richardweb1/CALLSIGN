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
  on?: (event: "accountsChanged", handler: (accounts: unknown) => void) => void;
  removeListener?: (event: "accountsChanged", handler: (accounts: unknown) => void) => void;
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

function getProviderErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: unknown;
      shortMessage?: unknown;
      details?: unknown;
      data?: { message?: unknown };
    };
    if (typeof maybeError.shortMessage === "string") return maybeError.shortMessage;
    if (typeof maybeError.message === "string") return maybeError.message;
    if (typeof maybeError.details === "string") return maybeError.details;
    if (typeof maybeError.data?.message === "string") return maybeError.data.message;
  }
  return "Transaction failed";
}

export function getTransactionErrorMessage(error: unknown) {
  const message = getProviderErrorMessage(error);
  if (/user rejected|user denied|rejected the request/i.test(message)) {
    return "Transaction cancelled in wallet.";
  }
  if (/insufficient funds|exceeds balance/i.test(message)) {
    return "Wallet has insufficient RITUAL for gas or budget.";
  }
  if (/wrong network|chain|network|unsupported/i.test(message)) {
    return "Wallet is not on Ritual Chain. Switch to Ritual Chain ID 1979 and try again.";
  }
  return message;
}

async function ensureRitualChain() {
  if (!window.ethereum) return;

  const targetChainId = toHex(ritualChain.id);
  const currentChainId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
  if (currentChainId?.toLowerCase() === targetChainId.toLowerCase()) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainId }],
    });
  } catch (error) {
    const message = getProviderErrorMessage(error);
    if (!message.includes("4902") && !/not added|unrecognized|does not exist/i.test(message)) {
      throw error;
    }

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: targetChainId,
          chainName: ritualChain.name,
          nativeCurrency: ritualChain.nativeCurrency,
          rpcUrls: ritualChain.rpcUrls.default.http,
          blockExplorerUrls: [ritualChain.blockExplorers.default.url],
        },
      ],
    });
  }
}

export async function getWalletClient() {
  if (!window.ethereum) {
    throw new Error("No injected wallet found. Install MetaMask or Rabby.");
  }

  await ensureRitualChain();

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

export async function getConnectedAccount() {
  if (!window.ethereum) return undefined;

  const accounts = (await window.ethereum.request({
    method: "eth_accounts",
  })) as Address[];

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
  value,
}: {
  abi: abi;
  address: Address;
  functionName: functionName;
  args: readonly unknown[];
  value?: bigint;
}) {
  if (!window.ethereum) {
    throw new Error("No injected wallet found. Install MetaMask or Rabby.");
  }

  await ensureRitualChain();

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
      value,
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
        value: value !== undefined ? toHex(value) : undefined,
        gas: toHex(gas),
        gasPrice: toHex(gasPrice),
      },
    ],
  })) as `0x${string}`;

  return hash;
}

export async function sendLegacyTransaction({
  data,
  gas,
  to,
  value,
}: {
  data?: `0x${string}`;
  gas?: bigint;
  to: Address;
  value?: bigint;
}) {
  if (!window.ethereum) {
    throw new Error("No injected wallet found. Install MetaMask or Rabby.");
  }

  await ensureRitualChain();

  const account = await getInjectedAccount();
  const [estimatedGas, gasPrice] = await Promise.all([
    gas
      ? Promise.resolve(gas)
      : publicClient.estimateGas({
          account,
          to,
          data,
          value,
        }),
    publicClient.getGasPrice(),
  ]);

  return (await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: account,
        to,
        data,
        value: value !== undefined ? toHex(value) : undefined,
        gas: toHex(estimatedGas),
        gasPrice: toHex(gasPrice),
      },
    ],
  })) as `0x${string}`;
}

export async function waitForTransaction(hash: `0x${string}`) {
  return publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
}

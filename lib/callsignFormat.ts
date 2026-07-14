import { formatEther } from "viem";

export const signalStatusLabels = ["Open", "Assigned / In Progress", "Resolved", "Archived"] as const;
export const proposalStatusLabels = ["Pending", "Accepted", "Rejected", "Cancelled"] as const;
export const missionStatusLabels = ["Active", "Reported", "Completed", "Disputed", "Refunded"] as const;

export function formatRitual(value: bigint) {
  const formatted = formatEther(value);
  return `${formatted.replace(/\.0+$|(\.\d*?)0+$/u, "$1")} RITUAL`;
}

export function formatDeadline(deadline: bigint) {
  if (deadline === 0n) return "No deadline";
  return new Date(Number(deadline) * 1000).toLocaleString();
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

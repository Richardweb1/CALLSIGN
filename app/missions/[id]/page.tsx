import { SignalDetailClient } from "../../../components/SignalDetailClient";

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SignalDetailClient id={id} />;
}

import { RouteLoading } from "@/components/dashboard/route-loading";

export default function ClientAnalyticsLoading() {
  return (
    <RouteLoading
      title="Loading analytics"
      description="Gathering conversation trends, transcripts, and resolution metrics for this client."
    />
  );
}

import { RouteLoading } from "@/components/dashboard/route-loading";

export default function DashboardRouteLoading() {
  return (
    <RouteLoading
      title="Loading overview"
      description="Pulling the latest client activity, conversation totals, and platform metrics."
    />
  );
}

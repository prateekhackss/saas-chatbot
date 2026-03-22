import { MarketingLandingPage } from "@/components/landing/landing-page";
import { AccountDeletedBanner } from "@/components/ui/account-deleted-banner";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const showDeleted = params.deleted === "true";

  return (
    <>
      {showDeleted && <AccountDeletedBanner />}
      <MarketingLandingPage />
    </>
  );
}

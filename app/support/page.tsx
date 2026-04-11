import SupportPageClient from "@/components/SupportPageClient";
import { fetchSupportServices } from "@/lib/support-services-data";

// Revalidate every 60 s so the page is never permanently cached with empty data.
export const revalidate = 60;

export default async function SupportPage() {
  let services = await fetchSupportServices().catch(() => []);

  return <SupportPageClient initialServices={services} />;
}

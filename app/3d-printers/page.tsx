import { redirect } from "next/navigation";

const buildRedirectUrl = (pathname: string, searchParams?: { sort?: string; page?: string }) => {
  if (!searchParams) {
    return pathname;
  }

  const params = new URLSearchParams();
  if (searchParams.sort) {
    params.set("sort", searchParams.sort);
  }
  if (searchParams.page) {
    params.set("page", searchParams.page);
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
};

export default function PrintersPage({
  searchParams,
}: {
  searchParams?: { sort?: string; page?: string };
}) {
  redirect(buildRedirectUrl("/category/3d-printers", searchParams));
}

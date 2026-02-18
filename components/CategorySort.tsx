"use client";

import { useRouter, useSearchParams } from "next/navigation";

type CategorySortProps = {
  currentSort: string;
};

export default function CategorySort({ currentSort }: CategorySortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", event.target.value);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <select
      id="sort"
      name="sort"
      defaultValue={currentSort}
      className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-text focus:border-black focus:outline-none"
      onChange={handleChange}
    >
      <option value="price-asc">Price: Low to high</option>
      <option value="price-desc">Price: High to low</option>
    </select>
  );
}

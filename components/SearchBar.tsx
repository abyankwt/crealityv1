"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type KeyboardEvent } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState<string>("");

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="search" className="sr-only">
        Search products
      </label>
      <input
        id="search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search products"
        className="h-11 w-full rounded-full border border-gray-200 bg-white px-5 text-sm text-text placeholder:text-gray-400 focus:border-black focus:outline-none"
        aria-label="Search products"
      />
    </form>
  );
}

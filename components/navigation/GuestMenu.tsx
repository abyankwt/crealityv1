"use client";

import Link from "next/link";

type GuestMenuProps = {
  onClose: () => void;
};

export default function GuestMenu({ onClose }: GuestMenuProps) {
  return (
    <>
      <Link
        href="/login"
        className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
        onClick={onClose}
      >
        Login
      </Link>
      <Link
        href="/register"
        className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
        onClick={onClose}
      >
        Register
      </Link>
    </>
  );
}

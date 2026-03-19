"use client";

import Link from "next/link";

type UserMenuProps = {
  onClose: () => void;
  onLogout: () => void;
};

export default function UserMenu({ onClose, onLogout }: UserMenuProps) {
  return (
    <>
      <Link
        href="/account"
        className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
        onClick={onClose}
      >
        Dashboard
      </Link>
      <Link
        href="/account/orders"
        className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
        onClick={onClose}
      >
        Orders
      </Link>
      <Link
        href="/account/addresses"
        className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
        onClick={onClose}
      >
        Addresses
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
      >
        Logout
      </button>
    </>
  );
}

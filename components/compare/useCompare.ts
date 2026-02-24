"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "creality_compare_v1";
const MAX_ITEMS = 4;

export type CompareItem = {
  id: number;
  name?: string;
  image?: string;
};

const normalizeItems = (raw: unknown): CompareItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (typeof entry === "number") {
        return { id: entry };
      }
      if (entry && typeof entry === "object") {
        const typed = entry as CompareItem;
        if (Number.isFinite(typed.id)) {
          return { id: typed.id, name: typed.name, image: typed.image };
        }
      }
      return null;
    })
    .filter((value): value is CompareItem => value !== null);
};

const readItems = (): CompareItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return normalizeItems(parsed);
  } catch {
    return [];
  }
};

const writeItems = (items: CompareItem[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("compare-updated"));
};

export type CompareState = {
  items: CompareItem[];
  ids: number[];
  maxItems: number;
  canAddMore: boolean;
  isSelected: (id: number) => boolean;
  toggleItem: (item: CompareItem) => { ok: boolean; reason?: string };
  removeItem: (id: number) => void;
  clearAll: () => void;
};

export default function useCompare(): CompareState {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    setItems(readItems());

    const handleUpdate = () => {
      setItems(readItems());
    };

    window.addEventListener("compare-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("compare-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const canAddMore = items.length < MAX_ITEMS;
  const ids = useMemo(() => items.map((item) => item.id), [items]);

  const isSelected = useCallback(
    (id: number) => items.some((item) => item.id === id),
    [items]
  );

  const toggleItem = useCallback(
    (item: CompareItem) => {
      const current = readItems();
      if (current.some((existing) => existing.id === item.id)) {
        const next = current.filter((value) => value.id !== item.id);
        writeItems(next);
        return { ok: true };
      }
      if (current.length >= MAX_ITEMS) {
        return { ok: false, reason: `Max ${MAX_ITEMS} products` };
      }
      const next = [...current, item];
      writeItems(next);
      return { ok: true };
    },
    []
  );

  const removeItem = useCallback((id: number) => {
    const next = readItems().filter((value) => value.id !== id);
    writeItems(next);
  }, []);

  const clearAll = useCallback(() => {
    writeItems([]);
  }, []);

  return useMemo(
    () => ({
      items,
      ids,
      maxItems: MAX_ITEMS,
      canAddMore,
      isSelected,
      toggleItem,
      removeItem,
      clearAll,
    }),
    [items, canAddMore, isSelected, toggleItem, removeItem, clearAll]
  );
}

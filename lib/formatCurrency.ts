export function formatKWD(amount: number | string | null | undefined) {
  const value =
    typeof amount === "string" ? parseFloat(amount) : Number(amount ?? 0);

  return `${value.toFixed(3)} KWD`;
}

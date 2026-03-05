export const CURRENCY = "PKR";

export function formatMoney(n, currency = CURRENCY) {
  const v = Number(n || 0);
  return `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
}

export function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}
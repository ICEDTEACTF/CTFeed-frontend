export function formatTimestampToLocal(timestamp?: number | null): string {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp * 1000);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

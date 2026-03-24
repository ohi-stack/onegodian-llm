export function scoreOutput(text: string): number {
  let score = 5;

  if (text.length > 100) score += 1;
  if (text.includes("unity")) score += 1;
  if (text.includes("intelligence")) score += 1;
  if (text.length > 300) score += 1;

  return Math.min(score, 10);
}

/**
 * Topic card vertical rhythm — single source for spacing + question block height.
 *
 * Tailwind spacing: gap-2 = 8px, py-3 = 12px, leading-5 = 1.25rem (20px) per line.
 * Question area reserves exactly 3 lines at text-xs + leading-5 → 3 × 20px = 60px = 3.75rem.
 */
export const TOPIC_ROW_LAYOUT = {
  /** Space between major card sections (meta / question / stats / pin). */
  sectionGap: "gap-2",
  /** Card padding — matches Tailwind py-3 px-3. */
  padding: "px-3 py-3",
  /** Reserved height for exactly three lines of question text + ellipsis. */
  questionBlockHeight: "h-[3.75rem]",
  /** Line metrics that must match questionBlockHeight (3 × 1.25rem). */
  questionText: "text-xs font-semibold leading-5",
  questionClamp: "line-clamp-3",
  /** Pin row — icon hit target without stretching the card unpredictably. */
  pinRowHeight: "h-8",
  /** Top row: category + meta — single baseline, no wrap overflow into question. */
  metaRowMinHeight: "min-h-[1.75rem]",
} as const;

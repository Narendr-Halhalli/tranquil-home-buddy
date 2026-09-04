# Water Tab: Un-stick the Monthly Summary

## Goal
The Monthly Summary card at the top of the Water tab currently stays pinned (sticky) while scrolling. Change it so it flows with the page like every other section.

## Change
- In `src/components/mps/WaterForm.tsx` (line 91), remove the sticky behavior from the Monthly Summary wrapper:
  - Replace `className="sticky top-2 z-30"` with a plain wrapper (no positioning classes).
- Everything else — metrics grid, MonthPicker, inputs, floor cards, results table — stays exactly as-is.

## Verification
- Scroll the Water tab in preview and confirm the summary card scrolls away with the rest of the content.

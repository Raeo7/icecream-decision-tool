/** Round to whole shekels, halves away from zero, matching Excel's ROUND. */
export function sh(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/**
 * A cost, rounded and stored negative so a statement reads top to bottom as a sum.
 *
 * Negating zero in JavaScript gives negative zero, which `toLocaleString` renders as
 * "-0" and which `Object.is` treats as distinct from 0. A season with no premise, no
 * machines and no loan has six such lines, so this returns a plain zero instead.
 */
export function cost(value: number): number {
  const rounded = sh(value);
  return rounded === 0 ? 0 : -rounded;
}

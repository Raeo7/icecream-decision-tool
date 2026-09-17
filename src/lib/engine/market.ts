/**
 * The season's market context.
 *
 * Handout section 6: "The actual market runs up to 20% below or above forecast." That swing is
 * the only uncertainty the app models about market size, and it models both ends rather than
 * picking one.
 *
 * How the market is then divided is not a belief and does not live here: it is the trainer's
 * stated rule, run in `allocation.ts`.
 */

/** The market runs up to 20% either side of the published forecast. */
export const FORECAST_SWING = 0.2;

export interface MarketBand {
  low: number;
  forecast: number;
  high: number;
}

export function marketBand(forecast: number): MarketBand {
  return {
    low: Math.round(forecast * (1 - FORECAST_SWING)),
    forecast,
    high: Math.round(forecast * (1 + FORECAST_SWING)),
  };
}

/** How much of the whole season you are asking for, at forecast and at both extremes. */
export function shareOfMarket(request: number, band: MarketBand) {
  return {
    atLow: request / band.low,
    atForecast: request / band.forecast,
    atHigh: request / band.high,
  };
}

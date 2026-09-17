import { describe, expect, it } from "vitest";
import { marketBand, shareOfMarket } from "@/lib/engine/market";

describe("marketBand", () => {
  it("should run twenty per cent either side of the forecast", () => {
    // #given the Year 1 spring forecast
    const band = marketBand(360000);

    // #then the market could be a fifth smaller or a fifth larger
    expect(band).toEqual({ low: 288000, forecast: 360000, high: 432000 });
  });

  it("should keep the forecast itself untouched in the middle", () => {
    // #given any forecast
    const band = marketBand(280000);

    // #then the published figure is the centre, not an end
    expect(band.forecast).toBe(280000);
    expect(band.low).toBeLessThan(band.forecast);
    expect(band.high).toBeGreaterThan(band.forecast);
  });
});

describe("shareOfMarket", () => {
  it("should show how much of the season you are asking for at each end of the swing", () => {
    // #given a 70,000 request into the 360,000 spring forecast
    const share = shareOfMarket(70000, marketBand(360000));

    // #then the ask is a larger slice of a small market than of a big one
    expect(share.atLow).toBeGreaterThan(share.atForecast);
    expect(share.atForecast).toBeGreaterThan(share.atHigh);
  });
});

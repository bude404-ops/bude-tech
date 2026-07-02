export function runSwarm(agents = [], market, genomes = []) {
  return [
    {
      name: "Trend Agent",
      bias: market.trendStrength > 0.6 ? "LONG" : "SHORT",
      confidence: market.trendStrength
    },
    {
      name: "Risk Agent",
      bias: market.volatility > 0.7 ? "NO TRADE" : "LONG",
      confidence: 0.8
    }
  ];
}

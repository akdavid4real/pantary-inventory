type Conversion = {
  fromUnit: string;
  toUnit: string;
  multiplier: number;
};

export function normalizeUnit(value: string) {
  const unit = value.trim().toLowerCase();
  if (["piece", "pieces", "pc", "pcs", "unit", "units"].includes(unit)) return "piece";
  if (["litre", "liter", "litres", "liters"].includes(unit)) return "l";
  if (["tablespoon", "tablespoons", "tbsp"].includes(unit)) return "tbsp";
  if (["teaspoon", "teaspoons", "tsp"].includes(unit)) return "tsp";
  if (["cups"].includes(unit)) return "cup";
  if (["dericas"].includes(unit)) return "derica";
  return unit;
}

export function convertIngredientQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string,
  conversions: Conversion[] = [],
) {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (from === to) return quantity;

  const factors: Record<string, number> = {
    g: 1,
    kg: 1000,
    ml: 1,
    l: 1000,
    cup: 250,
    tbsp: 15,
    tsp: 5,
    piece: 1,
  };
  const dimensions: Record<string, string> = {
    g: "mass",
    kg: "mass",
    ml: "volume",
    l: "volume",
    cup: "volume",
    tbsp: "volume",
    tsp: "volume",
    piece: "count",
  };

  if (factors[from] && factors[to] && dimensions[from] === dimensions[to]) {
    return (quantity * factors[from]) / factors[to];
  }

  const direct = conversions.find(
    (conversion) => normalizeUnit(conversion.fromUnit) === from && normalizeUnit(conversion.toUnit) === to,
  );
  if (direct) return quantity * direct.multiplier;

  const reverse = conversions.find(
    (conversion) => normalizeUnit(conversion.fromUnit) === to && normalizeUnit(conversion.toUnit) === from,
  );
  if (reverse && reverse.multiplier > 0) return quantity / reverse.multiplier;

  const baseUnits = ["g", "ml", "piece"];
  for (const baseUnit of baseUnits) {
    const first = convertOneStep(quantity, from, baseUnit, conversions);
    if (first === null) continue;
    const second = convertOneStep(first, baseUnit, to, conversions);
    if (second !== null) return second;
  }

  return null;
}

function convertOneStep(quantity: number, from: string, to: string, conversions: Conversion[]) {
  if (from === to) return quantity;
  const factors: Record<string, number> = { g: 1, kg: 1000, ml: 1, l: 1000, cup: 250, tbsp: 15, tsp: 5, piece: 1 };
  const dimensions: Record<string, string> = { g: 'mass', kg: 'mass', ml: 'volume', l: 'volume', cup: 'volume', tbsp: 'volume', tsp: 'volume', piece: 'count' };
  if (factors[from] && factors[to] && dimensions[from] === dimensions[to]) {
    return (quantity * factors[from]) / factors[to];
  }
  const direct = conversions.find(
    (conversion) => normalizeUnit(conversion.fromUnit) === from && normalizeUnit(conversion.toUnit) === to,
  );
  if (direct) return quantity * direct.multiplier;
  const reverse = conversions.find(
    (conversion) => normalizeUnit(conversion.fromUnit) === to && normalizeUnit(conversion.toUnit) === from,
  );
  return reverse && reverse.multiplier > 0 ? quantity / reverse.multiplier : null;
}

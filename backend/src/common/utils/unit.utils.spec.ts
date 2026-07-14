import { convertIngredientQuantity } from './unit.utils';
import { describe, expect, it } from 'vitest';

describe('ingredient quantity conversion', () => {
  const riceConversions = [
    { fromUnit: 'cup', toUnit: 'g', multiplier: 200 },
    { fromUnit: 'derica', toUnit: 'g', multiplier: 750 },
  ];

  it('converts rice cups and derica through ingredient-specific factors', () => {
    expect(convertIngredientQuantity(2, 'cup', 'g', riceConversions)).toBe(400);
    expect(convertIngredientQuantity(2, 'derica', 'kg', riceConversions)).toBe(1.5);
    expect(convertIngredientQuantity(1000, 'g', 'derica', riceConversions)).toBeCloseTo(1.333, 3);
  });

  it('does not convert count units to mass without an ingredient factor', () => {
    expect(convertIngredientQuantity(2, 'piece', 'g')).toBeNull();
  });

  it('deducts two cups from rice stored as two derica without mixing units', () => {
    const storedDerica = 2;
    const usedDerica = convertIngredientQuantity(2, 'cup', 'derica', riceConversions);
    expect(usedDerica).toBeCloseTo(0.533333, 6);
    expect(storedDerica - usedDerica!).toBeCloseTo(1.466667, 6);
  });
});

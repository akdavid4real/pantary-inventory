export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeIngredientName(value: string): string {
  const normalized = normalizeText(value);

  const aliases: Record<string, string> = {
    tomatoes: 'tomato',
    'fresh tomatoes': 'tomato',
    'fresh tomato': 'tomato',
    pepper: 'pepper',
    'fresh pepper': 'pepper',
    'scotch bonnet': 'pepper',
    'ata rodo': 'pepper',
    tatashe: 'red bell pepper',
    maggi: 'seasoning cube',
    knorr: 'seasoning cube',
    'stock cube': 'seasoning cube',
    'seasoning cubes': 'seasoning cube',
    ugu: 'fluted pumpkin leaf',
    'ugu leaf': 'fluted pumpkin leaf',
    garri: 'garri',
    gari: 'garri',
    'cassava flakes': 'garri',
    crayfish: 'dried crayfish',
    'dried crayfish': 'dried crayfish',
    iru: 'locust beans',
    dawadawa: 'locust beans',
    'palm-oil': 'palm oil',
  };

  return aliases[normalized] ?? normalized;
}

export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

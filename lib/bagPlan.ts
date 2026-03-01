// ── BAG PLAN HELPERS ─────────────────────────────────────
export type SensitivityGroup = { key: string; label: string; emoji: string; color: string; border: string };

export const SENSITIVITY_GROUPS: SensitivityGroup[] = [
  { key: 'frozen',          label: 'Frozen',           emoji: '🧊', color: 'bg-cyan-50',   border: 'border-cyan-200'   },
  { key: 'chilled',         label: 'Chilled',          emoji: '❄️', color: 'bg-sky-50',    border: 'border-sky-200'    },
  { key: 'fragile',         label: 'Fragile',          emoji: '⚠️', color: 'bg-rose-50',   border: 'border-rose-200'   },
  { key: 'delicate-produce',label: 'Delicate Produce', emoji: '🍅', color: 'bg-red-50',    border: 'border-red-200'    },
  { key: 'produce',         label: 'Fresh Produce',    emoji: '🌿', color: 'bg-green-50',  border: 'border-green-200'  },
  { key: 'bakery',          label: 'Bakery',           emoji: '🥖', color: 'bg-amber-50',  border: 'border-amber-200'  },
  { key: 'dry',             label: 'Dry Goods',        emoji: '📦', color: 'bg-orange-50', border: 'border-orange-200' },
  { key: 'general',         label: 'General',          emoji: '🛍️', color: 'bg-gray-50',   border: 'border-gray-200'   },
];

// Standard bag weight capacity in grams.
// A typical plastic produce bag holds ~1.5kg comfortably.
// Delicate bags are kept lighter (~600g) so items don't get crushed.
const BAG_CAPACITY_G: Record<string, number> = {
  'delicate-produce': 600,   // tomatoes/berries crush easily — keep bags light
  'produce':          1500,  // standard veg bag
  'bakery':           1200,  // bread/pastries need space but aren't too heavy
  'default':          2000,  // dry/chilled/frozen — heavier items ok
};

// Estimated weight per single unit (grams)
function getItemWeightG(name: string): number {
  const n = name.toLowerCase();
  // Delicate produce
  if (/cherry tomato/.test(n))                        return 20;
  if (/tomato/.test(n))                               return 150;
  if (/strawberr/.test(n))                            return 250;  // punnet
  if (/raspberr|blueberr|blackberr/.test(n))          return 125;  // small punnet
  if (/grape/.test(n))                                return 200;  // bunch
  if (/mushroom/.test(n))                             return 30;
  if (/peach|plum|apricot/.test(n))                   return 130;
  if (/fig/.test(n))                                  return 50;
  if (/kiwi/.test(n))                                 return 90;
  if (/avocado/.test(n))                              return 200;
  if (/cherry/.test(n))                               return 8;    // each
  // Hardy produce — bulky veg first
  if (/cabbage/.test(n))                              return 800;
  if (/cauliflower/.test(n))                          return 600;
  if (/broccoli/.test(n))                             return 400;
  if (/lettuce/.test(n))                              return 350;
  if (/courgette|zucchini/.test(n))                   return 250;
  if (/cucumber/.test(n))                             return 300;
  if (/sweet potato/.test(n))                         return 250;
  if (/potato/.test(n))                               return 200;
  if (/pepper|capsicum/.test(n))                      return 160;
  if (/carrot/.test(n))                               return 80;
  if (/parsnip/.test(n))                              return 100;
  if (/onion/.test(n))                                return 150;
  if (/garlic/.test(n))                               return 50;
  if (/mango/.test(n))                                return 300;
  if (/apple/.test(n))                                return 180;
  if (/orange/.test(n))                               return 200;
  if (/pear/.test(n))                                 return 170;
  if (/banana/.test(n))                               return 120;
  if (/lemon|lime/.test(n))                           return 100;
  // Bakery
  if (/loaf|bread/.test(n))                           return 800;
  if (/bagel/.test(n))                                return 100;
  if (/croissant/.test(n))                            return 80;
  if (/muffin|donut|doughnut/.test(n))                return 120;
  if (/roll|bun/.test(n))                             return 80;
  if (/cake|pastry/.test(n))                          return 150;
  return 150; // sensible default
}

export function classifyItem(name: string): SensitivityGroup {
  const n = name.toLowerCase();
  if (/frozen|ice cream|gelato/.test(n))                                                                              return SENSITIVITY_GROUPS[0];
  if (/milk|yogurt|yoghurt|cheese|butter|cream|dairy|meat|chicken|beef|lamb|pork|fish|seafood|prawn|salmon|tuna|egg/.test(n)) return SENSITIVITY_GROUPS[1];
  if (/glass|bottle|jar|fragile/.test(n))                                                                             return SENSITIVITY_GROUPS[2];
  if (/cherry tomato|tomato|strawberr|raspberr|blueberr|blackberr|cherry|grape|mushroom|peach|plum|apricot|fig|kiwi|avocado/.test(n)) return SENSITIVITY_GROUPS[3];
  if (/apple|banana|orange|mango|pear|lemon|lime|fruit|potato|sweet potato|carrot|onion|garlic|lettuce|spinach|salad|vegetable|veg|cucumber|pepper|courgette|broccoli|cauliflower|cabbage/.test(n)) return SENSITIVITY_GROUPS[4];
  if (/bread|roll|bun|loaf|pastry|cake|croissant|muffin|donut|doughnut|bagel/.test(n))                               return SENSITIVITY_GROUPS[5];
  if (/rice|pasta|noodle|cereal|flour|sugar|salt|can|tin|sauce|oil|vinegar|spice|coffee|tea|biscuit|crisp|snack/.test(n)) return SENSITIVITY_GROUPS[6];
  return SENSITIVITY_GROUPS[7];
}

// Split items into bags using weight capacity.
// Items are never split mid-unit — if one unit exceeds capacity it gets its own bag.
function splitByWeight(items: any[], capacityG: number): any[][] {
  const totalWeight = items.reduce((s: number, i: any) => s + i.quantity * getItemWeightG(i.itemName), 0);
  if (totalWeight <= capacityG) return [items];

  const bags: any[][] = [];
  let bag: any[] = [];
  let bagWeightG = 0;

  for (const item of items) {
    const unitW = getItemWeightG(item.itemName);
    let remaining = item.quantity;

    while (remaining > 0) {
      const spaceUnits = Math.max(1, Math.floor((capacityG - bagWeightG) / unitW));
      const take = Math.min(spaceUnits, remaining);

      bag.push({ ...item, quantity: take });
      bagWeightG += take * unitW;
      remaining -= take;

      // Seal bag when full (or when item won't fit at all in current bag)
      if (bagWeightG >= capacityG || (remaining > 0 && bagWeightG + unitW > capacityG)) {
        bags.push(bag);
        bag = [];
        bagWeightG = 0;
      }
    }
  }

  if (bag.length > 0) bags.push(bag);
  return bags;
}

export type BagEntry = { bagNo: number; group: SensitivityGroup; items: any[]; weightG: number };

export function buildBagPlan(items: any[]): BagEntry[] {
  // Group by sensitivity
  const map = new Map<string, { group: SensitivityGroup; items: any[] }>();
  for (const item of items) {
    const group = classifyItem(item.itemName);
    if (!map.has(group.key)) map.set(group.key, { group, items: [] });
    map.get(group.key)!.items.push(item);
  }

  const bags: Omit<BagEntry, 'bagNo'>[] = [];
  for (const { group, items: gItems } of map.values()) {
    const cap = BAG_CAPACITY_G[group.key] ?? BAG_CAPACITY_G.default;
    const chunks = splitByWeight(gItems, cap);
    for (const chunk of chunks) {
      const weightG = chunk.reduce((s: number, i: any) => s + i.quantity * getItemWeightG(i.itemName), 0);
      bags.push({ group, items: chunk, weightG });
    }
  }

  return bags.map((b, i) => ({ bagNo: i + 1, ...b }));
}

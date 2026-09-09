/**
 * Every kind of shop a town or kasba has, with the label people actually use.
 *
 * Mirrors `StoreCategory` in the backend. Each entry carries a Hindi label
 * because in a small town the shop is "दवा की दुकान", not "Pharmacy", and an
 * icon because a lot of users scan for the picture before they read the word.
 */
export type CategoryGroup =
  | 'daily'
  | 'medical'
  | 'utility'
  | 'household'
  | 'farm'
  | 'services'
  | 'other';

export interface StoreCategoryMeta {
  key: string;
  en: string;
  hi: string;
  icon: string;
  group: CategoryGroup;
  /** Shown in the "daily needs" strip and prioritised in search. */
  essential?: boolean;
  /** Also listed on the public emergency screen. */
  emergency?: boolean;
  /** Sells something you re-order on a schedule (can, cylinder, milk). */
  refillable?: boolean;
  /** Accent colour for tiles and chips. */
  tint: string;
}

export const GROUP_LABELS: Record<CategoryGroup, { en: string; hi: string }> = {
  daily: { en: 'Food & daily needs', hi: 'खाना और रोज़ की ज़रूरत' },
  medical: { en: 'Medical & emergency', hi: 'दवा और आपातकाल' },
  utility: { en: 'Home & utility', hi: 'घर और ज़रूरी सामान' },
  household: { en: 'Everyday shopping', hi: 'रोज़मर्रा की खरीद' },
  farm: { en: 'Farm & village trade', hi: 'खेती और गाँव का काम' },
  services: { en: 'Services', hi: 'सेवाएँ' },
  other: { en: 'Other', hi: 'अन्य' },
};

export const STORE_CATEGORIES: StoreCategoryMeta[] = [
  // ---------------------------------------------------------------- daily
  { key: 'KIRANA', en: 'Kirana / provision', hi: 'किराना दुकान', icon: '🛒', group: 'daily', essential: true, tint: '#7c3aed' },
  { key: 'VEGETABLE', en: 'Vegetables', hi: 'सब्ज़ी', icon: '🥬', group: 'daily', essential: true, tint: '#16a34a' },
  { key: 'FRUIT', en: 'Fruits', hi: 'फल', icon: '🍎', group: 'daily', essential: true, tint: '#e11d48' },
  { key: 'DAIRY', en: 'Milk & dairy', hi: 'दूध डेयरी', icon: '🥛', group: 'daily', essential: true, refillable: true, tint: '#0ea5e9' },
  { key: 'BAKERY', en: 'Bakery', hi: 'बेकरी', icon: '🍞', group: 'daily', tint: '#d97706' },
  { key: 'SWEETS', en: 'Sweets & namkeen', hi: 'मिठाई नमकीन', icon: '🍬', group: 'daily', tint: '#f59e0b' },
  { key: 'MEAT_FISH', en: 'Meat & fish', hi: 'मीट मछली', icon: '🍗', group: 'daily', tint: '#b91c1c' },
  { key: 'RESTAURANT', en: 'Restaurant / dhaba', hi: 'होटल ढाबा', icon: '🍽️', group: 'daily', tint: '#ea580c' },
  { key: 'TIFFIN', en: 'Tiffin / mess', hi: 'टिफ़िन सेवा', icon: '🍱', group: 'daily', refillable: true, tint: '#0d9488' },
  { key: 'GROCERY', en: 'Grocery', hi: 'ग्रॉसरी', icon: '🧺', group: 'daily', essential: true, tint: '#6d28d9' },

  // -------------------------------------------------------------- medical
  { key: 'MEDICAL', en: 'Medical / chemist', hi: 'दवा की दुकान', icon: '💊', group: 'medical', essential: true, emergency: true, tint: '#dc2626' },
  { key: 'PHARMACY', en: 'Pharmacy', hi: 'फार्मेसी', icon: '🏥', group: 'medical', essential: true, emergency: true, tint: '#dc2626' },
  { key: 'CLINIC', en: 'Clinic / doctor', hi: 'क्लिनिक डॉक्टर', icon: '🩺', group: 'medical', emergency: true, tint: '#0891b2' },
  { key: 'PATH_LAB', en: 'Path lab', hi: 'जाँच लैब', icon: '🧪', group: 'medical', tint: '#7c3aed' },
  { key: 'AMBULANCE', en: 'Ambulance', hi: 'एम्बुलेंस', icon: '🚑', group: 'medical', emergency: true, tint: '#dc2626' },
  { key: 'VETERINARY', en: 'Veterinary / pashu', hi: 'पशु चिकित्सक', icon: '🐄', group: 'medical', emergency: true, tint: '#65a30d' },
  { key: 'FIRE_SAFETY', en: 'Fire safety', hi: 'अग्नि सुरक्षा', icon: '🧯', group: 'medical', emergency: true, tint: '#ea580c' },

  // -------------------------------------------------------------- utility
  { key: 'WATER', en: 'Water can & tanker', hi: 'पानी कैन टैंकर', icon: '💧', group: 'utility', essential: true, emergency: true, refillable: true, tint: '#0284c7' },
  { key: 'GAS', en: 'LPG gas cylinder', hi: 'गैस सिलेंडर', icon: '🔥', group: 'utility', essential: true, emergency: true, refillable: true, tint: '#ea580c' },
  { key: 'HARDWARE', en: 'Hardware', hi: 'हार्डवेयर', icon: '🔧', group: 'utility', tint: '#475569' },
  { key: 'ELECTRICAL', en: 'Electrical', hi: 'बिजली सामान', icon: '💡', group: 'utility', emergency: true, tint: '#ca8a04' },
  { key: 'PLUMBING', en: 'Plumbing', hi: 'नल फिटिंग', icon: '🚰', group: 'utility', emergency: true, tint: '#0891b2' },
  { key: 'BUILDING_MATERIAL', en: 'Cement & building', hi: 'सीमेंट सरिया', icon: '🧱', group: 'utility', tint: '#78716c' },
  { key: 'FURNITURE', en: 'Furniture', hi: 'फर्नीचर', icon: '🪑', group: 'utility', tint: '#a16207' },
  { key: 'UTENSILS', en: 'Utensils', hi: 'बर्तन', icon: '🍲', group: 'utility', tint: '#94a3b8' },
  { key: 'FUEL', en: 'Petrol / diesel', hi: 'पेट्रोल डीज़ल', icon: '⛽', group: 'utility', tint: '#1d4ed8' },

  // ------------------------------------------------------------ household
  { key: 'STATIONERY', en: 'Stationery & books', hi: 'स्टेशनरी', icon: '✏️', group: 'household', tint: '#2563eb' },
  { key: 'XEROX', en: 'Xerox / online work', hi: 'ज़ेरॉक्स ऑनलाइन', icon: '🖨️', group: 'household', tint: '#4f46e5' },
  { key: 'COSMETICS', en: 'Cosmetics', hi: 'कॉस्मेटिक', icon: '💄', group: 'household', tint: '#db2777' },
  { key: 'CLOTHING', en: 'Clothes', hi: 'कपड़े', icon: '👕', group: 'household', tint: '#7c3aed' },
  { key: 'FOOTWEAR', en: 'Footwear', hi: 'जूते चप्पल', icon: '👞', group: 'household', tint: '#92400e' },
  { key: 'MOBILE', en: 'Mobile & recharge', hi: 'मोबाइल रिचार्ज', icon: '📱', group: 'household', tint: '#0891b2' },
  { key: 'ELECTRONICS', en: 'Electronics', hi: 'इलेक्ट्रॉनिक्स', icon: '📺', group: 'household', tint: '#4338ca' },
  { key: 'POOJA_SAMAGRI', en: 'Pooja samagri', hi: 'पूजा सामग्री', icon: '🪔', group: 'household', tint: '#f59e0b' },
  { key: 'TOYS', en: 'Toys & gifts', hi: 'खिलौने', icon: '🧸', group: 'household', tint: '#e11d48' },

  // ----------------------------------------------------------------- farm
  { key: 'AGRI', en: 'Seeds & fertiliser', hi: 'बीज खाद दवा', icon: '🌾', group: 'farm', tint: '#15803d' },
  { key: 'CATTLE_FEED', en: 'Cattle feed', hi: 'पशु आहार', icon: '🐃', group: 'farm', refillable: true, tint: '#65a30d' },
  { key: 'POULTRY', en: 'Poultry', hi: 'मुर्गी पालन', icon: '🐔', group: 'farm', tint: '#b45309' },
  { key: 'GRAIN_MILL', en: 'Aata chakki', hi: 'आटा चक्की', icon: '⚙️', group: 'farm', tint: '#a16207' },

  // ------------------------------------------------------------- services
  { key: 'SALON', en: 'Salon & parlour', hi: 'सैलून पार्लर', icon: '💈', group: 'services', tint: '#be185d' },
  { key: 'TAILOR', en: 'Tailor', hi: 'दर्ज़ी', icon: '🧵', group: 'services', tint: '#7c3aed' },
  { key: 'LAUNDRY', en: 'Laundry / press', hi: 'धुलाई प्रेस', icon: '🧼', group: 'services', tint: '#0284c7' },
  { key: 'REPAIR', en: 'Repair & mechanic', hi: 'मरम्मत मिस्त्री', icon: '🛠️', group: 'services', emergency: true, tint: '#475569' },
  { key: 'COURIER', en: 'Courier', hi: 'कूरियर', icon: '📦', group: 'services', tint: '#ca8a04' },
  { key: 'TRANSPORT', en: 'Tempo & transport', hi: 'टेम्पो ट्रांसपोर्ट', icon: '🚚', group: 'services', tint: '#1d4ed8' },

  // ---------------------------------------------------------------- other
  { key: 'GENERAL', en: 'General store', hi: 'जनरल स्टोर', icon: '🏪', group: 'other', tint: '#6b7280' },
  { key: 'OTHER', en: 'Other', hi: 'अन्य', icon: '🏬', group: 'other', tint: '#6b7280' },
];

const BY_KEY = new Map(STORE_CATEGORIES.map((c) => [c.key, c]));

const FALLBACK: StoreCategoryMeta = {
  key: 'OTHER',
  en: 'Shop',
  hi: 'दुकान',
  icon: '🏬',
  group: 'other',
  tint: '#6b7280',
};

/** Metadata for a category key, never null — old data can hold anything. */
export function categoryMeta(key?: string | null): StoreCategoryMeta {
  if (!key) return FALLBACK;
  return BY_KEY.get(String(key).toUpperCase()) ?? { ...FALLBACK, key: String(key) };
}

/** Categories grouped for a picker, in display order. */
export function categoriesByGroup(): { group: CategoryGroup; items: StoreCategoryMeta[] }[] {
  const order: CategoryGroup[] = [
    'daily',
    'medical',
    'utility',
    'household',
    'farm',
    'services',
    'other',
  ];
  return order.map((group) => ({
    group,
    items: STORE_CATEGORIES.filter((c) => c.group === group),
  }));
}

/** The strip of shortcuts on the customer home screen. */
export const QUICK_NEEDS: { key: string; en: string; hi: string; icon: string; tint: string }[] = [
  { key: 'MEDICAL', en: 'Medicine', hi: 'दवा', icon: '💊', tint: '#dc2626' },
  { key: 'WATER', en: 'Water can', hi: 'पानी', icon: '💧', tint: '#0284c7' },
  { key: 'GAS', en: 'Gas cylinder', hi: 'गैस', icon: '🔥', tint: '#ea580c' },
  { key: 'VEGETABLE', en: 'Vegetables', hi: 'सब्ज़ी', icon: '🥬', tint: '#16a34a' },
  { key: 'DAIRY', en: 'Milk', hi: 'दूध', icon: '🥛', tint: '#0ea5e9' },
  { key: 'KIRANA', en: 'Kirana', hi: 'किराना', icon: '🛒', tint: '#7c3aed' },
];

/** Categories you can put on a repeat schedule. */
export const REFILLABLE_CATEGORIES = STORE_CATEGORIES.filter((c) => c.refillable);

/**
 * The unit a repeat order is naturally counted in, so the shop's morning round
 * reads "2 cans" or "1 cylinder" instead of a meaningless "2 unit".
 */
const REFILL_UNITS: Record<string, string> = {
  WATER: 'can (20L)',
  GAS: 'cylinder',
  DAIRY: 'litre',
  CATTLE_FEED: 'bora (sack)',
  TIFFIN: 'tiffin',
};

export function refillUnitFor(category?: string | null): string {
  return REFILL_UNITS[String(category || '').toUpperCase()] ?? 'packet';
}

/** Units a small shop actually sells in, including loose Indian measures. */
export const SHOP_UNITS = [
  'kg',
  'gram',
  'pav (250g)',
  'adha kilo (500g)',
  'litre',
  'ml',
  'packet',
  'piece',
  'dozen',
  'can (20L)',
  'cylinder',
  'bora (sack)',
  'bundle',
  'plate',
  'tray',
];

/** How a shop's timings read right now. */
export function isOpenNow(store: {
  is24x7?: boolean;
  closedToday?: boolean;
  operatingHours?: { open?: string; close?: string };
}): boolean {
  if (store?.closedToday) return false;
  if (store?.is24x7) return true;
  const open = store?.operatingHours?.open;
  const close = store?.operatingHours?.close;
  if (!open || !close) return true; // unknown timings: don't claim it's shut
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const from = toMins(open);
  const to = toMins(close);
  // Shops that shut after midnight (11:00 → 01:00) wrap around.
  return to < from ? mins >= from || mins <= to : mins >= from && mins <= to;
}

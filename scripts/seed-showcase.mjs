/**
 * Showcase seeder — fills ONE account of each type with a COMPLETE set of data,
 * so you can open a single account and see everything that role can hold:
 *
 *   - Kirana shop  → full ration rate list (atta, rice, dals, oil, masala…)
 *   - Medical shop → full medicine list
 *   - Sabzi/Dairy/Water/Gas → their full rate boards
 *   - Electrician/Plumber → full service+price list
 *   - Wholesaler #1 / Distributor #1 → full bulk catalog
 *   - Sales agent #1 → a lead in every pipeline stage, with visits
 *   - Customer #1 → orders from several shops, khata, repeat orders
 *   - Shop #1 → khata with several named customers
 *
 * Idempotent: rate lists are replaced wholesale each run; orders/leads/khata/
 * products are added only up to the target and matched by name so nothing
 * duplicates. Account #2 of each type is left lighter on purpose, to prove the
 * two accounts are distinct.
 *
 *   ADMIN_PW='your-admin-password' node scripts/seed-showcase.mjs
 */
const API = process.env.API || 'https://vendor-management-x1v1.vercel.app';
const ADMIN_PW = process.env.ADMIN_PW;
if (!ADMIN_PW) { console.error('Set ADMIN_PW'); process.exit(2); }
const PW = 'Demo@1234';
const H = { lat: 22.7196, lng: 75.8577, pincode: '452001', area: 'Rajwada', city: 'Indore' };

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await res.text(); let d = null; try { d = t ? JSON.parse(t) : null; } catch { d = t; }
  return { ok: res.ok, status: res.status, data: d };
}
const login = async (email, password = PW) => (await api('POST', '/auth/login', { body: { email, password } })).data.access_token;
const id = (x) => x && (x.id || x._id);
const arr = (x) => (Array.isArray(x) ? x : []);
const rate = (name, nameLocal, price, unit) => ({ name, nameLocal, price, unit, available: true });

// ---- full rate boards ----
const RATION = [
  rate('Aashirvaad Atta 10kg', 'आटा', 420, 'bag'), rate('Basmati Rice', 'बासमती चावल', 95, 'kg'),
  rate('Sona Masoori Rice', 'चावल', 55, 'kg'), rate('Toor Dal (Arhar)', 'अरहर दाल', 140, 'kg'),
  rate('Moong Dal', 'मूंग दाल', 120, 'kg'), rate('Chana Dal', 'चना दाल', 90, 'kg'),
  rate('Urad Dal', 'उड़द दाल', 130, 'kg'), rate('Masoor Dal', 'मसूर दाल', 95, 'kg'),
  rate('Sugar', 'चीनी', 45, 'kg'), rate('Tata Salt', 'नमक', 28, 'kg'),
  rate('Mustard Oil', 'सरसों तेल', 160, 'litre'), rate('Refined Oil', 'रिफाइंड तेल', 140, 'litre'),
  rate('Desi Ghee', 'घी', 600, 'kg'), rate('Tata Tea 500g', 'चाय', 240, 'packet'),
  rate('Poha', 'पोहा', 50, 'kg'), rate('Besan', 'बेसन', 80, 'kg'),
  rate('Maida', 'मैदा', 45, 'kg'), rate('Suji (Rava)', 'सूजी', 48, 'kg'),
  rate('Haldi Powder', 'हल्दी', 40, '200g'), rate('Red Chilli Powder', 'लाल मिर्च', 60, '200g'),
  rate('Dhania Powder', 'धनिया', 45, '200g'), rate('Jeera', 'जीरा', 90, '200g'),
  rate('Garam Masala', 'गरम मसाला', 55, '100g'), rate('Parle-G Biscuit', 'बिस्कुट', 10, 'packet'),
  rate('Lux Soap', 'साबुन', 35, 'piece'), rate('Surf Excel 1kg', 'सर्फ', 120, 'packet'),
  rate('Colgate 100g', 'टूथपेस्ट', 55, 'piece'), rate('Maggi', 'मैगी', 14, 'packet'),
];
const MEDICINES = [
  rate('Paracetamol 500mg', 'पैरासिटामोल', 30, 'strip'), rate('Crocin Advance', 'क्रोसिन', 35, 'strip'),
  rate('Dolo 650', 'डोलो', 32, 'strip'), rate('ORS Packet', 'ओआरएस', 20, 'packet'),
  rate('Cough Syrup', 'खांसी सिरप', 95, 'bottle'), rate('Digene Antacid', 'एंटासिड', 40, 'strip'),
  rate('Band-aid', 'बैंड-एड', 40, 'box'), rate('Dettol 100ml', 'डेटॉल', 55, 'bottle'),
  rate('Cotton Roll', 'रूई', 45, 'piece'), rate('Thermometer', 'थर्मामीटर', 120, 'piece'),
  rate('Sanitizer 200ml', 'सैनिटाइज़र', 80, 'bottle'), rate('Face Mask', 'मास्क', 5, 'piece'),
  rate('Pain Balm', 'बाम', 60, 'piece'), rate('BP Tablet (Amlodipine)', 'बीपी गोली', 45, 'strip'),
  rate('Sugar Test Strips', 'शुगर स्ट्रिप', 350, 'box'), rate('Vitamin C', 'विटामिन सी', 90, 'strip'),
  rate('Electral', 'इलेक्ट्रल', 22, 'packet'), rate('Volini Spray', 'वोलिनी', 180, 'piece'),
];
const SABZI = [
  rate('Tomato', 'टमाटर', 30, 'kg'), rate('Onion', 'प्याज़', 25, 'kg'), rate('Potato', 'आलू', 20, 'kg'),
  rate('Cauliflower', 'फूलगोभी', 40, 'piece'), rate('Brinjal', 'बैंगन', 30, 'kg'), rate('Lady Finger', 'भिंडी', 40, 'kg'),
  rate('Green Chilli', 'हरी मिर्च', 60, 'kg'), rate('Coriander', 'धनिया', 10, 'bunch'), rate('Ginger', 'अदरक', 120, 'kg'),
  rate('Garlic', 'लहसुन', 150, 'kg'), rate('Spinach', 'पालक', 20, 'bunch'), rate('Green Peas', 'मटर', 60, 'kg'),
];
const DAIRY = [
  rate('Full Cream Milk', 'दूध', 60, 'litre'), rate('Curd', 'दही', 70, 'kg'), rate('Paneer', 'पनीर', 320, 'kg'),
  rate('Butter 500g', 'मक्खन', 275, 'packet'), rate('Desi Ghee', 'घी', 600, 'kg'), rate('Lassi', 'लस्सी', 30, 'glass'),
  rate('Buttermilk', 'छाछ', 20, 'litre'),
];
const WATER = [
  rate('20L Water Can', '20L कैन', 40, 'can'), rate('Jar Refill', 'जार रिफिल', 30, 'jar'),
  rate('Water Tanker 1000L', 'टैंकर', 500, 'tanker'), rate('Bisleri 1L', 'बोतल', 20, 'bottle'),
];
const GAS = [
  rate('LPG 14.2kg Refill', 'सिलेंडर रिफिल', 1100, 'cylinder'), rate('Commercial 19kg', 'कमर्शियल', 1900, 'cylinder'),
  rate('Small 5kg Cylinder', 'छोटा सिलेंडर', 450, 'cylinder'), rate('Regulator', 'रेगुलेटर', 450, 'piece'),
  rate('Gas Pipe', 'गैस पाइप', 180, 'piece'), rate('Lighter', 'लाइटर', 40, 'piece'),
];
const ELECTRICAL = [
  rate('Fan Repair', 'पंखा मरम्मत', 250, 'job'), rate('Wiring per point', 'वायरिंग', 120, 'point'),
  rate('Switchboard Fitting', 'स्विचबोर्ड', 300, 'job'), rate('Inverter Service', 'इन्वर्टर', 400, 'job'),
  rate('Tubelight Fitting', 'ट्यूबलाइट', 150, 'job'), rate('MCB Replacement', 'एमसीबी', 350, 'job'),
];
const PLUMBING = [
  rate('Tap Repair', 'नल मरम्मत', 150, 'job'), rate('Pipe Leak Fix', 'पाइप लीक', 250, 'job'),
  rate('Basin Fitting', 'बेसिन', 400, 'job'), rate('Motor Repair', 'मोटर', 500, 'job'),
  rate('Bathroom Fitting', 'बाथरूम फिटिंग', 600, 'job'),
];

async function setRates(ownerEmail, category, items) {
  const tok = await login(ownerEmail);
  const shop = arr((await api('GET', '/stores', { token: tok })).data).find((s) => s.category === category);
  if (!shop) { console.log(`  ⚠️  no ${category} shop for ${ownerEmail}`); return; }
  const r = await api('PUT', `/stores/${id(shop)}/price-list`, { token: tok, body: { items } });
  console.log(`  ✅ ${shop.name.padEnd(26)} ${items.length} items on the rate board`);
  return { tok, shop };
}

async function main() {
  const admin = await login('admin@vendor.com', ADMIN_PW);
  console.log('\n=== Loading ONE full account per type ===\n');

  // ---- full rate boards on every showcase shop ----
  console.log('Rate boards (the "all ration / all stock" lists):');
  await setRates('demo.shop1@ridefleet.test', 'KIRANA', RATION);
  await setRates('demo.shop1@ridefleet.test', 'MEDICAL', MEDICINES);
  await setRates('demo.shop1@ridefleet.test', 'VEGETABLE', SABZI);
  await setRates('demo.shop2@ridefleet.test', 'DAIRY', DAIRY);
  await setRates('demo.shop2@ridefleet.test', 'WATER', WATER);
  await setRates('demo.shop2@ridefleet.test', 'GAS', GAS);
  await setRates('demo.service1@ridefleet.test', 'ELECTRICAL', ELECTRICAL);
  await setRates('demo.service2@ridefleet.test', 'PLUMBING', PLUMBING);

  // ---- shop #1 khata: several named customers with running balances ----
  console.log('\nShop #1 khata (multiple named customers):');
  const shop1Tok = await login('demo.shop1@ridefleet.test');
  const kirana = arr((await api('GET', '/stores', { token: shop1Tok })).data).find((s) => s.category === 'KIRANA');
  const khataBook = [
    { customerName: 'Ramesh Yadav', customerPhone: '9811100001', entries: [['CREDIT', 450, 'atta+tel'], ['PAYMENT', 200, 'part paid']] },
    { customerName: 'Sunita Bai', customerPhone: '9811100002', entries: [['CREDIT', 300, 'monthly rashan']] },
    { customerName: 'Imtiaz Khan', customerPhone: '9811100003', entries: [['CREDIT', 620, 'diwali samaan'], ['PAYMENT', 300, '']] },
    { customerName: 'Geeta Devi', customerPhone: '9811100004', entries: [['CREDIT', 180, 'dal chawal']] },
  ];
  if (kirana) {
    const existing = arr((await api('GET', `/khata/store/${id(kirana)}/customers`, { token: shop1Tok })).data);
    const havePhones = new Set(existing.map((c) => c.customerPhone));
    for (const k of khataBook) {
      if (havePhones.has(k.customerPhone.slice(-10))) continue;
      for (const [type, amount, note] of k.entries) {
        await api('POST', '/khata', { token: shop1Tok, body: { store: id(kirana), customerName: k.customerName, customerPhone: k.customerPhone, type, amount, note } });
      }
    }
    const now = arr((await api('GET', `/khata/store/${id(kirana)}/customers`, { token: shop1Tok })).data);
    console.log(`  ✅ ${kirana.name} khata: ${now.length} customers`);
  }

  // ---- customer #1: orders from several shops ----
  console.log('\nCustomer #1 (a full order history):');
  const custTok = await login('demo.customer1@ridefleet.test');
  const shops = arr((await api('GET', '/public/shops?pincode=' + H.pincode)).data);
  const pick = (c) => shops.find((s) => s.category === c);
  const orderPlan = [
    { shop: pick('KIRANA'), item: 'Toor Dal (Arhar)', price: 140, qty: 2 },
    { shop: pick('MEDICAL'), item: 'Crocin Advance', price: 35, qty: 1 },
    { shop: pick('VEGETABLE'), item: 'Tomato', price: 30, qty: 3 },
    { shop: pick('DAIRY'), item: 'Paneer', price: 320, qty: 1 },
  ].filter((p) => p.shop);
  const haveOrders = arr((await api('GET', '/orders', { token: custTok })).data).length;
  for (let i = haveOrders; i < orderPlan.length; i++) {
    const p = orderPlan[i];
    await api('POST', '/orders', { token: custTok, body: {
      store: id(p.shop), customer: { name: 'Aarti Sharma', phone: '9810000011', address: 'Rajwada', landmark: 'Peepal ped ke paas', lat: H.lat + 0.002, lng: H.lng },
      items: [{ name: p.item, quantity: p.qty, price: p.price }], paymentMethod: i % 2 ? 'UDHAAR' : 'COD',
    }});
  }
  console.log(`  ✅ Aarti now has ${Math.max(haveOrders, orderPlan.length)} orders across shops`);

  // ---- wholesaler #1 + distributor #1: full bulk catalogs ----
  console.log('\nSupplier #1 catalogs (full bulk lists):');
  const bulk = {
    'demo.wholesaler1@ridefleet.test': [
      ['Aashirvaad Atta 10kg', 'bag', 420, 200], ['Fortune Oil 15L tin', 'tin', 1800, 60], ['Sugar 50kg bora', 'bora', 2100, 40],
      ['Basmati Rice 25kg', 'bag', 1900, 50], ['Toor Dal 30kg', 'bag', 3600, 30], ['Tata Salt case (24)', 'case', 550, 80],
      ['Tea 20kg', 'bag', 4200, 20], ['Besan 25kg', 'bag', 1700, 25],
    ],
    'demo.distributor1@ridefleet.test': [
      ['Parle-G box (48)', 'box', 480, 100], ['Maggi case (96)', 'case', 1200, 60], ['Lux Soap case (72)', 'case', 2100, 40],
      ['Surf Excel 20×1kg', 'case', 2200, 30], ['Colgate box (36)', 'box', 1800, 35], ['Bisleri 12×1L', 'case', 200, 120],
    ],
  };
  for (const [email, items] of Object.entries(bulk)) {
    const tok = await login(email);
    const have = new Set(arr((await api('GET', '/products/mine', { token: tok })).data).map((p) => p.name));
    for (const [name, unit, price, stock] of items) {
      if (have.has(name)) continue;
      await api('POST', '/products', { token: tok, body: { name, category: 'GROCERY', unit, price, stock } });
    }
    const now = arr((await api('GET', '/products/mine', { token: tok })).data).length;
    console.log(`  ✅ ${email.split('@')[0].padEnd(18)} ${now} products`);
  }

  // ---- sales agent #1: a lead in every stage ----
  console.log('\nSales agent #1 (a lead in every stage):');
  const salesTok = await login('demo.sales1@ridefleet.test');
  const pipeline = [
    ['Anaya Kirana', 'KIRANA', 'NEW'], ['Metro Medical', 'MEDICAL', 'VISITED'], ['Fresh Sabzi', 'VEGETABLE', 'INTERESTED'],
    ['Aqua Water', 'WATER', 'DEMO_GIVEN'], ['Sunrise Dairy', 'DAIRY', 'ONBOARDED'], ['Old Hardware', 'HARDWARE', 'NOT_INTERESTED'],
  ];
  const haveLeads = new Set(arr((await api('GET', '/sales/leads', { token: salesTok })).data).map((l) => l.shopName));
  for (const [shopName, category, status] of pipeline) {
    if (haveLeads.has(shopName)) continue;
    await api('POST', '/sales/leads', { token: salesTok, body: { shopName, category, status, ownerName: 'Owner ' + shopName.split(' ')[0], phone: '98765' + (10000 + Math.floor(Math.random() * 89999)), area: H.area, city: H.city, pincode: H.pincode, notes: 'demo pipeline' } });
  }
  const stages = arr((await api('GET', '/sales/leads', { token: salesTok })).data);
  console.log(`  ✅ Pooja now has ${stages.length} leads across stages`);

  // ---- rider #1: assign a couple of pending orders ----
  console.log('\nRider #1 (assigned deliveries):');
  const riderTok = await login('demo.rider1@ridefleet.test');
  const rider = arr((await api('GET', '/riders', { token: riderTok })).data)[0];
  if (rider) {
    // Owner assigns their CREATED orders to this rider.
    const ownerTok = await login('demo.shop1@ridefleet.test');
    const orders = arr((await api('GET', '/orders', { token: ownerTok })).data).filter((o) => o.status === 'CREATED');
    let assigned = 0;
    for (const o of orders.slice(0, 2)) {
      const r = await api('PATCH', `/orders/${id(o)}/assign-rider`, { token: ownerTok, body: { riderId: id(rider) } });
      if (r.ok) assigned++;
    }
    console.log(`  ✅ Imran assigned ${assigned} delivery(ies) with OTP`);
  }

  console.log('\n✅ Showcase ready — account #1 of each type is fully loaded.\n');
  console.log('   Kirana rate list: open /shops → 452001 → Sharma Kirana → Rate list');
}

main().catch((e) => { console.error('FATAL', e); process.exit(2); });

/**
 * Demo seeder — creates TWO demo accounts for every role, plus shops across
 * many categories and enough transactional data (orders, khata, refills,
 * products, leads) that no screen is empty. Idempotent: re-running logs in the
 * existing demo users and skips shops that already exist.
 *
 * Usage (admin password passed at run time, never hardcoded):
 *   ADMIN_PW='your-admin-password' node scripts/seed-demo.mjs
 *   API='http://localhost:3000' ADMIN_PW='admin123' node scripts/seed-demo.mjs
 *
 * Every demo account's password is Demo@1234. Prints a full credentials table
 * at the end.
 */
const API = process.env.API || 'https://vendor-management-x1v1.vercel.app';
const ADMIN_PW = process.env.ADMIN_PW;
if (!ADMIN_PW) {
  console.error('Set ADMIN_PW, e.g.  ADMIN_PW=... node scripts/seed-demo.mjs');
  process.exit(2);
}
const PW = 'Demo@1234';
// Central Indore, pincode 452001 — so the whole demo is findable in one search.
const H = { lat: 22.7196, lng: 75.8577, pincode: '452001', area: 'Rajwada', city: 'Indore' };

let aTok = '';
const made = []; // credential rows for the final table

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, ok: res.ok, data };
}

/** Create a demo user (or log in), approve it as admin, record its credentials. */
async function user(role, email, name, phone, roleLabel) {
  let r = await api('POST', '/auth/register', { body: { role, email, password: PW, name, phone } });
  let token, id;
  if (r.ok) { token = r.data.access_token; id = r.data.user.id; }
  else {
    r = await api('POST', '/auth/login', { body: { email, password: PW } });
    if (!r.ok) throw new Error(`login ${email}: ${r.status}`);
    token = r.data.access_token; id = r.data.user.id;
  }
  // Approve the account so approval-gated roles can operate.
  if (id) await api('PATCH', `/users/${id}/approve`, { token: aTok });
  made.push({ role: roleLabel, email, password: PW, name });
  console.log(`  ✓ ${roleLabel.padEnd(16)} ${email}`);
  return { token, id, email, name, phone };
}

/** Create a shop for an owner if they don't already have one of that category. */
async function shop(owner, cfg) {
  const mine = (await api('GET', '/stores', { token: owner.token })).data || [];
  let s = mine.find((x) => x.category === cfg.category);
  if (!s) {
    const r = await api('POST', '/stores', { token: owner.token, body: {
      ...cfg,
      address: { landmark: cfg.landmark, area: H.area, city: H.city, pincode: H.pincode },
      lat: H.lat + (Math.random() - 0.5) * 0.01,
      lng: H.lng + (Math.random() - 0.5) * 0.01,
    }});
    s = r.data;
  }
  const id = s.id || s._id;
  if (id) await api('PATCH', `/stores/${id}/approve`, { token: aTok });
  console.log(`     🏪 ${cfg.name} (${cfg.category})`);
  return { id, ...cfg };
}

async function main() {
  console.log(`\n=== Seeding demo data → ${API} ===\n`);
  const admin = await api('POST', '/auth/login', { body: { email: 'admin@vendor.com', password: ADMIN_PW } });
  if (!admin.ok) { console.error('admin login failed'); process.exit(1); }
  aTok = admin.data.access_token;
  console.log('admin ok\n');

  // ---------- 2 of every role ----------
  console.log('Accounts (2 per role):');
  const customers = [
    await user('customer', 'demo.customer1@ridefleet.test', 'Aarti (Customer 1)', '9810000011', 'Customer'),
    await user('customer', 'demo.customer2@ridefleet.test', 'Vikram (Customer 2)', '9810000012', 'Customer'),
  ];
  const owners = [
    await user('store_owner', 'demo.shop1@ridefleet.test', 'Sharma Stores (Shop 1)', '9820000021', 'Shop owner'),
    await user('store_owner', 'demo.shop2@ridefleet.test', 'Verma Traders (Shop 2)', '9820000022', 'Shop owner'),
  ];
  const staff = [
    await user('store_staff', 'demo.staff1@ridefleet.test', 'Raju (Staff 1)', '9830000031', 'Shop staff'),
    await user('store_staff', 'demo.staff2@ridefleet.test', 'Sunil (Staff 2)', '9830000032', 'Shop staff'),
  ];
  const riders = [
    await user('rider', 'demo.rider1@ridefleet.test', 'Imran (Rider 1)', '9840000041', 'Rider'),
    await user('rider', 'demo.rider2@ridefleet.test', 'Deepak (Rider 2)', '9840000042', 'Rider'),
  ];
  const wholesalers = [
    await user('wholesaler', 'demo.wholesaler1@ridefleet.test', 'Metro Wholesale (1)', '9850000051', 'Wholesaler'),
    await user('wholesaler', 'demo.wholesaler2@ridefleet.test', 'Bharat Wholesale (2)', '9850000052', 'Wholesaler'),
  ];
  const distributors = [
    await user('distributor', 'demo.distributor1@ridefleet.test', 'Agarwal Distributors (1)', '9860000061', 'Distributor'),
    await user('distributor', 'demo.distributor2@ridefleet.test', 'Jain Distributors (2)', '9860000062', 'Distributor'),
  ];
  const salesAgents = [
    await user('sales', 'demo.sales1@ridefleet.test', 'Pooja (Sales 1)', '9870000071', 'Sales agent'),
    await user('sales', 'demo.sales2@ridefleet.test', 'Manoj (Sales 2)', '9870000072', 'Sales agent'),
  ];
  const services = [
    await user('service_provider', 'demo.service1@ridefleet.test', 'Kumar Electricals (1)', '9880000081', 'Service provider'),
    await user('service_provider', 'demo.service2@ridefleet.test', 'Sai Plumbing (2)', '9880000082', 'Service provider'),
  ];

  // ---------- shops across many categories ----------
  console.log('\nShops:');
  const S = {};
  S.medical = await shop(owners[0], { name: 'Sanjeevani Medical Store', nameLocal: 'संजीवनी मेडिकल', category: 'MEDICAL', phone: '9820000021', whatsapp: '9820000021', upiId: 'sanjeevani@upi', is24x7: true, emergencyService: true, acceptsUdhaar: true, homeDelivery: true, deliveryRadiusKm: 5, landmark: 'Rajwada gate ke paas' });
  S.kirana = await shop(owners[0], { name: 'Sharma Kirana', nameLocal: 'शर्मा किराना', category: 'KIRANA', phone: '9820000021', whatsapp: '9820000021', acceptsUdhaar: true, homeDelivery: true, minOrderValue: 100, landmark: 'Sabzi mandi ke andar' });
  S.veg = await shop(owners[0], { name: 'Taaza Sabzi Center', nameLocal: 'ताज़ा सब्ज़ी', category: 'VEGETABLE', phone: '9820000021', homeDelivery: true, landmark: 'Mandi gate 2' });
  S.water = await shop(owners[1], { name: 'Shivam Water Suppliers', nameLocal: 'शिवम वाटर', category: 'WATER', phone: '9820000022', whatsapp: '9820000022', homeDelivery: true, acceptsUdhaar: true, landmark: 'Bus stand ke saamne' });
  S.gas = await shop(owners[1], { name: 'Gupta Gas Agency', nameLocal: 'गुप्ता गैस', category: 'GAS', phone: '9820000022', is24x7: true, emergencyService: true, homeDelivery: true, landmark: 'Station road' });
  S.dairy = await shop(owners[1], { name: 'Gokul Dairy', nameLocal: 'गोकुल डेयरी', category: 'DAIRY', phone: '9820000022', homeDelivery: true, acceptsUdhaar: true, landmark: 'Mandir ke peeche' });
  // Service providers list their service as a "shop" too.
  S.elec = await shop(services[0], { name: 'Kumar Electricals', nameLocal: 'कुमार इलेक्ट्रिकल्स', category: 'ELECTRICAL', phone: '9880000081', emergencyService: true, landmark: 'Main market' });
  S.plumb = await shop(services[1], { name: 'Sai Plumbing', nameLocal: 'साई प्लंबिंग', category: 'PLUMBING', phone: '9880000082', emergencyService: true, landmark: 'Gali no. 4' });

  // ---------- rate lists ----------
  await api('PUT', `/stores/${S.medical.id}/price-list`, { token: owners[0].token, body: { items: [
    { name: 'Paracetamol 500mg', nameLocal: 'पैरासिटामोल', price: 30, unit: 'strip', available: true },
    { name: 'ORS packet', nameLocal: 'ओआरएस', price: 20, unit: 'packet', available: true },
    { name: 'Band-aid', nameLocal: 'बैंड-एड', price: 40, unit: 'box', available: true },
  ]}});
  await api('PUT', `/stores/${S.veg.id}/price-list`, { token: owners[0].token, body: { items: [
    { name: 'Tomato', nameLocal: 'टमाटर', price: 30, unit: 'kg', available: true },
    { name: 'Onion', nameLocal: 'प्याज़', price: 25, unit: 'kg', available: true },
    { name: 'Potato', nameLocal: 'आलू', price: 20, unit: 'kg', available: true },
  ]}});
  console.log('     📋 rate lists published');

  // ---------- attach staff to shops ----------
  await api('POST', `/stores/${S.medical.id}/staff`, { token: owners[0].token, body: { identifier: staff[0].email } });
  await api('POST', `/stores/${S.water.id}/staff`, { token: owners[1].token, body: { identifier: staff[1].email } });
  console.log('     🧑‍💼 staff attached to shops');

  // ---------- riders: approve, locate, go available ----------
  console.log('\nRiders:');
  for (const [i, rd] of riders.entries()) {
    let profs = (await api('GET', '/riders', { token: rd.token })).data || [];
    let prof = Array.isArray(profs) ? profs[0] : null;
    if (!prof) prof = (await api('POST', '/riders/register', { token: rd.token, body: { vehicleType: i === 0 ? 'MOTORCYCLE' : 'SCOOTER', vehicleNumber: `MP09-XX-${1000 + i}` } })).data;
    const id = prof.id || prof._id;
    if (id) {
      await api('PATCH', `/riders/${id}/approve`, { token: aTok });
      await api('PATCH', `/riders/${id}/location`, { token: rd.token, body: { lat: H.lat, lng: H.lng } });
      await api('PATCH', `/riders/${id}/availability`, { token: rd.token, body: { availability: 'AVAILABLE' } });
      console.log(`     🛵 ${rd.name} available`);
    }
  }

  // ---------- supplier catalogs ----------
  console.log('\nSupply chain:');
  await api('POST', '/products', { token: wholesalers[0].token, body: { name: 'Aashirvaad Atta 10kg', category: 'GROCERY', unit: 'bag', price: 420, stock: 200 } });
  await api('POST', '/products', { token: wholesalers[0].token, body: { name: 'Fortune Oil 15L tin', category: 'GROCERY', unit: 'tin', price: 1800, stock: 60 } });
  await api('POST', '/products', { token: distributors[0].token, body: { name: 'Parle-G (box of 48)', category: 'GROCERY', unit: 'box', price: 480, stock: 100 } });
  await api('POST', '/products', { token: distributors[0].token, body: { name: 'Tata Salt (case of 24)', category: 'GROCERY', unit: 'case', price: 550, stock: 80 } });
  console.log('     📦 supplier catalogs added');

  // ---------- customer orders + refills ----------
  console.log('\nCustomer activity:');
  const o1 = await api('POST', '/orders', { token: customers[0].token, body: {
    store: S.medical.id, customer: { name: customers[0].name, phone: customers[0].phone, address: 'Near clock tower', landmark: 'Peepal ped ke paas', lat: H.lat + 0.003, lng: H.lng },
    items: [{ name: 'Paracetamol 500mg', quantity: 2, price: 30 }, { name: 'ORS packet', quantity: 3, price: 20 }], paymentMethod: 'COD',
  }});
  await api('POST', '/orders', { token: customers[1].token, body: {
    store: S.kirana.id, customer: { name: customers[1].name, phone: customers[1].phone, address: 'Gali 3', landmark: 'Hanuman mandir ke paas', lat: H.lat, lng: H.lng + 0.004 },
    items: [{ name: 'Atta 5kg', quantity: 1, price: 210 }], paymentMethod: 'UDHAAR',
  }});
  await api('POST', '/refills', { token: customers[0].token, body: { store: S.water.id, itemLabel: '20L water can', category: 'WATER', quantity: 2, frequency: 'WEEKLY', landmark: 'Peepal ped ke paas' } });
  await api('POST', '/refills', { token: customers[1].token, body: { store: S.dairy.id, itemLabel: 'Milk 1L full cream', category: 'DAIRY', quantity: 1, frequency: 'DAILY', landmark: 'Hanuman mandir ke paas' } });
  console.log('     🛒 2 orders + 2 repeat orders');

  // ---------- khata ----------
  await api('POST', '/khata', { token: owners[0].token, body: { store: S.medical.id, customerName: customers[0].name, customerPhone: customers[0].phone, type: 'CREDIT', amount: 250, note: 'dawa udhaar' } });
  await api('POST', '/khata', { token: owners[0].token, body: { store: S.medical.id, customerName: customers[0].name, customerPhone: customers[0].phone, type: 'PAYMENT', amount: 100, note: 'part paid' } });
  await api('POST', '/khata', { token: owners[1].token, body: { store: S.water.id, customerName: customers[1].name, customerPhone: customers[1].phone, type: 'CREDIT', amount: 120, note: '2 cans' } });
  console.log('     📒 khata entries added');

  // ---------- sales leads ----------
  await api('POST', '/sales/leads', { token: salesAgents[0].token, body: { shopName: 'Naya Kirana', ownerName: 'Ramesh', phone: '9899000001', category: 'KIRANA', area: H.area, city: H.city, pincode: H.pincode, status: 'INTERESTED' } });
  await api('POST', '/sales/leads', { token: salesAgents[1].token, body: { shopName: 'City Chemist', ownerName: 'Sofia', phone: '9899000002', category: 'MEDICAL', area: H.area, city: H.city, pincode: H.pincode, status: 'DEMO_GIVEN' } });
  console.log('     📋 2 sales leads');

  // ---------- credentials table ----------
  console.log(`\n\n======== DEMO CREDENTIALS (password for all: ${PW}) ========`);
  const width = Math.max(...made.map((m) => m.email.length));
  let lastRole = '';
  for (const m of made) {
    const tag = m.role === lastRole ? '' : m.role;
    lastRole = m.role;
    console.log(`  ${tag.padEnd(18)} ${m.email.padEnd(width)}   ${m.name}`);
  }
  console.log(`  ${'Admin'.padEnd(18)} admin@vendor.com${' '.repeat(Math.max(1, width - 16))}   (your own private password)`);
  console.log(`\n  All demo shops are in pincode ${H.pincode} (${H.city}).`);
  console.log(`===============================================================\n`);
}

main().catch((e) => { console.error('FATAL', e); process.exit(2); });

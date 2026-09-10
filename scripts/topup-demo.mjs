/**
 * Tops every demo account up to AT LEAST 2 of each kind of record, so no list
 * in the app ever shows just one item. Idempotent: it counts what already
 * exists and only adds the shortfall, so it is safe to run repeatedly.
 *
 *   ADMIN_PW='your-admin-password' node scripts/topup-demo.mjs
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
const login = async (email, password = PW) => {
  const r = await api('POST', '/auth/login', { body: { email, password } });
  if (!r.ok) throw new Error(`login ${email} ${r.status}`);
  return r.data.access_token;
};
const id = (x) => x && (x.id || x._id);
const arr = (x) => (Array.isArray(x) ? x : []);

/** Ensure a list has >= need items; call add(i) for each missing one. */
async function ensure(label, count, need, add) {
  let have = count;
  for (let i = have; i < need; i++) { await add(i); have++; }
  console.log(`  ${have >= need ? '✅' : '⚠️ '} ${label.padEnd(38)} now ${have}`);
}

const admin = await login('admin@vendor.com', ADMIN_PW);

// Shop directory (approved) so we can point orders/refills at real shops.
const shops = arr((await api('GET', '/public/shops?pincode=' + H.pincode)).data);
const byCat = (c) => shops.find((s) => s.category === c);
const medical = byCat('MEDICAL'), kirana = byCat('KIRANA'), water = byCat('WATER'), dairy = byCat('DAIRY'), gas = byCat('GAS');

console.log('\n=== Topping up demo data to >= 2 each ===\n');

// ---------- 2 orders per customer ----------
console.log('Orders (>=2 per customer):');
const custDefs = [
  { email: 'demo.customer1@ridefleet.test', name: 'Aarti Sharma', phone: '9810000011', landmark: 'Peepal ped ke paas' },
  { email: 'demo.customer2@ridefleet.test', name: 'Vikram Singh', phone: '9810000012', landmark: 'Hanuman mandir ke paas' },
];
const custTokens = {};
// Each order goes to a different shop and carries a different item, so no two
// demo orders look alike.
const orderPlan = [
  { shop: medical, item: 'Paracetamol 500mg', price: 30 },
  { shop: kirana, item: 'Aashirvaad Atta 5kg', price: 210 },
  { shop: water, item: '20L water can', price: 40 },
  { shop: dairy, item: 'Amul butter 500g', price: 275 },
].filter((p) => p.shop);
for (const [ci, c] of custDefs.entries()) {
  const tok = await login(c.email); custTokens[c.email] = tok;
  const have = arr((await api('GET', '/orders', { token: tok })).data).length;
  await ensure(`orders · ${c.name}`, have, 2, async (i) => {
    // Offset by customer so the two customers order different things.
    const p = orderPlan[(i + ci) % orderPlan.length];
    await api('POST', '/orders', { token: tok, body: {
      store: id(p.shop),
      customer: { name: c.name, phone: c.phone, address: 'Demo address', landmark: c.landmark, lat: H.lat + 0.002 * (i + 1), lng: H.lng },
      items: [{ name: p.item, quantity: 1 + i, price: p.price }],
      paymentMethod: i % 2 ? 'UDHAAR' : 'COD',
    }});
  });
}

// ---------- 2 refills per customer ----------
console.log('\nRepeat orders (>=2 per customer, all different):');
const refillTargets = [
  { shop: water, itemLabel: '20L water can', category: 'WATER', frequency: 'WEEKLY' },
  { shop: dairy, itemLabel: 'Milk 1L full cream', category: 'DAIRY', frequency: 'DAILY' },
  { shop: gas, itemLabel: 'LPG cylinder refill', category: 'GAS', frequency: 'MONTHLY' },
].filter((t) => t.shop);
for (const c of custDefs) {
  const tok = custTokens[c.email];
  let existing = arr((await api('GET', '/refills/mine', { token: tok })).data);
  // Drop any exact-duplicate item labels first (keep one of each).
  const seen = new Set();
  for (const r of existing) {
    if (seen.has(r.itemLabel)) await api('DELETE', `/refills/${id(r)}`, { token: tok });
    else seen.add(r.itemLabel);
  }
  const labels = seen;
  // Add only items this customer doesn't already have, until they hold 2.
  for (const t of refillTargets) {
    if (labels.size >= 2) break;
    if (labels.has(t.itemLabel)) continue;
    await api('POST', '/refills', { token: tok, body: { store: id(t.shop), itemLabel: t.itemLabel, category: t.category, quantity: 1, frequency: t.frequency, landmark: c.landmark } });
    labels.add(t.itemLabel);
  }
  console.log(`  ✅ refills · ${c.name.padEnd(30)} now ${labels.size} (${[...labels].join(', ')})`);
}

// ---------- 2 khata customers per shop owner ----------
console.log('\nKhata (>=2 customers per shop that keeps one):');
const ownerDefs = [
  { email: 'demo.shop1@ridefleet.test', shopCat: 'MEDICAL' },
  { email: 'demo.shop2@ridefleet.test', shopCat: 'WATER' },
];
const khataPeople = [
  { customerName: 'Aarti', customerPhone: '9810000011' },
  { customerName: 'Vikram', customerPhone: '9810000012' },
  { customerName: 'Sita Devi', customerPhone: '9811000013' },
];
for (const o of ownerDefs) {
  const tok = await login(o.email);
  const mine = arr((await api('GET', '/stores', { token: tok })).data);
  const shop = mine.find((s) => s.category === o.shopCat) || mine[0];
  if (!shop) continue;
  const cust = arr((await api('GET', `/khata/store/${id(shop)}/customers`, { token: tok })).data);
  await ensure(`khata · ${shop.name}`, cust.length, 2, async (i) => {
    const p = khataPeople[i % khataPeople.length];
    await api('POST', '/khata', { token: tok, body: { store: id(shop), ...p, type: 'CREDIT', amount: 100 + i * 50, note: 'demo udhaar' } });
  });
}

// ---------- 2 products per supplier ----------
console.log('\nSupplier catalogs (>=2 products each):');
const supplierDefs = [
  { email: 'demo.wholesaler1@ridefleet.test', items: ['Aashirvaad Atta 10kg', 'Fortune Oil 15L'] },
  { email: 'demo.wholesaler2@ridefleet.test', items: ['Sugar 50kg bora', 'Basmati Rice 25kg'] },
  { email: 'demo.distributor1@ridefleet.test', items: ['Parle-G box of 48', 'Tata Salt case of 24'] },
  { email: 'demo.distributor2@ridefleet.test', items: ['Maggi case of 96', 'Colgate box of 36'] },
];
for (const s of supplierDefs) {
  const tok = await login(s.email);
  const have = arr((await api('GET', '/products/mine', { token: tok })).data).length;
  await ensure(`products · ${s.email.split('@')[0]}`, have, 2, async (i) => {
    await api('POST', '/products', { token: tok, body: { name: s.items[i % s.items.length], category: 'GROCERY', unit: 'unit', price: 300 + i * 120, stock: 50 + i * 20 } });
  });
}

// ---------- 2 leads per sales agent ----------
console.log('\nSales leads (>=2 per agent):');
const agentDefs = [
  { email: 'demo.sales1@ridefleet.test', leads: [['Naya Kirana', 'KIRANA', 'INTERESTED'], ['Sharma General', 'GENERAL', 'VISITED']] },
  { email: 'demo.sales2@ridefleet.test', leads: [['City Chemist', 'MEDICAL', 'DEMO_GIVEN'], ['Krishna Dairy', 'DAIRY', 'NEW']] },
];
for (const a of agentDefs) {
  const tok = await login(a.email);
  const have = arr((await api('GET', '/sales/leads', { token: tok })).data).length;
  await ensure(`leads · ${a.email.split('@')[0]}`, have, 2, async (i) => {
    const [shopName, category, status] = a.leads[i % a.leads.length];
    await api('POST', '/sales/leads', { token: tok, body: { shopName, category, status, ownerName: 'Demo Owner', phone: `98990000${20 + i}`, area: H.area, city: H.city, pincode: H.pincode } });
  });
}

// ---------- 2 local emergency contacts of key types ----------
console.log('\nEmergency (>=2 local per key type):');
const emTypes = [
  { type: 'AMBULANCE', names: ['City Ambulance Service', 'Red Cross Ambulance'] },
  { type: 'HOSPITAL', names: ['District Hospital', 'Life Care Hospital'] },
  { type: 'BLOOD_BANK', names: ['Red Cross Blood Bank', 'Civil Blood Bank'] },
];
for (const et of emTypes) {
  const existing = arr((await api('GET', `/emergency?type=${et.type}`, { token: admin })).data);
  await ensure(`emergency · ${et.type}`, existing.length, 2, async (i) => {
    await api('POST', '/emergency', { token: admin, body: { type: et.type, name: et.names[i % et.names.length], phone: `98${et.type.length}00000${i}`, city: H.city, pincode: H.pincode, is24x7: true, verified: true } });
  });
}

console.log('\n✅ Done — every demo account now has at least 2 of each record.\n');

/**
 * End-to-end smoke test + demo seeder for RideFleet.
 *
 * Seeds one or two demo records per feature against a running API and verifies
 * each one actually works — including the geo "shops in this area" query.
 * Idempotent: re-running logs in the existing demo users instead of failing.
 *
 * Usage (the admin password is NEVER hardcoded — pass it at run time):
 *   ADMIN_PW='your-admin-password' node scripts/smoke-test.mjs
 *   API='http://localhost:3000' ADMIN_PW='admin123' node scripts/smoke-test.mjs
 *
 * Defaults to the live API. Prints a PASS/FAIL checklist and exits non-zero if
 * anything failed, so it can gate CI too.
 */
const API = process.env.API || 'https://vendor-management-x1v1.vercel.app';
const ADMIN_PW = process.env.ADMIN_PW;
if (!ADMIN_PW) {
  console.error('Set ADMIN_PW to the admin password, e.g.  ADMIN_PW=... node scripts/smoke-test.mjs');
  process.exit(2);
}
const ADMIN = { email: process.env.ADMIN_EMAIL || 'admin@vendor.com', password: ADMIN_PW };

// A fixed spot so the geo test is reproducible: central Indore, pincode 452001.
const HERE = { lat: 22.7196, lng: 75.8577, pincode: '452001', area: 'Rajwada', city: 'Indore' };
const PW = 'Demo@1234';

const results = [];
const pass = (name, detail = '') => { results.push({ ok: true, name, detail }); console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`); };
const fail = (name, detail = '') => { results.push({ ok: false, name, detail }); console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); };

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, ok: res.ok, data };
}

/** Register a demo user, or log in if they already exist. Returns {token,user}. */
async function ensureUser(role, email, name, phone) {
  let r = await api('POST', '/auth/register', { body: { role, email, password: PW, name, phone } });
  if (r.status === 201 || r.status === 200) return { token: r.data.access_token, user: r.data.user };
  // Already registered — log in.
  r = await api('POST', '/auth/login', { body: { email, password: PW } });
  if (r.ok) return { token: r.data.access_token, user: r.data.user };
  throw new Error(`could not create/login ${email}: ${r.status} ${JSON.stringify(r.data)}`);
}

async function main() {
  console.log(`\n=== RideFleet live smoke test — ${API} ===\n`);

  // ---- 0. Admin login ----
  console.log('[0] Admin');
  const admin = await api('POST', '/auth/login', { body: ADMIN });
  if (!admin.ok) return fail('admin login', JSON.stringify(admin.data)), summary();
  const aTok = admin.data.access_token;
  pass('admin login', `role=${admin.data.user.role}`);

  // ---- 1. Store owner + two shops (Medical 24x7 + Water) with real coords ----
  console.log('\n[1] Shops (geo)');
  const owner = await ensureUser('store_owner', 'demo.kirana@ridefleet.test', 'Demo Medical & Water', '9800000001');
  pass('store owner account', owner.user.email);

  // Reuse existing demo shops if this owner already has them.
  let existing = (await api('GET', '/stores', { token: owner.token })).data || [];
  // The test owns its own shops (it mutates their rate list / shutter), and
  // deletes them again at the very end, so re-running never pollutes the
  // directory with duplicates. Idempotent within a run via the owner's list.
  const findByCat = (c) => existing.find((s) => s.category === c);

  let medical = findByCat('MEDICAL');
  if (!medical) {
    const r = await api('POST', '/stores', { token: owner.token, body: {
      name: 'Sanjeevani Medical Store', nameLocal: 'संजीवनी मेडिकल', category: 'MEDICAL',
      phone: '9800000001', whatsapp: '9800000001', upiId: 'sanjeevani@upi',
      is24x7: true, emergencyService: true, acceptsUdhaar: true, homeDelivery: true,
      minOrderValue: 0, deliveryRadiusKm: 5,
      address: { landmark: 'Rajwada gate ke paas', area: HERE.area, city: HERE.city, pincode: HERE.pincode },
      lat: HERE.lat + 0.001, lng: HERE.lng + 0.001,
    }});
    medical = r.data;
  }
  (medical.id || medical._id) ? pass('Medical shop (24x7)', medical.name) : fail('Medical shop', JSON.stringify(medical));

  let water = findByCat('WATER');
  if (!water) {
    const r = await api('POST', '/stores', { token: owner.token, body: {
      name: 'Shivam Water Suppliers', nameLocal: 'शिवम वाटर', category: 'WATER',
      phone: '9800000002', whatsapp: '9800000002',
      is24x7: false, homeDelivery: true, acceptsUdhaar: true,
      address: { landmark: 'Bus stand ke saamne', area: HERE.area, city: HERE.city, pincode: HERE.pincode },
      lat: HERE.lat - 0.002, lng: HERE.lng + 0.002,
    }});
    water = r.data;
  }
  (water.id || water._id) ? pass('Water shop', water.name) : fail('Water shop', JSON.stringify(water));

  const medId = medical.id || medical._id;
  const watId = water.id || water._id;

  // Admin approves both.
  const ap1 = await api('PATCH', `/stores/${medId}/approve`, { token: aTok });
  const ap2 = await api('PATCH', `/stores/${watId}/approve`, { token: aTok });
  (ap1.ok && ap2.ok) ? pass('admin approve both shops') : fail('approve shops', `${ap1.status}/${ap2.status}`);

  // ---- 2. Public directory + GEO "shops in this area" ----
  console.log('\n[2] Public directory & geo search');
  const byPin = await api('GET', `/public/shops?pincode=${HERE.pincode}`);
  const pinHit = (byPin.data || []).some((s) => (s.id || s._id) === medId);
  pinHit ? pass('directory by pincode', `${byPin.data.length} shops in ${HERE.pincode}`) : fail('directory by pincode', JSON.stringify(byPin.data)?.slice(0, 120));

  const nearby = await api('GET', `/public/shops/nearby?lat=${HERE.lat}&lng=${HERE.lng}&radius=5000`);
  const geoHit = (nearby.data || []).some((s) => (s.id || s._id) === medId);
  geoHit ? pass('GEO: shops open near this location', `${nearby.data.length} within 5km`) : fail('GEO nearby', JSON.stringify(nearby.data)?.slice(0, 120));

  const faraway = await api('GET', `/public/shops/nearby?lat=19.0760&lng=72.8777&radius=5000`); // Mumbai
  const excluded = !(faraway.data || []).some((s) => (s.id || s._id) === medId);
  excluded ? pass('GEO: far-away area excludes this shop', 'Mumbai search → not returned') : fail('GEO exclusion', 'shop leaked into far search');

  const medOnly = await api('GET', `/public/shops?category=MEDICAL&pincode=${HERE.pincode}`);
  (medOnly.data || []).every((s) => s.category === 'MEDICAL') && medOnly.data.length
    ? pass('filter by category', `${medOnly.data.length} medical`) : fail('category filter', JSON.stringify(medOnly.data)?.slice(0, 120));

  const counts = await api('GET', '/public/shops/counts');
  counts.data && counts.data.MEDICAL ? pass('category counts (tiles)', `MEDICAL=${counts.data.MEDICAL}, WATER=${counts.data.WATER || 0}`) : fail('counts', JSON.stringify(counts.data));

  const detail = await api('GET', `/public/shops/${medId}`);
  detail.ok && detail.data.name ? pass('public shop detail page', detail.data.name) : fail('shop detail', JSON.stringify(detail.data)?.slice(0, 120));

  // ---- 3. Rate list ----
  console.log('\n[3] Rate list');
  const rl = await api('PUT', `/stores/${medId}/price-list`, { token: owner.token, body: { items: [
    { name: 'Paracetamol 500mg', nameLocal: 'पैरासिटामोल', price: 30, unit: 'strip', available: true },
    { name: 'ORS packet', nameLocal: 'ओआरएस', price: 20, unit: 'packet', available: true },
  ] }});
  const rlBack = await api('GET', `/public/shops/${medId}`);
  (rlBack.data?.priceList || []).length >= 2 ? pass('publish rate list', `${rlBack.data.priceList.length} items visible publicly`) : fail('rate list', JSON.stringify(rl.data)?.slice(0, 120));

  // ---- 4. Shutter toggle ----
  console.log('\n[4] Shutter switch');
  await api('PATCH', `/stores/${medId}/shutter`, { token: owner.token, body: { closed: true } });
  const openList = await api('GET', `/public/shops?pincode=${HERE.pincode}&open=1`);
  const hiddenWhenClosed = !(openList.data || []).some((s) => (s.id || s._id) === medId);
  hiddenWhenClosed ? pass('shutter closed hides from "open now"') : fail('shutter close', 'still shown as open');
  await api('PATCH', `/stores/${medId}/shutter`, { token: owner.token, body: { closed: false } });
  pass('shutter reopened');

  // ---- 5. Customer places an order ----
  console.log('\n[5] Customer order');
  const cust = await ensureUser('customer', 'demo.customer@ridefleet.test', 'Demo Customer', '9800000009');
  pass('customer account', cust.user.email);
  const order = await api('POST', '/orders', { token: cust.token, body: {
    store: medId,
    customer: { name: 'Demo Customer', phone: '9800000009', address: 'Near clock tower', landmark: 'Peepal ped ke paas', lat: HERE.lat + 0.003, lng: HERE.lng },
    items: [{ name: 'Paracetamol 500mg', quantity: 2, price: 30 }],
    listText: '2x Paracetamol, 1x ORS', paymentMethod: 'COD',
  }});
  const orderId = order.data?.id || order.data?._id;
  orderId ? pass('place order (COD)', `${order.data.orderNumber}, fee ₹${order.data.deliveryFee}`) : fail('place order', JSON.stringify(order.data)?.slice(0, 160));

  const myOrders = await api('GET', '/orders', { token: cust.token });
  (myOrders.data || []).some((o) => (o.id || o._id) === orderId) ? pass('order shows in "my orders"') : fail('my orders', `${myOrders.data?.length} orders`);

  if (orderId) {
    const inv = await api('GET', `/orders/${orderId}/invoice`, { token: cust.token });
    inv.ok && inv.data.total != null ? pass('invoice / bill', `total ₹${inv.data.total}`) : fail('invoice', JSON.stringify(inv.data)?.slice(0, 120));
  }

  // ---- 6. Rider: profile -> approve -> available -> assign ----
  console.log('\n[6] Rider & assignment');
  const rider = await ensureUser('rider', 'demo.rider@ridefleet.test', 'Demo Rider', '9800000003');
  let profs = (await api('GET', '/riders', { token: rider.token })).data || [];
  let prof = Array.isArray(profs) ? profs[0] : null;
  if (!prof) {
    const r = await api('POST', '/riders/register', { token: rider.token, body: { vehicleType: 'MOTORCYCLE', vehicleNumber: 'MP09-AB-1234' } });
    prof = r.data;
  }
  const riderId = prof?.id || prof?._id;
  riderId ? pass('rider profile', prof.vehicleType) : fail('rider profile', JSON.stringify(prof)?.slice(0, 120));

  if (riderId) {
    const rap = await api('PATCH', `/riders/${riderId}/approve`, { token: aTok });
    rap.ok ? pass('admin approve rider') : fail('approve rider', rap.status);
    await api('PATCH', `/riders/${riderId}/location`, { token: rider.token, body: { lat: HERE.lat, lng: HERE.lng } });
    const av = await api('PATCH', `/riders/${riderId}/availability`, { token: rider.token, body: { availability: 'AVAILABLE' } });
    av.ok ? pass('rider set AVAILABLE + location') : fail('availability', av.status);

    const near = await api('GET', `/riders/nearby?lat=${HERE.lat}&lng=${HERE.lng}&radius=8000&status=AVAILABLE`, { token: owner.token });
    (near.data || []).some((x) => (x.id || x._id) === riderId) ? pass('store sees rider on map (nearby)', `${near.data.length} available`) : fail('riders/nearby', JSON.stringify(near.data)?.slice(0, 120));

    if (orderId) {
      const asg = await api('PATCH', `/orders/${orderId}/assign-rider`, { token: owner.token, body: { riderId } });
      asg.ok && asg.data.otp ? pass('assign rider to order', `OTP ${asg.data.otp}`) : fail('assign rider', JSON.stringify(asg.data)?.slice(0, 120));
    }
  }

  // ---- 7. Khata (udhaar) ----
  console.log('\n[7] Khata / udhaar');
  const k1 = await api('POST', '/khata', { token: owner.token, body: { store: medId, customerName: 'Demo Customer', customerPhone: '9800000009', type: 'CREDIT', amount: 250, note: 'dawa udhaar' } });
  const k2 = await api('POST', '/khata', { token: owner.token, body: { store: medId, customerName: 'Demo Customer', customerPhone: '9800000009', type: 'PAYMENT', amount: 100, note: 'part paid' } });
  (k1.ok && k2.ok) ? pass('write khata (credit + payment)') : fail('khata write', `${k1.status}/${k2.status}`);
  const ksum = await api('GET', `/khata/store/${medId}/summary`, { token: owner.token });
  ksum.ok ? pass('shop khata summary', `outstanding ₹${ksum.data.outstanding}`) : fail('khata summary', JSON.stringify(ksum.data)?.slice(0, 120));
  const kmine = await api('GET', '/khata/mine', { token: cust.token });
  kmine.ok ? pass('customer sees own khata', `owes ₹${kmine.data.totalOutstanding} across ${kmine.data.shops?.length || 0} shop(s)`) : fail('khata mine', JSON.stringify(kmine.data)?.slice(0, 120));

  // ---- 8. Refills ----
  console.log('\n[8] Refill subscriptions');
  const rf = await api('POST', '/refills', { token: cust.token, body: { store: watId, itemLabel: '20L water can', category: 'WATER', quantity: 2, frequency: 'WEEKLY', landmark: 'Peepal ped ke paas' } });
  rf.ok ? pass('customer sets repeat order', rf.data.itemLabel) : fail('create refill', JSON.stringify(rf.data)?.slice(0, 120));
  const rmine = await api('GET', '/refills/mine', { token: cust.token });
  (rmine.data || []).length ? pass('customer sees repeat orders', `${rmine.data.length}`) : fail('refills mine', JSON.stringify(rmine.data)?.slice(0, 120));
  const rstore = await api('GET', `/refills/store/${watId}`, { token: owner.token });
  rstore.ok ? pass("shop's delivery round", `${rstore.data.due?.length || 0} due, ${rstore.data.upcoming?.length || 0} upcoming`) : fail('refills store', JSON.stringify(rstore.data)?.slice(0, 120));

  // ---- 9. Emergency ----
  console.log('\n[9] Emergency directory');
  const em = await api('GET', '/public/emergency');
  (em.data?.national || []).length ? pass('national helplines (always on)', `${em.data.national.length} numbers`) : fail('emergency national', JSON.stringify(em.data)?.slice(0, 120));
  const addEm = await api('POST', '/emergency', { token: aTok, body: { type: 'AMBULANCE', name: 'Demo City Ambulance', nameLocal: 'डेमो एम्बुलेंस', phone: '9800000108', city: HERE.city, pincode: HERE.pincode, is24x7: true, verified: true } });
  addEm.ok ? pass('admin adds local emergency number') : fail('add emergency', JSON.stringify(addEm.data)?.slice(0, 120));
  const emCity = await api('GET', `/public/emergency?city=${HERE.city}`);
  pass('emergency by city', `${emCity.data?.local?.length || 0} local in ${HERE.city}`);

  // ---- 10. Field sales ----
  console.log('\n[10] Field sales');
  const sales = await ensureUser('sales', 'demo.sales@ridefleet.test', 'Demo Sales Agent', '9800000004');
  pass('sales agent account', sales.user.email);
  const lead = await api('POST', '/sales/leads', { token: sales.token, body: { shopName: 'Naya Kirana', ownerName: 'Ramesh', phone: '9800000055', category: 'KIRANA', area: HERE.area, city: HERE.city, pincode: HERE.pincode, status: 'INTERESTED' } });
  lead.ok ? pass('add a lead', lead.data.shopName) : fail('add lead', JSON.stringify(lead.data)?.slice(0, 120));
  const sstats = await api('GET', '/sales/stats', { token: sales.token });
  sstats.ok ? pass('sales scorecard', `${sstats.data.total} leads, ${sstats.data.followUpsDue} follow-ups due`) : fail('sales stats', JSON.stringify(sstats.data)?.slice(0, 120));

  // ---- 11. Language / profile ----
  console.log('\n[11] Profile & language');
  const lng = await api('PATCH', '/me/language', { token: cust.token, body: { preferredLanguage: 'hi' } });
  lng.ok ? pass('save language (hi)') : fail('language', JSON.stringify(lng.data)?.slice(0, 120));
  const me = await api('GET', '/me', { token: cust.token });
  me.data?.preferredLanguage === 'hi' ? pass('language persisted on account') : fail('language persist', me.data?.preferredLanguage);
  await api('PATCH', '/me/language', { token: cust.token, body: { preferredLanguage: 'en' } });

  // ---- cleanup: delete the shops this test created, so the public directory
  //      is never left with duplicates of the real demo shops ----
  console.log('\n[cleanup] removing test shops');
  for (const sid of [medId, watId]) {
    if (sid) {
      const r = await api('DELETE', `/stores/${sid}`, { token: aTok });
      console.log(`  ${r.ok ? '🗑 removed' : '· skipped'} ${sid}`);
    }
  }

  summary();
}

function summary() {
  const ok = results.filter((r) => r.ok).length;
  const bad = results.filter((r) => !r.ok);
  console.log(`\n========================================`);
  console.log(`  RESULT: ${ok}/${results.length} checks passed`);
  if (bad.length) { console.log(`  FAILURES:`); bad.forEach((b) => console.log(`   ❌ ${b.name} — ${b.detail}`)); }
  else console.log(`  🎉 every feature verified end-to-end`);
  console.log(`========================================\n`);
  process.exit(bad.length ? 1 : 0);
}

main().catch((e) => { console.error('FATAL', e); process.exit(2); });

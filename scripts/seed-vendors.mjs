/**
 * Seeds a set of demo procurement vendors (the legacy "Vendors" tab in the
 * admin console) with realistic performance metrics. Idempotent: a vendor whose
 * code already exists is updated, not duplicated.
 *
 *   ADMIN_PW='your-admin-password' node scripts/seed-vendors.mjs
 */
const API = process.env.API || 'https://vendor-management-x1v1.vercel.app';
const ADMIN_PW = process.env.ADMIN_PW;
if (!ADMIN_PW) { console.error('Set ADMIN_PW'); process.exit(2); }

async function api(method, path, { token, body } = {}, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status >= 500) { await new Promise(r => setTimeout(r, 3000)); continue; }
    const t = await res.text(); let d = null; try { d = t ? JSON.parse(t) : null; } catch { d = t; }
    return { ok: res.ok, status: res.status, data: d };
  }
  return { ok: false, status: 500 };
}
const id = (x) => x.id || x._id;

const VENDORS = [
  { name: 'Bharat Traders',            vendorCode: 'VND-101', contactDetails: 'ramesh@bharattraders.in · 9811100201', address: 'Sector 12, Gandhi Nagar, Delhi',      onTimeDeliveryRate: 96, qualityRatingAvg: 4.7, averageResponseTime: 3,  fulfillmentRate: 98 },
  { name: 'Shree Industrial Supplies', vendorCode: 'VND-102', contactDetails: 'sales@shreeindl.com · 9811100202',     address: 'MIDC, Bhosari, Pune',                    onTimeDeliveryRate: 88, qualityRatingAvg: 4.2, averageResponseTime: 6,  fulfillmentRate: 91 },
  { name: 'Reliable Logistics',        vendorCode: 'VND-103', contactDetails: 'ops@reliablelog.in · 9811100203',      address: 'Transport Nagar, Indore',                onTimeDeliveryRate: 79, qualityRatingAvg: 3.8, averageResponseTime: 9,  fulfillmentRate: 84 },
  { name: 'Metro Packaging Co',        vendorCode: 'VND-104', contactDetails: 'info@metropack.co · 9811100204',       address: 'Peenya Industrial Area, Bengaluru',      onTimeDeliveryRate: 92, qualityRatingAvg: 4.5, averageResponseTime: 4,  fulfillmentRate: 95 },
  { name: 'Anand Raw Materials',       vendorCode: 'VND-105', contactDetails: 'anand@anandraw.in · 9811100205',       address: 'GIDC, Vapi, Gujarat',                    onTimeDeliveryRate: 71, qualityRatingAvg: 3.4, averageResponseTime: 12, fulfillmentRate: 77 },
  { name: 'Sunrise Chemicals',         vendorCode: 'VND-106', contactDetails: 'contact@sunrisechem.in · 9811100206',  address: 'Chemical Zone, Ankleshwar',              onTimeDeliveryRate: 85, qualityRatingAvg: 4.0, averageResponseTime: 7,  fulfillmentRate: 89 },
];

const admin = (await api('POST', '/auth/login', { body: { email: 'admin@vendor.com', password: ADMIN_PW } })).data.access_token;
const existing = (await api('GET', '/vendors', { token: admin })).data || [];
const byCode = new Map(existing.map((v) => [v.vendorCode, v]));

let created = 0, updated = 0;
for (const v of VENDORS) {
  const { name, contactDetails, address, vendorCode, ...metrics } = v;
  let vendor = byCode.get(vendorCode);
  if (!vendor) {
    const r = await api('POST', '/vendors', { token: admin, body: { name, contactDetails, address, vendorCode } });
    if (!r.ok) { console.log(`  ✗ create ${name}: ${r.status} ${JSON.stringify(r.data)?.slice(0,80)}`); continue; }
    vendor = r.data; created++;
  } else updated++;
  // Set the performance metrics (create can't, they aren't in the DTO).
  const u = await api('PUT', `/vendors/${id(vendor)}`, { token: admin, body: metrics });
  console.log(`  ${u.ok ? '✓' : '✗'} ${name.padEnd(26)} ${vendorCode}  on-time ${v.onTimeDeliveryRate}% · ★${v.qualityRatingAvg}`);
}
console.log(`\n${created} created, ${updated} updated. Total vendors now: ${((await api('GET', '/vendors', { token: admin })).data || []).length}`);

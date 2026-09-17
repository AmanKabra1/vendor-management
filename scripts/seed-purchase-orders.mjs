/**
 * Seeds a few demo purchase orders across the demo vendors, so the admin PO
 * screen and the vendor's "My Purchase Orders" have data. Idempotent by PO
 * number.  ADMIN_PW='...' node scripts/seed-purchase-orders.mjs
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
const iso = (daysFromNow) => new Date(Date.now() + daysFromNow * 864e5).toISOString();

const admin = (await api('POST', '/auth/login', { body: { email: 'admin@vendor.com', password: ADMIN_PW } })).data.access_token;
const vendors = (await api('GET', '/vendors', { token: admin })).data || [];
const existing = (await api('GET', '/purchase-orders', { token: admin })).data || [];
const havePO = new Set(existing.map((p) => p.poNumber));

// 2 POs per vendor: one issued (to acknowledge), one completed+rated.
const plan = [];
let seq = 1;
for (const v of vendors) {
  plan.push({ vendor: v, item: 'Raw material batch', qty: 500, status: 'issued', rate: null, dd: 7 });
  plan.push({ vendor: v, item: 'Packaging supplies', qty: 1200, status: 'completed', rate: v.qualityRatingAvg || 4, dd: -3 });
}

let made = 0;
for (const p of plan) {
  const poNumber = `PO-2026-${String(seq++).padStart(4, '0')}`;
  if (havePO.has(poNumber)) continue;
  const r = await api('POST', '/purchase-orders', { token: admin, body: {
    poNumber, vendor: id(p.vendor), orderDate: iso(-5), issueDate: iso(-5),
    deliveryDate: iso(p.dd), items: { name: p.item }, quantity: p.qty, status: p.status,
    ...(p.rate != null ? { qualityRating: p.rate } : {}),
  }});
  if (r.ok) { made++; console.log(`  ✓ ${poNumber}  ${p.vendor.name.padEnd(24)} ${p.status}`); }
  else console.log(`  ✗ ${poNumber} ${p.vendor.name}: ${r.status} ${JSON.stringify(r.data)?.slice(0,80)}`);
}
console.log(`\n${made} purchase orders created. Total now: ${((await api('GET', '/purchase-orders', { token: admin })).data || []).length}`);

import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { STORE_CATEGORIES } from '../shared/store-categories';

@Component({
  selector: 'app-landing',
  standalone: false,
  template: `
    <div class="lp">
      <!-- NAV -->
      <header class="lp-nav">
        <a class="lp-brand" href="#top"><span class="lp-chip">📦</span> RideFleet</a>
        <nav class="lp-links">
          <a routerLink="/shops">Shop directory</a>
          <a href="#shops">Shop types</a>
          <a href="#flow">How it works</a>
          <a href="#people">For you</a>
        </nav>
        <div class="lp-navcta">
          <a class="lp-ghost" routerLink="/emergency">🆘 Emergency</a>
          <a class="lp-ghost" routerLink="/login">Log in</a>
          <a class="lp-amber" routerLink="/register">Get started</a>
        </div>
      </header>

      <!-- HERO -->
      <section class="lp-hero" id="top">
        <canvas #map class="lp-map"></canvas>
        <div class="lp-hero-inner">
          <span class="lp-kicker">For towns, kasbas and small cities · हिंदी में भी</span>
          <h1>Your whole bazaar,<br><span class="lp-grad">one phone call away.</span></h1>
          <p class="lp-sub">
            Kirana, medical, water can, gas cylinder, sabzi, hardware, seeds — every shop in
            town, with its phone number, its rates and a rider to bring it home. Udhaar khata
            included, and an emergency directory that works without an account.
          </p>
          <div class="lp-cta-row">
            <a class="lp-amber lg" routerLink="/register">Get started free →</a>
            <a class="lp-ghost lg" routerLink="/shops">Browse shops near you</a>
          </div>
          <div class="lp-chips">
            <span>📒 Udhaar khata</span>
            <span>🆘 108 · 101 · 1906 built in</span>
            <span>🐢 Works on 2G</span>
            <span>₹0 to start</span>
          </div>
        </div>
      </section>

      <!-- STATS (real product facts) -->
      <section class="lp-stats">
        <div class="lp-stat" *ngFor="let s of stats">
          <div class="lp-stat-num">{{ s.num }}</div>
          <div class="lp-stat-label">{{ s.label }}</div>
        </div>
      </section>

      <!-- SHOP TYPES — the answer to "is my kind of shop on this?" -->
      <section class="lp-section" id="shops">
        <div class="lp-eyebrow">Every kind of shop</div>
        <h2 class="lp-h2">Not just groceries. The whole bazaar.</h2>
        <p class="lp-lead">
          A town runs on more than a kirana. Each shop type gets the fields it actually needs —
          a water supplier gets refill rounds, a chemist gets a 24×7 flag, a gas agency gets
          cylinder bookings, a seed shop gets its season.
        </p>
        <div class="lp-cats">
          <span class="lp-cat" *ngFor="let c of shopTypes">
            <b>{{ c.icon }}</b> {{ c.en }}
            <small>{{ c.hi }}</small>
          </span>
        </div>
      </section>

      <!-- EMERGENCY — the part that has to work without an account -->
      <section class="lp-section alt" id="emergency">
        <div class="lp-eyebrow">Medical & emergency</div>
        <h2 class="lp-h2">The numbers you need at 2am.</h2>
        <p class="lp-lead">
          Ambulance, fire, gas leak, live wire, blood bank, the night chemist two streets away.
          National helplines are built into the app and render instantly — no login, no map load,
          no signal required. Local numbers are added and verified by the district admin.
        </p>
        <div class="lp-sos-row">
          <a class="lp-sos" href="tel:112"><b>112</b><small>All emergencies</small></a>
          <a class="lp-sos" href="tel:108"><b>108</b><small>Ambulance</small></a>
          <a class="lp-sos" href="tel:101"><b>101</b><small>Fire brigade</small></a>
          <a class="lp-sos" href="tel:1906"><b>1906</b><small>LPG gas leak</small></a>
          <a class="lp-sos" href="tel:1912"><b>1912</b><small>Electricity</small></a>
        </div>
        <div class="lp-cta-row">
          <a class="lp-amber lg" routerLink="/emergency">Open the emergency page →</a>
        </div>
      </section>

      <!-- FLOW (real sequence) -->
      <section class="lp-section" id="flow">
        <div class="lp-eyebrow">How an order flows</div>
        <h2 class="lp-h2">From a handwritten list to your doorstep.</h2>
        <div class="lp-flow">
          <div class="lp-step" *ngFor="let f of flow; let i = index">
            <div class="lp-step-no">0{{ i + 1 }}</div>
            <div class="lp-step-ic">{{ f.ic }}</div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.text }}</p>
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="lp-section alt" id="features">
        <div class="lp-eyebrow">Built to be trusted</div>
        <h2 class="lp-h2">Everything a local delivery network needs.</h2>
        <div class="lp-grid">
          <div class="lp-card" *ngFor="let c of features">
            <div class="lp-card-ic" [style.background]="c.bg">{{ c.ic }}</div>
            <h3>{{ c.title }}</h3>
            <p>{{ c.text }}</p>
          </div>
        </div>
      </section>

      <!-- PEOPLE -->
      <section class="lp-section" id="people">
        <div class="lp-eyebrow">For everyone in the chain</div>
        <h2 class="lp-h2">One platform, every role.</h2>
        <div class="lp-people">
          <div class="lp-persona" *ngFor="let p of personas">
            <div class="lp-persona-top" [style.background]="p.bg">{{ p.ic }}</div>
            <div class="lp-persona-body">
              <h3>{{ p.title }}</h3>
              <ul><li *ngFor="let b of p.bullets">{{ b }}</li></ul>
            </div>
          </div>
        </div>
      </section>

      <!-- TESTIMONIALS -->
      <section class="lp-section alt">
        <div class="lp-eyebrow">From the ground</div>
        <h2 class="lp-h2">Built for how a town actually shops.</h2>
        <div class="lp-quotes">
          <figure class="lp-quote" *ngFor="let q of quotes">
            <blockquote>“{{ q.text }}”</blockquote>
            <figcaption><span class="lp-avatar" [style.background]="q.bg">{{ q.initial }}</span>
              <span><b>{{ q.name }}</b><small>{{ q.role }}</small></span>
            </figcaption>
          </figure>
        </div>
      </section>

      <!-- CTA -->
      <section class="lp-final">
        <h2>Bring your shop online today.</h2>
        <p>Free to start. Any kind of shop, in Hindi or English, in under two minutes.</p>
        <div class="lp-cta-row center">
          <a class="lp-amber lg" routerLink="/register">Create your account</a>
          <a class="lp-ghost lg dark" routerLink="/login">I already have one</a>
        </div>
      </section>

      <footer class="lp-foot">
        <span class="lp-brand sm"><span class="lp-chip">📦</span> RideFleet</span>
        <span class="lp-foot-note">
          <a routerLink="/shops" style="color:inherit">Shop directory</a> ·
          <a routerLink="/emergency" style="color:inherit">Emergency numbers</a> ·
          local commerce for towns and kasbas
        </span>
      </footer>
    </div>
  `,
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('map', { static: false }) mapRef!: ElementRef<HTMLCanvasElement>;
  private raf = 0;

  stats = [
    { num: '40+ shop types', label: 'kirana to gas agency to seed shop' },
    { num: '9 roles', label: 'customer · shop · staff · rider · sales · supplier' },
    { num: '₹20 + ₹8/km', label: 'fair, distance-based rider fee' },
    { num: 'हिंदी + English', label: 'one tap, no reinstall' },
  ];

  /** A slice of the catalogue — enough to answer "is my shop on this list?" */
  shopTypes = STORE_CATEGORIES.filter(
    (c) => !['GROCERY', 'PHARMACY', 'GENERAL', 'OTHER'].includes(c.key),
  );

  flow = [
    { ic: '📝', title: 'Send your list', text: 'Type it, snap a photo of the handwritten one, or tap items off the shop’s own rate board.' },
    { ic: '🏪', title: 'The shop prices it', text: 'The counter reviews the list, prepares the order and the bill is generated automatically.' },
    { ic: '🛵', title: 'A nearby rider is hired', text: 'The shop sees available riders on a map and assigns the closest — fee set by distance.' },
    { ic: '📒', title: 'Pay cash, UPI or khata', text: 'OTP handoff on delivery. Put it on your udhaar khata and both sides see the same balance.' },
  ];


  features = [
    { ic: '📒', bg: 'linear-gradient(135deg,#b91c1c,#dc2626)', title: 'Udhaar khata, digitised', text: 'The shop’s credit book — goods now, payment on salary day. Shopkeeper and customer see the same balance, so payday arguments end.' },
    { ic: '🆘', bg: 'linear-gradient(135deg,#f43f5e,#e11d48)', title: 'Emergency directory', text: '108, 101, 1906, 1912 built in, plus verified local ambulance, hospital, blood bank and tanker numbers. No login, works offline.' },
    { ic: '💧', bg: 'linear-gradient(135deg,#0284c7,#0ea5e9)', title: 'Repeat refills', text: 'Water can, gas cylinder, milk, cattle feed — a dated round the shop works through each morning, so nobody runs dry.' },
    { ic: '🌐', bg: 'linear-gradient(135deg,#7c3aed,#6366f1)', title: 'Hindi + English', text: 'One tap switches the whole app. Shop names, rate lists and item names all carry a local-script version.' },
    { ic: '🐢', bg: 'linear-gradient(135deg,#15803d,#16a34a)', title: 'Data saver mode', text: 'Turns off maps, photos and animation for a 2G tower or a tight data pack. Big-text mode for older eyes.' },
    { ic: '📍', bg: 'linear-gradient(135deg,#f59e0b,#ea580c)', title: 'Landmark addresses', text: '“Behind Hanuman mandir, blue gate” — because street names often don’t exist and a GPS pin lands on the wrong lane.' },
  ];

  personas = [
    { ic: '🏪', bg: 'linear-gradient(135deg,#5b21b6,#4f46e5)', title: 'Shop owners', bullets: ['Any shop type — kirana, medical, water, gas, sabzi, seeds', 'Publish a rate list, keep the udhaar khata, run refill rounds', 'One shutter switch pauses orders when you close'] },
    { ic: '🧑‍💼', bg: 'linear-gradient(135deg,#0891b2,#0ea5e9)', title: 'Shop staff', bullets: ['Own login for whoever is on the counter', 'Take phone orders and write the khata', 'No access to shop settings or payouts'] },
    { ic: '🛵', bg: 'linear-gradient(135deg,#f59e0b,#ea580c)', title: 'Riders', bullets: ['Deliver for any shop in town, on your own hours', 'OTP handoff, live GPS, fee set by distance', 'See help requests raised nearby'] },
    { ic: '🛒', bg: 'linear-gradient(135deg,#15803d,#16a34a)', title: 'Customers', bullets: ['Send a list, a photo, or tap the shop’s rate board', 'Pay cash, UPI, or put it on your khata', 'Set repeat orders for water, gas and milk'] },
    { ic: '📋', bg: 'linear-gradient(135deg,#be185d,#db2777)', title: 'Field sales agents', bullets: ['Work a shop-by-shop beat in your own town', 'Log visits, set follow-ups, pitch on WhatsApp', 'Earn per shop that actually goes live'] },
    { ic: '🚚', bg: 'linear-gradient(135deg,#4338ca,#6366f1)', title: 'Wholesalers & distributors', bullets: ['List a bulk catalogue for the shops', 'Take restock orders, dispatch and confirm', 'Sell to kiranas across the district'] },
  ];

  quotes = [
    { text: 'The khata is the reason I open it. Twelve years of paper registers, and now the customer sees the same number I do.', name: 'Sharma Kirana', role: 'Kirana, Jaipur', initial: 'S', bg: '#5b21b6' },
    { text: 'Water can orders used to come by call and I would forget half. Now the morning list is on the phone with the landmark.', name: 'Balaji Jal Seva', role: 'Water supplier, Nashik', initial: 'B', bg: '#0284c7' },
    { text: 'My mother could not read the English screen. One tap and it is all Hindi — now she orders the sabzi herself.', name: 'Aman', role: 'Customer, Indore', initial: 'A', bg: '#15803d' },
  ];

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    // Signed-in visitors go straight to their dashboard.
    if (this.auth.isLoggedIn) this.router.navigateByUrl(this.auth.home);
  }

  ngAfterViewInit() {
    if (!this.mapRef) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.drawMap(prefersReduced);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
  }

  /** Stylized living map: dotted grid, glowing route, pulsing stores, a rider moving along the path. */
  private drawMap(staticOnly: boolean) {
    const canvas = this.mapRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const path = (t: number) => {
      // a smooth S-curve route across the canvas
      const x = 0.12 * W + t * 0.76 * W;
      const y = 0.7 * H - Math.sin(t * Math.PI) * 0.42 * H + Math.sin(t * 6) * 6;
      return { x, y };
    };
    const stores = [0.18, 0.5, 0.82].map((t) => path(t));
    let p = 0;

    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      // dot grid
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let x = 20; x < W; x += 34) for (let y = 20; y < H; y += 34) { ctx.beginPath(); ctx.arc(x, y, 1, 0, 7); ctx.fill(); }
      // route
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.01) { const q = path(t); t === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y); }
      ctx.strokeStyle = 'rgba(245,158,11,0.85)'; ctx.lineWidth = 3; ctx.shadowColor = 'rgba(245,158,11,0.7)'; ctx.shadowBlur = 14; ctx.stroke(); ctx.shadowBlur = 0;
      // store pins
      const pulse = staticOnly ? 4 : 4 + Math.sin(p * 6) * 2;
      stores.forEach((s) => {
        ctx.beginPath(); ctx.arc(s.x, s.y, pulse + 3, 0, 7); ctx.fillStyle = 'rgba(139,92,246,0.25)'; ctx.fill();
        ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, 7); ctx.fillStyle = '#a78bfa'; ctx.fill();
      });
      // rider
      const r = path(p);
      ctx.beginPath(); ctx.arc(r.x, r.y, 9, 0, 7); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
      ctx.beginPath(); ctx.arc(r.x, r.y, 5.5, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
      if (!staticOnly) { p += 0.0035; if (p > 1) p = 0; this.raf = requestAnimationFrame(frame); }
    };
    if (staticOnly) { p = 0.62; frame(); } else { frame(); }
  }
}

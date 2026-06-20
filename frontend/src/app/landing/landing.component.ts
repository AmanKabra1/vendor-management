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

@Component({
  selector: 'app-landing',
  standalone: false,
  template: `
    <div class="lp">
      <!-- NAV -->
      <header class="lp-nav">
        <a class="lp-brand" href="#top"><span class="lp-chip">📦</span> RideFleet</a>
        <nav class="lp-links">
          <a href="#flow">How it works</a>
          <a href="#features">Features</a>
          <a href="#people">For you</a>
        </nav>
        <div class="lp-navcta">
          <a class="lp-ghost" routerLink="/login">Log in</a>
          <a class="lp-amber" routerLink="/register">Get started</a>
        </div>
      </header>

      <!-- HERO -->
      <section class="lp-hero" id="top">
        <canvas #map class="lp-map"></canvas>
        <div class="lp-hero-inner">
          <span class="lp-kicker">Shared delivery riders · for Bharat's shops</span>
          <h1>Shared riders for<br><span class="lp-grad">every shop.</span></h1>
          <p class="lp-sub">
            Kirana stores, wholesalers and customers — connected by a pool of nearby riders.
            List it, hire a rider on the map, deliver with an OTP, track every move live.
          </p>
          <div class="lp-cta-row">
            <a class="lp-amber lg" routerLink="/register">Get started free →</a>
            <a class="lp-ghost lg" href="#flow">See how it works</a>
          </div>
          <div class="lp-chips">
            <span>🔒 OTP-verified handoff</span>
            <span>🛰️ Live GPS tracking</span>
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
        <h2 class="lp-h2">Loved across the supply chain.</h2>
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
        <p>Free to start. Set up your store or sign up to ride in under two minutes.</p>
        <div class="lp-cta-row center">
          <a class="lp-amber lg" routerLink="/register">Create your account</a>
          <a class="lp-ghost lg dark" routerLink="/login">I already have one</a>
        </div>
      </section>

      <footer class="lp-foot">
        <span class="lp-brand sm"><span class="lp-chip">📦</span> RideFleet</span>
        <span class="lp-foot-note">Shared riders for local commerce · built on a 100% free stack</span>
      </footer>
    </div>
  `,
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('map', { static: false }) mapRef!: ElementRef<HTMLCanvasElement>;
  private raf = 0;

  stats = [
    { num: '5 roles', label: 'admin · store · rider · customer · wholesaler' },
    { num: '₹20 + ₹8/km', label: 'fair, distance-based rider fee' },
    { num: 'every 4s', label: 'live GPS location updates' },
    { num: '4-digit OTP', label: 'verified, fraud-free handoff' },
  ];

  flow = [
    { ic: '📝', title: 'Customer sends a list', text: 'Type your daily items or snap a photo of a handwritten list and pick a nearby kirana store.' },
    { ic: '🏪', title: 'Store confirms & prices', text: 'The shop reviews the list, prepares the order and the bill is generated automatically.' },
    { ic: '🛵', title: 'A nearby rider is hired', text: 'The store sees available riders on a map and assigns the closest one — fee set by distance.' },
    { ic: '✅', title: 'OTP delivery, tracked live', text: 'Watch the rider move in real time; they hand over only after your 4-digit OTP matches.' },
  ];

  features = [
    { ic: '🗺️', bg: 'linear-gradient(135deg,#6d28d9,#4f46e5)', title: 'Live map tracking', text: 'Leaflet + OpenStreetMap show riders, stores and the moving delivery in real time.' },
    { ic: '🔒', bg: 'linear-gradient(135deg,#0ea5e9,#2563eb)', title: 'OTP-verified delivery', text: 'Every order carries a one-time code, so handoffs can’t be faked.' },
    { ic: '🪪', bg: 'linear-gradient(135deg,#f59e0b,#ea580c)', title: 'KYC verification', text: 'Riders & stores verify identity (Aadhaar / DigiLocker) before they go live.' },
    { ic: '💳', bg: 'linear-gradient(135deg,#10b981,#059669)', title: 'UPI & card payments', text: 'Pay on delivery or online — UPI, cards and wallets via a secure gateway.' },
    { ic: '📈', bg: 'linear-gradient(135deg,#8b5cf6,#6366f1)', title: 'Fair distance pricing', text: 'Transparent base + per-km rider fee, computed from real coordinates.' },
    { ic: '🔔', bg: 'linear-gradient(135deg,#f43f5e,#e11d48)', title: 'Instant notifications', text: 'Email + in-app alerts on approval, assignment and delivery.' },
  ];

  personas = [
    { ic: '🏪', bg: 'linear-gradient(135deg,#6d28d9,#4f46e5)', title: 'Store owners', bullets: ['List your shop & go live after approval', 'Accept customer lists, auto-generate bills', 'Hire the nearest available rider'] },
    { ic: '🛵', bg: 'linear-gradient(135deg,#f59e0b,#ea580c)', title: 'Riders', bullets: ['Choose your hours & platform per slot', 'Accept nearby orders, earn per delivery', 'Go live and share GPS while delivering'] },
    { ic: '🛒', bg: 'linear-gradient(135deg,#10b981,#059669)', title: 'Customers', bullets: ['Send a list or a photo to a kirana', 'Track the rider live on a map', 'Pay on delivery, get a clear invoice'] },
  ];

  quotes = [
    { text: 'I get orders from the whole mohalla now without hiring my own delivery boy. I just tap the nearest rider.', name: 'Sharma Kirana', role: 'Grocery store, Jaipur', initial: 'S', bg: '#6d28d9' },
    { text: 'Morning I take Zomato, evening I do kirana drops here. One app, my own timing, fee fixed by distance.', name: 'Ravi K.', role: 'Delivery rider, Pune', initial: 'R', bg: '#f59e0b' },
    { text: 'I send a photo of my list to the shop and watch it come home. The OTP makes it feel safe.', name: 'Aman', role: 'Customer, Indore', initial: 'A', bg: '#10b981' },
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

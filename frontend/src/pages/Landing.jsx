import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Building2,
  CheckCircle2,
  CreditCard,
  Droplets,
  FileText,
  KeyRound,
  MessageSquare,
  Mic,
  Phone,
  Shield,
  Smartphone,
  Wrench,
  Sparkles,
} from 'lucide-react';
import heroImage from '../utils/l-ph.jpg';
import SiteFooter from '../components/SiteFooter';

const heroImages = [
  {
    src: heroImage,
    alt: 'Apartment building in Nairobi, Kenya',
  },
  {
    src: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80',
    alt: 'Modern apartment exterior',
  },
];

const painRows = [
  ['Rent follow-up', 'See who paid, who is partial, and who still needs a reminder without switching between inboxes.'],
  ['M-Pesa records', 'Match every payment to a tenant and a month in seconds, not hours of message hunting.'],
  ['Repairs', 'Track caretaker updates, voice notes, and tenant ratings in a single repair timeline.'],
];

const capabilities = [
  { icon: CreditCard, title: 'Rent collection', desc: 'Manage realtime receipts, track partial payments, and issue automated arrears reminders across all properties.', tone: 'saas-card--emerald' },
  { icon: Droplets, title: 'Utility management', desc: 'Record water and electricity meter readings on-site, generate instant bills, and track consumption trends.', tone: 'saas-card--cyan' },
  { icon: Wrench, title: 'Maintenance ecosystem', desc: 'A complete lifecycle tracker for repairs, from tenant reporting to caretaker assignment and closure verification.', tone: 'saas-card--amber' },
  { icon: Shield, title: 'Tenant behavioral score', desc: 'Analyze risk signals based on historical payment behavior to make better selection decisions for your properties.', tone: 'saas-card--indigo' },
  { icon: KeyRound, title: 'Digital credit passport', desc: 'Empower tenants to share their verified rent history with future landlords, rewarding good payment habits.', tone: 'saas-card--rose' },
  { icon: FileText, title: 'Lease & compliance', desc: 'Automated lease generation, renewal tracking, and tax-ready reporting for iTax and internal accounting.', tone: 'saas-card--purple' },
  { icon: BellRing, title: 'Omnichannel alerts', desc: 'Reach tenants where they are - SMS, WhatsApp, and USSD - with billing alerts, receipts, and property-wide broadcasts.', tone: 'saas-card--blue' },
  { icon: BarChart3, title: 'Financial analytics', desc: 'Deep insights into collection efficiency, vacancy rates, and projected revenue for data-driven management.', tone: 'saas-card--teal' },
];

const channels = [
  { icon: Building2, label: 'Web portal', desc: 'Full-featured administrative dashboards for landlords and property management teams.', tone: 'saas-card--indigo' },
  { icon: CreditCard, label: 'M-Pesa Paybill', desc: 'Native STK push and C2B matching for instant, reconciliation-free rent collection.', tone: 'saas-card--emerald' },
  { icon: Phone, label: 'USSD *XXX#', desc: 'Accessibility for all - pay rent or check unit balances on any feature phone without internet.', tone: 'saas-card--amber' },
  { icon: Smartphone, label: 'Smart SMS', desc: 'Automated billing reminders, digital receipts, and real-time maintenance updates.', tone: 'saas-card--blue' },
  { icon: Mic, label: 'Voice AI', desc: 'Interactive voice prompts for payment confirmations and tenant accessibility across Kenya.', tone: 'saas-card--purple' },
  { icon: MessageSquare, label: 'WhatsApp', desc: 'Direct tenant chat for support, receipt delivery, and automated payment prompts.', tone: 'saas-card--teal' },
];

const heroHighlights = [
  { title: 'Collections', text: 'Realtime rent, arrears, and statement visibility.', tone: 'saas-card--emerald' },
  { title: 'Messages', text: 'SMS, USSD, WhatsApp, and voice in one flow.', tone: 'saas-card--indigo' },
  { title: 'Field ops', text: 'Repairs, meters, caretaker updates, and ratings.', tone: 'saas-card--amber' },
  { title: 'Trust signals', text: 'Risk flags and passports for better decisions.', tone: 'saas-card--rose' },
];

const timeline = [
  { label: 'SMS reminder', value: 'Rent due on 1 May. Pay by M-Pesa or dial USSD.' },
  { label: 'Payment receipt', value: 'KSh 24,000 received. Ref QKD72P. Trust score updated.' },
  { label: 'Maintenance ticket', value: 'Plumbing issue in Unit B4 assigned to caretaker.' },
];

function useReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-kodi-accent to-kodi-emerald shadow-lg shadow-kodi-accent/25">
        <Building2 className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className={`text-xl font-black tracking-tight ${light ? 'text-white' : 'text-kodi-dark'}`}>Kodishaa</p>
        <p className={`text-[10px] font-semibold uppercase tracking-[0.26em] ${light ? 'text-blue-100' : 'text-kodi-text-muted'}`}>Easy Renting</p>
      </div>
    </div>
  );
}

export default function Landing() {
  useReveal();

  return (
    <div className="landing-page min-h-screen overflow-hidden bg-slate-50 text-kodi-text-primary relative isolate">
      {/* Dynamic Background Elements */}
      <div className="pointer-events-none absolute -left-24 top-16 h-96 w-96 rounded-full bg-kodi-accent/15 blur-[120px] animate-float" />
      <div className="pointer-events-none absolute right-[-10rem] top-40 h-[30rem] w-[30rem] rounded-full bg-kodi-emerald/10 blur-[140px] animate-pulse" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-kodi-purple/5 blur-[100px]" />

      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(29,78,216,0.08),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_35%)]" />
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Logo />
          <div className="hidden items-center gap-7 text-sm font-medium text-kodi-text-muted md:flex">
            <a href="#workflow" className="transition hover:text-kodi-text-primary">Workflow</a>
            <a href="#channels" className="transition hover:text-kodi-text-primary">Channels</a>
            <a href="#features" className="transition hover:text-kodi-text-primary">Features</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost">Log in</Link>
            <Link to="/login" className="btn-primary">Open Dashboard</Link>
          </div>
        </nav>

        <section className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(460px,1.05fr)] lg:items-center lg:px-8 lg:pb-24">
          <div className="space-y-8 reveal" data-reveal>
            <div className="space-y-5">
              <div className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-kodi-border bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-kodi-text-muted shadow-sm stagger-1">
                <Sparkles className="h-4 w-4 text-kodi-accent" />
                Rental operations made calmer
              </div>
              <h1 className="max-w-4xl animate-fade-up text-5xl font-black tracking-tight text-kodi-dark md:text-7xl stagger-2">
                Rent on time. Every time.
              </h1>
              <p className="max-w-2xl animate-fade-up text-lg leading-8 text-kodi-text-secondary md:text-xl stagger-3">
                One clear place for rent, arrears, repairs, receipts, tenants, caretakers, M-Pesa, SMS, USSD, and WhatsApp. Built for busy
                property teams who want clean money trails, calmer tenants, and fewer forgotten follow-ups.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 animate-fade-up stagger-4">
              <Link to="/login" className="btn-primary px-7 py-3.5 text-base">
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#workflow" className="btn-soft-hover inline-flex items-center justify-center rounded-xl border border-kodi-border bg-white/90 px-7 py-3.5 text-base font-semibold text-kodi-dark shadow-sm transition">
                See How It Works
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up stagger-5">
              {heroHighlights.map((card, i) => (
                <div key={card.title} className={`saas-card reveal ${card.tone} p-4 stagger-${i + 1}`} data-reveal>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-kodi-accent">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-kodi-text-muted">{card.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal" data-reveal>
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-kodi-border bg-kodi-dark shadow-2xl shadow-slate-300/70 animate-float">
                <img
                  src={heroImages[0].src}
                  alt={heroImages[0].alt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-kodi-dark via-kodi-dark/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                  <div className="max-w-md rounded-3xl border border-white/15 bg-white/95 p-5 text-kodi-text-primary shadow-xl backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kodi-text-muted">This month</p>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[
                        ['Collected', '1.42M', 'text-kodi-emerald'],
                        ['Owed', '186K', 'text-kodi-amber'],
                        ['Full', '94%', 'text-kodi-accent'],
                      ].map(([label, value, color]) => (
                        <div key={label} className="rounded-2xl bg-kodi-navy p-3">
                          <p className="text-[11px] text-kodi-text-muted">{label}</p>
                          <p className={`mt-1 text-xl font-black ${color}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      {timeline.slice(0, 2).map((item) => (
                        <div key={item.label} className="rounded-2xl border border-kodi-border bg-white p-3 transition-transform duration-300 hover:-translate-y-0.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kodi-accent">{item.label}</p>
                          <p className="mt-1 text-xs leading-5 text-kodi-text-secondary">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="overflow-hidden rounded-[2rem] border border-kodi-border bg-white shadow-xl shadow-slate-200/70">
                  <img src={heroImages[1].src} alt={heroImages[1].alt} className="h-64 w-full object-cover" />
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-kodi-accent">Property view</p>
                    <p className="mt-2 text-lg font-bold text-kodi-dark">See collections, arrears, and maintenance in one place.</p>
                    <p className="mt-2 text-sm leading-6 text-kodi-text-muted">Designed for fast decisions when the month gets busy and every reminder matters.</p>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-kodi-border bg-white p-5 shadow-xl shadow-slate-200/70">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-kodi-text-muted">Live activity</p>
                  <div className="mt-4 space-y-3">
                    {timeline.map((item) => (
                      <div key={item.label} className="rounded-2xl bg-slate-50 p-4 transition-all duration-300 hover:bg-slate-100/80">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kodi-accent">{item.label}</p>
                        <p className="mt-1 text-sm leading-6 text-kodi-text-secondary">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8" data-reveal>
          <div className="max-w-2xl">
            <p className="section-eyebrow">The old way is expensive</p>
            <h2 className="section-title mt-3">The gaps are simple. They are just costly.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {painRows.map(([title, text], index) => (
              <article key={title} className={`glass-card-hover reveal min-h-[190px] stagger-${index + 1}`} data-reveal>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-kodi-navy text-xs font-black text-kodi-accent">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-5 text-lg font-bold text-kodi-dark">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-kodi-text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="bg-white py-20" data-reveal>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-3xl">
              <p className="section-eyebrow">Everything in one system</p>
              <h2 className="section-title mt-3">Run the full rental workflow without stitching together notebooks, spreadsheets, and chat threads.</h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map(({ icon: Icon, title, desc, tone }, i) => (
                <div key={title} className={`saas-card reveal ${tone} group p-5 stagger-${(i % 4) + 1}`} data-reveal> 
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-kodi-navy transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-5 w-5 text-kodi-accent" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-kodi-dark">{title}</p>
                  <p className="mt-2 text-xs leading-6 text-kodi-text-muted">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="channels" className="mx-auto max-w-7xl px-5 py-20 lg:px-8" data-reveal>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="section-eyebrow">Multi-channel proof</p>
              <h2 className="section-title mt-3">Works where your tenants already are.</h2>
              <p className="section-copy mt-4">
                The system meets people through money movement, messaging, feature-phone flows, and web portals instead of forcing every user into one app.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {channels.map(({ icon: Icon, label, desc }, i) => (
                <div key={label} className={`saas-card reveal saas-card--cyan p-5 text-center stagger-${i + 1}`} data-reveal>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-kodi-navy">
                    <Icon className="h-6 w-6 text-kodi-accent" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-kodi-text-secondary">{label}</p>
                  <p className="mt-2 text-xs leading-6 text-kodi-text-muted">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-kodi-dark py-20 text-white" data-reveal>
          <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-3 lg:px-8">
            {[
              ['Know arrears instantly', 'See who paid, who is partial, and who needs follow-up without waiting for manual reconciliation.'],
              ['Reduce payment excuses', 'Send reminders, trigger M-Pesa prompts, and issue receipts from the same operating record.'],
              ['Keep maintenance history', 'Capture tickets, recordings, assignments, closure, and tenant ratings in one timeline.'],
            ].map(([title, text], i) => (
              <div key={title} className={`reveal rounded-3xl border border-white/10 bg-white/10 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/30 stagger-${i + 1}`} data-reveal>
                <CheckCircle2 className="h-6 w-6 text-kodi-emerald" />
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-blue-50">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8" data-reveal>
          <div className="max-w-3xl">
            <p className="section-eyebrow">Operational outcomes</p>
            <h2 className="section-title mt-3">Teams run cleaner months with fewer gaps and faster follow-up.</h2>
            <p className="section-copy mt-4">
              These are the outcomes we hear from landlords and caretakers who stop juggling tools: faster rent matching, fewer
              disputes, tighter maintenance timelines, and a calmer week before rent day.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['Financial Control', 'Eliminate the guesswork of manual tracking. See exactly who owes, trigger one-tap reminders, and follow up with a documented audit trail.', 'saas-card--emerald'],
              ['Seamless Operations', 'Bridge the gap between office and field. Every meter reading, repair ticket, and caretaker assignment lives in one shared source of truth.', 'saas-card--indigo'],
              ['Tenant Experience', 'Build loyalty through transparency. Tenants receive professional receipts and status updates in the channels they already use every day.', 'saas-card--cyan'],
              ['Risk Intelligence', 'Use data to protect your investment. Identify late-payment patterns early and leverage trust scores to manage your portfolio with confidence.', 'saas-card--amber'],
            ].map(([title, text, tone], i) => (
              <div key={title} className={`saas-card reveal ${tone} p-5 stagger-${i + 1}`} data-reveal>
                <h3 className="text-base font-bold text-kodi-dark">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-kodi-text-muted">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 rounded-[3rem] bg-slate-900 p-8 lg:p-16 text-white reveal" data-reveal>
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <h2 className="text-4xl font-black tracking-tight sm:text-5xl">The Operating System for Modern Kenyan Real Estate.</h2>
                <p className="text-lg leading-8 text-slate-300">
                  Kodishaa was not built in a boardroom; it was built in the streets and apartment blocks of Nairobi. We understood that the biggest challenge for landlords is not just "collecting money" - it is the mental load of tracking hundreds of conversations, physical notebooks, and M-Pesa messages.
                </p>
                <p className="text-lg leading-8 text-slate-300">
                  Our platform consolidates every touchpoint into a single, intelligent flow. By integrating USSD for accessibility, M-Pesa for instant settlement, and AI-driven risk scoring, we provide property owners with the same level of technical sophistication as global enterprise firms, tailored specifically for the local market context.
                </p>
                <div className="flex flex-wrap gap-6 pt-4">
                  <div>
                    <p className="text-3xl font-bold text-kodi-accent">98%</p>
                    <p className="text-xs uppercase tracking-widest text-slate-400">Collection Rate</p>
                  </div>
                  <div className="h-12 w-px bg-slate-800" />
                  <div>
                    <p className="text-3xl font-bold text-kodi-emerald">10min</p>
                    <p className="text-xs uppercase tracking-widest text-slate-400">Monthly Reconciliation</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Built for Scale', 'Whether you manage 10 units or 1,000, Kodishaa provides the infrastructure to grow your portfolio without increasing your administrative headcount.', 'saas-card--slate'],
                  ['Security First', "Your data is encrypted and backed up daily. We prioritize the privacy of your financial records and your tenants' personal information above all else.", 'saas-card--slate'],
                  ['Local Expertise', 'Integrated directly with local payment gateways and communication networks to ensure 99.9% uptime for your critical operations.', 'saas-card--slate'],
                  ['Dedicated Support', 'Our team of real estate experts is available to help you migrate your data and train your caretakers on the ground.', 'saas-card--slate'],
                ].map(([title, text, tone], i) => (
                  <div key={title} className={`saas-card ${tone} border-white/10 bg-white/5 p-6 stagger-${i + 1}`} data-reveal>
                    <h4 className="font-bold">{title}</h4>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8" data-reveal>
          <div className="rounded-[2rem] border border-kodi-border bg-white p-8 shadow-xl shadow-slate-200/70 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="section-eyebrow">Built for rental pressure</p>
                <h2 className="section-title mt-3">Get the rental control you should have had already.</h2>
                <p className="section-copy mt-4 max-w-2xl">
                  Start with one property, prove the workflow, then extend it to caretakers, tenants, broadcasts, water billing, tax reports, and trust passports.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/login" className="btn-primary">Log in</Link>
                <Link to="/login" className="btn-secondary">Book a demo</Link>
                <Link to="/login" className="btn-secondary">Start with one property</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

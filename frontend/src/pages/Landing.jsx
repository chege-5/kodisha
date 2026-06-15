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
  { icon: CreditCard, title: 'Rent collection', desc: 'Track receipts, partial payments, arrears, and reminders for every unit.', tone: 'saas-card--emerald' },
  { icon: Droplets, title: 'Utilities', desc: 'Record water and electricity readings, bill tenants, and keep a clear usage trail.', tone: 'saas-card--cyan' },
  { icon: Wrench, title: 'Repairs', desc: 'Log tenant issues, assign caretakers, and close work with a visible history.', tone: 'saas-card--amber' },
  { icon: Shield, title: 'Tenant risk', desc: 'Spot late-payment patterns before they become a monthly surprise.', tone: 'saas-card--indigo' },
  { icon: KeyRound, title: 'Rent history', desc: 'Give reliable tenants a verified record they can carry to their next home.', tone: 'saas-card--rose' },
  { icon: FileText, title: 'Leases and reports', desc: 'Keep lease dates, renewals, and tax-ready records in one place.', tone: 'saas-card--purple' },
  { icon: BellRing, title: 'Tenant messages', desc: 'Send rent reminders, receipts, updates, and broadcasts by SMS, WhatsApp, or USSD.', tone: 'saas-card--blue' },
  { icon: BarChart3, title: 'Reports', desc: 'Read collection, vacancy, arrears, and repair numbers without rebuilding spreadsheets.', tone: 'saas-card--teal' },
];

const channels = [
  { icon: Building2, label: 'Web portal', desc: 'Dashboards for owners, managers, and office teams.', tone: 'saas-card--indigo' },
  { icon: CreditCard, label: 'M-Pesa Paybill', desc: 'Match payments to tenants and months without message hunting.', tone: 'saas-card--emerald' },
  { icon: Phone, label: 'USSD', desc: 'Let tenants check balances or pay from a feature phone.', tone: 'saas-card--amber' },
  { icon: Smartphone, label: 'SMS', desc: 'Send reminders, receipts, and repair updates.', tone: 'saas-card--blue' },
  { icon: Mic, label: 'Voice', desc: 'Support payment confirmations and access for low-data tenants.', tone: 'saas-card--purple' },
  { icon: MessageSquare, label: 'WhatsApp', desc: 'Keep tenant support and receipt delivery close to chat.', tone: 'saas-card--teal' },
];

const heroHighlights = [
  { title: 'Rent', text: 'Paid, partial, overdue, and expected.' },
  { title: 'Messages', text: 'Reminders, receipts, and broadcasts.' },
  { title: 'Field work', text: 'Repairs, meters, and caretaker updates.' },
  { title: 'Records', text: 'Leases, reports, and tenant history.' },
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
<<<<<<< HEAD
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-kodi-accent to-kodi-emerald shadow-kodi-accent-25">
        <Building2 className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className={`text-xl font-black tracking-tight ${light ? 'text-white' : 'text-kodi-text-primary'}`}>Kodishaa</p>
        <p className={`text-[10px] font-semibold uppercase tracking-[0.26em] ${light ? 'text-blue-100' : 'text-kodi-text-muted'}`}>Easy Renting</p>
=======
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-kodi-dark">
        <Building2 className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className={`text-xl font-black tracking-tight ${light ? 'text-white' : 'text-kodi-dark'}`}>Kodishaa</p>
        <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${light ? 'text-blue-100' : 'text-kodi-text-muted'}`}>Easy Renting</p>
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
      </div>
    </div>
  );
}

export default function Landing() {
  useReveal();

  return (
<<<<<<< HEAD
    <div className="min-h-screen overflow-hidden bg-kodi-navy text-kodi-text-primary relative isolate flex flex-col justify-between">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,_rgba(56,189,248,0.08),_transparent_32%),linear-gradient(315deg,_rgba(52,211,153,0.08),_transparent_30%)]" />

      <header className="relative overflow-hidden w-full">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.08),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(52,211,153,0.08),_transparent_35%)]" />
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Logo />
          <div className="hidden items-center gap-7 text-sm font-semibold text-kodi-text-muted md:flex">
            <a href="#workflow" className="hover:text-kodi-accent transition-colors">Workflow</a>
            <a href="#channels" className="hover:text-kodi-accent transition-colors">Channels</a>
            <a href="#features" className="hover:text-kodi-accent transition-colors">Features</a>
=======
    <div className="landing-page min-h-screen overflow-hidden bg-slate-50 text-kodi-text-primary relative isolate">
      <header className="relative overflow-hidden">
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Logo />
          <div className="hidden items-center gap-7 text-sm font-medium text-kodi-text-muted md:flex">
            <a href="#workflow" className="transition hover:text-kodi-text-primary">Workflow</a>
            <a href="#channels" className="transition hover:text-kodi-text-primary">Channels</a>
            <a href="#features" className="transition hover:text-kodi-text-primary">Features</a>
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost">Log in</Link>
            <Link to="/login" className="btn-primary">Open dashboard</Link>
          </div>
        </nav>

        <section className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(460px,1.05fr)] lg:items-center lg:px-8 lg:pb-24">
          <div className="space-y-8 reveal" data-reveal>
            <div className="space-y-5">
<<<<<<< HEAD
              <div className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-kodi-border bg-kodi-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-kodi-text-muted shadow-sm stagger-1">
                <Sparkles className="h-4 w-4 text-kodi-accent" />
                Rental operations made calmer
=======
              <div className="inline-flex animate-fade-up items-center gap-2 rounded-md border border-kodi-border bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-kodi-text-muted stagger-1">
                Built for Kenyan rental teams
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
              </div>
              <h1 className="max-w-4xl animate-fade-up text-5xl font-black tracking-tight text-kodi-text-primary md:text-7xl stagger-2">
                Rent on time. Every time.
              </h1>
              <p className="max-w-2xl animate-fade-up text-lg leading-8 text-kodi-text-secondary md:text-xl stagger-3">
                One place to see rent, arrears, repairs, receipts, tenants, caretakers, M-Pesa, SMS, USSD, and WhatsApp. Built for teams that need clean records and fewer forgotten follow-ups.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 animate-fade-up stagger-4">
              <Link to="/login" className="btn-primary px-7 py-3.5 text-base">
                Open dashboard <ArrowRight className="h-4 w-4" />
              </Link>
<<<<<<< HEAD
              <a href="#workflow" className="inline-flex items-center justify-center rounded-xl border border-kodi-border bg-kodi-card px-7 py-3.5 text-base font-semibold text-kodi-text-primary shadow-sm transition hover:border-kodi-accent/50 hover:bg-kodi-navy hover:text-kodi-accent">
                See How It Works
=======
              <a href="#workflow" className="btn-soft-hover inline-flex items-center justify-center rounded-lg border border-kodi-border bg-white px-7 py-3.5 text-base font-semibold text-kodi-dark transition">
                See the workflow
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up stagger-5">
              {heroHighlights.map((card, i) => (
                <div key={card.title} className={`saas-card reveal p-4 stagger-${i + 1}`} data-reveal>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-kodi-accent">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-kodi-text-muted">{card.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal" data-reveal>
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
<<<<<<< HEAD
              <div className="relative min-h-[560px] overflow-hidden rounded-2xl border border-kodi-border bg-kodi-card shadow-2xl animate-float">
=======
              <div className="relative min-h-[560px] overflow-hidden rounded-xl border border-kodi-border bg-kodi-dark shadow-sm">
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
                <img
                  src={heroImages[0].src}
                  alt={heroImages[0].alt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-kodi-navy via-kodi-navy/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
<<<<<<< HEAD
                  <div className="max-w-md rounded-2xl border border-kodi-border bg-kodi-card/95 p-5 text-kodi-text-primary shadow-xl backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kodi-text-muted">This month</p>
=======
                  <div className="max-w-md rounded-xl border border-white/15 bg-white p-5 text-kodi-text-primary shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-kodi-text-muted">This month</p>
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[
                        ['Collected', '1.42M', 'text-kodi-emerald'],
                        ['Owed', '186K', 'text-kodi-amber'],
                        ['Full', '94%', 'text-kodi-accent'],
                      ].map(([label, value, color]) => (
<<<<<<< HEAD
                        <div key={label} className="rounded-2xl bg-kodi-navy p-3 border border-kodi-border/30">
=======
                        <div key={label} className="rounded-lg bg-kodi-navy p-3">
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
                          <p className="text-[11px] text-kodi-text-muted">{label}</p>
                          <p className={`mt-1 text-xl font-black ${color}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      {timeline.slice(0, 2).map((item) => (
<<<<<<< HEAD
                        <div key={item.label} className="rounded-2xl border border-kodi-border bg-kodi-card p-3 transition-transform duration-300 hover:-translate-y-0.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kodi-accent">{item.label}</p>
=======
                        <div key={item.label} className="rounded-lg border border-kodi-border bg-white p-3 transition-colors duration-150 hover:bg-slate-50">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-kodi-accent">{item.label}</p>
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
                          <p className="mt-1 text-xs leading-5 text-kodi-text-secondary">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
<<<<<<< HEAD
                <div className="overflow-hidden rounded-2xl border border-kodi-border bg-kodi-card shadow-xl">
                  <img src={heroImages[1].src} alt={heroImages[1].alt} className="h-64 w-full object-cover" />
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-kodi-accent">Property view</p>
                    <p className="mt-2 text-lg font-bold text-kodi-text-primary">See collections, arrears, and maintenance in one place.</p>
=======
                <div className="overflow-hidden rounded-xl border border-kodi-border bg-white shadow-sm">
                  <img src={heroImages[1].src} alt={heroImages[1].alt} className="h-64 w-full object-cover" />
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-kodi-accent">Property view</p>
                    <p className="mt-2 text-lg font-bold text-kodi-dark">See collections, arrears, and maintenance in one place.</p>
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
                    <p className="mt-2 text-sm leading-6 text-kodi-text-muted">Designed for fast decisions when the month gets busy and every reminder matters.</p>
                  </div>
                </div>

<<<<<<< HEAD
                <div className="rounded-2xl border border-kodi-border bg-kodi-card p-5 shadow-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-kodi-text-muted">Live activity</p>
                  <div className="mt-4 space-y-3">
                    {timeline.map((item) => (
                      <div key={item.label} className="rounded-2xl bg-kodi-navy p-4 border border-kodi-border/30 transition-all duration-300 hover:border-kodi-accent/40">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kodi-accent">{item.label}</p>
=======
                <div className="rounded-xl border border-kodi-border bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-kodi-text-muted">Live activity</p>
                  <div className="mt-4 space-y-3">
                    {timeline.map((item) => (
                      <div key={item.label} className="rounded-lg bg-slate-50 p-4 transition-colors duration-150 hover:bg-slate-100/80">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-kodi-accent">{item.label}</p>
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
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

      <main className="w-full">
        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8" data-reveal>
          <div className="max-w-2xl">
            <p className="section-eyebrow">The old way is expensive</p>
            <h2 className="section-title mt-3 text-kodi-text-primary">The gaps are simple. They are just costly.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {painRows.map(([title, text], index) => (
              <article key={title} className={`glass-card-hover reveal min-h-[190px] stagger-${index + 1}`} data-reveal>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-kodi-navy text-xs font-black text-kodi-accent border border-kodi-border/40">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-5 text-lg font-bold text-kodi-text-primary">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-kodi-text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="bg-kodi-card/50 border-y border-kodi-border/30 py-20 w-full" data-reveal>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-3xl">
              <p className="section-eyebrow">Everything in one system</p>
<<<<<<< HEAD
              <h2 className="section-title mt-3 text-kodi-text-primary">Run the full rental workflow without stitching together notebooks, spreadsheets, and chat threads.</h2>
=======
              <h2 className="section-title mt-3">Run rent, repairs, bills, and records without rebuilding the same month in notebooks and chats.</h2>
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map(({ icon: Icon, title, desc, tone }, i) => (
                <div key={title} className={`saas-card reveal ${tone} group p-5 stagger-${(i % 4) + 1}`} data-reveal> 
<<<<<<< HEAD
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-kodi-navy transition-transform duration-300 group-hover:scale-105 border border-kodi-border/30">
=======
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-kodi-navy transition-colors duration-150">
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
                    <Icon className="h-5 w-5 text-kodi-accent" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-kodi-text-primary">{title}</p>
                  <p className="mt-2 text-xs leading-6 text-kodi-text-muted">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="channels" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 w-full" data-reveal>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
<<<<<<< HEAD
              <p className="section-eyebrow">Multi-channel proof</p>
              <h2 className="section-title mt-3 text-kodi-text-primary">Works where your tenants already are.</h2>
              <p className="section-copy mt-4 text-kodi-text-secondary">
                The system meets people through money movement, messaging, feature-phone flows, and web portals instead of forcing every user into one app.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {channels.map(({ icon: Icon, label, desc, tone }, i) => (
                <div key={label} className={`saas-card reveal ${tone} p-5 text-center stagger-${i + 1}`} data-reveal>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-kodi-navy border border-kodi-border/30">
=======
              <p className="section-eyebrow">Tenant channels</p>
              <h2 className="section-title mt-3">Works where your tenants already are.</h2>
              <p className="section-copy mt-4">
                Use the channels that already carry rent and support conversations: M-Pesa, SMS, USSD, WhatsApp, voice, and the web portal.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {channels.map(({ icon: Icon, label, desc }, i) => (
                <div key={label} className={`saas-card reveal saas-card--cyan p-5 text-center stagger-${i + 1}`} data-reveal>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-kodi-navy">
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
                    <Icon className="h-6 w-6 text-kodi-accent" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-kodi-text-primary">{label}</p>
                  <p className="mt-2 text-xs leading-6 text-kodi-text-muted">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-[linear-gradient(180deg,#090d1a_0%,#05231f_100%)] border-y border-kodi-border/30 py-20 text-white w-full" data-reveal>
          <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-3 lg:px-8">
            {[
              ['Know arrears instantly', 'See who paid, who is partial, and who needs follow-up without waiting for manual reconciliation.'],
              ['Reduce payment excuses', 'Send reminders, trigger M-Pesa prompts, and issue receipts from the same operating record.'],
              ['Keep maintenance history', 'Capture tickets, recordings, assignments, closure, and tenant ratings in one timeline.'],
            ].map(([title, text], i) => (
<<<<<<< HEAD
              <div key={title} className={`reveal rounded-2xl border border-white/10 bg-white/5 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/30 stagger-${i + 1}`} data-reveal>
=======
              <div key={title} className={`reveal rounded-xl border border-white/10 bg-white/10 p-7 transition-colors duration-150 hover:border-white/30 stagger-${i + 1}`} data-reveal>
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
                <CheckCircle2 className="h-6 w-6 text-kodi-emerald" />
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-blue-50/80">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 w-full" data-reveal>
          <div className="max-w-3xl">
<<<<<<< HEAD
            <p className="section-eyebrow">Operational outcomes</p>
            <h2 className="section-title mt-3 text-kodi-text-primary">Teams run cleaner months with fewer gaps and faster follow-up.</h2>
            <p className="section-copy mt-4 text-kodi-text-secondary">
              These are the outcomes we hear from landlords and caretakers who stop juggling tools: faster rent matching, fewer
              disputes, tighter maintenance timelines, and a calmer week before rent day.
=======
            <p className="section-eyebrow">What changes</p>
            <h2 className="section-title mt-3">Cleaner rent months, fewer gaps, faster follow-up.</h2>
            <p className="section-copy mt-4">
              The product is built around the everyday pressure points: matching payments, following arrears, handling repair updates, and keeping a useful record.
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['Money trail', 'See who owes, what was paid, and which reminder was sent.', 'saas-card--emerald'],
              ['Field work', 'Keep meter readings, repair tickets, and caretaker assignments visible.', 'saas-card--indigo'],
              ['Tenant updates', 'Send receipts and status updates through familiar channels.', 'saas-card--cyan'],
              ['Early warnings', 'Identify late-payment patterns before they pile up.', 'saas-card--amber'],
            ].map(([title, text, tone], i) => (
              <div key={title} className={`saas-card reveal ${tone} p-5 stagger-${i + 1}`} data-reveal>
                <h3 className="text-base font-bold text-kodi-text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-kodi-text-muted">{text}</p>
              </div>
            ))}
          </div>

<<<<<<< HEAD
          <div className="mt-20 rounded-2xl bg-gradient-to-br from-kodi-card to-kodi-elevated p-8 lg:p-16 border border-kodi-border/30 reveal" data-reveal>
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <h2 className="text-4xl font-black tracking-tight sm:text-5xl text-kodi-text-primary">The Operating System for Kenyan Real Estate.</h2>
                <p className="text-lg leading-8 text-kodi-text-secondary">
                  Kodishaa was built around the streets and apartment blocks of Nairobi. The hardest part for landlords is not only collecting money; it is the mental load of tracking hundreds of conversations, physical notebooks, and M-Pesa messages.
                </p>
                <p className="text-lg leading-8 text-kodi-text-secondary">
                  Our platform consolidates every touchpoint into a single, intelligent flow. By integrating USSD for accessibility, M-Pesa for instant settlement, and AI-driven risk scoring, we provide property owners with the same level of technical sophistication as global enterprise firms, tailored specifically for the local market context.
=======
          <div className="mt-20 rounded-xl bg-slate-900 p-8 lg:p-12 text-white reveal" data-reveal>
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built around how rent is actually managed in Kenya.</h2>
                <p className="text-lg leading-8 text-slate-300">
                  Kodishaa keeps the monthly work close to the real record: M-Pesa messages, tenant reminders, caretaker updates, water bills, lease dates, and the conversations that explain them.
                </p>
                <p className="text-lg leading-8 text-slate-300">
                  Managers can start with one property, keep records clean, and bring tenants or caretakers into the parts of the workflow that matter to them.
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
                </p>
                <div className="flex flex-wrap gap-6 pt-4">
                  <div>
                    <p className="text-3xl font-bold text-kodi-accent">98%</p>
<<<<<<< HEAD
                    <p className="text-xs uppercase tracking-widest text-kodi-text-muted">Collection Rate</p>
=======
                    <p className="text-xs uppercase tracking-widest text-slate-400">Collection rate</p>
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
                  </div>
                  <div className="h-12 w-px bg-kodi-border/30" />
                  <div>
                    <p className="text-3xl font-bold text-kodi-emerald">10min</p>
<<<<<<< HEAD
                    <p className="text-xs uppercase tracking-widest text-kodi-text-muted">Monthly Reconciliation</p>
=======
                    <p className="text-xs uppercase tracking-widest text-slate-400">Monthly reconciliation</p>
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Portfolio ready', 'Use the same workflow for a few units or a growing property list.', 'saas-card--slate'],
                  ['Private records', "Keep financial records and tenant details in a controlled account.", 'saas-card--slate'],
                  ['Local payments', 'Work with the rent channels Kenyan tenants already use.', 'saas-card--slate'],
                  ['Team handoff', 'Give caretakers and office users clear tasks instead of scattered messages.', 'saas-card--slate'],
                ].map(([title, text, tone], i) => (
                  <div key={title} className={`saas-card ${tone} border-white/10 bg-white/5 p-6 stagger-${i + 1}`} data-reveal>
                    <h4 className="font-bold text-white">{title}</h4>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

<<<<<<< HEAD
        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 w-full" data-reveal>
          <div className="rounded-2xl border border-kodi-border bg-kodi-card p-8 shadow-xl lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="section-eyebrow">Built for rental pressure</p>
                <h2 className="section-title mt-3 text-kodi-text-primary">Get the rental control you should have had already.</h2>
                <p className="section-copy mt-4 max-w-2xl text-kodi-text-secondary">
                  Start with one property, prove the workflow, then extend it to caretakers, tenants, broadcasts, water billing, tax reports, and trust passports.
=======
        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8" data-reveal>
          <div className="rounded-xl border border-kodi-border bg-white p-8 shadow-sm lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="section-eyebrow">Built for rental pressure</p>
                <h2 className="section-title mt-3">Start with the rent workflow you need this month.</h2>
                <p className="section-copy mt-4 max-w-2xl">
                  Add a property, track the first payments, then extend the workflow to caretakers, tenants, broadcasts, water billing, reports, and trust passports.
>>>>>>> f5b4ed203937dd83f1f0993e59b52abdfb064e75
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

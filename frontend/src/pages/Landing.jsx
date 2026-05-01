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
  Headphones,
  KeyRound,
  MessageSquare,
  Mic,
  Phone,
  Receipt,
  Shield,
  Smartphone,
  Users,
  Wrench,
} from 'lucide-react';
import heroImage from '../utils/l-ph.jpg';

const painRows = [
  ['Rent follow-up', 'See who has paid, who is partial, and who still needs a reminder.'],
  ['M-Pesa records', 'Match payments to houses and months without hunting through messages.'],
  ['Repairs', 'Keep every issue, caretaker update, and tenant rating in one trail.'],
];

const capabilities = [
  { icon: CreditCard, title: 'Rent collection' },
  { icon: Droplets, title: 'Bills and water meters' },
  { icon: Wrench, title: 'Maintenance tickets' },
  { icon: Shield, title: 'Tenant trust scoring' },
  { icon: KeyRound, title: 'Credit passport' },
  { icon: FileText, title: 'Lease generation' },
  { icon: BarChart3, title: 'Reports and iTax' },
  { icon: BellRing, title: 'Broadcasts and alerts' },
];

const channels = [
  { icon: Building2, label: 'Web portal' },
  { icon: CreditCard, label: 'M-Pesa' },
  { icon: Phone, label: 'USSD' },
  { icon: Smartphone, label: 'SMS' },
  { icon: Mic, label: 'Voice' },
  { icon: MessageSquare, label: 'WhatsApp' },
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
    <div className="min-h-screen overflow-hidden bg-kodi-navy text-kodi-text-primary">
      <header className="relative overflow-hidden bg-white">
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Logo />
          <div className="hidden items-center gap-7 text-sm font-medium text-kodi-text-muted md:flex">
            <a href="#workflow" className="hover:text-kodi-accent">Workflow</a>
            <a href="#channels" className="hover:text-kodi-accent">Channels</a>
            <a href="#features" className="hover:text-kodi-accent">Features</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost">Log in</Link>
            <Link to="/login" className="btn-primary">Open Dashboard</Link>
          </div>
        </nav>

        <section className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(460px,1.1fr)] lg:items-center lg:px-8 lg:pb-24">
          <div className="space-y-8 reveal" data-reveal>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-black tracking-tight text-kodi-dark md:text-7xl">
                Rent on time. Every time.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-kodi-text-secondary md:text-xl">
                One clear place for rent, arrears, repairs, receipts, tenants, caretakers, M-Pesa, SMS, USSD, and WhatsApp.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/login" className="btn-primary px-7 py-3.5 text-base">
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#workflow" className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/15">
                See How It Works
              </a>
            </div>
          </div>

          <div className="reveal" data-reveal>
            <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-kodi-border bg-kodi-dark shadow-2xl shadow-slate-300/70">
              <img
                src={heroImage}
                alt="Apartment building in Nairobi, Kenya"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-kodi-dark via-kodi-dark/45 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                <div className="max-w-md rounded-3xl border border-white/15 bg-white/95 p-5 text-kodi-text-primary shadow-xl">
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
                      <div key={item.label} className="rounded-2xl border border-kodi-border bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kodi-accent">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-kodi-text-secondary">{item.value}</p>
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
              <article key={title} className="glass-card-hover min-h-[190px]">
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
              {capabilities.map(({ icon: Icon, title }) => (
                <div key={title} className="rounded-2xl border border-kodi-border bg-kodi-navy p-5">
                  <Icon className="h-5 w-5 text-kodi-accent" />
                  <p className="mt-4 text-sm font-bold text-kodi-dark">{title}</p>
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
              {channels.map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-2xl border border-kodi-border bg-white p-5 text-center shadow-sm">
                  <Icon className="mx-auto h-6 w-6 text-kodi-accent" />
                  <p className="mt-3 text-sm font-semibold text-kodi-text-secondary">{label}</p>
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
            ].map(([title, text]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/10 p-7">
                <CheckCircle2 className="h-6 w-6 text-kodi-emerald" />
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-blue-50">{text}</p>
              </div>
            ))}
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

      <footer className="border-t border-kodi-border bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Logo />
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-kodi-text-muted">
            {['Landlord login', 'Caretaker login', 'Tenant portal', 'Contact', 'Privacy', 'Terms', 'Support', 'FAQ'].map((item) => (
              <Link key={item} to="/login" className="hover:text-kodi-accent">{item}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

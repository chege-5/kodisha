import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Bot,
  CreditCard,
  MessageSquare,
  Mic,
  Shield,
  Sparkles,
  Workflow,
} from 'lucide-react';

const features = [
  { icon: CreditCard, title: 'Smart payments', text: 'STK Push, receipts, reconciliation, and payment tracking in one flow.' },
  { icon: MessageSquare, title: 'Communication automation', text: 'SMS, WhatsApp, email, and broadcast reminders from one queue.' },
  { icon: Mic, title: 'Voice and USSD access', text: 'Feature-phone and voice interactions for broader tenant reach.' },
  { icon: BarChart3, title: 'AI insights', text: 'Rent prediction, late-payment risk, and vacancy forecasting.' },
  { icon: BellRing, title: 'Automated alerts', text: 'Lease renewal prompts, overdue notices, and maintenance updates.' },
  { icon: Shield, title: 'Secure operations', text: 'Tokenized sessions, audit logs, and permission-aware workflows.' },
];

const workflow = [
  { step: '1', title: 'Tenant pays rent', text: 'A single Pay Now action triggers an M-Pesa STK prompt.' },
  { step: '2', title: 'System confirms payment', text: 'Callbacks update the ledger, receipt, and dashboard instantly.' },
  { step: '3', title: 'AI reacts', text: 'Kodisha sends follow-up messages and forecasts the next cycle.' },
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
      { threshold: 0.15 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

export default function Landing() {
  useReveal();

  return (
    <div className="min-h-screen overflow-hidden bg-kodi-navy text-kodi-text-primary">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-10%] h-96 w-96 rounded-full bg-kodi-accent/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-8%] h-[30rem] w-[30rem] rounded-full bg-kodi-cyan/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }} />
      </div>

      <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-kodi-accent to-kodi-cyan shadow-lg shadow-kodi-accent/30">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-[0.24em] text-white">KODISHA</span>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/login" className="btn-primary">Open app</Link>
        </div>
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 pt-10 md:pt-16">
        <section className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8" data-reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-kodi-border/60 bg-kodi-card/70 px-4 py-2 text-sm text-kodi-text-secondary backdrop-blur">
              <Sparkles className="h-4 w-4 text-kodi-accent-light" />
              AI-powered rental operations for African property teams
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                Run rentals with a premium SaaS platform built for payments, tenants, and automation.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-kodi-text-muted md:text-xl">
                Kodisha unifies rent collection, tenant lifecycle management, communication, and AI assistance across web, SMS, USSD, voice, and M-Pesa.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/login" className="btn-primary px-7 py-3.5 text-base">
                Start now <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="btn-secondary px-7 py-3.5 text-base">
                Explore platform
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Automated reminders', value: 'SMS + WhatsApp' },
                { label: 'Payment flows', value: 'M-Pesa STK Push' },
                { label: 'AI intelligence', value: 'Risk + forecast' },
              ].map((item) => (
                <div key={item.label} className="glass-card">
                  <p className="text-sm text-kodi-text-muted">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative" data-reveal>
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-kodi-accent/10 blur-3xl" />
            <div className="glass-card space-y-6 border-kodi-border/70 shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-kodi-text-muted">Live workflow</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">Tenant payment to receipt</h2>
                </div>
                <div className="rounded-2xl border border-kodi-accent/20 bg-kodi-accent/10 p-3 text-kodi-accent-light">
                  <Workflow className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-4">
                {workflow.map((item) => (
                  <div key={item.step} className="flex gap-4 rounded-2xl border border-kodi-border/60 bg-kodi-navy/35 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-kodi-accent/15 text-sm font-semibold text-kodi-accent-light">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-kodi-text-muted">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-24 space-y-8 md:mt-32" data-reveal>
          <div className="max-w-2xl">
            <p className="section-eyebrow">Platform capabilities</p>
            <h2 className="section-title mt-3">A clean operating system for property income, tenant support, and team coordination.</h2>
            <p className="section-copy mt-4">
              Every major workflow is designed to reduce manual follow-up, improve payment completion, and give each role a focused dashboard.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="glass-card-hover group p-7" data-reveal>
                <div className="mb-5 inline-flex rounded-2xl border border-kodi-border/60 bg-kodi-card/80 p-3 text-kodi-accent-light transition-transform group-hover:-translate-y-0.5">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-kodi-text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-24 grid gap-6 rounded-[2rem] border border-kodi-border/60 bg-kodi-card/50 p-8 backdrop-blur md:grid-cols-3" data-reveal>
          {[
            { title: 'Pricing', text: 'Flexible SaaS tiers for emerging and enterprise portfolios.' },
            { title: 'Testimonials', text: 'Customer stories, quantified results, and deployment notes.' },
            { title: 'Contact', text: 'Sales, support, and implementation readiness in one place.' },
          ].map((item) => (
            <div key={item.title} className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-kodi-text-muted">{item.title}</p>
              <p className="text-sm leading-7 text-kodi-text-secondary">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-24 rounded-[2rem] border border-kodi-border/60 bg-kodi-navy/35 p-8 md:p-10" data-reveal>
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="section-eyebrow">Get started</p>
              <h2 className="section-title mt-3 max-w-2xl">Build your rental operating system with Kodisha.</h2>
              <p className="section-copy mt-4 max-w-2xl">Create the account, add your API keys, run migrations, and start managing portfolios with automated communication and payments.</p>
            </div>
            <Link to="/login" className="btn-primary px-7 py-3.5 text-base">
              Open login <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-kodi-border/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 text-sm text-kodi-text-muted md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} Kodisha. AI-powered rental management SaaS.</p>
          <p>Web, SMS, USSD, voice, and M-Pesa automation in one platform.</p>
        </div>
      </footer>
    </div>
  );
}

import { ExternalLink } from 'lucide-react';

const teamMembers = [
  { name: 'Peter Maina', href: 'https://mainapeter.netlify.app', featured: true },
  { name: 'Peter Opapa', href: 'https://www.peteropapa.tech' },
  { name: 'Kihara Chege', href: 'https://jimmyhome.onrender.com/' },
];

export default function SiteFooter({ compact = false }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-kodi-border bg-white/95 text-kodi-text-muted">
      <div className={`mx-auto grid w-full max-w-7xl gap-5 px-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-8 ${compact ? 'py-5' : 'py-7'}`}>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold tracking-tight text-kodi-dark">
            Copyright &copy; {year} Trinity. All rights reserved.
          </p>
          <p className="max-w-3xl text-xs leading-5">
            Kodishaa concept, authorship, and presentation credit remain with the Trinity team.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium lg:justify-end">
          {teamMembers.map((member) => (
            <a
              key={member.name}
              href={member.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${member.name} portfolio, opens in a new tab`}
              className={`group inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 transition-all focus:outline-none focus:ring-2 focus:ring-kodi-accent/30 ${
                member.featured
                  ? 'border-kodi-accent/20 bg-kodi-accent/5 font-bold text-kodi-dark shadow-kodi-accent-5 hover:border-kodi-accent/40 hover:text-kodi-accent'
                  : 'border-transparent text-kodi-text-secondary hover:border-kodi-border hover:bg-kodi-navy hover:text-kodi-accent'
              }`}
            >
              <span>{member.name}</span>
              <ExternalLink className={`h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${member.featured ? 'text-kodi-accent' : 'text-kodi-text-muted group-hover:text-kodi-accent'}`} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/apiClient';
import toast from 'react-hot-toast';
import { Bot, Send, Sparkles, X, MessageCircle } from 'lucide-react';

const QUICK_ACTIONS = [
  'Show unpaid tenants',
  'Total collected this month',
  'Vacant units',
  'Open tickets',
  'Risky tenants',
  'Occupancy rate',
  'Collection rate',
  'Best tenants',
];

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your Kodishaa insights assistant. Ask about arrears, vacancies, tickets, payments, or risky tenants.", type: 'text' },
  ]);

  const askAI = useMutation({
    mutationFn: (q) => api.post('/insights/query', { query: q }).then((r) => r.data),
    onSuccess: (data) => {
      let content = data.message;
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        content += '\n' + data.data.map((d) =>
          Object.entries(d).map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toLocaleString('en-KE') : v}`).join(' · ')
        ).join('\n');
      }
      if (data.total !== undefined) {
        content += `\n\nTotal: KSh ${Number(data.total).toLocaleString('en-KE')}`;
      }
      if (data.suggestions) {
        content += '\n\n💡 Try: ' + data.suggestions.join(', ');
      }
      setMessages((prev) => [...prev, { role: 'assistant', content, type: data.type }]);
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that. Try rephrasing." }]);
    },
  });

  function handleSend() {
    if (!query.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    askAI.mutate(query);
    setQuery('');
  }

  function handleQuickAction(action) {
    setMessages((prev) => [...prev, { role: 'user', content: action }]);
    askAI.mutate(action);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-kodi-accent text-white shadow-2xl shadow-kodi-accent/30 flex items-center justify-center hover:scale-105 transition-all duration-200 z-50"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-3rem)] bg-kodi-dark border border-kodi-border rounded-2xl shadow-2xl shadow-black/30 flex flex-col z-50 animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-kodi-border/30 bg-kodi-card/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-kodi-accent to-kodi-cyan flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-kodi-text-primary">Kodishaa Insights</p>
            <p className="text-[10px] text-kodi-emerald">Online</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-kodi-border/20 text-kodi-text-muted hover:text-white transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
              m.role === 'user'
                ? 'bg-kodi-accent text-white rounded-br-md'
                : 'bg-kodi-card border border-kodi-border/30 text-kodi-text-primary rounded-bl-md'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {askAI.isPending && (
          <div className="flex justify-start">
            <div className="bg-kodi-card border border-kodi-border/30 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-kodi-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-kodi-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-kodi-accent animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.slice(0, 4).map((a) => (
            <button key={a} onClick={() => handleQuickAction(a)}
              className="text-[10px] px-2.5 py-1.5 rounded-lg bg-kodi-accent/10 text-kodi-accent border border-kodi-accent/20 hover:bg-kodi-accent/20 transition-all">
              {a}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-kodi-border/30">
        <div className="flex gap-2">
          <input
            className="input flex-1 py-2.5 text-sm"
            placeholder="Ask about tenants, payments…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={!query.trim() || askAI.isPending}
            className="p-2.5 rounded-xl bg-kodi-accent text-white hover:bg-kodi-accent-light transition-all disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

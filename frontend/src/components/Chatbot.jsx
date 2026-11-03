import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X, Bot } from 'lucide-react';
import { api } from '../lib/api.js';

const QUICK = [
  'Loan plans',
  'Application status',
  'Required documents',
  'Customer support',
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hi! I am the LoanLedger assistant. Ask me about loan plans, application status, required documents or customer support.',
    },
  ]);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open]);

  async function ask(question) {
    const q = question.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setBusy(true);
    try {
      const d = await api.get(`/chatbot/answer?q=${encodeURIComponent(q)}`);
      setMessages((m) => [...m, { role: 'bot', text: d.answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'bot', text: 'The assistant is unavailable right now. Please try the FAQ or Contact pages.' },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <div className="chatbot-panel" role="dialog" aria-label="Loan assistant">
          <div className="chatbot-head">
            <Bot size={22} />
            <div style={{ flex: 1 }}>
              <strong>LoanLedger Assistant</strong>
              <span>Instant answers · 24×7</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>
          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role === 'bot' ? 'msg-bot' : 'msg-user'}`}>
                {m.text}
              </div>
            ))}
            {busy && <div className="msg msg-bot">Typing…</div>}
          </div>
          <div className="chatbot-chips">
            {QUICK.map((q) => (
              <button key={q} className="chip" onClick={() => ask(q)}>
                {q}
              </button>
            ))}
          </div>
          <form
            className="chatbot-input"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              aria-label="Chat message"
            />
            <button className="btn btn-teal btn-sm" type="submit" disabled={busy} aria-label="Send">
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
      <button
        className="chatbot-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}

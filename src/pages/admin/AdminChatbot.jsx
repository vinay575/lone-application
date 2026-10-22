import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminChatbot() {
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ keywords: '', response: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/admin/chatbot').then((d) => setEntries(d.entries)).catch(() => setEntries([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/admin/chatbot', {
        keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
        response: form.response,
      });
      setForm({ keywords: '', response: '' });
      toast.success('Chatbot response added.');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (entry) => {
    if (busy) return;
    setBusy(true);
    try {
      await api.put(`/admin/chatbot/${entry.id}`, { active: !entry.active });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update the response.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entry) => {
    if (!window.confirm('Delete this chatbot response?')) return;
    try {
      await api.del(`/admin/chatbot/${entry.id}`);
      toast.success('Deleted.');
      load();
    } catch {
      toast.error('Delete failed.');
    }
  };

  return (
    <div className="fade-up">
      <h1>Chatbot Knowledge Base</h1>
      <p className="text-sm text-muted">
        The floating assistant matches visitor questions against these keyword → response rules.
      </p>
      <div className="dash-grid">
        <div style={{ display: 'grid', gap: '0.8rem' }}>
          {entries.map((entry) => (
            <div className="card" key={entry.id} style={{ padding: '1rem 1.2rem' }}>
              <div className="row between">
                <div className="row" style={{ gap: '0.35rem' }}>
                  {(entry.keywords || []).map((k) => (
                    <span key={k} className="chip" style={{ cursor: 'default' }}>{k}</span>
                  ))}
                </div>
                <div className="row" style={{ gap: '0.4rem' }}>
                  <span className={entry.active ? 'badge badge-done' : 'badge badge-draft'}>
                    {entry.active ? 'Active' : 'Off'}
                  </span>
                  <button className="btn btn-soft btn-sm" onClick={() => toggle(entry)}>
                    {entry.active ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(entry)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted mb-0" style={{ marginTop: '0.5rem' }}>{entry.response}</p>
            </div>
          ))}
        </div>
        <div className="card" style={{ alignSelf: 'start' }}>
          <h3><Plus size={16} style={{ verticalAlign: -2 }} /> Add response</h3>
          <form onSubmit={submit} style={{ display: 'grid', gap: '0.75rem' }}>
            <div className="field">
              <label htmlFor="kw">Keywords (comma separated)</label>
              <input id="kw" placeholder="emi, tenure, interest" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="resp">Bot response</label>
              <textarea id="resp" rows={4} value={form.response} onChange={(e) => setForm({ ...form, response: e.target.value })} required />
            </div>
            <button className="btn btn-teal" disabled={busy}>Add response</button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import Loader from '../../components/Loader.jsx';
import { api, ApiError } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';

const FIELDS = [
  ['name', 'Company / brand name'],
  ['tagline', 'Tagline'],
  ['email', 'Support email'],
  ['phone', 'Support phone'],
  ['supportHours', 'Support hours'],
  ['address', 'Address'],
  ['website', 'Website'],
];

export default function AdminSettings() {
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then((d) => setSettings(d.settings)).catch(() => setSettings({}));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api.put('/admin/settings', settings);
      setSettings(d.settings);
      toast.success('Settings saved. Contact pages now show these details.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  if (!settings) return <Loader />;

  return (
    <div className="fade-up">
      <h1>Settings</h1>
      <div className="dash-grid">
        <form className="card" onSubmit={save}>
          <h3>Company contact details</h3>
          <p className="text-sm text-muted">
            Shown on the Contact, Support and Footer sections.
          </p>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {FIELDS.map(([key, label]) => (
              <div className="field" key={key}>
                <label htmlFor={key}>{label}</label>
                <input
                  id={key}
                  value={settings.company?.[key] || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, company: { ...settings.company, [key]: e.target.value } })
                  }
                />
              </div>
            ))}
          </div>
          <button className="btn btn-teal mt-2" disabled={busy}>
            {busy ? 'Saving…' : 'Save settings'}
          </button>
        </form>
        <div className="card" style={{ alignSelf: 'start' }}>
          <h3>Site behaviour</h3>
          <label className="row text-sm" style={{ gap: '0.6rem', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              checked={settings.demo?.chatbotEnabled !== false}
              onChange={(e) =>
                setSettings({ ...settings, demo: { ...settings.demo, chatbotEnabled: e.target.checked } })
              }
            />
            Floating chatbot assistant enabled
          </label>
          <div className="alert alert-info">
            This instance runs in sandbox mode — payments are simulated and no live funds are
            captured.
          </div>
        </div>
      </div>
    </div>
  );
}

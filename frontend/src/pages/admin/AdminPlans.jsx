import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatINR } from '../../lib/format.js';

const EMPTY = {
  name: '',
  maxAmount: '',
  demoUnlockAmount: '',
  tenureMonths: 6,
  demoRateLabel: '',
  summary: '',
  features: '',
};

export default function AdminPlans() {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/admin/plans').then((d) => setPlans(d.plans)).catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (p) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      maxAmount: p.maxAmount,
      demoUnlockAmount: p.demoUnlockAmount,
      tenureMonths: p.tenureMonths,
      demoRateLabel: p.demoRateLabel,
      summary: p.summary,
      features: (p.features || []).join('\n'),
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      name: form.name,
      maxAmount: Number(form.maxAmount),
      demoUnlockAmount: Number(form.demoUnlockAmount),
      tenureMonths: Number(form.tenureMonths),
      demoRateLabel: form.demoRateLabel,
      summary: form.summary,
      features: form.features.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editId) {
        await api.put(`/admin/plans/${editId}`, payload);
        toast.success('Plan updated.');
      } else {
        await api.post('/admin/plans', payload);
        toast.success('Plan created.');
      }
      setForm(EMPTY);
      setEditId(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p) => {
    if (busy) return;
    setBusy(true);
    try {
      await api.put(`/admin/plans/${p.id}`, { active: !p.active });
      toast.success(p.active ? 'Plan deactivated.' : 'Plan activated.');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update the plan.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.name}? This cannot be undone.`)) return;
    try {
      await api.del(`/admin/plans/${p.id}`);
      toast.success('Plan deleted.');
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Delete failed.');
    }
  };

  return (
    <div className="fade-up">
      <h1>Loan Plans</h1>
      <p className="text-sm text-muted">
        These are the amounts, fees and labels shown to customers on the public plans section.
      </p>
      <div className="dash-grid">
        <div style={{ display: 'grid', gap: '1rem' }}>
          {plans.map((p) => (
            <div className="card" key={p.id}>
              <div className="row between">
                <div>
                  <strong>{p.name}</strong> <span className="badge badge-submitted">Plan {p.code}</span>
                  {!p.active && <span className="badge badge-draft">Inactive</span>}
                </div>
                <div className="row" style={{ gap: '0.4rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button className="btn btn-soft btn-sm" onClick={() => toggleActive(p)}>
                    {p.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="row text-sm mt-1">
                <span>Loan amount: <strong>{formatINR(p.maxAmount)}</strong></span>
                <span>Processing fee: <strong>{formatINR(p.demoUnlockAmount)}</strong></span>
                <span>Tenure: {p.tenureMonths}m</span>
              </div>
              <p className="text-sm text-muted mb-0">{p.summary}</p>
            </div>
          ))}
        </div>
        <div className="card" style={{ alignSelf: 'start' }}>
          <h3>
            {editId ? 'Edit plan' : <><Plus size={16} style={{ verticalAlign: -2 }} /> Add plan</>}
          </h3>
          <form onSubmit={submit} style={{ display: 'grid', gap: '0.75rem' }}>
            {[
              ['name', 'Plan name'],
              ['maxAmount', 'Loan amount up to (₹)'],
              ['demoUnlockAmount', 'Processing fee (₹)'],
              ['tenureMonths', 'Tenure (months)'],
              ['demoRateLabel', 'Rate label'],
            ].map(([key, label]) => (
              <div className="field" key={key}>
                <label htmlFor={key}>{label}</label>
                <input
                  id={key}
                  type={key === 'name' || key === 'demoRateLabel' ? 'text' : 'number'}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required={key !== 'demoRateLabel'}
                />
              </div>
            ))}
            <div className="field">
              <label htmlFor="summary">Summary</label>
              <textarea id="summary" rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="features">Features (one per line)</label>
              <textarea id="features" rows={4} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
            </div>
            <div className="row">
              <button className="btn btn-teal" disabled={busy}>
                {editId ? 'Save changes' : 'Create plan'}
              </button>
              {editId && (
                <button type="button" className="btn btn-ghost" onClick={() => { setEditId(null); setForm(EMPTY); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

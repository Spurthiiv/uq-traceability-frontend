import { useEffect, useState } from 'react';
import { GraduationCap, CheckCircle2, Clock, Percent, Trash2 } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';
const inputStyle = { background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white', padding: 8, borderRadius: 6 };

const EMPTY_MODULE = { name: '', role: 'ALL', description: '' };
const EMPTY_ASSIGNMENT = { moduleId: '', userId: '' };

export default function TrainingDashboard({ user }) {
  const [summary, setSummary] = useState(null);
  const [modules, setModules] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState(EMPTY_ASSIGNMENT);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/training/summary').then(r => setSummary(r.data));
    api.get('/training/modules').then(r => setModules(r.data));
    api.get('/training/completions').then(r => setCompletions(r.data));
    api.get('/auth/users').then(r => setUsers(r.data));
  };
  useEffect(() => { load(); }, []);

  const createModule = async () => {
    if (!moduleForm.name) return;
    await api.post('/training/modules', moduleForm);
    setModuleForm(EMPTY_MODULE);
    setShowModuleForm(false);
    load();
  };
  const deleteModule = async (id) => {
    if (!window.confirm('Delete this training module and all its assignments?')) return;
    await api.delete(`/training/modules/${id}`);
    load();
  };

  const createAssignment = async () => {
    setError('');
    if (!assignForm.moduleId || !assignForm.userId) return;
    try {
      await api.post('/training/completions', assignForm);
      setAssignForm(EMPTY_ASSIGNMENT);
      setShowAssignForm(false);
      load();
    } catch (err) { setError(err.response?.data?.error || 'Failed to assign'); }
  };
  const markComplete = async (id) => { await api.patch(`/training/completions/${id}/complete`); load(); };
  const deleteAssignment = async (id) => {
    if (!window.confirm('Remove this training assignment?')) return;
    await api.delete(`/training/completions/${id}`);
    load();
  };

  if (!summary) return <Layout user={user} title="Training / Performance Dashboard"><p style={{ color: '#cfd6e0' }}>Loading...</p></Layout>;

  const statTile = (label, value, Icon, color) => (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color="white" />
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>{value}</div>
        <div style={{ fontSize: 11, color: '#8b96a8' }}>{label}</div>
      </div>
    </div>
  );

  const sectionCard = (title, action, children) => (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <strong style={{ color: 'white', fontSize: 14 }}>{title}</strong>
        {action}
      </div>
      {children}
    </div>
  );

  return (
    <Layout user={user} title="Training / Performance Dashboard">
      <div style={{ color: '#8b96a8', fontSize: 11, marginTop: -12, marginBottom: 16, fontStyle: 'italic' }}>
        BRD Section 34.4 — tracks real training-module completion per person. Assigning training here doesn't automatically block account activation elsewhere in the app; it's a visibility/tracking tool.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        {statTile('Modules', summary.totalModules, GraduationCap, '#7b5fd6')}
        {statTile('Total Assignments', summary.totalAssignments, GraduationCap, '#3b82c4')}
        {statTile('Completed', summary.completed, CheckCircle2, '#4fd18b')}
        {statTile('Pending', summary.pending, Clock, GOLD)}
        {statTile('Completion Rate', `${summary.completionRate}%`, Percent, '#2e7d5f')}
      </div>

      {summary.byRole.length > 0 && sectionCard('Completion by Role', null, (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {summary.byRole.map(r => (
            <span key={r.role} style={{ background: '#243044', color: '#cfd6e0', padding: '6px 14px', borderRadius: 20, fontSize: 13 }}>
              {r.role}: {r.completed}/{r.total} ({r.total ? Math.round((r.completed / r.total) * 100) : 0}%)
            </span>
          ))}
        </div>
      ))}

      {sectionCard('Training Modules',
        <button onClick={() => setShowModuleForm(!showModuleForm)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>+ New Module</button>,
        <>
          {showModuleForm && (
            <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input placeholder="Module name (e.g. Food Safety Basics)" value={moduleForm.name} style={{ ...inputStyle, flex: '1 1 220px' }} onChange={e => setModuleForm({ ...moduleForm, name: e.target.value })} />
              <select value={moduleForm.role} style={inputStyle} onChange={e => setModuleForm({ ...moduleForm, role: e.target.value })}>
                <option value="ALL">All roles</option>
                <option value="QUEEN">Queen Seller</option>
                <option value="LOGISTICS">Rider</option>
                <option value="OPS">Ops / Local Admin</option>
                <option value="RETAILER">Retailer</option>
              </select>
              <input placeholder="Description (optional)" value={moduleForm.description} style={{ ...inputStyle, flex: '1 1 220px' }} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} />
              <button onClick={createModule} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Create Module</button>
            </div>
          )}
          {modules.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No training modules yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead><tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}><th style={{ padding: '8px 8px 8px 0' }}>Name</th><th>Target Role</th><th>Assignments</th><th></th></tr></thead>
              <tbody>
                {modules.map(m => (
                  <tr key={m.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0', color: 'white' }}>{m.name}</td>
                    <td>{m.role}</td>
                    <td>{m.assignment_count}</td>
                    <td><button onClick={() => deleteModule(m.id)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {sectionCard('Assignments',
        <button onClick={() => setShowAssignForm(!showAssignForm)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>+ Assign Training</button>,
        <>
          {showAssignForm && (
            <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <select value={assignForm.moduleId} style={inputStyle} onChange={e => setAssignForm({ ...assignForm, moduleId: e.target.value })}>
                <option value="">Select module…</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select value={assignForm.userId} style={inputStyle} onChange={e => setAssignForm({ ...assignForm, userId: e.target.value })}>
                <option value="">Select person…</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
              <button onClick={createAssignment} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Assign</button>
              {error && <div style={{ color: '#e0708e', fontSize: 12, width: '100%' }}>{error}</div>}
            </div>
          )}
          {completions.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No assignments yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead><tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}><th style={{ padding: '8px 8px 8px 0' }}>Person</th><th>Role</th><th>Module</th><th>Status</th><th>Completed</th><th></th></tr></thead>
              <tbody>
                {completions.map(c => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0', color: 'white' }}>{c.user_name}</td>
                    <td>{c.user_role}</td>
                    <td>{c.module_name}</td>
                    <td>
                      <span style={{
                        background: c.status === 'completed' ? 'rgba(46,125,95,0.15)' : 'rgba(201,165,69,0.15)',
                        color: c.status === 'completed' ? '#4fd18b' : GOLD,
                        padding: '3px 10px', borderRadius: 12, fontSize: 12, textTransform: 'capitalize'
                      }}>{c.status}</span>
                    </td>
                    <td style={{ color: '#8b96a8', fontSize: 12 }}>{c.completed_at ? c.completed_at.slice(0, 10) : '—'}</td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      {c.status !== 'completed' && (
                        <button onClick={() => markComplete(c.id)} style={{ background: 'none', border: 'none', color: '#4fd18b', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>Mark Complete</button>
                      )}
                      <button onClick={() => deleteAssignment(c.id)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </Layout>
  );
}

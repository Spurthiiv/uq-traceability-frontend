import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Shield, Briefcase, Crown, Store, Bike, Eye, Pencil, Power } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

const ROLES = ['ADMIN', 'OPS', 'QUEEN', 'RETAILER', 'LOGISTICS'];

const ROLE_DESCRIPTIONS = {
  ADMIN: 'Full system access',
  OPS: 'Supply chain, orders, quality, operations',
  QUEEN: 'Own products, batches and seller operations',
  RETAILER: 'Retail and order-related access',
  LOGISTICS: 'Delivery and shipment access',
};

// Mirrors the actual roles arrays in Layout.jsx's navItems — this is the real
// enforced navigation access, not a separate/fictional permissions system.
const PERMISSIONS = [
  { module: 'Dashboard', roles: ['ADMIN', 'OPS', 'QUEEN', 'RETAILER', 'LOGISTICS'] },
  { module: 'Supply Chain', roles: ['ADMIN', 'OPS'] },
  { module: 'Blockchain Ledger', roles: ['ADMIN', 'OPS'] },
  { module: 'Products & Batches', roles: ['ADMIN', 'OPS', 'QUEEN'] },
  { module: 'Quality & Compliance', roles: ['ADMIN', 'OPS'] },
  { module: 'Finance & Settlements', roles: ['ADMIN', 'OPS'] },
  { module: 'Reports & Analytics', roles: ['ADMIN'] },
  { module: 'Users & Roles', roles: ['ADMIN'] },
  { module: 'Settings', roles: ['ADMIN'] },
];

const EMPTY_FORM = { name: '', email: '', organization: 'FCMCSL', role: 'QUEEN', phone: '', status: 'active' };

export default function UsersRoles({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addError, setAddError] = useState('');
  const [tempPassword, setTempPassword] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [viewingUser, setViewingUser] = useState(null);

  const load = () => api.get('/auth/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const createUser = async () => {
    setAddError('');
    if (!addForm.name || !addForm.email) return setAddError('Name and email are required');
    try {
      const res = await api.post('/auth/users', addForm);
      setTempPassword(res.data.temporaryPassword);
      setAddForm(EMPTY_FORM);
      setShowAddForm(false);
      load();
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditForm({ name: u.name, email: u.email, organization: u.organization, role: u.role, phone: u.phone || '', status: u.status || 'active' });
    setViewingUser(null);
  };

  const saveEdit = async (id) => {
    await api.patch(`/auth/users/${id}`, editForm);
    setEditingId(null);
    load();
  };

  const toggleStatus = async (u) => {
    const newStatus = u.status === 'inactive' ? 'active' : 'inactive';
    if (!window.confirm(`${newStatus === 'active' ? 'Activate' : 'Deactivate'} ${u.name}?`)) return;
    await api.patch(`/auth/users/${u.id}`, { status: newStatus });
    load();
  };

  const roleCounts = ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {});
  const activeCount = users.filter(u => (u.status || 'active') === 'active').length;

  const statTile = (label, value, Icon, color) => (
    <div style={{
      background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10,
      padding: 16, flex: '1 1 150px', display: 'flex', alignItems: 'center', gap: 12
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color="white" />
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>{value}</div>
        <div style={{ fontSize: 11, color: '#8b96a8' }}>{label}</div>
      </div>
    </div>
  );

  const inputStyle = { background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white', padding: 8, borderRadius: 6 };

  return (
    <Layout user={user} onLogout={onLogout} title="Users & Roles">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        {statTile('Total Users', users.length, Users, '#7b5fd6')}
        {statTile('Active', activeCount, UserCheck, '#2e7d5f')}
        {statTile('Inactive', users.length - activeCount, UserX, '#c4443b')}
        {statTile('Admins', roleCounts.ADMIN, Shield, '#e0a336')}
        {statTile('Operations', roleCounts.OPS, Briefcase, '#3b82c4')}
        {statTile('Queen Sellers', roleCounts.QUEEN, Crown, '#a855c7')}
        {statTile('Retailers', roleCounts.RETAILER, Store, '#d6336c')}
        {statTile('Logistics', roleCounts.LOGISTICS, Bike, '#3b82c4')}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => { setShowAddForm(!showAddForm); setTempPassword(null); }} style={{
          background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6,
          padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold'
        }}>+ Add User</button>
      </div>

      {tempPassword && (
        <div style={{ background: 'rgba(46,125,95,0.15)', border: '1px solid #2e7d5f', borderRadius: 8, padding: 14, marginBottom: 16, color: '#4fd18b', fontSize: 13 }}>
          User created. Temporary password: <strong style={{ fontFamily: 'monospace' }}>{tempPassword}</strong> — share this with them; there's no email invite system yet, so they'll need it to log in.
        </div>
      )}

      {showAddForm && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <input placeholder="Full name" value={addForm.name} style={inputStyle} onChange={e => setAddForm({ ...addForm, name: e.target.value })} />
            <input placeholder="Email" value={addForm.email} style={inputStyle} onChange={e => setAddForm({ ...addForm, email: e.target.value })} />
            <input placeholder="Organization" value={addForm.organization} style={inputStyle} onChange={e => setAddForm({ ...addForm, organization: e.target.value })} />
            <select value={addForm.role} style={inputStyle} onChange={e => setAddForm({ ...addForm, role: e.target.value })}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input placeholder="Phone (optional)" value={addForm.phone} style={inputStyle} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} />
            <select value={addForm.status} style={inputStyle} onChange={e => setAddForm({ ...addForm, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button onClick={createUser} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Create User</button>
          </div>
          {addError && <div style={{ color: '#e0708e', fontSize: 12, marginTop: 8 }}>{addError}</div>}
        </div>
      )}

      {viewingUser && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ color: 'white', fontSize: 15 }}>{viewingUser.name}</strong>
            <button onClick={() => setViewingUser(null)} style={{ background: 'none', border: 'none', color: '#8b96a8', cursor: 'pointer', fontSize: 13 }}>Close</button>
          </div>
          <div style={{ fontSize: 13, color: '#cfd6e0', lineHeight: 2 }}>
            Email: <strong>{viewingUser.email}</strong><br />
            Organization: <strong>{viewingUser.organization}</strong><br />
            Role: <strong>{viewingUser.role}</strong><br />
            Status: <strong style={{ textTransform: 'capitalize' }}>{viewingUser.status || 'active'}</strong><br />
            Phone: <strong>{viewingUser.phone || '—'}</strong><br />
            Joined: <strong>{viewingUser.created_at}</strong>
          </div>
          <div style={{ fontSize: 11, color: '#5a6578', marginTop: 8, fontStyle: 'italic' }}>
            Last activity and associated seller/hub info aren't tracked in the current schema.
          </div>
        </div>
      )}

      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <strong style={{ color: 'white' }}>Team Members</strong>
        {users.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No users yet</div>
        ) : (
          <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                <th style={{ padding: '10px 8px' }}>Name</th>
                <th>Email</th>
                <th>Organization</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  {editingId === u.id ? (
                    <>
                      <td style={{ padding: '10px 8px' }}><input value={editForm.name} style={inputStyle} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></td>
                      <td style={{ color: '#5a6578' }}>{u.email}</td>
                      <td><input value={editForm.organization} style={inputStyle} onChange={e => setEditForm({ ...editForm, organization: e.target.value })} /></td>
                      <td>
                        <select value={editForm.role} style={inputStyle} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td>
                        <select value={editForm.status} style={inputStyle} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td style={{ color: '#5a6578' }}>{u.created_at}</td>
                      <td>
                        <button onClick={() => saveEdit(u.id)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, marginRight: 6 }}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{ background: 'none', border: `1px solid ${BORDER}`, color: '#cfd6e0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '10px 8px' }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.organization}</td>
                      <td>{u.role}</td>
                      <td>
                        <span style={{
                          background: (u.status || 'active') === 'active' ? 'rgba(46,125,95,0.15)' : 'rgba(198,40,40,0.15)',
                          color: (u.status || 'active') === 'active' ? '#4fd18b' : '#e0708e',
                          padding: '3px 10px', borderRadius: 12, fontSize: 12, textTransform: 'capitalize'
                        }}>{u.status || 'active'}</span>
                      </td>
                      <td style={{ color: '#8b96a8' }}>{u.created_at}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setViewingUser(u)} title="View" style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', display: 'flex' }}><Eye size={15} /></button>
                          <button onClick={() => startEdit(u)} title="Edit" style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', display: 'flex' }}><Pencil size={15} /></button>
                          <button onClick={() => toggleStatus(u)} title="Activate/Deactivate" style={{ background: 'none', border: 'none', color: (u.status || 'active') === 'active' ? '#e0708e' : '#4fd18b', cursor: 'pointer', display: 'flex' }}><Power size={15} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <strong style={{ color: 'white' }}>Roles</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
          {ROLES.map(r => (
            <div key={r} style={{ flex: '1 1 180px', background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12 }}>
              <div style={{ color: GOLD, fontWeight: 'bold', fontSize: 13 }}>{r}</div>
              <div style={{ color: '#8b96a8', fontSize: 12, marginTop: 4 }}>{ROLE_DESCRIPTIONS[r]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20 }}>
        <strong style={{ color: 'white' }}>Role Permissions</strong>
        <div style={{ fontSize: 11, color: '#5a6578', marginTop: 4, marginBottom: 14, fontStyle: 'italic' }}>
          This reflects the app's actual role-based navigation access (Layout.jsx) — not a separate permission system.
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
              <th style={{ padding: '8px 8px 8px 0' }}>Module</th>
              {ROLES.map(r => <th key={r} style={{ textAlign: 'center' }}>{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map(p => (
              <tr key={p.module} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ padding: '8px 8px 8px 0' }}>{p.module}</td>
                {ROLES.map(r => (
                  <td key={r} style={{ textAlign: 'center', color: p.roles.includes(r) ? '#4fd18b' : '#5a6578' }}>
                    {p.roles.includes(r) ? '✓' : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

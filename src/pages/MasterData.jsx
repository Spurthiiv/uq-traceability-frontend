import { useEffect, useState } from 'react';
import { Trash2, MapPin, Building2, Tag, Ticket, Pencil, Percent, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

const inputStyle = { background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white', padding: 8, borderRadius: 6 };

const TABS = [
  { key: 'zones', label: 'Zones & Wards', singular: 'Zone', Icon: MapPin },
  { key: 'hubs', label: 'Hubs', singular: 'Hub', Icon: Building2 },
  { key: 'categories', label: 'Categories', singular: 'Category', Icon: Tag },
  { key: 'coupons', label: 'Coupons', singular: 'Coupon', Icon: Ticket },
  { key: 'pricing-rules', label: 'Pricing Rules', singular: 'Rule', Icon: Percent },
];

const ZONE_LEVELS = ['micro', 'ward', 'cluster', 'district'];
const ZONE_STATUSES = ['draft', 'pilot', 'active', 'saturated', 'frozen'];
const STATUS_COLOR = { draft: '#8b96a8', pilot: '#3b82c4', active: '#4fd18b', saturated: GOLD, frozen: '#e0708e' };

export default function MasterData({ user, onLogout }) {
  const [tab, setTab] = useState('zones');
  const [zones, setZones] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [zoneForm, setZoneForm] = useState({ name: '', zoneLevel: 'ward', parentZoneId: '', status: 'draft' });
  const [hubForm, setHubForm] = useState({ name: '', zoneId: '', address: '', status: 'active' });
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percent', discountValue: '', validFrom: '', validTo: '', usageLimit: '' });
  const [error, setError] = useState('');
  const [editingHubId, setEditingHubId] = useState(null);
  const [hubEditForm, setHubEditForm] = useState(null);
  const [commissionRules, setCommissionRules] = useState([]);
  const [bulkRules, setBulkRules] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCommissionForm, setShowCommissionForm] = useState(false);
  const [commissionForm, setCommissionForm] = useState({ scope: 'hub', hubName: '', sellerName: '', commissionPercent: '' });
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkForm, setBulkForm] = useState({ targetType: 'product', productName: '', category: '', minQuantity: '', discountPercent: '' });
  const [pricingError, setPricingError] = useState('');

  const load = () => {
    api.get('/master-data/zones').then(r => setZones(r.data));
    api.get('/master-data/hubs').then(r => setHubs(r.data));
    api.get('/master-data/categories').then(r => setCategories(r.data));
    api.get('/coupons').then(r => setCoupons(r.data));
    api.get('/pricing-rules/commission-rules').then(r => setCommissionRules(r.data));
    api.get('/pricing-rules/bulk-pricing-rules').then(r => setBulkRules(r.data));
    api.get('/products').then(r => setProducts(r.data));
  };
  useEffect(() => { load(); }, []);

  const createZone = async () => {
    if (!zoneForm.name) return;
    await api.post('/master-data/zones', zoneForm);
    setZoneForm({ name: '', zoneLevel: 'ward', parentZoneId: '', status: 'draft' });
    setShowForm(false);
    load();
  };
  const updateZoneStatus = async (id, status) => { await api.patch(`/master-data/zones/${id}/status`, { status }); load(); };
  const updateZoneParent = async (id, parentZoneId) => { await api.patch(`/master-data/zones/${id}`, { parentZoneId }); load(); };
  const deleteZone = async (id, name) => {
    if (!window.confirm(`Delete zone "${name}"?`)) return;
    try { await api.delete(`/master-data/zones/${id}`); load(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to delete'); }
  };

  const createHub = async () => {
    if (!hubForm.name) return;
    await api.post('/master-data/hubs', hubForm);
    setHubForm({ name: '', zoneId: '', address: '', status: 'active' });
    setShowForm(false);
    load();
  };
  const updateHubStatus = async (id, status) => { await api.patch(`/master-data/hubs/${id}/status`, { status }); load(); };
  const startEditHub = (h) => { setEditingHubId(h.id); setHubEditForm({ name: h.name, zoneId: h.zone_id || '', address: h.address || '' }); };
  const saveHubEdit = async (id) => { await api.patch(`/master-data/hubs/${id}`, hubEditForm); setEditingHubId(null); load(); };
  const deleteHub = async (id, name) => {
    if (!window.confirm(`Delete hub "${name}"?`)) return;
    await api.delete(`/master-data/hubs/${id}`);
    load();
  };

  const createCategory = async () => {
    if (!categoryForm.name) return;
    setError('');
    try {
      await api.post('/master-data/categories', categoryForm);
      setCategoryForm({ name: '' });
      setShowForm(false);
      load();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create'); }
  };
  const deleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    await api.delete(`/master-data/categories/${id}`);
    load();
  };

  const createCoupon = async () => {
    if (!couponForm.code || !couponForm.discountValue) return;
    setError('');
    try {
      await api.post('/coupons', couponForm);
      setCouponForm({ code: '', discountType: 'percent', discountValue: '', validFrom: '', validTo: '', usageLimit: '' });
      setShowForm(false);
      load();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create'); }
  };
  const toggleCouponStatus = async (c) => { await api.patch(`/coupons/${c.id}/status`, { status: c.status === 'active' ? 'inactive' : 'active' }); load(); };
  const deleteCoupon = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    await api.delete(`/coupons/${id}`);
    load();
  };

  const createCommissionRule = async () => {
    setPricingError('');
    if (commissionForm.scope === 'hub' && !commissionForm.hubName) return;
    if (commissionForm.scope === 'seller' && !commissionForm.sellerName) return;
    if (commissionForm.commissionPercent === '') return;
    try {
      await api.post('/pricing-rules/commission-rules', commissionForm);
      setCommissionForm({ scope: 'hub', hubName: '', sellerName: '', commissionPercent: '' });
      setShowCommissionForm(false);
      load();
    } catch (err) { setPricingError(err.response?.data?.error || 'Failed to create rule'); }
  };
  const toggleCommissionRule = async (r) => { await api.patch(`/pricing-rules/commission-rules/${r.id}/status`, { status: r.status === 'active' ? 'inactive' : 'active' }); load(); };
  const deleteCommissionRule = async (id) => {
    if (!window.confirm('Delete this commission rule?')) return;
    await api.delete(`/pricing-rules/commission-rules/${id}`);
    load();
  };

  const createBulkRule = async () => {
    setPricingError('');
    const { targetType, productName, category, minQuantity, discountPercent } = bulkForm;
    if (targetType === 'product' && !productName) return;
    if (targetType === 'category' && !category) return;
    if (!minQuantity || !discountPercent) return;
    try {
      await api.post('/pricing-rules/bulk-pricing-rules', {
        productName: targetType === 'product' ? productName : null,
        category: targetType === 'category' ? category : null,
        minQuantity, discountPercent,
      });
      setBulkForm({ targetType: 'product', productName: '', category: '', minQuantity: '', discountPercent: '' });
      setShowBulkForm(false);
      load();
    } catch (err) { setPricingError(err.response?.data?.error || 'Failed to create rule'); }
  };
  const toggleBulkRule = async (r) => { await api.patch(`/pricing-rules/bulk-pricing-rules/${r.id}/status`, { status: r.status === 'active' ? 'inactive' : 'active' }); load(); };
  const deleteBulkRule = async (id) => {
    if (!window.confirm('Delete this bulk pricing rule?')) return;
    await api.delete(`/pricing-rules/bulk-pricing-rules/${id}`);
    load();
  };

  const statusBadge = (status) => (
    <span style={{ background: `${STATUS_COLOR[status] || GOLD}22`, color: STATUS_COLOR[status] || GOLD, padding: '3px 10px', borderRadius: 12, fontSize: 12, textTransform: 'capitalize' }}>{status}</span>
  );

  return (
    <Layout user={user} onLogout={onLogout} title="Master Data">
      <div style={{ color: '#8b96a8', fontSize: 11, marginTop: -12, marginBottom: 16, fontStyle: 'italic' }}>
        BRD Section 7.6 (ADM-01 / ADM-03) — zones, hubs, catalog categories and promotions as managed master data.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setShowForm(false); setError(''); }} style={{
              padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: tab === t.key ? GOLD : '#243044', color: tab === t.key ? '#1a2332' : '#cfd6e0',
              fontWeight: tab === t.key ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: 6
            }}><t.Icon size={14} /> {t.label}</button>
          ))}
        </div>
        {tab !== 'pricing-rules' && (
          <button onClick={() => setShowForm(!showForm)} style={{
            background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold'
          }}>+ New {TABS.find(t => t.key === tab).singular}</button>
        )}
      </div>

      {showForm && tab === 'zones' && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input placeholder="Zone name" value={zoneForm.name} style={inputStyle} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} />
          <select value={zoneForm.zoneLevel} style={inputStyle} onChange={e => setZoneForm({ ...zoneForm, zoneLevel: e.target.value })}>
            {ZONE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={zoneForm.parentZoneId} style={inputStyle} onChange={e => setZoneForm({ ...zoneForm, parentZoneId: e.target.value })}>
            <option value="">No parent zone</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <select value={zoneForm.status} style={inputStyle} onChange={e => setZoneForm({ ...zoneForm, status: e.target.value })}>
            {ZONE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={createZone} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Create Zone</button>
        </div>
      )}

      {showForm && tab === 'hubs' && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input placeholder="Hub name" value={hubForm.name} style={inputStyle} onChange={e => setHubForm({ ...hubForm, name: e.target.value })} />
          <select value={hubForm.zoneId} style={inputStyle} onChange={e => setHubForm({ ...hubForm, zoneId: e.target.value })}>
            <option value="">No zone assigned</option>
            {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
          <input placeholder="Address" value={hubForm.address} style={{ ...inputStyle, flex: '1 1 200px' }} onChange={e => setHubForm({ ...hubForm, address: e.target.value })} />
          <button onClick={createHub} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Create Hub</button>
        </div>
      )}

      {showForm && tab === 'categories' && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input placeholder="Category name" value={categoryForm.name} style={inputStyle} onChange={e => setCategoryForm({ name: e.target.value })} />
          <button onClick={createCategory} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Create Category</button>
          {error && <div style={{ color: '#e0708e', fontSize: 12, width: '100%' }}>{error}</div>}
        </div>
      )}

      {showForm && tab === 'coupons' && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input placeholder="Coupon code" value={couponForm.code} style={inputStyle} onChange={e => setCouponForm({ ...couponForm, code: e.target.value })} />
          <select value={couponForm.discountType} style={inputStyle} onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value })}>
            <option value="percent">% off</option>
            <option value="flat">₹ flat off</option>
          </select>
          <input placeholder="Discount value" type="number" value={couponForm.discountValue} style={inputStyle} onChange={e => setCouponForm({ ...couponForm, discountValue: e.target.value })} />
          <input type="date" value={couponForm.validFrom} style={inputStyle} onChange={e => setCouponForm({ ...couponForm, validFrom: e.target.value })} />
          <input type="date" value={couponForm.validTo} style={inputStyle} onChange={e => setCouponForm({ ...couponForm, validTo: e.target.value })} />
          <input placeholder="Usage limit (optional)" type="number" value={couponForm.usageLimit} style={inputStyle} onChange={e => setCouponForm({ ...couponForm, usageLimit: e.target.value })} />
          <button onClick={createCoupon} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Create Coupon</button>
          {error && <div style={{ color: '#e0708e', fontSize: 12, width: '100%' }}>{error}</div>}
        </div>
      )}

      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20 }}>
        {tab === 'zones' && (
          zones.length === 0 ? <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No zones yet</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '10px 8px 10px 0' }}>Name</th><th>Level</th><th>Parent Zone</th><th>Hubs</th><th>Status</th><th></th><th></th>
                </tr>
              </thead>
              <tbody>
                {zones.map(z => (
                  <tr key={z.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '10px 8px 10px 0', color: 'white' }}>{z.name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{z.zone_level}</td>
                    <td>
                      <select value={z.parent_zone_id || ''} onChange={e => updateZoneParent(z.id, e.target.value)} style={{ ...inputStyle, padding: '4px 8px', fontSize: 12 }}>
                        <option value="">No parent zone</option>
                        {zones.filter(p => p.id !== z.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td>{z.hub_count}</td>
                    <td>{statusBadge(z.status)}</td>
                    <td>
                      <select value={z.status} onChange={e => updateZoneStatus(z.id, e.target.value)} style={{ ...inputStyle, padding: '4px 8px', fontSize: 12 }}>
                        {ZONE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td><button onClick={() => deleteZone(z.id, z.name)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'hubs' && (
          hubs.length === 0 ? <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No hubs yet</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '10px 8px 10px 0' }}>Name</th><th>Zone</th><th>Address</th><th>Status</th><th></th><th></th><th></th>
                </tr>
              </thead>
              <tbody>
                {hubs.map(h => editingHubId === h.id ? (
                  <tr key={h.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '10px 8px 10px 0' }}>
                      <input value={hubEditForm.name} style={{ ...inputStyle, padding: '4px 8px', fontSize: 12, width: 120 }} onChange={e => setHubEditForm({ ...hubEditForm, name: e.target.value })} />
                    </td>
                    <td>
                      <select value={hubEditForm.zoneId} onChange={e => setHubEditForm({ ...hubEditForm, zoneId: e.target.value })} style={{ ...inputStyle, padding: '4px 8px', fontSize: 12 }}>
                        <option value="">No zone assigned</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <input value={hubEditForm.address} style={{ ...inputStyle, padding: '4px 8px', fontSize: 12, width: 140 }} onChange={e => setHubEditForm({ ...hubEditForm, address: e.target.value })} />
                    </td>
                    <td>{statusBadge(h.status)}</td>
                    <td colSpan={2} style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => saveHubEdit(h.id)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}>Save</button>
                      <button onClick={() => setEditingHubId(null)} style={{ background: '#243044', color: '#cfd6e0', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={h.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '10px 8px 10px 0', color: 'white' }}>{h.name}</td>
                    <td style={{ color: '#8b96a8' }}>
                      {h.zone_name || '—'}
                      {h.withinZone === false && (
                        <span title={`${h.distanceFromZoneKm} km from "${h.zone_name}"'s center — outside its geofence radius`} style={{ color: '#e0708e', marginLeft: 6, display: 'inline-flex', verticalAlign: 'middle' }}>
                          <AlertTriangle size={13} />
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#8b96a8' }}>{h.address || '—'}</td>
                    <td>{statusBadge(h.status)}</td>
                    <td>
                      <select value={h.status} onChange={e => updateHubStatus(h.id, e.target.value)} style={{ ...inputStyle, padding: '4px 8px', fontSize: 12 }}>
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                      </select>
                    </td>
                    <td><button onClick={() => startEditHub(h)} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', display: 'flex' }}><Pencil size={14} /></button></td>
                    <td><button onClick={() => deleteHub(h.id, h.name)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'categories' && (
          categories.length === 0 ? <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No categories yet</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '10px 8px 10px 0' }}>Name</th><th>Products Using It</th><th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '10px 8px 10px 0', color: 'white' }}>{c.name}</td>
                    <td>{c.product_count}</td>
                    <td><button onClick={() => deleteCategory(c.id, c.name)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'coupons' && (
          coupons.length === 0 ? <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No coupons yet</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '10px 8px 10px 0' }}>Code</th><th>Discount</th><th>Valid</th><th>Usage</th><th>Status</th><th></th><th></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '10px 8px 10px 0', fontFamily: 'monospace', color: 'white' }}>{c.code}</td>
                    <td>{c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                    <td style={{ color: '#8b96a8', fontSize: 12 }}>{c.valid_from || '—'} → {c.valid_to || '—'}</td>
                    <td>{c.times_used}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                    <td>{statusBadge(c.status)}</td>
                    <td>
                      <button onClick={() => toggleCouponStatus(c)} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>
                        {c.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                    <td><button onClick={() => deleteCoupon(c.id, c.code)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'pricing-rules' && (
          <>
            <div style={{ color: '#8b96a8', fontSize: 11, marginBottom: 16, fontStyle: 'italic' }}>
              BRD ADM-05 — a commission rule overrides the settings-wide default % for one hub or Queen seller when a settlement is created for them. A bulk pricing rule is an always-on quantity discount (no code), applied automatically at order creation and stacked before any coupon.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ color: 'white', fontSize: 14 }}>Commission Rules</strong>
              <button onClick={() => setShowCommissionForm(!showCommissionForm)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>+ New Commission Rule</button>
            </div>
            {showCommissionForm && (
              <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <select value={commissionForm.scope} style={inputStyle} onChange={e => setCommissionForm({ ...commissionForm, scope: e.target.value, hubName: '', sellerName: '' })}>
                  <option value="hub">Hub</option>
                  <option value="seller">Queen Seller</option>
                </select>
                {commissionForm.scope === 'hub' ? (
                  <>
                    <input list="pricing-hub-names" placeholder="Hub name" value={commissionForm.hubName} style={inputStyle} onChange={e => setCommissionForm({ ...commissionForm, hubName: e.target.value })} />
                    <datalist id="pricing-hub-names">{hubs.map(h => <option key={h.id} value={h.name} />)}</datalist>
                  </>
                ) : (
                  <input placeholder="Queen Seller name" value={commissionForm.sellerName} style={inputStyle} onChange={e => setCommissionForm({ ...commissionForm, sellerName: e.target.value })} />
                )}
                <input placeholder="Commission %" type="number" value={commissionForm.commissionPercent} style={inputStyle} onChange={e => setCommissionForm({ ...commissionForm, commissionPercent: e.target.value })} />
                <button onClick={createCommissionRule} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Create Rule</button>
                {pricingError && <div style={{ color: '#e0708e', fontSize: 12, width: '100%' }}>{pricingError}</div>}
              </div>
            )}
            {commissionRules.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No commission rules yet — settlements use the settings-wide default %</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13, marginBottom: 24 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                    <th style={{ padding: '10px 8px 10px 0' }}>Scope</th><th>Target</th><th>Commission %</th><th>Status</th><th></th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {commissionRules.map(r => (
                    <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '10px 8px 10px 0', textTransform: 'capitalize' }}>{r.scope}</td>
                      <td style={{ color: 'white' }}>{r.scope === 'hub' ? r.hub_name : r.seller_name}</td>
                      <td>{r.commission_percent}%</td>
                      <td>{statusBadge(r.status)}</td>
                      <td>
                        <button onClick={() => toggleCommissionRule(r)} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>
                          {r.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                      <td><button onClick={() => deleteCommissionRule(r.id)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderTop: `1px solid ${BORDER}`, paddingTop: 20 }}>
              <strong style={{ color: 'white', fontSize: 14 }}>Bulk / Tiered Pricing</strong>
              <button onClick={() => setShowBulkForm(!showBulkForm)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>+ New Bulk Rule</button>
            </div>
            {showBulkForm && (
              <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <select value={bulkForm.targetType} style={inputStyle} onChange={e => setBulkForm({ ...bulkForm, targetType: e.target.value, productName: '', category: '' })}>
                  <option value="product">Specific product</option>
                  <option value="category">Whole category</option>
                </select>
                {bulkForm.targetType === 'product' ? (
                  <select value={bulkForm.productName} style={inputStyle} onChange={e => setBulkForm({ ...bulkForm, productName: e.target.value })}>
                    <option value="">Select product…</option>
                    {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                ) : (
                  <select value={bulkForm.category} style={inputStyle} onChange={e => setBulkForm({ ...bulkForm, category: e.target.value })}>
                    <option value="">Select category…</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                )}
                <input placeholder="Min quantity" type="number" value={bulkForm.minQuantity} style={inputStyle} onChange={e => setBulkForm({ ...bulkForm, minQuantity: e.target.value })} />
                <input placeholder="Discount %" type="number" value={bulkForm.discountPercent} style={inputStyle} onChange={e => setBulkForm({ ...bulkForm, discountPercent: e.target.value })} />
                <button onClick={createBulkRule} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Create Rule</button>
                {pricingError && <div style={{ color: '#e0708e', fontSize: 12, width: '100%' }}>{pricingError}</div>}
              </div>
            )}
            {bulkRules.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No bulk pricing rules yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                    <th style={{ padding: '10px 8px 10px 0' }}>Target</th><th>Min Quantity</th><th>Discount %</th><th>Status</th><th></th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {bulkRules.map(r => (
                    <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '10px 8px 10px 0', color: 'white' }}>{r.product_name || `${r.category} (category)`}</td>
                      <td>{r.min_quantity}</td>
                      <td>{r.discount_percent}%</td>
                      <td>{statusBadge(r.status)}</td>
                      <td>
                        <button onClick={() => toggleBulkRule(r)} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>
                          {r.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                      <td><button onClick={() => deleteBulkRule(r.id)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

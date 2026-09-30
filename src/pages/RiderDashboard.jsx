import { useEffect, useState } from 'react';
import { Bike, CheckCircle2, IndianRupee, Power } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';
const inputStyle = { background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white', padding: 8, borderRadius: 6 };

export default function RiderDashboard({ user }) {
  const [riders, setRiders] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [data, setData] = useState(null);

  const loadRiders = () => api.get('/role-view/riders').then(r => {
    setRiders(r.data);
    if (r.data.length > 0 && !selectedId) { setSelectedId(r.data[0].id); setSelectedName(r.data[0].name); }
  });
  useEffect(() => { loadRiders(); }, []);

  useEffect(() => {
    if (selectedName) api.get(`/role-view/rider/${encodeURIComponent(selectedName)}`).then(r => setData(r.data));
  }, [selectedName]);

  const toggleOnline = async () => {
    await api.patch(`/role-view/rider/${selectedId}/online-status`, { isOnline: !data.isOnline });
    api.get(`/role-view/rider/${encodeURIComponent(selectedName)}`).then(r => setData(r.data));
    loadRiders();
  };

  const onSelect = (id) => {
    const r = riders.find(x => x.id === id);
    setSelectedId(id);
    setSelectedName(r ? r.name : '');
  };

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

  const sectionCard = (title, children) => (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
      <strong style={{ color: 'white', fontSize: 14 }}>{title}</strong>
      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );

  return (
    <Layout user={user} title="Queen Rider Dashboard">
      <div style={{ color: '#8b96a8', fontSize: 11, marginTop: -12, marginBottom: 16, fontStyle: 'italic' }}>
        BRD Section 34.4 — the dashboard a rider sees for her own deliveries and earnings. Navigation/SOS aren't included — those need real GPS/maps integration and a live location feed this app doesn't have.
      </div>

      <div style={{ marginBottom: 20 }}>
        <select value={selectedId} style={inputStyle} onChange={e => onSelect(e.target.value)}>
          {riders.length === 0 && <option value="">No riders found</option>}
          {riders.map(r => <option key={r.id} value={r.id}>{r.name} {r.is_online ? '🟢' : '⚪'}</option>)}
        </select>
      </div>

      {!data ? <p style={{ color: '#cfd6e0' }}>{riders.length === 0 ? 'No riders exist yet — add one in Users & Roles.' : 'Loading...'}</p> : (
        <>
          <div style={{ marginBottom: 20 }}>
            <button onClick={toggleOnline} style={{
              background: data.isOnline ? 'rgba(46,125,95,0.15)' : '#243044',
              border: `1px solid ${data.isOnline ? '#2e7d5f' : BORDER}`,
              color: data.isOnline ? '#4fd18b' : '#cfd6e0',
              borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8
            }}><Power size={15} /> {data.isOnline ? 'Online — go offline' : 'Offline — go online'}</button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            {statTile('Active Deliveries', data.activeOrderCount, Bike, GOLD)}
            {statTile('Delivered', data.deliveredCount, CheckCircle2, '#4fd18b')}
            {statTile('Estimated Earnings', `₹${data.estimatedEarnings}`, IndianRupee, '#2e7d5f')}
            {statTile('Settled Earnings', `₹${data.settledEarnings}`, IndianRupee, '#7b5fd6')}
          </div>

          {sectionCard('Active Deliveries', (
            data.activeOrders.length === 0 ? <div style={{ color: '#8b96a8', fontSize: 13 }}>No active deliveries</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                <thead><tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}><th style={{ padding: '8px 8px 8px 0' }}>Order</th><th>Customer</th><th>Status</th></tr></thead>
                <tbody>{data.activeOrders.map(o => (
                  <tr key={o.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{o.order_ref}</td>
                    <td>{o.customer_name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{o.status}</td>
                  </tr>
                ))}</tbody>
              </table>
            )
          ))}

          {sectionCard('Delivery History', (
            data.deliveryHistory.length === 0 ? <div style={{ color: '#8b96a8', fontSize: 13 }}>No deliveries yet</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                <thead><tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}><th style={{ padding: '8px 8px 8px 0' }}>Order</th><th>Customer</th><th>Date</th></tr></thead>
                <tbody>{data.deliveryHistory.map(o => (
                  <tr key={o.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{o.order_ref}</td>
                    <td>{o.customer_name}</td>
                    <td style={{ color: '#8b96a8', fontSize: 12 }}>{o.created_at}</td>
                  </tr>
                ))}</tbody>
              </table>
            )
          ))}
        </>
      )}
    </Layout>
  );
}

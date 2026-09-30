import { useEffect, useState } from 'react';
import { Building2, ShoppingCart, Clock, IndianRupee, Users } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';
const inputStyle = { background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white', padding: 8, borderRadius: 6 };

export default function HubDashboard({ user }) {
  const [hubs, setHubs] = useState([]);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/role-view/hubs').then(r => {
      setHubs(r.data);
      if (r.data.length > 0) setSelected(r.data[0].name);
    });
  }, []);

  useEffect(() => {
    if (selected) api.get(`/role-view/hub/${encodeURIComponent(selected)}`).then(r => setData(r.data));
  }, [selected]);

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
    <Layout user={user} title="CP / Queen Hub Dashboard">
      <div style={{ color: '#8b96a8', fontSize: 11, marginTop: -12, marginBottom: 16, fontStyle: 'italic' }}>
        BRD Section 34.4 — the dashboard a Channel Partner sees for her own hub only. No inventory/stock-alert data is shown, since there's no real per-hub inventory system in this app yet — nothing here is invented.
      </div>

      <div style={{ marginBottom: 20 }}>
        <select value={selected} style={inputStyle} onChange={e => setSelected(e.target.value)}>
          {hubs.length === 0 && <option value="">No hubs found</option>}
          {hubs.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
        </select>
      </div>

      {!data ? <p style={{ color: '#cfd6e0' }}>{hubs.length === 0 ? 'No hubs exist yet — add one in Master Data.' : 'Loading...'}</p> : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            {statTile("Today's Orders", data.todaysOrderCount, ShoppingCart, GOLD)}
            {statTile('Pending Orders', data.pendingOrderCount, Clock, '#c4443b')}
            {statTile('Gross Order Value', `₹${data.grossOrderValue}`, IndianRupee, '#2e7d5f')}
            {statTile('Queen Sellers Served', data.sellerCount, Users, '#a855c7')}
          </div>

          {sectionCard('Hub Orders', (
            data.orders.length === 0 ? <div style={{ color: '#8b96a8', fontSize: 13 }}>No orders through this hub yet</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                <thead><tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}><th style={{ padding: '8px 8px 8px 0' }}>Order</th><th>Customer</th><th>Seller</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>{data.orders.map(o => (
                  <tr key={o.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{o.order_ref}</td>
                    <td>{o.customer_name}</td><td>{o.seller_name || '—'}</td><td>₹{o.amount}</td>
                    <td style={{ textTransform: 'capitalize' }}>{o.status}</td>
                  </tr>
                ))}</tbody>
              </table>
            )
          ))}

          {sectionCard('Hub Settlements', (
            data.settlements.length === 0 ? <div style={{ color: '#8b96a8', fontSize: 13 }}>No settlements recorded yet</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                <thead><tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}><th style={{ padding: '8px 8px 8px 0' }}>Settlement</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>{data.settlements.map(s => (
                  <tr key={s.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{s.settlement_code}</td>
                    <td>₹{s.amount}</td>
                    <td style={{ textTransform: 'capitalize' }}>{s.status}</td>
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

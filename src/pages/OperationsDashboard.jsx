import { useEffect, useState } from 'react';
import { Timer, AlertTriangle, ShoppingCart, Bike, Building2 } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

const STATUS_COLOR = { pending: GOLD, confirmed: '#3b82c4', delivered: '#4fd18b', cancelled: '#e0708e', refunded: '#8b96a8' };

export default function OperationsDashboard({ user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/executive/operations-summary').then(r => setData(r.data));
  }, []);

  if (!data) return <Layout user={user} title="Operations Dashboard"><p style={{ color: '#cfd6e0' }}>Loading...</p></Layout>;

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
    <Layout user={user} title="Operations Dashboard">
      <div style={{ color: '#8b96a8', fontSize: 11, marginTop: -12, marginBottom: 16, fontStyle: 'italic' }}>
        BRD Section 34.4 — dispatch, SLA and escalation monitoring for Central Operations. Note: "hub audit status" from the BRD isn't shown here — there's no real audit-scheduling data behind it yet in this app, so it's left out rather than faked.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        {statTile(`SLA Breaches (>${data.slaHours}h pending)`, data.slaBreachCount, AlertTriangle, '#c4443b')}
        {statTile('High-Priority Open Complaints', data.escalationCount, AlertTriangle, '#d6336c')}
        {statTile('Riders with Active Orders', data.riderLoad.length, Bike, '#3b9c6d')}
        {statTile('Hubs with Active Orders', data.hubLoad.length, Building2, '#7b5fd6')}
      </div>

      {sectionCard('Orders by Status', (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {Object.entries(data.statusCounts).map(([status, count]) => (
            <span key={status} style={{
              background: `${STATUS_COLOR[status] || GOLD}22`, color: STATUS_COLOR[status] || GOLD,
              padding: '6px 14px', borderRadius: 20, fontSize: 13, textTransform: 'capitalize'
            }}>{status}: {count}</span>
          ))}
          {Object.keys(data.statusCounts).length === 0 && <span style={{ color: '#8b96a8', fontSize: 13 }}>No orders yet</span>}
        </div>
      ))}

      {sectionCard('Escalations (High-Priority, Unresolved Complaints)', (
        data.escalations.length === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center', color: '#4fd18b', fontSize: 13 }}>None right now</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                <th style={{ padding: '8px 8px 8px 0' }}>Complainant</th><th>Category</th><th>Description</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.escalations.map(e => (
                <tr key={e.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '8px 8px 8px 0' }}>{e.complainantName}</td>
                  <td>{e.category}</td>
                  <td>{e.description}</td>
                  <td style={{ color: '#8b96a8', fontSize: 12 }}>{e.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ))}

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          {sectionCard('Rider Dispatch Load', (
            data.riderLoad.length === 0 ? (
              <div style={{ color: '#8b96a8', fontSize: 13 }}>No riders with active orders</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                <thead><tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}><th style={{ padding: '8px 8px 8px 0' }}>Rider</th><th>Active Orders</th></tr></thead>
                <tbody>{data.riderLoad.map(r => (
                  <tr key={r.rider} style={{ borderTop: `1px solid ${BORDER}` }}><td style={{ padding: '8px 8px 8px 0' }}>{r.rider}</td><td>{r.activeOrders}</td></tr>
                ))}</tbody>
              </table>
            )
          ))}
        </div>
        <div style={{ flex: '1 1 300px' }}>
          {sectionCard('Hub Dispatch Load', (
            data.hubLoad.length === 0 ? (
              <div style={{ color: '#8b96a8', fontSize: 13 }}>No hubs with active orders</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                <thead><tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}><th style={{ padding: '8px 8px 8px 0' }}>Hub</th><th>Active Orders</th></tr></thead>
                <tbody>{data.hubLoad.map(h => (
                  <tr key={h.hub} style={{ borderTop: `1px solid ${BORDER}` }}><td style={{ padding: '8px 8px 8px 0' }}>{h.hub}</td><td>{h.activeOrders}</td></tr>
                ))}</tbody>
              </table>
            )
          ))}
        </div>
      </div>
    </Layout>
  );
}

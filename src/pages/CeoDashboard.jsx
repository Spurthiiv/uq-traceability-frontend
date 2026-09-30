import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart, Building2, Crown, Bike, Percent, Users, Repeat } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

export default function CeoDashboard({ user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/executive/ceo-summary').then(r => setData(r.data));
  }, []);

  if (!data) return <Layout user={user} title="CEO / Investor Dashboard"><p style={{ color: '#cfd6e0' }}>Loading...</p></Layout>;

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
    <Layout user={user} title="CEO / Investor Dashboard">
      <div style={{ color: '#8b96a8', fontSize: 11, marginTop: -12, marginBottom: 16, fontStyle: 'italic' }}>
        BRD Section 34.4 — high-level business growth and performance view. Every figure here is computed from real orders, hubs, users and zones — nothing here is a projection or placeholder.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        {statTile('Gross Merchandise Value', `₹${data.gmv}`, TrendingUp, '#7b5fd6')}
        {statTile('Total Orders', data.totalOrders, ShoppingCart, '#3b82c4')}
        {statTile('Avg. Order Value', `₹${data.aov}`, Percent, GOLD)}
        {statTile('Active Hubs', `${data.activeHubs} / ${data.totalHubs}`, Building2, '#c4443b')}
        {statTile('Active Queens', data.activeQueens, Crown, '#a855c7')}
        {statTile('Active Riders', data.activeRiders, Bike, '#3b9c6d')}
        {statTile('Total Customers', data.totalCustomers, Users, '#2e7d5f')}
        {statTile('Repeat Customer Rate', `${data.repeatRate}%`, Repeat, '#d6336c')}
      </div>

      {sectionCard('Month-over-Month Growth Trend', (
        data.growthTrend.length === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No order history yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                <th style={{ padding: '8px 8px 8px 0' }}>Month</th><th>Orders</th><th>GMV</th><th>New Customers</th>
              </tr>
            </thead>
            <tbody>
              {data.growthTrend.map(r => (
                <tr key={r.month} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{r.month}</td>
                  <td>{r.orders}</td>
                  <td>₹{r.gmv}</td>
                  <td>{r.newCustomers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ))}

      {sectionCard('Ward / District Growth', (
        data.zoneGrowthTrend.length === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No zones created yet — add some in Master Data</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                <th style={{ padding: '8px 8px 8px 0' }}>Month</th><th>New Wards</th><th>New Districts</th>
              </tr>
            </thead>
            <tbody>
              {data.zoneGrowthTrend.map(r => (
                <tr key={r.month} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{r.month}</td>
                  <td>{r.wards}</td>
                  <td>{r.districts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ))}

      {sectionCard('Unit Economics', (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ color: '#8b96a8', fontSize: 11, textTransform: 'uppercase' }}>Platform Commission Earned</div>
            <div style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>₹{data.platformCommission}</div>
          </div>
          <div>
            <div style={{ color: '#8b96a8', fontSize: 11, textTransform: 'uppercase' }}>Repeat Customers</div>
            <div style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>{data.repeatCustomers} of {data.totalCustomers}</div>
          </div>
        </div>
      ))}
    </Layout>
  );
}

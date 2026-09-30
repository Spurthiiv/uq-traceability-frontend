import { useEffect, useState } from 'react';
import { Map, Building2, Crown, ShoppingCart, IndianRupee, AlertTriangle, MessageSquareWarning, RotateCcw } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

export default function DistrictDashboard({ user }) {
  const [districts, setDistricts] = useState(null);

  useEffect(() => {
    api.get('/executive/district-summary').then(r => setDistricts(r.data));
  }, []);

  if (!districts) return <Layout user={user} title="District / State Dashboard"><p style={{ color: '#cfd6e0' }}>Loading...</p></Layout>;

  const metric = (label, value, Icon, color) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={14} color={color} />
      <div>
        <div style={{ color: 'white', fontSize: 15, fontWeight: 'bold' }}>{value}</div>
        <div style={{ color: '#8b96a8', fontSize: 10, textTransform: 'uppercase' }}>{label}</div>
      </div>
    </div>
  );

  return (
    <Layout user={user} title="District / State Dashboard">
      <div style={{ color: '#8b96a8', fontSize: 11, marginTop: -12, marginBottom: 16, fontStyle: 'italic' }}>
        BRD Section 34.4 — rolls up every ward, hub, order and complaint beneath each district-level zone (Master Data → Zones & Wards), so a District Head can monitor the whole district instead of one hub at a time.
      </div>

      {districts.length === 0 ? (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 24, textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>
          No district-level zones yet — create one in Master Data → Zones & Wards (set Level to "district") and assign wards/hubs under it.
        </div>
      ) : (
        districts.map(d => (
          <div key={d.districtId} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Map size={16} color={GOLD} />
              <strong style={{ color: 'white', fontSize: 15 }}>{d.districtName}</strong>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {metric('Wards', d.wardCount, Map, '#3b82c4')}
              {metric('Hubs', `${d.activeHubCount} / ${d.totalHubCount}`, Building2, '#7b5fd6')}
              {metric('Queen Sellers', d.sellerCount, Crown, '#a855c7')}
              {metric('Orders', d.orderCount, ShoppingCart, GOLD)}
              {metric('Revenue', `₹${d.revenue}`, IndianRupee, '#2e7d5f')}
              {metric('Stale Pending', d.stalePendingOrders, AlertTriangle, '#c4443b')}
              {metric('Complaints', d.complaintCount, MessageSquareWarning, '#d6336c')}
              {metric('Refunds', d.refundCount, RotateCcw, '#e0708e')}
            </div>
          </div>
        ))
      )}
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import { Crown, ShoppingCart, Clock, IndianRupee, Package } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';
const inputStyle = { background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white', padding: 8, borderRadius: 6 };

export default function SellerDashboard({ user }) {
  const [sellers, setSellers] = useState([]);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/role-view/sellers').then(r => {
      setSellers(r.data);
      if (r.data.length > 0) setSelected(r.data[0].name);
    });
  }, []);

  useEffect(() => {
    if (selected) api.get(`/role-view/seller/${encodeURIComponent(selected)}`).then(r => setData(r.data));
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
    <Layout user={user} title="Queen Seller Dashboard">
      <div style={{ color: '#8b96a8', fontSize: 11, marginTop: -12, marginBottom: 16, fontStyle: 'italic' }}>
        BRD Section 34.4 — the dashboard a Queen Seller sees for her own business. Since there's no per-user login right now, pick which seller to view as below.
      </div>

      <div style={{ marginBottom: 20 }}>
        <select value={selected} style={inputStyle} onChange={e => setSelected(e.target.value)}>
          {sellers.length === 0 && <option value="">No Queen Sellers found</option>}
          {sellers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      {!data ? <p style={{ color: '#cfd6e0' }}>{sellers.length === 0 ? 'No Queen Sellers exist yet — add one in Users & Roles.' : 'Loading...'}</p> : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            {statTile("Today's Orders", data.todaysOrderCount, ShoppingCart, GOLD)}
            {statTile('Pending Orders', data.pendingOrderCount, Clock, '#c4443b')}
            {statTile('Total Sales', `₹${data.totalSales}`, IndianRupee, '#2e7d5f')}
            {statTile('Products', data.productCount, Package, '#7b5fd6')}
            {statTile('Pending Settlements', data.pendingSettlementCount, Crown, '#a855c7')}
          </div>

          {sectionCard('My Products', (
            data.products.length === 0 ? <div style={{ color: '#8b96a8', fontSize: 13 }}>No products yet</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                <thead><tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}><th style={{ padding: '8px 8px 8px 0' }}>Name</th><th>Category</th><th>Price</th></tr></thead>
                <tbody>{data.products.map(p => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${BORDER}` }}><td style={{ padding: '8px 8px 8px 0', color: 'white' }}>{p.name}</td><td>{p.category || '—'}</td><td>{p.price ? `₹${p.price}` : '—'}</td></tr>
                ))}</tbody>
              </table>
            )
          ))}

          {sectionCard('My Orders', (
            data.orders.length === 0 ? <div style={{ color: '#8b96a8', fontSize: 13 }}>No orders yet</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                <thead><tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}><th style={{ padding: '8px 8px 8px 0' }}>Order</th><th>Customer</th><th>Product</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>{data.orders.map(o => (
                  <tr key={o.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{o.order_ref}</td>
                    <td>{o.customer_name}</td><td>{o.product_name}</td><td>₹{o.amount}</td>
                    <td style={{ textTransform: 'capitalize' }}>{o.status}</td>
                  </tr>
                ))}</tbody>
              </table>
            )
          ))}

          {sectionCard('My Settlements', (
            data.settlements.length === 0 ? <div style={{ color: '#8b96a8', fontSize: 13 }}>No settlements recorded yet</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                <thead><tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}><th style={{ padding: '8px 8px 8px 0' }}>Settlement</th><th>Gross</th><th>Status</th></tr></thead>
                <tbody>{data.settlements.map(s => (
                  <tr key={s.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{s.settlement_code}</td>
                    <td>₹{s.gross_order_value || 0}</td>
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

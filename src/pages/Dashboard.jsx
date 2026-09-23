import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, CheckCircle2, Crown, Store, Bike, Tag, Trash2,
  Sprout, Building2, ShieldCheck, Box, Link2, QrCode, Truck,
  ClipboardCheck, AlertTriangle, ShoppingCart, Wallet, Percent, Clock
} from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';
import { STAGES } from '../stages';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

const canSeeOpsData = (role) => role === 'ADMIN' || role === 'OPS';

export default function Dashboard({ user, onLogout }) {
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [chainValid, setChainValid] = useState(null);
  const [ledgerCount, setLedgerCount] = useState(null);
  const [form, setForm] = useState({ productName: '', farmerName: '', originLocation: '', harvestDate: '', quantity: '', unit: '', ingredients: '' });
  const [showForm, setShowForm] = useState(false);

  // Role-gated data (these endpoints are ADMIN/OPS or ADMIN-only on the backend)
  const [qcSummary, setQcSummary] = useState(null);
  const [qcChecks, setQcChecks] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [queens, setQueens] = useState(null); // null = not fetched (non-admin)

  const load = () => api.get('/batches').then(r => setBatches(r.data));
  const loadSummary = () => api.get('/dashboard/summary').then(r => setSummary(r.data));
  const loadTraceability = () => {
    api.get('/ledger/verify-all').then(r => setChainValid(r.data.allValid));
    api.get('/ledger').then(r => setLedgerCount(r.data.length));
  };

  useEffect(() => {
    load();
    loadSummary();
    loadTraceability();
    if (canSeeOpsData(user.role)) {
      api.get('/quality/summary').then(r => setQcSummary(r.data));
      api.get('/quality/qc-checks').then(r => setQcChecks(r.data));
      api.get('/finance/summary').then(r => setFinanceSummary(r.data));
      api.get('/finance/settlements').then(r => setSettlements(r.data));
    }
    if (user.role === 'ADMIN') {
      api.get('/auth/users').then(r => setQueens(r.data.filter(u => u.role === 'QUEEN')));
    }
  }, []);

  const createBatch = async () => {
    await api.post('/batches', form);
    setForm({ productName: '', farmerName: '', originLocation: '', harvestDate: '', quantity: '', unit: '', ingredients: '' });
    setShowForm(false);
    load();
    loadSummary();
    loadTraceability();
  };

  const deleteBatch = async (id, productName) => {
    if (!window.confirm(`Delete batch "${productName}"? This cannot be undone.`)) return;
    await api.delete(`/batches/${id}`);
    load();
    loadSummary();
    loadTraceability();
  };

  const delivered = batches.filter(b => (b.status || '').toUpperCase() === 'DELIVERED').length;
  const totalBatches = batches.length;
  const latestDelivered = [...batches].filter(b => (b.status || '').toUpperCase() === 'DELIVERED')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  const qrBoundBatches = batches.filter(b => b.batch_code).length;
  const hubCount = new Set(settlements.map(s => s.hub_name).filter(Boolean)).size;

  const statTile = (label, value, Icon, color) => (
    <div className="card-hover" style={{
      background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10,
      padding: 20, flex: '1 1 180px', display: 'flex', alignItems: 'center', gap: 14
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color="white" />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>{value}</div>
        <div style={{ fontSize: 12, color: '#8b96a8' }}>{label}</div>
      </div>
    </div>
  );

  const miniTile = (label, value, Icon, color) => (
    <div style={{
      background: `${color}15`, border: `1px solid ${color}44`, borderRadius: 10,
      padding: '14px 16px', flex: '1 1 140px', display: 'flex', alignItems: 'center', gap: 10
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>{value}</div>
        <div style={{ fontSize: 11, color: '#8b96a8' }}>{label}</div>
      </div>
    </div>
  );

  const sectionCard = (icon, title, action, children) => (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <strong style={{ color: 'white' }}>{title}</strong>
        </div>
        {action}
      </div>
      {children}
    </div>
  );

  const emptyState = (text) => <div style={{ padding: '20px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>{text}</div>;
  const viewLink = (to, label) => <Link to={to} style={{ color: GOLD, fontSize: 13 }}>{label}</Link>;

  const showOpsSections = canSeeOpsData(user.role);

  return (
    <Layout user={user} onLogout={onLogout} title="Dashboard">
      {/* Top cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        {statTile('Total Batches', totalBatches, Package, '#7b5fd6')}
        {summary && statTile('Products', summary.products, Tag, '#e0a336')}
        {summary && statTile('Queens (Sellers)', summary.queens, Crown, '#a855c7')}
        {summary && statTile('Retailers', summary.retailers, Store, '#d6336c')}
        {summary && statTile('Riders', summary.riders, Bike, '#3b82c4')}
        {statTile('Delivered', delivered, CheckCircle2, '#2e7d5f')}
      </div>

      {/* Batches in the Supply Chain */}
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} color="#1a2332" />
            </div>
            <strong style={{ color: 'white' }}>Batches in the Supply Chain</strong>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6,
            padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold'
          }}>+ New Batch</button>
        </div>

        {showForm && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, padding: 16, background: '#0f1620', borderRadius: 8 }}>
            {['productName', 'farmerName', 'originLocation', 'harvestDate', 'quantity', 'unit', 'ingredients'].map(field => (
              <input key={field} placeholder={field === 'ingredients' ? 'ingredients (comma-separated)' : field} value={form[field]}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                style={{ background: '#1a2332', border: `1px solid ${BORDER}`, color: 'white', padding: 8, borderRadius: 6 }} />
            ))}
            <button onClick={createBatch} style={{
              background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer'
            }}>Create</button>
          </div>
        )}

        {batches.length === 0 ? emptyState('No batches yet') : (
          <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                <th style={{ padding: '10px 8px' }}>Batch Code</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Origin</th>
                <th>Status</th>
                <th>Traceability</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>{b.batch_code || b.id.slice(0, 8) + '…'}</td>
                  <td>{b.product_name}</td>
                  <td>{b.quantity} {b.unit}</td>
                  <td style={{ color: '#8b96a8' }}>{b.origin_location || '—'}</td>
                  <td>
                    <span style={{ background: 'rgba(201,165,69,0.15)', color: GOLD, padding: '3px 12px', borderRadius: 12, fontSize: 12 }}>{b.status}</span>
                  </td>
                  <td>
                    {b.batch_code
                      ? <span style={{ color: '#4fd18b', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}><CheckCircle2 size={12} /> QR Verified</span>
                      : <span style={{ color: '#8b96a8', fontSize: 12 }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Link to={`/batches/${b.id}`} style={{ color: GOLD, fontSize: 12 }}>View Journey</Link>
                      <Link to={`/batches/${b.id}`} style={{ color: GOLD, fontSize: 12 }}>View QR</Link>
                      <button onClick={() => deleteBatch(b.id, b.product_name)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Supply Chain Journey */}
      {sectionCard(<Link2 size={16} color="#1a2332" />, 'Supply Chain Journey', null, (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            {STAGES.map((s, i) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: '#0f1620',
                  border: `1px solid ${BORDER}`, borderRadius: 20, padding: '6px 12px', fontSize: 12, color: '#cfd6e0'
                }}>
                  <s.icon size={13} />{s.label}
                </div>
                {i < STAGES.length - 1 && <span style={{ color: '#5a6578', margin: '0 4px' }}>→</span>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 16, fontSize: 13, color: '#cfd6e0' }}>
            <span>{ledgerCount ?? '—'} supply-chain events recorded</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: chainValid ? '#4fd18b' : chainValid === false ? '#e0708e' : '#8b96a8' }}>
              <ShieldCheck size={14} /> Blockchain: {chainValid === null ? 'checking…' : chainValid ? 'Chain Valid' : 'Chain Broken'}
            </span>
          </div>
        </>
      ))}

      {/* Quality & Compliance (ADMIN/OPS) */}
      {showOpsSections && sectionCard(<ClipboardCheck size={16} color="#1a2332" />, 'Quality & Compliance', viewLink('/quality', 'View Quality'), (
        !qcSummary ? emptyState('Loading…') : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              {miniTile('QC Checks', qcSummary.totalChecks, ClipboardCheck, '#7b5fd6')}
              {miniTile('Passed', qcSummary.passed, CheckCircle2, '#2e7d5f')}
              {miniTile('Failed', qcSummary.failed, AlertTriangle, '#c4443b')}
              {miniTile('Complaints', qcSummary.openComplaints, AlertTriangle, GOLD)}
            </div>
            {qcChecks.length === 0 ? emptyState('No quality checks recorded yet') : (
              <div>
                {qcChecks.slice(0, 5).map(qc => (
                  <div key={qc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${BORDER}`, fontSize: 13 }}>
                    <span style={{ color: '#cfd6e0' }}>{qc.product_name}</span>
                    <span style={{ color: qc.result === 'passed' ? '#4fd18b' : '#e0708e' }}>{qc.result === 'passed' ? '✓ PASSED' : '✗ FAILED'}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )
      ))}

      {/* Product Traceability */}
      {sectionCard(<Sprout size={16} color="#1a2332" />, 'Product Traceability', viewLink('/ledger', 'View Traceability'), (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            {miniTile('Traceable Batches', totalBatches, Box, '#7b5fd6')}
            {miniTile('QR Bound', qrBoundBatches, QrCode, GOLD)}
            {miniTile('Verified', chainValid ? totalBatches : 0, CheckCircle2, '#2e7d5f')}
            {miniTile('Blockchain Events', ledgerCount ?? 0, Link2, '#3b82c4')}
          </div>
          {batches[0] ? (
            <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14 }}>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>{batches[0].product_name}</div>
              <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 12, marginTop: 2 }}>{batches[0].batch_code}</div>
              <div style={{ color: '#8b96a8', fontSize: 12, marginTop: 4 }}>Origin: {batches[0].origin_location || '—'}</div>
            </div>
          ) : emptyState('No batches yet')}
        </>
      ))}

      {/* Orders & Sales (ADMIN/OPS) */}
      {showOpsSections && sectionCard(<ShoppingCart size={16} color="#1a2332" />, 'Orders & Sales', viewLink('/finance', 'View Orders'), (
        !financeSummary ? emptyState('Loading…') : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {miniTile('Total Orders', financeSummary.totalOrders, ShoppingCart, '#7b5fd6')}
              {miniTile('Revenue', `₹${financeSummary.totalRevenue}`, Wallet, GOLD)}
              {miniTile('Transactions', financeSummary.totalTransactions, CheckCircle2, '#2e7d5f')}
              {miniTile('Failed', financeSummary.failedTransactions, AlertTriangle, '#c4443b')}
            </div>
            {financeSummary.totalOrders === 0 && emptyState('No customer orders yet')}
          </>
        )
      ))}

      {/* Queen Sellers (ADMIN) */}
      {user.role === 'ADMIN' && sectionCard(<Crown size={16} color="#1a2332" />, 'Queen Sellers', viewLink('/users', 'View All Queens'), (
        queens === null ? emptyState('Loading…') : queens.length === 0 ? emptyState('No Queen sellers yet') : (
          <div>
            <div style={{ fontSize: 13, color: '#cfd6e0', marginBottom: 10 }}>Active Queens: <strong>{queens.filter(q => (q.status || 'active') === 'active').length}</strong></div>
            {queens.map(q => (
              <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${BORDER}`, fontSize: 13 }}>
                <span style={{ color: '#cfd6e0' }}>{q.name}</span>
                <span style={{ color: (q.status || 'active') === 'active' ? '#4fd18b' : '#e0708e', textTransform: 'capitalize' }}>{q.status || 'active'}</span>
              </div>
            ))}
          </div>
        )
      ))}

      {/* Logistics (ADMIN/OPS) */}
      {showOpsSections && summary && sectionCard(<Truck size={16} color="#1a2332" />, 'Logistics', viewLink('/supply-chain', 'View Logistics'), (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            {miniTile('Queen Hubs', hubCount, Building2, '#7b5fd6')}
            {miniTile('Active Riders', summary.riders, Bike, '#3b82c4')}
            {miniTile('Pending Deliveries', totalBatches - delivered, Clock, GOLD)}
            {miniTile('Delivered', delivered, CheckCircle2, '#2e7d5f')}
          </div>
          {latestDelivered ? (
            <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#8b96a8', textTransform: 'uppercase' }}>Latest Delivery</div>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: 13, marginTop: 4 }}>{latestDelivered.product_name}</div>
              <div style={{ color: GOLD, fontFamily: 'monospace', fontSize: 12 }}>{latestDelivered.batch_code}</div>
              <div style={{ color: '#4fd18b', fontSize: 12, marginTop: 4 }}>✓ Delivered</div>
            </div>
          ) : emptyState('No deliveries yet')}
        </>
      ))}

      {/* Finance Snapshot (ADMIN/OPS) */}
      {showOpsSections && sectionCard(<Percent size={16} color="#1a2332" />, 'Finance Snapshot', viewLink('/finance', 'View Finance'), (
        !financeSummary ? emptyState('Loading…') : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {miniTile('Customer Revenue', `₹${financeSummary.totalRevenue}`, Wallet, '#7b5fd6')}
            {miniTile('Seller Payouts', `₹${financeSummary.sellerPayouts}`, Crown, '#a855c7')}
            {miniTile('CP Commission', `₹${financeSummary.cpCommission}`, Percent, '#3b82c4')}
            {miniTile('Pending Settlements', `₹${financeSummary.pendingSettlements}`, Clock, GOLD)}
          </div>
        )
      ))}
    </Layout>
  );
}

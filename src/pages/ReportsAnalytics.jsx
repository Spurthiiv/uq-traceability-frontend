import { useEffect, useState } from 'react';
import {
  Package, Layers, CheckCircle2, Clock, ShieldCheck, MessageSquareWarning,
  ShoppingCart, Wallet, Users, Link2, Download, RotateCcw
} from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';
import { stageIcon } from '../stages';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

const inputStyle = {
  background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white',
  padding: '8px 10px', borderRadius: 6, fontSize: 13
};

export default function ReportsAnalytics({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ product: '', status: '', dateFrom: '', dateTo: '', complaintStatus: '', seller: '', hub: '' });

  const load = (activeFilters = filters) => {
    const params = Object.fromEntries(Object.entries(activeFilters).filter(([, v]) => v));
    api.get('/reports/summary', { params }).then(r => setData(r.data));
  };

  useEffect(() => {
    load();
    api.get('/products').then(r => setProducts(r.data));
  }, []);

  const applyFilters = () => load(filters);
  const resetFilters = () => {
    const cleared = { product: '', status: '', dateFrom: '', dateTo: '', complaintStatus: '', seller: '', hub: '' };
    setFilters(cleared);
    load(cleared);
  };

  const exportCsv = () => {
    if (!data) return;
    const lines = [];
    lines.push('Summary');
    Object.entries(data.summary).forEach(([k, v]) => lines.push(`${k},${v}`));
    lines.push('');
    lines.push('Batches by Status');
    lines.push('Status,Count,Percentage');
    data.batchesByStatus.forEach(s => lines.push(`${s.status},${s.count},${s.percentage}%`));
    lines.push('');
    lines.push('Top Products');
    lines.push('Product,Batches,Total Quantity,Delivered,Status');
    data.topProducts.forEach(p => lines.push(`"${p.product_name}",${p.batches},${p.totalQuantity},${p.delivered},${p.status}`));
    lines.push('');
    lines.push('Supply Chain Funnel');
    lines.push('Stage,Count');
    data.supplyChainFunnel.forEach(s => lines.push(`${s.label},${s.count}`));
    lines.push('');
    lines.push('Seller Performance');
    lines.push('Seller,Orders,Delivered,Revenue');
    data.sellerPerformance.forEach(s => lines.push(`"${s.seller}",${s.orders},${s.delivered},${s.revenue}`));
    lines.push('');
    lines.push('Recent Activity');
    lines.push('Time,Activity,Entity,Status');
    data.recentActivity.forEach(a => lines.push(`${a.time},"${a.activity}","${a.entity}",${a.status}`));

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uq-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statTile = (label, value, Icon, color) => (
    <div style={{
      background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10,
      padding: 16, flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: 12
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}><Icon size={18} color="white" /></div>
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

  const barRow = (label, count, percentage, color) => (
    <div key={label} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#cfd6e0', marginBottom: 4 }}>
        <span>{label}</span><span>{count} ({percentage}%)</span>
      </div>
      <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 6, height: 10 }}>
        <div style={{ width: `${percentage}%`, background: color, height: '100%', borderRadius: 6 }} />
      </div>
    </div>
  );

  const tableHead = (cols) => (
    <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
      {cols.map(c => <th key={c} style={{ padding: '8px 8px 8px 0' }}>{c}</th>)}
    </tr>
  );

  if (!data) {
    return <Layout user={user} onLogout={onLogout} title="Reports & Analytics"><p style={{ color: '#cfd6e0' }}>Loading...</p></Layout>;
  }

  return (
    <Layout user={user} onLogout={onLogout} title="Reports & Analytics">
      <div style={{ color: '#8b96a8', fontSize: 13, marginTop: -12, marginBottom: 20 }}>
        Operational, supply-chain, quality, finance and customer insights
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        {statTile('Total Products', data.summary.totalProducts, Package, '#7b5fd6')}
        {statTile('Total Batches', data.summary.totalBatches, Layers, '#3b82c4')}
        {statTile('Delivered Batches', data.summary.deliveredBatches, CheckCircle2, '#2e7d5f')}
        {statTile('Pending Batches', data.summary.pendingBatches, Clock, GOLD)}
        {statTile('Quality Passed', data.summary.qualityPassed, ShieldCheck, '#4fd18b')}
        {statTile('Open Complaints', data.summary.openComplaints, MessageSquareWarning, '#c4443b')}
        {statTile('Total Orders', data.summary.totalOrders, ShoppingCart, '#8b96a8')}
        {statTile('Total Settled (₹)', data.summary.totalRevenue, Wallet, GOLD)}
      </div>

      {/* Filters */}
      {sectionCard('Filters', <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <select value={filters.product} onChange={e => setFilters({ ...filters, product: e.target.value })} style={inputStyle}>
            <option value="">All products</option>
            {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} style={inputStyle}>
            <option value="">All statuses</option>
            {data.batchesByStatus.map(s => <option key={s.status} value={s.status}>{s.status}</option>)}
          </select>
          <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} style={inputStyle} />
          <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} style={inputStyle} />
          <select value={filters.complaintStatus} onChange={e => setFilters({ ...filters, complaintStatus: e.target.value })} style={inputStyle}>
            <option value="">All complaint statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
          <input placeholder="Seller / CP ID" value={filters.seller} onChange={e => setFilters({ ...filters, seller: e.target.value })} style={{ ...inputStyle, width: 140 }} />
          <input placeholder="Hub name" value={filters.hub} onChange={e => setFilters({ ...filters, hub: e.target.value })} style={{ ...inputStyle, width: 140 }} />
          <button onClick={applyFilters} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>Apply Filters</button>
          <button onClick={resetFilters} style={{ background: '#243044', color: '#cfd6e0', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><RotateCcw size={14} /> Reset</button>
          <button onClick={exportCsv} style={{ background: '#243044', color: GOLD, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Download size={14} /> Export Report (CSV)</button>
        </div>
      </>)}

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 400px' }}>
          {sectionCard('Supply Chain Overview — Batches by Status', (
            data.batchesByStatus.length === 0
              ? <p style={{ color: '#8b96a8', fontSize: 13 }}>No batches match the current filters.</p>
              : data.batchesByStatus.map(s => barRow(s.status, s.count, s.percentage, '#7b5fd6'))
          ))}
        </div>
        <div style={{ flex: '1 1 400px' }}>
          {sectionCard('UQ Operations', <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {statTile('Total Team', data.operations.totalUsers, Users, '#7b5fd6')}
              {statTile('Active', data.operations.active, CheckCircle2, '#2e7d5f')}
              {statTile('Inactive', data.operations.inactive, Clock, '#8b96a8')}
            </div>
            <div style={{ marginTop: 12, fontSize: 13, color: '#cfd6e0', lineHeight: 2 }}>
              Admins: <strong>{data.operations.admins}</strong> · Ops: <strong>{data.operations.ops}</strong> · Queens: <strong>{data.operations.queens}</strong> · Retailers: <strong>{data.operations.retailers}</strong> · Logistics: <strong>{data.operations.logistics}</strong>
            </div>
          </>)}
        </div>
      </div>

      {sectionCard('Supply Chain Analytics — Batches per Stage', (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {data.supplyChainFunnel.map(s => {
            const StageIcon = stageIcon(s.stage);
            return (
              <div key={s.stage} style={{
                flex: '1 1 100px', background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8,
                padding: 12, textAlign: 'center'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}><StageIcon size={18} color="#8b96a8" /></div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: 'white', marginTop: 4 }}>{s.count}</div>
                <div style={{ fontSize: 10, color: '#8b96a8', marginTop: 2 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 400px' }}>
          {sectionCard('Orders & Revenue Over Time', (
            data.ordersOverTime.length === 0
              ? <p style={{ color: '#8b96a8', fontSize: 13 }}>No orders recorded yet.</p>
              : data.ordersOverTime.map(d => (
                <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#cfd6e0', padding: '6px 0', borderTop: `1px solid ${BORDER}` }}>
                  <span>{d.date}</span><span>{d.orders} orders</span><span style={{ color: GOLD }}>₹{d.revenue}</span>
                </div>
              ))
          ))}
        </div>
        <div style={{ flex: '1 1 400px' }}>
          {sectionCard('CP Performance', (
            data.cpPerformance.length === 0
              ? <p style={{ color: '#8b96a8', fontSize: 13 }}>No settlements recorded yet.</p>
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                  <thead>{tableHead(['CP', 'Settlements', 'Commission', 'Released', 'Pending'])}</thead>
                  <tbody>
                    {data.cpPerformance.map(c => (
                      <tr key={c.cpId} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '8px 8px 8px 0' }}>{c.cpId}</td>
                        <td>{c.settlements}</td>
                        <td>₹{c.totalCommission}</td>
                        <td style={{ color: '#4fd18b' }}>₹{c.released}</td>
                        <td style={{ color: GOLD }}>₹{c.pending}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
          ))}
        </div>
      </div>

      {sectionCard('Seller Performance', (
        data.sellerPerformance.length === 0
          ? <p style={{ color: '#8b96a8', fontSize: 13 }}>No orders recorded yet.</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>{tableHead(['Seller', 'Orders', 'Delivered', 'Revenue'])}</thead>
              <tbody>
                {data.sellerPerformance.map(s => (
                  <tr key={s.seller} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0' }}>{s.seller}</td>
                    <td>{s.orders}</td>
                    <td>{s.delivered}</td>
                    <td style={{ color: GOLD }}>₹{s.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
      ))}

      {sectionCard(`Top Products by Batch Volume (${data.filteredBatchCount} batches match filters)`, (
        data.topProducts.length === 0
          ? <p style={{ color: '#8b96a8', fontSize: 13 }}>No products match the current filters.</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>{tableHead(['Product', 'Batches', 'Total Quantity', 'Delivered', 'Status'])}</thead>
              <tbody>
                {data.topProducts.map(p => (
                  <tr key={p.product_name} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0' }}>{p.product_name}</td>
                    <td>{p.batches}</td>
                    <td>{p.totalQuantity}</td>
                    <td>{p.delivered}</td>
                    <td>
                      <span style={{
                        background: p.status === 'Delivered' ? 'rgba(46,125,95,0.15)' : p.status === 'Partially Delivered' ? 'rgba(201,165,69,0.15)' : 'rgba(59,130,196,0.15)',
                        color: p.status === 'Delivered' ? '#4fd18b' : p.status === 'Partially Delivered' ? GOLD : '#6fb1e8',
                        padding: '3px 10px', borderRadius: 12, fontSize: 12
                      }}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
      ))}

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 400px' }}>
          {sectionCard('Quality & Compliance', <>
            <div style={{ fontSize: 13, color: '#cfd6e0', lineHeight: 2 }}>
              Total QC Checks: <strong>{data.quality.totalChecks}</strong><br />
              Passed: <strong style={{ color: '#4fd18b' }}>{data.quality.passed}</strong> · Failed: <strong style={{ color: '#e0708e' }}>{data.quality.failed}</strong> · Pending: <strong>{data.quality.pending}</strong><br />
              Pass Rate: <strong>{data.quality.passRate}%</strong>
            </div>
            <div style={{ fontSize: 11, color: '#5a6578', marginTop: 6, fontStyle: 'italic' }}>
              Breakdown by check type (Appearance/Packaging/Weight/Lab Test) isn't tracked in the current QC schema.
            </div>
            <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 14, paddingTop: 14, fontSize: 13, color: '#cfd6e0', lineHeight: 2 }}>
              <strong style={{ color: 'white' }}>Complaints</strong><br />
              Open: <strong>{data.quality.complaints.open}</strong> · Investigating: <strong>{data.quality.complaints.investigating}</strong> · Resolved: <strong>{data.quality.complaints.resolved}</strong> · Rejected: <strong>{data.quality.complaints.rejected}</strong>
              <div style={{ fontSize: 11, color: '#5a6578', marginTop: 4, fontStyle: 'italic' }}>
                "Investigating" and "Rejected" aren't tracked yet — complaints currently only have pending/resolved status.
              </div>
            </div>
          </>)}
        </div>
        <div style={{ flex: '1 1 400px' }}>
          {sectionCard('Finance Overview', <div style={{ fontSize: 13, color: '#cfd6e0', lineHeight: 2 }}>
            Total Released (Settlements): <strong>₹{data.finance.totalReleased}</strong><br />
            Pending Settlements: <strong>₹{data.finance.pendingSettlements}</strong><br />
            Total Settlements: <strong>{data.finance.totalSettlements}</strong><br />
            Default CP Commission: <strong>{data.finance.cpCommissionPercent}%</strong> (configurable in Settings)<br />
            Settlement Cycle: <strong style={{ textTransform: 'capitalize' }}>{data.finance.settlementCycle}</strong>
            <div style={{ fontSize: 11, color: '#5a6578', marginTop: 6, fontStyle: 'italic' }}>
              These are internal settlement records, not real bank transfers — no payment gateway is integrated yet.
            </div>
          </div>)}
        </div>
      </div>

      {sectionCard('Product Traceability', (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {statTile('Traceable Batches', data.traceability.totalBatches, Link2, '#7b5fd6')}
          {statTile('QR-Bound Batches', data.traceability.qrBound, ShieldCheck, GOLD)}
          {statTile('Verified', data.traceability.verified, CheckCircle2, '#2e7d5f')}
          {statTile('Unverified/Incomplete', data.traceability.unverified, MessageSquareWarning, '#c4443b')}
          {statTile('Ledger Records', data.traceability.ledgerRecords, Layers, '#3b82c4')}
          {statTile('Supply Chain Events', data.traceability.totalEvents, Package, '#8b96a8')}
        </div>
      ))}

      {sectionCard('Recent Activity', (
        data.recentActivity.length === 0
          ? <p style={{ color: '#8b96a8', fontSize: 13 }}>No activity yet.</p>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>{tableHead(['Time', 'Activity', 'Entity', 'Status'])}</thead>
              <tbody>
                {data.recentActivity.map((a, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0', fontSize: 12, color: '#8b96a8' }}>{a.time}</td>
                    <td>{a.activity}</td>
                    <td>{a.entity}</td>
                    <td>
                      <span style={{
                        background: a.status === 'Failed' ? 'rgba(198,40,40,0.15)' : a.status === 'Open' ? 'rgba(201,165,69,0.15)' : 'rgba(46,125,95,0.15)',
                        color: a.status === 'Failed' ? '#e0708e' : a.status === 'Open' ? GOLD : '#4fd18b',
                        padding: '3px 10px', borderRadius: 12, fontSize: 12
                      }}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
      ))}
    </Layout>
  );
}

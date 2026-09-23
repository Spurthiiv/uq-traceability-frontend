import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ShieldCheck, Clock, MessageSquareWarning, ClipboardCheck, Trash2, Package, FileSearch, BarChart3, IndianRupee, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';
import DocumentUploads from '../components/DocumentUploads';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

const inputStyle = { background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white', padding: 8, borderRadius: 6 };

const EMPTY_QC = { batchId: '', qcType: 'Overall Quality', result: 'passed', checkedBy: '', notes: '' };
const EMPTY_COMPLAINT = { batchId: '', complainantName: '', description: '', category: 'Quality Issue', priority: 'Medium' };
const EMPTY_REFUND = { orderId: '', complaintId: '', customerName: '', reason: '', refundType: 'refund', requestedAmount: '' };
const REFUND_STATUS_COLOR = { initiated: GOLD, approved: '#3b82c4', disbursed: '#4fd18b', rejected: '#e0708e' };

export default function QualityCompliance({ user, onLogout }) {
  const [qcChecks, setQcChecks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState({ qcTypes: [], complaintCategories: [], priorities: [] });
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [showQcForm, setShowQcForm] = useState(false);
  const [qcForm, setQcForm] = useState(EMPTY_QC);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintForm, setComplaintForm] = useState(EMPTY_COMPLAINT);
  const [refunds, setRefunds] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundForm, setRefundForm] = useState(EMPTY_REFUND);
  const [refundError, setRefundError] = useState('');
  const [consentDraft, setConsentDraft] = useState({});
  const [expandedQcId, setExpandedQcId] = useState(null);

  const load = () => {
    api.get('/quality/qc-checks').then(r => setQcChecks(r.data));
    api.get('/quality/complaints').then(r => setComplaints(r.data));
    api.get('/quality/summary').then(r => setSummary(r.data));
    api.get('/quality/options').then(r => setOptions(r.data));
    api.get('/batches').then(r => setBatches(r.data));
    api.get('/products').then(r => setProducts(r.data));
    api.get('/refunds').then(r => setRefunds(r.data));
    api.get('/orders').then(r => setOrders(r.data));
  };
  useEffect(() => { load(); }, []);

  const createRefund = async () => {
    if (!refundForm.customerName || !refundForm.reason) return;
    setRefundError('');
    try {
      await api.post('/refunds', refundForm);
      setRefundForm(EMPTY_REFUND);
      setShowRefundForm(false);
      load();
    } catch (err) { setRefundError(err.response?.data?.error || 'Failed to create refund request'); }
  };

  const approveRefund = async (id) => {
    const consent = consentDraft[id];
    if (!consent) { alert('Check "Seller consent obtained" before approving.'); return; }
    try {
      await api.patch(`/refunds/${id}/approve`, { sellerConsent: true });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Failed to approve'); }
  };

  const rejectRefund = async (id) => {
    if (!window.confirm('Reject this refund request?')) return;
    await api.patch(`/refunds/${id}/reject`, {});
    load();
  };

  const disburseRefund = async (id) => {
    if (!window.confirm('Mark this refund as disbursed? This logs a real refund transaction against the order.')) return;
    await api.patch(`/refunds/${id}/disburse`, {});
    load();
  };

  const deleteRefund = async (id) => {
    if (!window.confirm('Delete this refund request record?')) return;
    await api.delete(`/refunds/${id}`);
    load();
  };

  const createQc = async () => {
    if (!qcForm.batchId) return;
    await api.post('/quality/qc-checks', qcForm);
    setQcForm(EMPTY_QC);
    setShowQcForm(false);
    load();
  };

  const createComplaint = async () => {
    if (!complaintForm.complainantName || !complaintForm.description) return;
    await api.post('/quality/complaints', complaintForm);
    setComplaintForm(EMPTY_COMPLAINT);
    setShowComplaintForm(false);
    load();
  };

  const deleteQc = async (id) => {
    if (!window.confirm('Delete this QC check? This cannot be undone.')) return;
    await api.delete(`/quality/qc-checks/${id}`);
    load();
  };

  const deleteComplaint = async (id) => {
    if (!window.confirm('Delete this complaint? This cannot be undone.')) return;
    await api.delete(`/quality/complaints/${id}`);
    load();
  };

  const resolveComplaint = async (id) => {
    await api.patch(`/quality/complaints/${id}/resolve`);
    load();
  };

  const statTile = (label, value, Icon, color) => (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, flex: '1 1 160px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color="white" />
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>{value}</div>
        <div style={{ fontSize: 11, color: '#8b96a8' }}>{label}</div>
      </div>
    </div>
  );

  const sectionCard = (title, action, children) => (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <strong style={{ color: 'white', fontSize: 14 }}>{title}</strong>
        {action}
      </div>
      {children}
    </div>
  );

  if (!summary) return <Layout user={user} onLogout={onLogout} title="Quality & Compliance"><p style={{ color: '#cfd6e0' }}>Loading...</p></Layout>;

  const PRIORITY_COLOR = { High: '#e0708e', Medium: GOLD, Low: '#6fb1e8' };

  const productIcon = (size = 14) => (
    <div style={{
      width: size + 18, height: size + 18, borderRadius: 8, background: 'rgba(201,165,69,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}><Package size={size} color={GOLD} /></div>
  );

  const productsWithFssai = products.filter(p => p.fssai_license).length;
  const batchDocsComplete = batches.length > 0 && batches.every(b => b.ingredients && b.origin_location);
  const qcRecordsAvailable = qcChecks.length > 0;
  const inspectionReportsAvailable = qcChecks.some(c => c.notes);

  const checklistRow = (label, ok, detail) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderTop: `1px solid ${BORDER}` }}>
      {ok ? <Check size={15} color="#4fd18b" style={{ flexShrink: 0, marginTop: 1 }} /> : <Clock size={15} color="#8b96a8" style={{ flexShrink: 0, marginTop: 1 }} />}
      <div>
        <div style={{ fontSize: 13, color: ok ? 'white' : '#8b96a8' }}>{label}</div>
        {detail && <div style={{ fontSize: 11, color: '#8b96a8', marginTop: 1 }}>{detail}</div>}
      </div>
    </div>
  );

  const quickLink = (label, to, Icon) => (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: 8, color: GOLD, fontSize: 13, textDecoration: 'none',
      background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10
    }}><Icon size={15} /> {label}</Link>
  );

  const allCompliant = productsWithFssai === products.length && products.length > 0 && batchDocsComplete && qcRecordsAvailable && inspectionReportsAvailable;

  return (
    <Layout user={user} onLogout={onLogout} title="Quality & Compliance">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        {statTile('Total QC Checks', summary.totalChecks, ClipboardCheck, '#7b5fd6')}
        {statTile('Passed', summary.passed, Check, '#2e7d5f')}
        {statTile('Pending', 0, Clock, GOLD)}
        {statTile('Failed', summary.failed, X, '#c4443b')}
        {statTile('Pass Rate', `${summary.passRate}%`, ShieldCheck, '#3b82c4')}
        {statTile('Complaints', complaints.length, MessageSquareWarning, '#d6336c')}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 500px', minWidth: 0 }}>
      {sectionCard('Quality Checks',
        <button onClick={() => setShowQcForm(!showQcForm)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>+ Log QC Check</button>,
        <>
          {showQcForm && (
            <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <select value={qcForm.batchId} style={inputStyle} onChange={e => setQcForm({ ...qcForm, batchId: e.target.value })}>
                <option value="">Select batch…</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.batch_code || b.id.slice(0, 8)} — {b.product_name}</option>)}
              </select>
              <select value={qcForm.qcType} style={inputStyle} onChange={e => setQcForm({ ...qcForm, qcType: e.target.value })}>
                {options.qcTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={qcForm.result} style={inputStyle} onChange={e => setQcForm({ ...qcForm, result: e.target.value })}>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
              <input placeholder="Inspector name" value={qcForm.checkedBy} style={inputStyle} onChange={e => setQcForm({ ...qcForm, checkedBy: e.target.value })} />
              <input placeholder="Notes (optional)" value={qcForm.notes} style={{ ...inputStyle, flex: '1 1 200px' }} onChange={e => setQcForm({ ...qcForm, notes: e.target.value })} />
              <button onClick={createQc} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Save Check</button>
            </div>
          )}
          {qcChecks.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No QC checks yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '8px 8px 8px 0' }}>Batch</th><th>Product</th><th>QC Type</th><th>Inspector</th><th>Date</th><th>Result</th><th></th><th></th>
                </tr>
              </thead>
              <tbody>
                {qcChecks.map(qc => (
                  <Fragment key={qc.id}>
                  <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{qc.batch_code || qc.batch_id.slice(0, 8)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {productIcon(13)} {qc.product_name}
                      </div>
                    </td>
                    <td>{qc.qc_type}</td>
                    <td>{qc.checked_by}</td>
                    <td style={{ color: '#8b96a8', fontSize: 12 }}>{qc.created_at}</td>
                    <td>
                      <span style={{
                        background: qc.result === 'passed' ? 'rgba(46,125,95,0.15)' : 'rgba(198,40,40,0.15)',
                        color: qc.result === 'passed' ? '#4fd18b' : '#e0708e',
                        padding: '3px 10px', borderRadius: 12, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4
                      }}>{qc.result === 'passed' ? <Check size={12} /> : <X size={12} />} {qc.result === 'passed' ? 'Passed' : 'Failed'}</span>
                    </td>
                    <td>
                      <button onClick={() => setExpandedQcId(expandedQcId === qc.id ? null : qc.id)} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <FileSearch size={13} /> Lab Report {expandedQcId === qc.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </td>
                    <td>
                      <button onClick={() => deleteQc(qc.id)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                  {expandedQcId === qc.id && (
                    <tr>
                      <td colSpan={8} style={{ padding: '0 0 12px', background: '#0f1620', border: `1px solid ${BORDER}`, borderTop: 'none' }}>
                        <div style={{ padding: '4px 14px' }}>
                          <DocumentUploads entityType="qc_check" entityId={qc.id} docType="lab_report" label="Lab Report / Evidence Photo" />
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {sectionCard('Complaints',
        <button onClick={() => setShowComplaintForm(!showComplaintForm)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>+ Log Complaint</button>,
        <>
          {showComplaintForm && (
            <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input placeholder="Customer name" value={complaintForm.complainantName} style={inputStyle} onChange={e => setComplaintForm({ ...complaintForm, complainantName: e.target.value })} />
              <select value={complaintForm.batchId} style={inputStyle} onChange={e => setComplaintForm({ ...complaintForm, batchId: e.target.value })}>
                <option value="">Related batch (optional)</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.batch_code || b.id.slice(0, 8)} — {b.product_name}</option>)}
              </select>
              <select value={complaintForm.category} style={inputStyle} onChange={e => setComplaintForm({ ...complaintForm, category: e.target.value })}>
                {options.complaintCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={complaintForm.priority} style={inputStyle} onChange={e => setComplaintForm({ ...complaintForm, priority: e.target.value })}>
                {options.priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input placeholder="Description" value={complaintForm.description} style={{ ...inputStyle, flex: '1 1 240px' }} onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })} />
              <button onClick={createComplaint} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Save Complaint</button>
            </div>
          )}
          {complaints.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No complaints yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '8px 8px 8px 0' }}>Customer</th><th>Description</th><th>Category</th><th>Priority</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0' }}>{c.complainant_name}</td>
                    <td>{c.description}</td>
                    <td>{c.category || '—'}</td>
                    <td><span style={{ color: PRIORITY_COLOR[c.priority] || '#8b96a8' }}>{c.priority || '—'}</span></td>
                    <td>
                      <span style={{
                        background: c.status === 'resolved' ? 'rgba(46,125,95,0.15)' : 'rgba(201,165,69,0.15)',
                        color: c.status === 'resolved' ? '#4fd18b' : GOLD,
                        padding: '3px 10px', borderRadius: 12, fontSize: 12
                      }}>{c.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {c.status === 'pending' && (
                          <button onClick={() => resolveComplaint(c.id)} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>Resolve</button>
                        )}
                        <button onClick={() => deleteComplaint(c.id)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {sectionCard(
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IndianRupee size={15} /> Refund Requests</span>,
        <button onClick={() => setShowRefundForm(!showRefundForm)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>+ New Refund Request</button>,
        <>
          <div style={{ fontSize: 11, color: '#5a6578', marginBottom: 14 }}>
            BRD Section 19.2 — a refund can never self-approve: an OPS user (Local Admin) initiates it here, then only an Admin (District Head) can approve it, and only after recording the seller's consent.
          </div>
          {showRefundForm && (
            <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input placeholder="Customer name" value={refundForm.customerName} style={inputStyle} onChange={e => setRefundForm({ ...refundForm, customerName: e.target.value })} />
              <select value={refundForm.orderId} style={inputStyle} onChange={e => setRefundForm({ ...refundForm, orderId: e.target.value })}>
                <option value="">Related order (optional)</option>
                {orders.map(o => <option key={o.id} value={o.id}>{o.order_ref} — {o.product_name} (₹{o.amount})</option>)}
              </select>
              <select value={refundForm.complaintId} style={inputStyle} onChange={e => setRefundForm({ ...refundForm, complaintId: e.target.value })}>
                <option value="">Related complaint (optional)</option>
                {complaints.map(c => <option key={c.id} value={c.id}>{c.complainant_name} — {c.category}</option>)}
              </select>
              <select value={refundForm.refundType} style={inputStyle} onChange={e => setRefundForm({ ...refundForm, refundType: e.target.value })}>
                <option value="refund">Refund</option>
                <option value="replacement">Replacement</option>
                <option value="goodwill_credit">Goodwill Credit</option>
              </select>
              <input placeholder="Requested amount (₹)" type="number" value={refundForm.requestedAmount} style={inputStyle} onChange={e => setRefundForm({ ...refundForm, requestedAmount: e.target.value })} />
              <input placeholder="Reason" value={refundForm.reason} style={{ ...inputStyle, flex: '1 1 240px' }} onChange={e => setRefundForm({ ...refundForm, reason: e.target.value })} />
              <button onClick={createRefund} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Initiate Request</button>
              {refundError && <div style={{ color: '#e0708e', fontSize: 12, width: '100%' }}>{refundError}</div>}
            </div>
          )}
          {refunds.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No refund requests yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '8px 8px 8px 0' }}>Refund ID</th><th>Customer</th><th>Order</th><th>Type</th><th>Amount</th><th>Initiated By</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {refunds.map(r => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{r.refund_code}</td>
                    <td>{r.customer_name}<div style={{ fontSize: 11, color: '#8b96a8' }}>{r.reason}</div></td>
                    <td style={{ color: '#8b96a8' }}>{r.order_ref || '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{r.refund_type.replace('_', ' ')}</td>
                    <td>₹{r.requested_amount}</td>
                    <td style={{ color: '#8b96a8' }}>{r.initiated_by}</td>
                    <td>
                      <span style={{ background: `${REFUND_STATUS_COLOR[r.status]}22`, color: REFUND_STATUS_COLOR[r.status], padding: '3px 10px', borderRadius: 12, fontSize: 12, textTransform: 'capitalize' }}>{r.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {r.status === 'initiated' && user.role === 'ADMIN' && (
                          <>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#8b96a8' }}>
                              <input type="checkbox" checked={!!consentDraft[r.id]} onChange={e => setConsentDraft({ ...consentDraft, [r.id]: e.target.checked })} />
                              Seller consent obtained
                            </label>
                            <button onClick={() => approveRefund(r.id)} style={{ background: 'none', border: 'none', color: '#4fd18b', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>Approve</button>
                            <button onClick={() => rejectRefund(r.id)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>Reject</button>
                          </>
                        )}
                        {r.status === 'approved' && (
                          <button onClick={() => disburseRefund(r.id)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}>Mark Disbursed</button>
                        )}
                        <button onClick={() => deleteRefund(r.id)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {sectionCard('Compliance & Certifications', null,
        products.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No products yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                <th style={{ padding: '8px 8px 8px 0' }}>Product</th><th>FSSAI License</th><th>Shelf Life</th><th>Batches with QC</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '8px 8px 8px 0' }}>{p.name}</td>
                  <td>{p.fssai_license || '—'}</td>
                  <td>{p.shelf_life || '—'}</td>
                  <td>{qcChecks.filter(qc => qc.product_name === p.name).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
      </div>

      {/* Right column */}
      <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
          <strong style={{ color: 'white', fontSize: 13 }}>Quality Overview</strong>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
            <div style={{
              width: 110, height: 110, borderRadius: '50%',
              background: `conic-gradient(#2e7d5f ${summary.passRate * 3.6}deg, #0f1620 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                width: 84, height: 84, borderRadius: '50%', background: CARD_BG,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>{summary.passRate}%</div>
                <div style={{ fontSize: 10, color: '#8b96a8' }}>Pass Rate</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#8b96a8' }}>QC Checks</span><span style={{ color: 'white' }}>{summary.totalChecks}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4fd18b' }}>Passed</span><span style={{ color: 'white' }}>{summary.passed}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: GOLD }}>Pending</span><span style={{ color: 'white' }}>0</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#e0708e' }}>Failed</span><span style={{ color: 'white' }}>{summary.failed}</span></div>
          </div>
        </div>

        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
          <strong style={{ color: 'white', fontSize: 13 }}>Compliance & Certifications</strong>
          <div>
            {checklistRow('FSSAI License', productsWithFssai === products.length && products.length > 0, `${productsWithFssai}/${products.length} products`)}
            {checklistRow('Batch Documentation', batchDocsComplete, `${batches.filter(b => b.ingredients && b.origin_location).length}/${batches.length} batches complete`)}
            {checklistRow('Quality Check Records', qcRecordsAvailable, `${qcChecks.length} check(s) recorded`)}
            {checklistRow('Inspection Notes', inspectionReportsAvailable, inspectionReportsAvailable ? 'Available' : 'None recorded yet')}
          </div>
          {allCompliant && (
            <div style={{
              marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(46,125,95,0.15)',
              border: '1px solid #2e7d5f', color: '#5fd6a8', fontSize: 12
            }}>All compliance requirements are up to date.</div>
          )}
        </div>

        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
          <strong style={{ color: 'white', fontSize: 13 }}>Quick Actions</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {quickLink('View All Batches', '/products', Package)}
            {quickLink('Blockchain Ledger', '/ledger', FileSearch)}
            {quickLink('Reports & Analytics', '/reports', BarChart3)}
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}

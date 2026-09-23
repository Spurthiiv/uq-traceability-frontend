import { Fragment, useEffect, useState } from 'react';
import { Wallet, CheckCircle2, Clock, Percent, Users, AlertTriangle, ChevronDown, ChevronUp, Trash2, Timer, Pencil, Truck, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvent } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import Layout from '../Layout';

const DEFAULT_MAP_CENTER = [13.0, 76.1];
const orderMarkerIcon = divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#c9a545;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>',
  iconSize: [16, 16], iconAnchor: [8, 8],
});

function DeliveryMapPicker({ onPick }) {
  useMapEvent('click', (e) => onPick(e.latlng));
  return null;
}

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

const inputStyle = { background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white', padding: 8, borderRadius: 6 };

const EMPTY_ORDER = {
  customerName: '', productName: '', sellerName: '', riderName: '', quantity: '', amount: '', status: 'pending', paymentMethod: 'UPI', couponCode: '',
  deliveryLatitude: null, deliveryLongitude: null, hubName: '',
};
const EMPTY_SELLER_SETTLEMENT = { settlementType: 'seller', sellerName: '', period: '', grossOrderValue: '', commissionPercent: '', ordersCount: '', refundAdjustment: '' };
const EMPTY_CP_SETTLEMENT = { settlementType: 'cp_hub', cpId: '', hubName: '', period: '', grossOrderValue: '', commissionPercent: '', ordersCount: '', refundAdjustment: '' };
const EMPTY_RIDER_SETTLEMENT = { settlementType: 'rider', riderName: '', period: '', grossOrderValue: '', commissionPercent: '0', ordersCount: '', refundAdjustment: '' };

const STATUS_LABEL = { pending: 'Pending', processing: 'Processing', released: 'Paid' };
const STATUS_COLOR = { pending: GOLD, processing: '#3b82c4', released: '#4fd18b' };

export default function FinanceSettlements({ user, onLogout }) {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [sellerSettlements, setSellerSettlements] = useState([]);
  const [cpSettlements, setCpSettlements] = useState([]);
  const [riderSettlements, setRiderSettlements] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState(EMPTY_ORDER);
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [sellerForm, setSellerForm] = useState(EMPTY_SELLER_SETTLEMENT);
  const [showCpForm, setShowCpForm] = useState(false);
  const [cpForm, setCpForm] = useState(EMPTY_CP_SETTLEMENT);
  const [showRiderForm, setShowRiderForm] = useState(false);
  const [riderForm, setRiderForm] = useState(EMPTY_RIDER_SETTLEMENT);
  const [expandedId, setExpandedId] = useState(null);
  const [payoutDraft, setPayoutDraft] = useState({ paymentMethod: 'Bank Transfer', transactionReference: '' });
  const [exceptions, setExceptions] = useState([]);
  const [orderError, setOrderError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [products, setProducts] = useState([]);
  const [riders, setRiders] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [showDeliveryMap, setShowDeliveryMap] = useState(false);
  const [nearestHubPreview, setNearestHubPreview] = useState(null);

  const load = () => {
    api.get('/finance/summary').then(r => setSummary(r.data));
    api.get('/orders').then(r => setOrders(r.data));
    api.get('/finance/settlements?type=seller').then(r => setSellerSettlements(r.data));
    api.get('/finance/settlements?type=cp_hub').then(r => setCpSettlements(r.data));
    api.get('/finance/settlements?type=rider').then(r => setRiderSettlements(r.data));
    api.get('/orders/exceptions?hours=24').then(r => setExceptions(r.data));
    api.get('/products').then(r => setProducts(r.data));
    api.get('/auth/riders').then(r => setRiders(r.data));
    api.get('/master-data/hubs').then(r => setHubs(r.data));
  };
  useEffect(() => { load(); }, []);

  const assignRider = async (orderId, riderName) => {
    await api.patch(`/orders/${orderId}/rider`, { riderName });
    load();
  };

  const assignHub = async (orderId, hubName) => {
    await api.patch(`/orders/${orderId}/hub`, { hubName });
    load();
  };

  // Picking a delivery point looks up the nearest real (placed) hub as a
  // live preview — the order form's Hub field is pre-filled from it but
  // stays editable, since the admin might know better than straight-line
  // distance (e.g. road access, hub capacity).
  const pickDeliveryLocation = async (latlng) => {
    const { lat, lng } = latlng;
    setOrderForm(prev => ({ ...prev, deliveryLatitude: lat, deliveryLongitude: lng }));
    try {
      const { data } = await api.get('/orders/nearest-hub', { params: { lat, lng } });
      setNearestHubPreview(data);
      if (data) setOrderForm(prev => ({ ...prev, hubName: data.name }));
    } catch {
      setNearestHubPreview(null);
    }
  };

  // Auto-fills the order amount from the product's real price × quantity —
  // admin can still type over it, this just removes having to do the math
  // (or remember the price) by hand.
  const applyProductPricing = (productName, quantity) => {
    const product = products.find(p => p.name.trim().toLowerCase() === productName.trim().toLowerCase());
    if (!product || !product.price) return null;
    const qty = Number(quantity) || 1;
    return Math.round(product.price * qty * 100) / 100;
  };

  const onOrderProductChange = (productName) => {
    const computed = applyProductPricing(productName, orderForm.quantity);
    setOrderForm(prev => ({ ...prev, productName, amount: computed ?? prev.amount }));
  };

  const onOrderQuantityChange = (quantity) => {
    const computed = applyProductPricing(orderForm.productName, quantity);
    setOrderForm(prev => ({ ...prev, quantity, amount: computed ?? prev.amount }));
  };

  const createOrder = async () => {
    if (!orderForm.customerName || !orderForm.productName || !orderForm.amount) return;
    setOrderError('');
    try {
      await api.post('/orders', orderForm);
      setOrderForm(EMPTY_ORDER);
      setShowOrderForm(false);
      setShowDeliveryMap(false);
      setNearestHubPreview(null);
      load();
    } catch (err) {
      setOrderError(err.response?.data?.error || 'Failed to create order');
    }
  };

  const createSellerSettlement = async () => {
    if (!sellerForm.sellerName) return;
    await api.post('/finance/settlements', sellerForm);
    setSellerForm(EMPTY_SELLER_SETTLEMENT);
    setShowSellerForm(false);
    load();
  };

  const createCpSettlement = async () => {
    if (!cpForm.cpId) return;
    await api.post('/finance/settlements', cpForm);
    setCpForm(EMPTY_CP_SETTLEMENT);
    setShowCpForm(false);
    load();
  };

  const createRiderSettlement = async () => {
    if (!riderForm.riderName) return;
    await api.post('/finance/settlements', riderForm);
    setRiderForm(EMPTY_RIDER_SETTLEMENT);
    setShowRiderForm(false);
    load();
  };

  const updateStatus = async (id, status) => {
    await api.patch(`/finance/settlements/${id}/status`, {
      status,
      paymentMethod: payoutDraft.paymentMethod,
      transactionReference: payoutDraft.transactionReference,
    });
    setPayoutDraft({ paymentMethod: 'Bank Transfer', transactionReference: '' });
    load();
  };

  const viewInvoice = async (order) => {
    const { data: invoice } = await api.post(`/invoices/generate/${order.id}`);
    const w = window.open('', '_blank');
    if (!w) {
      alert('Your browser blocked the invoice popup. Please allow popups for this site and try again.');
      return;
    }
    w.document.title = invoice.invoice_number;
    w.document.body.style.cssText = 'font-family:sans-serif;padding:40px;max-width:480px;margin:0 auto;color:#1a1a1a;';

    const heading = w.document.createElement('h2');
    heading.textContent = 'Udyami Queens';
    const sub = w.document.createElement('div');
    sub.style.cssText = 'color:#888;margin-bottom:20px;';
    sub.textContent = 'Tax Invoice';

    const meta = w.document.createElement('div');
    meta.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px;';
    const metaLeft = w.document.createElement('div');
    const invNoLabel = w.document.createElement('div'); invNoLabel.textContent = `Invoice No: ${invoice.invoice_number}`;
    const invDateLabel = w.document.createElement('div'); invDateLabel.textContent = `Date: ${invoice.created_at}`;
    metaLeft.append(invNoLabel, invDateLabel);
    const metaRight = w.document.createElement('div');
    metaRight.style.cssText = 'text-align:right;';
    const orderRefLabel = w.document.createElement('div'); orderRefLabel.textContent = `Order: ${invoice.order.order_ref}`;
    const custLabel = w.document.createElement('div'); custLabel.textContent = `Customer: ${invoice.order.customer_name}`;
    metaRight.append(orderRefLabel, custLabel);
    meta.append(metaLeft, metaRight);

    const table = w.document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;';
    const rows = [
      ['Product', invoice.order.product_name],
      ['Quantity', invoice.order.quantity || '—'],
    ];
    rows.forEach(([label, value]) => {
      const tr = w.document.createElement('tr');
      const td1 = w.document.createElement('td'); td1.style.cssText = 'padding:6px 0;color:#666;border-bottom:1px solid #eee;'; td1.textContent = label;
      const td2 = w.document.createElement('td'); td2.style.cssText = 'padding:6px 0;text-align:right;border-bottom:1px solid #eee;'; td2.textContent = value;
      tr.append(td1, td2);
      table.appendChild(tr);
    });

    const totals = [
      ['Subtotal', `₹${invoice.subtotal}`],
      ...(invoice.discount_amount ? [['Discount applied', `−₹${invoice.discount_amount}`]] : []),
      [`GST (${invoice.gst_percent}%)`, `₹${invoice.gst_amount}`],
    ];
    totals.forEach(([label, value]) => {
      const tr = w.document.createElement('tr');
      const td1 = w.document.createElement('td'); td1.style.cssText = 'padding:6px 0;color:#666;'; td1.textContent = label;
      const td2 = w.document.createElement('td'); td2.style.cssText = 'padding:6px 0;text-align:right;'; td2.textContent = value;
      tr.append(td1, td2);
      table.appendChild(tr);
    });
    const totalTr = w.document.createElement('tr');
    const totalTd1 = w.document.createElement('td'); totalTd1.style.cssText = 'padding:10px 0;font-weight:bold;border-top:2px solid #333;'; totalTd1.textContent = 'Total';
    const totalTd2 = w.document.createElement('td'); totalTd2.style.cssText = 'padding:10px 0;text-align:right;font-weight:bold;border-top:2px solid #333;'; totalTd2.textContent = `₹${invoice.total_amount}`;
    totalTr.append(totalTd1, totalTd2);
    table.appendChild(totalTr);

    const footer = w.document.createElement('div');
    footer.style.cssText = 'font-size:11px;color:#aaa;margin-top:20px;';
    footer.textContent = 'This is a system-generated invoice from Udyami Queens (FCMCSL).';

    w.document.body.append(heading, sub, meta, table, footer);
    w.print();
    load();
  };

  const deleteSettlement = async (id) => {
    if (!window.confirm('Delete this settlement? This cannot be undone.')) return;
    await api.delete(`/finance/settlements/${id}`);
    if (expandedId === id) setExpandedId(null);
    load();
  };

  const toggleExpand = (s) => {
    setExpandedId(expandedId === s.id ? null : s.id);
    setEditingId(null);
    setPayoutDraft({ paymentMethod: s.payment_method || 'Bank Transfer', transactionReference: s.transaction_reference || '' });
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditForm({
      cpId: s.cp_id || '', hubName: s.hub_name || '', sellerName: s.seller_name || '', riderName: s.rider_name || '',
      period: s.period || '', grossOrderValue: s.gross_order_value || 0,
      commissionPercent: s.commission_percent || 0, ordersCount: s.orders_count || 0,
      refundAdjustment: s.refund_adjustment || 0,
    });
  };

  const saveEdit = async (id) => {
    await api.patch(`/finance/settlements/${id}`, editForm);
    setEditingId(null);
    load();
  };

  const statTile = (label, value, Icon, color) => (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, flex: '1 1 180px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color="white" />
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>{value}</div>
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

  const statusBadge = (status) => (
    <span style={{
      background: `${STATUS_COLOR[status] || GOLD}22`, color: STATUS_COLOR[status] || GOLD,
      padding: '3px 10px', borderRadius: 12, fontSize: 12
    }}>{STATUS_LABEL[status] || status}</span>
  );

  const detailField = (label, value) => (
    <div>
      <div style={{ color: '#8b96a8', fontSize: 11, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: 'white', fontSize: 13, marginTop: 2 }}>{value ?? '—'}</div>
    </div>
  );

  const settlementDetail = (s) => {
    if (editingId === s.id) {
      return (
        <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16, marginTop: -1, marginBottom: 8 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {s.settlement_type === 'seller' ? (
              <input placeholder="Queen Seller name" value={editForm.sellerName} style={inputStyle} onChange={e => setEditForm({ ...editForm, sellerName: e.target.value })} />
            ) : s.settlement_type === 'rider' ? (
              <select value={editForm.riderName} style={inputStyle} onChange={e => setEditForm({ ...editForm, riderName: e.target.value })}>
                <option value="">Select rider…</option>
                {riders.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            ) : (
              <>
                <input placeholder="CP / Hub ID" value={editForm.cpId} style={inputStyle} onChange={e => setEditForm({ ...editForm, cpId: e.target.value })} />
                <input placeholder="Hub name" value={editForm.hubName} style={inputStyle} onChange={e => setEditForm({ ...editForm, hubName: e.target.value })} />
              </>
            )}
            <input placeholder="Period" value={editForm.period} style={inputStyle} onChange={e => setEditForm({ ...editForm, period: e.target.value })} />
            <input placeholder="Orders count" type="number" value={editForm.ordersCount} style={inputStyle} onChange={e => setEditForm({ ...editForm, ordersCount: e.target.value })} />
            <input placeholder="Gross order value (₹)" type="number" value={editForm.grossOrderValue} style={inputStyle} onChange={e => setEditForm({ ...editForm, grossOrderValue: e.target.value })} />
            <input placeholder="Commission %" type="number" value={editForm.commissionPercent} style={inputStyle} onChange={e => setEditForm({ ...editForm, commissionPercent: e.target.value })} />
            <input placeholder="Refund / adjustment (₹)" type="number" value={editForm.refundAdjustment} style={inputStyle} onChange={e => setEditForm({ ...editForm, refundAdjustment: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => saveEdit(s.id)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>Save Changes</button>
            <button onClick={() => setEditingId(null)} style={{ background: '#243044', color: '#cfd6e0', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      );
    }

    return (
    <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16, marginTop: -1, marginBottom: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 16 }}>
        {detailField('Settlement ID', s.settlement_code)}
        {detailField(
          s.settlement_type === 'seller' ? 'Seller' : s.settlement_type === 'rider' ? 'Rider' : 'CP / Hub',
          s.settlement_type === 'seller' ? s.seller_name : s.settlement_type === 'rider' ? s.rider_name : `${s.cp_id}${s.hub_name ? ' · ' + s.hub_name : ''}`
        )}
        {detailField('Orders', s.orders_count || 0)}
        {detailField('Gross Order Value', `₹${s.gross_order_value || 0}`)}
        {detailField('Platform Commission', `₹${s.commissionAmount} (${s.commission_percent || 0}%)`)}
        {detailField('Refunds / Adjustments', `₹${s.refund_adjustment || 0}`)}
        {detailField('Net Payable', <strong style={{ color: '#4fd18b' }}>₹{s.netPayable}</strong>)}
        {detailField('Payment Method', s.payment_method)}
        {detailField('Transaction Reference', s.transaction_reference)}
        {detailField('Settlement Date', s.settlement_date ? s.settlement_date.slice(0, 10) : null)}
        {detailField('Status', statusBadge(s.status))}
      </div>

      {s.status !== 'released' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', borderTop: `1px solid ${BORDER}`, paddingTop: 14, marginBottom: 12 }}>
          <select value={payoutDraft.paymentMethod} style={inputStyle} onChange={e => setPayoutDraft({ ...payoutDraft, paymentMethod: e.target.value })}>
            <option>Bank Transfer</option><option>UPI</option><option>Cash</option>
          </select>
          <input placeholder="Transaction reference" value={payoutDraft.transactionReference} style={inputStyle}
            onChange={e => setPayoutDraft({ ...payoutDraft, transactionReference: e.target.value })} />
          {s.status === 'pending' && (
            <button onClick={() => updateStatus(s.id, 'processing')} style={{ background: '#243044', color: '#cfd6e0', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>Mark Processing</button>
          )}
          <button onClick={() => updateStatus(s.id, 'released')} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>Mark Paid</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, borderTop: s.status === 'released' ? `1px solid ${BORDER}` : 'none', paddingTop: s.status === 'released' ? 14 : 0 }}>
        <button onClick={() => startEdit(s)} style={{
          background: 'none', border: 'none', color: GOLD, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12
        }}><Pencil size={13} /> Edit settlement</button>
        <button onClick={() => deleteSettlement(s.id)} style={{
          background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12
        }}><Trash2 size={13} /> Delete settlement</button>
      </div>
    </div>
    );
  };

  if (!summary) return <Layout user={user} onLogout={onLogout} title="Finance & Settlements"><p style={{ color: '#cfd6e0' }}>Loading...</p></Layout>;

  return (
    <Layout user={user} onLogout={onLogout} title="Finance & Settlements">
      <div style={{ color: '#8b96a8', fontSize: 11, marginTop: -12, marginBottom: 16, fontStyle: 'italic' }}>
        Orders and settlements are recorded manually by your team — there's no live payment gateway connected yet, so these are real internal records, not automated bank transfers.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        {statTile('Total Sales', `₹${summary.totalRevenue}`, Wallet, '#7b5fd6')}
        {statTile('Pending Settlements', `₹${summary.pendingSettlements}`, Clock, GOLD)}
        {statTile('Completed Settlements', `${summary.completedSettlementsCount} · ₹${summary.totalReleased}`, CheckCircle2, '#2e7d5f')}
        {statTile('Platform Commission', `₹${summary.platformCommission}`, Percent, '#3b82c4')}
        {statTile('Queen Seller Earnings', `₹${summary.sellerPayouts}`, Users, '#a855c7')}
        {statTile('Rider Earnings', `₹${summary.riderPayouts}`, Truck, '#3b9c6d')}
        {statTile('Failed Transactions', summary.failedTransactions, AlertTriangle, '#c4443b')}
      </div>

      {sectionCard('Orders & Transactions',
        <button onClick={() => setShowOrderForm(!showOrderForm)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>+ New Order</button>,
        <>
          {showOrderForm && (
            <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input placeholder="Customer name" value={orderForm.customerName} style={inputStyle} onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })} />
              <input list="order-product-names" placeholder="Product name" value={orderForm.productName} style={inputStyle} onChange={e => onOrderProductChange(e.target.value)} />
              <datalist id="order-product-names">
                {products.map(p => <option key={p.id} value={p.name} />)}
              </datalist>
              <input placeholder="Seller name" value={orderForm.sellerName} style={inputStyle} onChange={e => setOrderForm({ ...orderForm, sellerName: e.target.value })} />
              <select value={orderForm.riderName} style={inputStyle} onChange={e => setOrderForm({ ...orderForm, riderName: e.target.value })}>
                <option value="">Assign rider (optional)</option>
                {riders.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              <input placeholder="Quantity" type="number" value={orderForm.quantity} style={inputStyle} onChange={e => onOrderQuantityChange(e.target.value)} />
              <input placeholder="Amount (₹)" type="number" value={orderForm.amount} style={inputStyle} onChange={e => setOrderForm({ ...orderForm, amount: e.target.value })} />
              <select value={orderForm.status} style={inputStyle} onChange={e => setOrderForm({ ...orderForm, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select value={orderForm.paymentMethod} style={inputStyle} onChange={e => setOrderForm({ ...orderForm, paymentMethod: e.target.value })}>
                <option>UPI</option><option>Cash</option><option>Card</option><option>Bank Transfer</option><option>COD</option>
              </select>
              <input placeholder="Coupon code (optional)" value={orderForm.couponCode} style={inputStyle} onChange={e => setOrderForm({ ...orderForm, couponCode: e.target.value })} />
              <select value={orderForm.hubName} style={inputStyle} onChange={e => setOrderForm({ ...orderForm, hubName: e.target.value })}>
                <option value="">Fulfilling hub (optional)</option>
                {hubs.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
              </select>
              <button onClick={createOrder} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Create Order</button>

              <button type="button" onClick={() => setShowDeliveryMap(!showDeliveryMap)} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
                <MapPin size={13} /> {showDeliveryMap ? 'Hide' : 'Set'} delivery location on map (auto-picks nearest hub)
              </button>
              {showDeliveryMap && (
                <div style={{ width: '100%' }}>
                  <div style={{ height: 220, borderRadius: 8, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                    <MapContainer center={DEFAULT_MAP_CENTER} zoom={8} style={{ height: '100%', width: '100%', cursor: 'crosshair' }}>
                      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <DeliveryMapPicker onPick={pickDeliveryLocation} />
                      {orderForm.deliveryLatitude != null && (
                        <Marker position={[orderForm.deliveryLatitude, orderForm.deliveryLongitude]} icon={orderMarkerIcon} />
                      )}
                    </MapContainer>
                  </div>
                  {orderForm.deliveryLatitude != null && (
                    <div style={{ fontSize: 12, color: '#8b96a8', marginTop: 6 }}>
                      Delivery point: {orderForm.deliveryLatitude.toFixed(4)}, {orderForm.deliveryLongitude.toFixed(4)}
                      {nearestHubPreview ? ` — nearest hub: ${nearestHubPreview.name} (${nearestHubPreview.distanceKm} km away)` : ' — no hubs placed on the map yet, so none could be suggested'}
                    </div>
                  )}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#5a6578', width: '100%' }}>Picking a product with a set price auto-fills the amount (quantity × price) — you can still edit it. A transaction is auto-logged only if status is Confirmed or Delivered. A valid coupon code recalculates the charged amount.</div>
              {orderError && <div style={{ color: '#e0708e', fontSize: 12, width: '100%' }}>{orderError}</div>}
            </div>
          )}
          {orders.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No orders yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '8px 8px 8px 0' }}>Order ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Payment Method</th><th>Hub</th><th>Rider</th><th>Status</th><th>Date</th><th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{o.order_ref}</td>
                    <td>{o.customer_name}</td>
                    <td>{o.product_name}</td>
                    <td>₹{o.amount}</td>
                    <td>{o.payment_method || '—'}</td>
                    <td>
                      <select value={o.hub_name || ''} onChange={e => assignHub(o.id, e.target.value)} style={{ ...inputStyle, padding: '4px 8px', fontSize: 12 }}>
                        <option value="">Unassigned</option>
                        {hubs.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={o.rider_name || ''} onChange={e => assignRider(o.id, e.target.value)} style={{ ...inputStyle, padding: '4px 8px', fontSize: 12 }}>
                        <option value="">Unassigned</option>
                        {riders.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <span style={{
                        background: o.status === 'delivered' ? 'rgba(46,125,95,0.15)' : o.status === 'cancelled' ? 'rgba(198,40,40,0.15)' : 'rgba(201,165,69,0.15)',
                        color: o.status === 'delivered' ? '#4fd18b' : o.status === 'cancelled' ? '#e0708e' : GOLD,
                        padding: '3px 10px', borderRadius: 12, fontSize: 12, textTransform: 'capitalize'
                      }}>{o.status}</span>
                    </td>
                    <td style={{ color: '#8b96a8', fontSize: 12 }}>{o.created_at}</td>
                    <td>
                      <button onClick={() => viewInvoice(o)} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>Invoice</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {sectionCard(
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Timer size={15} /> Order Exceptions (Pending &gt; 24h)</span>,
        null,
        exceptions.length === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center', color: '#4fd18b', fontSize: 13 }}>No stale orders — everything is moving within SLA.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                <th style={{ padding: '8px 8px 8px 0' }}>Order ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Pending For</th><th></th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map(o => (
                <tr key={o.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{o.order_ref}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.product_name}</td>
                  <td>₹{o.amount}</td>
                  <td style={{ color: '#e0708e', fontWeight: 'bold' }}>{o.hoursPending}h</td>
                  <td>
                    <select defaultValue="" onChange={async e => { if (!e.target.value) return; await api.patch(`/orders/${o.id}/status`, { status: e.target.value }); load(); }} style={{ ...inputStyle, padding: '4px 8px', fontSize: 12 }}>
                      <option value="" disabled>Intervene…</option>
                      <option value="confirmed">Mark Confirmed</option>
                      <option value="cancelled">Cancel Order</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {sectionCard('Seller Settlements',
        <button onClick={() => setShowSellerForm(!showSellerForm)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>+ New Settlement</button>,
        <>
          {showSellerForm && (
            <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input list="seller-names" placeholder="Queen Seller name" value={sellerForm.sellerName} style={inputStyle} onChange={e => setSellerForm({ ...sellerForm, sellerName: e.target.value })} />
              <datalist id="seller-names">
                {summary.sellerPayoutRows.map(r => <option key={r.seller} value={r.seller} />)}
              </datalist>
              <input placeholder="Period (e.g. Sep 2026)" value={sellerForm.period} style={inputStyle} onChange={e => setSellerForm({ ...sellerForm, period: e.target.value })} />
              <input placeholder="Orders count" type="number" value={sellerForm.ordersCount} style={inputStyle} onChange={e => setSellerForm({ ...sellerForm, ordersCount: e.target.value })} />
              <input placeholder="Gross order value (₹)" type="number" value={sellerForm.grossOrderValue} style={inputStyle} onChange={e => setSellerForm({ ...sellerForm, grossOrderValue: e.target.value })} />
              <input placeholder={`Commission % (default ${summary.defaultCpCommissionPercent ?? ''})`} type="number" value={sellerForm.commissionPercent} style={inputStyle} onChange={e => setSellerForm({ ...sellerForm, commissionPercent: e.target.value })} />
              <input placeholder="Refund / adjustment (₹, optional)" type="number" value={sellerForm.refundAdjustment} style={inputStyle} onChange={e => setSellerForm({ ...sellerForm, refundAdjustment: e.target.value })} />
              <button onClick={createSellerSettlement} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Create Settlement</button>
            </div>
          )}
          {sellerSettlements.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No seller settlements yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '8px 8px 8px 0' }}>Settlement ID</th><th>Queen Seller</th><th>Orders</th><th>Gross</th><th>UQ Commission</th><th>Net Payable</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {sellerSettlements.map(s => (
                  <Fragment key={s.id}>
                    <tr onClick={() => toggleExpand(s)} style={{ borderTop: `1px solid ${BORDER}`, cursor: 'pointer' }}>
                      <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{s.settlement_code}</td>
                      <td>{s.seller_name}</td>
                      <td>{s.orders_count || 0}</td>
                      <td>₹{s.gross_order_value || 0}</td>
                      <td>₹{s.commissionAmount}</td>
                      <td style={{ fontWeight: 'bold' }}>₹{s.netPayable}</td>
                      <td>{statusBadge(s.status)}</td>
                      <td>{expandedId === s.id ? <ChevronUp size={15} color="#8b96a8" /> : <ChevronDown size={15} color="#8b96a8" />}</td>
                    </tr>
                    {expandedId === s.id && (
                      <tr><td colSpan={8} style={{ padding: 0 }}>{settlementDetail(s)}</td></tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {sectionCard('CP / Hub Settlements',
        <button onClick={() => setShowCpForm(!showCpForm)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>+ New Settlement</button>,
        <>
          {showCpForm && (
            <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input placeholder="CP / Hub ID" value={cpForm.cpId} style={inputStyle} onChange={e => setCpForm({ ...cpForm, cpId: e.target.value })} />
              <input placeholder="Hub name" value={cpForm.hubName} style={inputStyle} onChange={e => setCpForm({ ...cpForm, hubName: e.target.value })} />
              <input placeholder="Period (e.g. Sep 2026)" value={cpForm.period} style={inputStyle} onChange={e => setCpForm({ ...cpForm, period: e.target.value })} />
              <input placeholder="Orders count" type="number" value={cpForm.ordersCount} style={inputStyle} onChange={e => setCpForm({ ...cpForm, ordersCount: e.target.value })} />
              <input placeholder="Gross order value (₹)" type="number" value={cpForm.grossOrderValue} style={inputStyle} onChange={e => setCpForm({ ...cpForm, grossOrderValue: e.target.value })} />
              <input placeholder={`Commission % (default ${summary.defaultCpCommissionPercent ?? ''})`} type="number" value={cpForm.commissionPercent} style={inputStyle} onChange={e => setCpForm({ ...cpForm, commissionPercent: e.target.value })} />
              <input placeholder="Refund / adjustment (₹, optional)" type="number" value={cpForm.refundAdjustment} style={inputStyle} onChange={e => setCpForm({ ...cpForm, refundAdjustment: e.target.value })} />
              <button onClick={createCpSettlement} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Create Settlement</button>
            </div>
          )}
          {cpSettlements.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No CP/Hub settlements yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '8px 8px 8px 0' }}>Settlement ID</th><th>CP / Hub</th><th>Period</th><th>Orders</th><th>Gross Value</th><th>Commission %</th><th>Amount</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {cpSettlements.map(s => (
                  <Fragment key={s.id}>
                    <tr onClick={() => toggleExpand(s)} style={{ borderTop: `1px solid ${BORDER}`, cursor: 'pointer' }}>
                      <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{s.settlement_code}</td>
                      <td>{s.cp_id} {s.hub_name && `· ${s.hub_name}`}</td>
                      <td>{s.period || '—'}</td>
                      <td>{s.orders_count || 0}</td>
                      <td>₹{s.gross_order_value || 0}</td>
                      <td>{s.commission_percent || 0}%</td>
                      <td>₹{s.amount}</td>
                      <td>{statusBadge(s.status)}</td>
                      <td>{expandedId === s.id ? <ChevronUp size={15} color="#8b96a8" /> : <ChevronDown size={15} color="#8b96a8" />}</td>
                    </tr>
                    {expandedId === s.id && (
                      <tr><td colSpan={9} style={{ padding: 0 }}>{settlementDetail(s)}</td></tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {sectionCard('Rider Settlements',
        <button onClick={() => setShowRiderForm(!showRiderForm)} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>+ New Settlement</button>,
        <>
          {showRiderForm && (
            <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <select value={riderForm.riderName} style={inputStyle} onChange={e => setRiderForm({ ...riderForm, riderName: e.target.value })}>
                <option value="">Select rider…</option>
                {riders.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              <input placeholder="Period (e.g. Sep 2026)" value={riderForm.period} style={inputStyle} onChange={e => setRiderForm({ ...riderForm, period: e.target.value })} />
              <input placeholder="Deliveries count" type="number" value={riderForm.ordersCount} style={inputStyle} onChange={e => setRiderForm({ ...riderForm, ordersCount: e.target.value })} />
              <input placeholder="Gross payout base (₹)" type="number" value={riderForm.grossOrderValue} style={inputStyle} onChange={e => setRiderForm({ ...riderForm, grossOrderValue: e.target.value })} />
              <input placeholder="Commission % (default 0 — flat fee)" type="number" value={riderForm.commissionPercent} style={inputStyle} onChange={e => setRiderForm({ ...riderForm, commissionPercent: e.target.value })} />
              <input placeholder="Refund / adjustment (₹, optional)" type="number" value={riderForm.refundAdjustment} style={inputStyle} onChange={e => setRiderForm({ ...riderForm, refundAdjustment: e.target.value })} />
              <button onClick={createRiderSettlement} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Create Settlement</button>
              <div style={{ fontSize: 11, color: '#5a6578', width: '100%' }}>Riders are paid a flat delivery fee, not a commission cut — commission % defaults to 0 unless overridden.</div>
            </div>
          )}
          {riderSettlements.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No rider settlements yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '8px 8px 8px 0' }}>Settlement ID</th><th>Rider</th><th>Deliveries</th><th>Gross</th><th>Net Payable</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {riderSettlements.map(s => (
                  <Fragment key={s.id}>
                    <tr onClick={() => toggleExpand(s)} style={{ borderTop: `1px solid ${BORDER}`, cursor: 'pointer' }}>
                      <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{s.settlement_code}</td>
                      <td>{s.rider_name}</td>
                      <td>{s.orders_count || 0}</td>
                      <td>₹{s.gross_order_value || 0}</td>
                      <td style={{ fontWeight: 'bold' }}>₹{s.netPayable}</td>
                      <td>{statusBadge(s.status)}</td>
                      <td>{expandedId === s.id ? <ChevronUp size={15} color="#8b96a8" /> : <ChevronDown size={15} color="#8b96a8" />}</td>
                    </tr>
                    {expandedId === s.id && (
                      <tr><td colSpan={7} style={{ padding: 0 }}>{settlementDetail(s)}</td></tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {sectionCard('Estimated Seller Payouts (Unsettled Orders)', null,
        <>
          <div style={{ fontSize: 11, color: '#5a6578', marginBottom: 10 }}>
            Live estimate from delivered/confirmed orders that don't yet have a persisted settlement record above — create a Seller Settlement to lock these in and mark them paid.
          </div>
          {summary.sellerPayoutRows.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No delivered/confirmed orders yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '8px 8px 8px 0' }}>Seller</th><th>Gross Order Value</th><th>Commission Deducted</th><th>Estimated Payout</th>
                </tr>
              </thead>
              <tbody>
                {summary.sellerPayoutRows.map(r => (
                  <tr key={r.seller} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0' }}>{r.seller}</td>
                    <td>₹{r.grossOrderValue}</td>
                    <td style={{ color: '#e0708e' }}>−₹{r.commission}</td>
                    <td style={{ color: '#4fd18b', fontWeight: 'bold' }}>₹{r.payout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {sectionCard('Estimated Rider Payouts (Unsettled Deliveries)', null,
        <>
          <div style={{ fontSize: 11, color: '#5a6578', marginBottom: 10 }}>
            Live estimate from delivered orders with an assigned rider, at the flat Delivery Fee set in Settings › Finance (₹{summary.deliveryFee} per delivery) — create a Rider Settlement to lock these in and mark them paid.
          </div>
          {summary.deliveryFee === 0 && (
            <div style={{ fontSize: 11, color: GOLD, marginBottom: 10 }}>Delivery Fee is currently ₹0 in Settings › Finance — set it there for these estimates to reflect real payouts.</div>
          )}
          {summary.riderPayoutRows.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No delivered orders with an assigned rider yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '8px 8px 8px 0' }}>Rider</th><th>Deliveries</th><th>Estimated Payout</th>
                </tr>
              </thead>
              <tbody>
                {summary.riderPayoutRows.map(r => (
                  <tr key={r.rider} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 8px 8px 0' }}>{r.rider}</td>
                    <td>{r.deliveries}</td>
                    <td style={{ color: '#4fd18b', fontWeight: 'bold' }}>₹{r.payout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </Layout>
  );
}

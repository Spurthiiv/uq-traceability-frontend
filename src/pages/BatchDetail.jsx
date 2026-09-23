import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Trash2, CheckCircle2, XCircle, Download, Printer, ExternalLink,
  Package, Check, Clock
} from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';
import { STAGES, stageIndex, nextStage } from '../stages';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

const NUTRITION_ROWS = [
  ['Protein', 'protein_per_100g'],
  ['Total Carbohydrates', 'carbs_per_100g'],
  ['Total Sugar', 'total_sugar_per_100g'],
  ['Added Sugar', 'added_sugar_per_100g'],
  ['Total Fat', 'total_fat_per_100g'],
  ['Saturated Fat', 'saturated_fat_per_100g'],
  ['Trans Fat', 'trans_fat_per_100g'],
  ['Cholesterol', 'cholesterol_per_100g'],
  ['Sodium', 'sodium_per_100g'],
  ['Energy', 'energy_per_100g'],
];

const sectionCard = (title, children) => (
  <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
    <strong style={{ color: 'white', fontSize: 14 }}>{title}</strong>
    <div style={{ marginTop: 12 }}>{children}</div>
  </div>
);

const infoRow = (label, value) => value ? (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${BORDER}`, fontSize: 13 }}>
    <span style={{ color: '#8b96a8' }}>{label}</span>
    <span style={{ color: '#cfd6e0', textAlign: 'right', maxWidth: '65%' }}>{value}</span>
  </div>
) : null;

const productIcon = (size = 20) => (
  <div style={{
    width: size + 24, height: size + 24, borderRadius: 10, background: 'rgba(201,165,69,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  }}><Package size={size} color={GOLD} /></div>
);

export default function BatchDetail({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [chainValid, setChainValid] = useState(null);
  const [qr, setQr] = useState(null);
  const [barcode, setBarcode] = useState(null);
  const [product, setProduct] = useState(null);
  const [qcChecks, setQcChecks] = useState([]);

  const load = () => {
    api.get(`/batches/${id}`).then(r => {
      setBatch(r.data);
      api.get('/products').then(pr => {
        const match = pr.data.find(p => p.name.trim() === r.data.product_name.trim());
        setProduct(match || null);
      });
    });
    api.get(`/batches/${id}/verify`).then(r => setChainValid(r.data.valid));
    api.get(`/batches/${id}/qr`).then(r => setQr(r.data));
    api.get(`/batches/${id}/barcode`).then(r => setBarcode(r.data));
    api.get('/quality/qc-checks').then(r => setQcChecks(r.data.filter(qc => qc.batch_id === id)));
  };
  useEffect(() => { load(); }, [id]);

  const currentIndex = batch ? stageIndex(batch.ledger[batch.ledger.length - 1]?.event_type) : -1;
  const upcoming = batch ? nextStage(batch.ledger[batch.ledger.length - 1]?.event_type) : null;

  // Real, factual auto-descriptions built from the batch's own data — not
  // invented narrative, just the actual origin/farmer/ingredients formatted
  // into a sentence for whichever stage is being logged.
  const describeStage = (stageKey) => {
    switch (stageKey) {
      case 'INGREDIENT_REGISTERED':
        return `Ingredients registered${batch.ingredients ? `: ${batch.ingredients}` : ''}${batch.farmer_name ? ` (${batch.farmer_name}${batch.origin_location ? `, ${batch.origin_location}` : ''})` : ''}`;
      case 'RECEIVED':
        return 'Received at processing facility';
      case 'BATCH_STARTED':
        return `Batch processing started${batch.batch_code ? ` — ${batch.batch_code}` : ''}`;
      case 'TRANSFORMED':
        return 'Processed and transformed';
      case 'QUALITY_CHECKED':
        return 'Quality inspection completed';
      case 'PACKAGED':
        return `Packed${batch.quantity ? ` in ${batch.quantity} ${batch.unit || ''} units` : ''}`;
      case 'QR_BOUND':
        return 'QR code and batch code bound to this batch';
      case 'TRANSFERRED_TO_SELLER':
        return 'Transferred to Queen Seller';
      case 'RECEIVED_AT_HUB':
        return 'Received at Queen Hub';
      case 'WAREHOUSED':
        return 'Moved to warehouse storage';
      case 'DISPATCHED':
        return 'Dispatched with rider for delivery';
      case 'DELIVERED':
        return 'Delivered to customer';
      default:
        return `${stageKey} stage logged`;
    }
  };

  const logNextStage = async () => {
    if (!upcoming) return;
    await api.post(`/batches/${id}/events`, {
      eventType: upcoming.key,
      eventData: { actor: upcoming.label, description: describeStage(upcoming.key) }
    });
    load();
  };

  const deleteBatch = async () => {
    if (!window.confirm(`Delete batch "${batch.product_name}"? This cannot be undone.`)) return;
    await api.delete(`/batches/${id}`);
    navigate('/dashboard');
  };

  const downloadDataUrl = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const printCodes = () => {
    if (!qr) return;
    const w = window.open('', '_blank');
    if (!w) {
      alert('Your browser blocked the print popup. Please allow popups for this site and try again.');
      return;
    }
    w.document.title = batch.batch_code;
    w.document.body.style.cssText = 'text-align:center;font-family:sans-serif;padding:40px;';

    const heading = w.document.createElement('h2');
    heading.textContent = batch.product_name;

    const img = w.document.createElement('img');
    img.src = qr.qrDataUrl;
    img.style.cssText = 'width:220px;height:220px;';

    const code = w.document.createElement('p');
    code.textContent = batch.batch_code;

    const caption = w.document.createElement('p');
    caption.textContent = 'Scan to trace this product';

    w.document.body.append(heading, img, code, caption);

    if (barcode) {
      const barcodeImg = w.document.createElement('img');
      barcodeImg.src = barcode.barcodeDataUrl;
      barcodeImg.style.cssText = 'width:260px;margin-top:20px;';
      const barcodeCaption = w.document.createElement('p');
      barcodeCaption.textContent = 'For warehouse / inventory scanning';
      w.document.body.append(barcodeImg, barcodeCaption);
    }

    w.print();
  };

  if (!batch) {
    return (
      <Layout user={user} onLogout={onLogout} title="Batch Detail">
        <p style={{ color: '#cfd6e0' }}>Loading...</p>
      </Layout>
    );
  }

  const lastUpdated = batch.ledger.length > 0 ? batch.ledger[batch.ledger.length - 1].timestamp : batch.created_at;
  const latestQc = qcChecks[0]; // already ordered DESC by created_at from the API

  const hasNutrition = product && NUTRITION_ROWS.some(([, key]) => product[key]);
  const features = product ? (product.key_features || '').split('\n').map(f => f.trim()).filter(Boolean) : [];
  const hasCompliance = product && (product.fssai_license || product.shelf_life || product.country_of_origin || product.customer_care_email || product.manufacturer_address || product.return_policy);
  const hasSeller = product && (product.seller_name || product.seller_address || product.seller_fssai);
  const hasProductInfo = product && (hasNutrition || features.length > 0 || hasCompliance || hasSeller || product.description);

  return (
    <Layout user={user} onLogout={onLogout} title="Batch Detail" breadcrumb={batch.product_name}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/products" style={{ color: GOLD, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={14} /> Back to batches
        </Link>
        <button onClick={deleteBatch} style={{
          background: 'rgba(198,40,40,0.15)', border: '1px solid #6b2c2c', color: '#e07a7a',
          borderRadius: 6, cursor: 'pointer', padding: '6px 14px', fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 6
        }}><Trash2 size={14} /> Delete Batch</button>
      </div>

      {/* Header */}
      <div style={{
        background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20,
        marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {productIcon(22)}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ color: 'white', margin: 0 }}>{batch.product_name}</h2>
              <span style={{ background: 'rgba(201,165,69,0.15)', color: GOLD, padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>{batch.status}</span>
            </div>
            <div style={{ color: '#8b96a8', fontSize: 12, marginTop: 4 }}>
              Farmer: {batch.farmer_name} · Origin: {batch.origin_location}
              {batch.ingredients && <> · Ingredients: {batch.ingredients}</>}
              {' · '}Quantity: {batch.initial_quantity ? `${batch.initial_quantity} ${batch.unit} → ` : ''}{batch.quantity} {batch.unit}
              {' · '}Chain Intact: {chainValid === null ? 'checking...' : chainValid ? 'Yes' : 'BROKEN'}
            </div>
          </div>
        </div>
        <span style={{
          background: 'rgba(201,165,69,0.15)', color: GOLD, padding: '4px 12px',
          borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 'bold'
        }}>{batch.batch_code}</span>
      </div>

      <div style={{ display: 'flex', gap: 20, marginTop: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left column */}
        <div style={{ flex: '2 1 480px', minWidth: 0 }}>
          {sectionCard('Batch Information', (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <div>
                {infoRow('Batch ID', batch.batch_code)}
                {infoRow('Product', batch.product_name)}
                {infoRow('Farmer', batch.farmer_name)}
                {infoRow('Origin', batch.origin_location)}
                {infoRow('Quantity', `${batch.initial_quantity ? `${batch.initial_quantity} → ` : ''}${batch.quantity} ${batch.unit || ''}`)}
                {infoRow('Ingredients', batch.ingredients)}
              </div>
              <div>
                {infoRow('Manufacturing Date', batch.harvest_date)}
                {infoRow('Chain Status', chainValid === null ? 'checking...' : (
                  <span style={{ color: chainValid ? '#4fd18b' : '#e0708e', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {chainValid ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {chainValid ? 'Verified' : 'Broken'}
                  </span>
                ))}
                {infoRow('Current Stage', batch.status)}
                {infoRow('Created On', batch.created_at)}
                {infoRow('Last Updated', lastUpdated)}
              </div>
            </div>
          ))}

          {sectionCard('Supply Chain Journey', (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                {upcoming ? (
                  <button onClick={logNextStage} style={{
                    background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6,
                    padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: 13
                  }}>Log Next Stage: {upcoming.label}</button>
                ) : (
                  <span style={{ color: '#4fd18b', fontSize: 13 }}>Journey complete</span>
                )}
              </div>
              {STAGES.map((s, i) => {
                const done = i <= currentIndex;
                const isCurrent = i === currentIndex;
                const entry = batch.ledger.find(e => e.event_type === s.key);
                const detail = entry ? JSON.parse(entry.event_data || '{}') : null;
                return (
                  <div key={s.key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0, fontSize: 11, fontWeight: 'bold',
                      background: done ? '#2e7d5f' : '#0f1620', color: done ? 'white' : '#8b96a8',
                      border: `1px solid ${done ? '#2e7d5f' : BORDER}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>{done ? <Check size={13} /> : i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 13, color: done ? 'white' : '#8b96a8' }}>{s.label}</strong>
                        {isCurrent && (
                          <span style={{ background: 'rgba(201,165,69,0.15)', color: GOLD, padding: '1px 8px', borderRadius: 10, fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={10} /> Current Stage
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: done ? '#cfd6e0' : '#5a6578', marginTop: 2 }}>
                        {done ? (detail?.description || describeStage(s.key)) : 'Pending'}
                      </div>
                      {entry && <div style={{ fontSize: 11, color: '#8b96a8', marginTop: 2 }}>{entry.timestamp}</div>}
                    </div>
                  </div>
                );
              })}
            </>
          ))}

          {sectionCard('Orders Linked to This Batch', (
            batch.orders.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No orders reference this batch yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                    <th style={{ padding: '8px 8px 8px 0' }}>Order ID</th><th>Customer</th><th>Quantity</th><th>Date</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.orders.map(o => (
                    <tr key={o.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '8px 8px 8px 0', fontFamily: 'monospace' }}>{o.order_ref}</td>
                      <td>{o.customer_name}</td>
                      <td>{o.quantity} {batch.unit}</td>
                      <td style={{ color: '#8b96a8' }}>{o.created_at}</td>
                      <td>
                        <span style={{
                          background: o.status === 'delivered' ? 'rgba(46,125,95,0.15)' : 'rgba(201,165,69,0.15)',
                          color: o.status === 'delivered' ? '#4fd18b' : GOLD,
                          padding: '3px 10px', borderRadius: 12, fontSize: 12, textTransform: 'capitalize'
                        }}>{o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ))}

          {hasProductInfo && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <strong style={{ color: 'white', fontSize: 15 }}>Product Information — {product.name}</strong>
                <Link to={`/products/${product.id}`} style={{ color: GOLD, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  View full product page <ExternalLink size={12} />
                </Link>
              </div>

              {product.description && sectionCard('Description', (
                <p style={{ color: '#cfd6e0', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{product.description}</p>
              ))}

              {features.length > 0 && sectionCard('Key Features', (
                <ul style={{ margin: 0, paddingLeft: 18, color: '#cfd6e0', fontSize: 13, lineHeight: 1.8 }}>
                  {features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              ))}

              {hasNutrition && sectionCard('Nutrition — Per 100g', (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {NUTRITION_ROWS.map(([label, key]) => product[key] && (
                      <tr key={key} style={{ borderTop: `1px solid ${BORDER}` }}>
                        <td style={{ padding: '8px 0', color: '#8b96a8' }}>{label}</td>
                        <td style={{ padding: '8px 0', color: 'white', textAlign: 'right', fontWeight: 'bold' }}>{product[key]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ flex: '1 1 300px', minWidth: 280 }}>
          {sectionCard('QR & Barcode', (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                {qr ? (
                  <div style={{ maxWidth: 160 }}>
                    <div style={{ background: 'white', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 150 }}>
                      <img src={qr.qrDataUrl} alt="QR code" style={{ width: 130, height: 130, display: 'block' }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#8b96a8', marginTop: 6 }}>Customer Trace QR</div>
                  </div>
                ) : <div style={{ color: '#8b96a8', fontSize: 12 }}>Generating QR…</div>}

                {barcode ? (
                  <div style={{ maxWidth: 160 }}>
                    <div style={{ background: 'white', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 150 }}>
                      <img src={barcode.barcodeDataUrl} alt="Barcode" style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#8b96a8', marginTop: 6 }}>Inventory Barcode</div>
                  </div>
                ) : <div style={{ color: '#8b96a8', fontSize: 12 }}>Generating barcode…</div>}
              </div>

              <div style={{ color: '#8b96a8', fontSize: 11, marginTop: 12, wordBreak: 'break-all' }}>{qr?.traceUrl}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {qr && (
                  <button onClick={() => downloadDataUrl(qr.qrDataUrl, `${batch.batch_code}-qr.png`)} style={{
                    background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6,
                    padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}><Download size={14} /> Download QR</button>
                )}
                {barcode && (
                  <button onClick={() => downloadDataUrl(barcode.barcodeDataUrl, `${batch.batch_code}-barcode.png`)} style={{
                    background: '#243044', color: '#cfd6e0', border: `1px solid ${BORDER}`, borderRadius: 6,
                    padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}><Download size={14} /> Download Barcode</button>
                )}
                <button onClick={printCodes} style={{
                  background: '#243044', color: '#cfd6e0', border: `1px solid ${BORDER}`, borderRadius: 6,
                  padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}><Printer size={14} /> Print</button>
                {qr && (
                  <a href={qr.traceUrl} target="_blank" rel="noreferrer" style={{
                    background: 'none', color: GOLD, border: `1px solid ${BORDER}`, borderRadius: 6,
                    padding: '8px 12px', cursor: 'pointer', fontSize: 13, textDecoration: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}><ExternalLink size={14} /> Open Customer Trace Page</a>
                )}
              </div>
            </div>
          ))}

          {sectionCard('Quality & Compliance', (
            <>
              {infoRow('FSSAI License No.', product?.fssai_license)}
              {infoRow('Quality Check Status', latestQc ? (
                <span style={{ color: latestQc.result === 'passed' ? '#4fd18b' : '#e0708e' }}>{latestQc.result === 'passed' ? 'Passed' : 'Failed'}</span>
              ) : 'No checks yet')}
              {latestQc && infoRow('Inspection Date', latestQc.created_at)}
              {latestQc && infoRow('Checked By', latestQc.checked_by)}
              {!product?.fssai_license && !latestQc && (
                <div style={{ color: '#8b96a8', fontSize: 12, padding: '8px 0' }}>No compliance data recorded yet</div>
              )}
            </>
          ))}

          {sectionCard('Customer Trace Preview', (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {productIcon(16)}
                <div>
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>{batch.product_name}</div>
                  <div style={{ fontSize: 11, color: '#8b96a8', fontFamily: 'monospace' }}>{batch.batch_code}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, fontSize: 12 }}>
                {infoRow('Origin', batch.origin_location)}
                {infoRow('Quantity', `${batch.quantity} ${batch.unit || ''}`)}
              </div>
              <div style={{ marginTop: 10 }}>
                {chainValid !== null && (
                  <span style={{
                    background: chainValid ? 'rgba(46,125,95,0.15)' : 'rgba(198,40,40,0.15)',
                    color: chainValid ? '#4fd18b' : '#e0708e',
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4
                  }}>{chainValid ? <Check size={11} /> : <XCircle size={11} />} {chainValid ? 'Verified Product' : 'Chain Issue Detected'}</span>
                )}
              </div>
              {qr && (
                <a href={qr.traceUrl} target="_blank" rel="noreferrer" style={{
                  display: 'block', textAlign: 'center', marginTop: 14, color: GOLD, fontSize: 12,
                  textDecoration: 'none', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 0'
                }}>View Live Page</a>
              )}
            </div>
          ))}

          {hasSeller && sectionCard('Seller', <>
            {infoRow('Name', product.seller_name)}
            {infoRow('Address', product.seller_address)}
            {infoRow('FSSAI', product.seller_fssai)}
          </>)}

          {hasCompliance && sectionCard('Compliance & Origin', <>
            {infoRow('Shelf Life', product.shelf_life)}
            {infoRow('Country of Origin', product.country_of_origin)}
            {infoRow('Customer Care', product.customer_care_email)}
            {infoRow('Manufacturer', product.manufacturer_address)}
            {infoRow('Return Policy', product.return_policy)}
          </>)}
        </div>
      </div>
    </Layout>
  );
}

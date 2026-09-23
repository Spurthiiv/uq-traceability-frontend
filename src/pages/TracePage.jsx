import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2, AlertTriangle, MapPin, Wheat, ShieldCheck, Mail, Factory,
  Crown, Calendar, Package, ChevronDown, ChevronUp, Lock
} from 'lucide-react';
import { api } from '../api';
import { stageIcon } from '../stages';

const PINK = '#d6336c';
const PURPLE = '#4a1a5c';
const GREEN = '#2e7d32';
const AMBER = '#e65100';
const RED = '#c62828';

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
  ['Sugar Profile', 'sugar_profile'],
];

const CARD = { background: 'white', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' };
const LABEL = { fontSize: 12, color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 };

function Header() {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
      padding: '28px 16px', textAlign: 'center', color: 'white'
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, margin: '0 auto 10px',
        background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}><Crown size={24} /></div>
      <div style={{ fontWeight: 'bold', fontSize: 18 }}>Udyami Queens</div>
      <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>Product Traceability</div>
    </div>
  );
}

function NotFound({ batchId }) {
  return (
    <div style={{ background: '#f4f4f6', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1a1a1a' }}>
      <Header />
      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ ...CARD, textAlign: 'center', border: `1px solid ${RED}33` }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px',
            background: `${RED}15`, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><AlertTriangle size={28} color={RED} /></div>
          <div style={{ color: RED, fontWeight: 'bold', fontSize: 17, marginBottom: 8 }}>PRODUCT NOT VERIFIED</div>
          <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>
            We could not find this batch in the Udyami Queens traceability system.
          </p>
          <div style={{ background: '#f4f4f6', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Batch ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: 14 }}>{batchId}</div>
          </div>
          <p style={{ color: AMBER, fontSize: 13, fontWeight: 'bold', margin: 0 }}>
            Please verify the product before purchase.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TracePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);

  useEffect(() => {
    api.get(`/trace/${id}`).then(r => setData(r.data)).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <NotFound batchId={id} />;
  if (!data) return <p style={{ padding: 24, fontFamily: 'sans-serif', color: '#1a1a1a' }}>Loading...</p>;

  const product = data.product;
  const hasNutrition = product && NUTRITION_ROWS.some(([, key]) => product[key]);
  const features = product ? (product.key_features || '').split('\n').map(f => f.trim()).filter(Boolean) : [];

  return (
    <div style={{ background: '#f4f4f6', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1a1a1a' }}>
      <Header />
      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        {/* Product / verification card */}
        <div style={CARD}>
          <h1 style={{ margin: '0 0 2px', fontSize: 22 }}>{data.product_name}</h1>
          {product?.category && <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{product.category}</div>}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: data.verified ? `${GREEN}15` : `${RED}15`,
            color: data.verified ? GREEN : RED,
            padding: '6px 12px', borderRadius: 20, fontWeight: 'bold', fontSize: 13, marginBottom: 16
          }}>
            {data.verified ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {data.verified ? 'VERIFIED PRODUCT' : 'CHAIN ISSUE DETECTED'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Batch ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 'bold' }}>{data.batch_code || data.id.slice(0, 8)}</div>
            </div>
            {data.origin_location && (
              <div>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={11} /> Origin
                </div>
                <div style={{ fontSize: 13 }}>{data.origin_location}</div>
              </div>
            )}
            {data.harvest_date && (
              <div>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={11} /> Packed
                </div>
                <div style={{ fontSize: 13 }}>{data.harvest_date}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Package size={11} /> Quantity
              </div>
              <div style={{ fontSize: 13 }}>
                {data.initial_quantity ? `${data.initial_quantity} → ` : ''}{data.quantity} {data.unit} batch
              </div>
            </div>
            {product?.price && (
              <div>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Price</div>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: GREEN }}>₹{product.price} <span style={{ fontSize: 11, fontWeight: 'normal', color: '#888' }}>/ {product.unit || data.unit}</span></div>
              </div>
            )}
          </div>

          {data.farmer_name && <div style={{ fontSize: 13, marginTop: 14, color: '#555' }}>Produced by <strong>{data.farmer_name}</strong></div>}
          {data.ingredients && (
            <div style={{ fontSize: 13, marginTop: 6, color: '#555', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <Wheat size={13} style={{ marginTop: 2, flexShrink: 0 }} /> {data.ingredients}
            </div>
          )}
        </div>

        {/* Blockchain verification summary */}
        <div style={CARD}>
          <div style={{ ...LABEL, display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={12} /> Blockchain Verified</div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>
            Ledger Status: <strong style={{ color: data.verified ? GREEN : RED }}>{data.verified ? 'VERIFIED ✓' : 'ISSUE DETECTED'}</strong>
          </div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>
            Events Verified: <strong>{data.eventsVerified}/{data.eventsTotal}</strong>
          </div>
          <div style={{ fontSize: 14, marginBottom: 10 }}>
            Chain Integrity: <strong style={{ color: data.verified ? GREEN : RED }}>{data.verified ? 'Valid ✓' : 'Broken'}</strong>
          </div>
          <button onClick={() => setShowVerificationDetails(v => !v)} style={{
            background: 'none', border: 'none', color: PINK, fontSize: 13, fontWeight: 'bold',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0
          }}>
            {showVerificationDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            View verification details
          </button>
          {showVerificationDetails && (
            <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
              {data.journey.map((e, i) => (
                <div key={i} style={{ fontSize: 11, fontFamily: 'monospace', color: '#666', marginBottom: 8 }}>
                  Block #{String(i + 1).padStart(3, '0')} — {e.type}<br />
                  Hash: {e.hash.slice(0, 16)}…<br />
                  Prev: {e.prevHash === 'GENESIS' ? 'GENESIS' : e.prevHash.slice(0, 16) + '…'}
                </div>
              ))}
            </div>
          )}
        </div>

        {data.qualityCheck && (
          <div style={{
            ...CARD,
            border: `1px solid ${data.qualityCheck.passed ? GREEN : RED}33`,
            background: data.qualityCheck.passed ? '#f0f8f0' : '#fdf0f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold', fontSize: 15, color: data.qualityCheck.passed ? GREEN : RED }}>
              {data.qualityCheck.passed ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {data.qualityCheck.passed ? 'Quality Check Passed' : 'Quality Check Failed'}
            </div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{data.qualityCheck.type} Verified</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Batch: {data.batch_code} · {data.qualityCheck.at}</div>
          </div>
        )}

        {product?.description && (
          <div style={CARD}>
            <div style={LABEL}>About this product</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#333' }}>{product.description}</p>
          </div>
        )}

        {features.length > 0 && (
          <div style={CARD}>
            <div style={LABEL}>Key Features</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.8, color: '#333' }}>
              {features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}

        {hasNutrition && (
          <div style={CARD}>
            <div style={LABEL}>Nutrition — Per 100g</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {NUTRITION_ROWS.map(([label, key]) => product[key] && (
                  <tr key={key} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '6px 0', color: '#666' }}>{label}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 'bold' }}>{product[key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {product && (product.fssai_license || product.country_of_origin || product.shelf_life || product.manufacturer_address || product.customer_care_email || product.return_policy) && (
          <div style={CARD}>
            <div style={LABEL}><ShieldCheck size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Compliance</div>
            {product.fssai_license && <div style={{ fontSize: 14, marginBottom: 6 }}>FSSAI License: <strong>{product.fssai_license}</strong></div>}
            {product.shelf_life && <div style={{ fontSize: 14, marginBottom: 6 }}>Shelf Life: <strong>{product.shelf_life}</strong></div>}
            {product.country_of_origin && <div style={{ fontSize: 14, marginBottom: 6 }}>Country of Origin: <strong>{product.country_of_origin}</strong></div>}
            {product.return_policy && <div style={{ fontSize: 14, marginBottom: 6 }}>Return Policy: <strong>{product.return_policy}</strong></div>}
            {product.manufacturer_address && (
              <div style={{ fontSize: 13, color: '#666', marginTop: 8, display: 'flex', gap: 6 }}>
                <Factory size={14} style={{ marginTop: 2, flexShrink: 0 }} /> {product.manufacturer_address}
              </div>
            )}
            {product.customer_care_email && (
              <div style={{ fontSize: 13, color: '#666', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} /> {product.customer_care_email}
              </div>
            )}
          </div>
        )}

        {product && (product.seller_name || product.seller_address || product.seller_fssai) && (
          <div style={CARD}>
            <div style={LABEL}>Seller</div>
            {product.seller_name && <div style={{ fontSize: 14, marginBottom: 6 }}>Name: <strong>{product.seller_name}</strong></div>}
            {product.seller_fssai && <div style={{ fontSize: 14, marginBottom: 6 }}>FSSAI: <strong>{product.seller_fssai}</strong></div>}
            {product.seller_address && <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{product.seller_address}</div>}
          </div>
        )}

        {product?.disclaimer && (
          <div style={CARD}>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#888', fontStyle: 'italic' }}>{product.disclaimer}</p>
          </div>
        )}

        {/* Journey */}
        <div style={CARD}>
          <div style={LABEL}>Product Journey</div>
          {data.journey.map((e, i) => {
            const StageIcon = stageIcon(e.type);
            return (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i === data.journey.length - 1 ? 0 : 4 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: `${GREEN}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}><StageIcon size={15} color={GREEN} /></div>
                {i < data.journey.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 24, background: '#e0e0e0' }} />}
              </div>
              <div style={{ paddingBottom: 18 }}>
                <div style={{ fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase' }}>{e.label}</div>
                {e.location && <div style={{ fontSize: 13, color: '#555' }}>{e.location}</div>}
                {e.actor && <div style={{ fontSize: 12, color: '#888' }}>{e.actor}</div>}
                <div style={{ fontSize: 12, color: GREEN, marginTop: 2 }}>✓ {e.description || e.type}</div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{e.at}</div>
              </div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

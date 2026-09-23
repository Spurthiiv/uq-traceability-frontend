import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Leaf, ShieldCheck, Truck, MapPinned, Trash2, Check, X,
  ExternalLink, QrCode as QrCodeIcon, PlusCircle, Link2
} from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';
import { STAGES, stageIndex } from '../stages';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

// Stages considered "in transit" for the summary tile — between packaging and final delivery.
const IN_TRANSIT_KEYS = ['TRANSFERRED_TO_SELLER', 'RECEIVED_AT_HUB', 'WAREHOUSED', 'DISPATCHED'];

export default function SupplyChain({ user, onLogout }) {
  const [batches, setBatches] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [verification, setVerification] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const load = () => api.get('/batches').then(r => setBatches(r.data));
  const loadLedger = () => api.get('/ledger').then(r => setLedger(r.data));
  const loadVerification = () => api.get('/ledger/verify-all').then(r => setVerification(r.data));

  useEffect(() => { load(); loadLedger(); loadVerification(); }, []);

  useEffect(() => {
    if (!selectedId && batches.length > 0) setSelectedId(batches[0].id);
  }, [batches, selectedId]);

  const deleteBatch = async (id, productName) => {
    if (!window.confirm(`Delete batch "${productName}"? This cannot be undone.`)) return;
    await api.delete(`/batches/${id}`);
    if (selectedId === id) setSelectedId(null);
    load();
    loadLedger();
    loadVerification();
  };

  const selectedBatch = batches.find(b => b.id === selectedId);
  const selectedEntries = useMemo(() => (
    ledger.filter(e => e.batch_id === selectedId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  ), [ledger, selectedId]);
  const selectedIndex = selectedBatch ? stageIndex(selectedBatch.status) : -1;
  const selectedValid = verification?.results.find(r => r.batchId === selectedId)?.valid;

  const totalBatches = batches.length;
  const delivered = batches.filter(b => b.status === 'DELIVERED').length;
  const inTransit = batches.filter(b => IN_TRANSIT_KEYS.includes(b.status)).length;
  const inProgress = batches.filter(b => b.status !== 'DELIVERED').length;
  const totalEvents = ledger.length;

  const statTile = (label, value, Icon, color) => (
    <div style={{
      background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10,
      padding: 16, flex: '1 1 160px', display: 'flex', alignItems: 'center', gap: 12
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}><Icon size={16} color="white" /></div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>{value}</div>
        <div style={{ fontSize: 11, color: '#8b96a8' }}>{label}</div>
      </div>
    </div>
  );

  const productIcon = (size = 18) => (
    <div style={{
      width: size + 20, height: size + 20, borderRadius: 8, background: 'rgba(201,165,69,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}><Package size={size} color={GOLD} /></div>
  );

  const infoField = (label, value) => (
    <div>
      <div style={{ color: '#8b96a8', fontSize: 11, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: 'white', fontSize: 13, marginTop: 2 }}>{value ?? '—'}</div>
    </div>
  );

  const quickLink = (label, to, Icon) => (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: 8, color: GOLD, fontSize: 13, textDecoration: 'none',
      background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10
    }}><Icon size={15} /> {label}</Link>
  );

  return (
    <Layout user={user} onLogout={onLogout} title="Supply Chain">
      {/* Stat tiles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        {statTile('Total Batches', totalBatches, Package, '#7b5fd6')}
        {statTile('In Progress', inProgress, Truck, GOLD)}
        {statTile('Delivered', delivered, ShieldCheck, '#2e7d5f')}
        {statTile('In Transit', inTransit, MapPinned, '#3b82c4')}
        {statTile('Total Events', totalEvents, Link2, '#d6336c')}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Main column */}
        <div style={{ flex: '1 1 500px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Batch list */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <strong style={{ color: 'white' }}>Batches in the Supply Chain</strong>
              <Link to="/products" style={{
                background: GOLD, color: '#1a2332', borderRadius: 6, padding: '8px 14px',
                fontWeight: 'bold', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6
              }}><PlusCircle size={14} /> New Batch</Link>
            </div>

            {batches.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No batches yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                    <th style={{ padding: '8px 6px 8px 0' }}>Product</th>
                    <th>Quantity</th>
                    <th>Origin</th>
                    <th>Status</th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => {
                    const valid = verification?.results.find(r => r.batchId === b.id)?.valid;
                    return (
                      <tr key={b.id}
                        onClick={() => setSelectedId(b.id)}
                        style={{
                          borderTop: `1px solid ${BORDER}`, cursor: 'pointer',
                          background: selectedId === b.id ? 'rgba(201,165,69,0.08)' : 'transparent'
                        }}>
                        <td style={{ padding: '10px 6px 10px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {productIcon(14)}
                            <div>
                              <div style={{ color: 'white' }}>{b.product_name}</div>
                              <div style={{ fontSize: 11, color: '#8b96a8', fontFamily: 'monospace' }}>{b.batch_code}</div>
                            </div>
                          </div>
                        </td>
                        <td>{b.initial_quantity ? `${b.initial_quantity} → ` : ''}{b.quantity} {b.unit}</td>
                        <td style={{ color: '#8b96a8' }}>{b.origin_location || '—'}</td>
                        <td>
                          <span style={{ background: 'rgba(201,165,69,0.15)', color: GOLD, padding: '3px 12px', borderRadius: 12, fontSize: 12 }}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          {valid !== undefined && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12,
                              color: valid ? '#4fd18b' : '#e0708e'
                            }}>{valid ? <Check size={13} /> : <X size={13} />} {valid ? 'Chain Valid' : 'Chain Broken'}</span>
                          )}
                        </td>
                        <td>
                          <button onClick={(ev) => { ev.stopPropagation(); deleteBatch(b.id, b.product_name); }} style={{
                            background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex'
                          }}><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Journey stepper */}
          {selectedBatch && (
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <strong style={{ color: 'white' }}>Supply Chain Journey — {selectedBatch.batch_code}</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12 }}>
                  <span style={{ color: '#8b96a8' }}>{selectedEntries.length} Events Recorded</span>
                  {selectedValid !== undefined && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: selectedValid ? '#4fd18b' : '#e0708e' }}>
                      {selectedValid ? <Check size={13} /> : <X size={13} />} {selectedValid ? 'Chain Valid' : 'Chain Broken'}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 8 }}>
                {STAGES.map((s, i) => {
                  const done = i <= selectedIndex;
                  const entry = selectedBatch.ledger?.find?.(e => e.event_type === s.key)
                    || selectedEntries.find(e => e.event_type === s.key);
                  return (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 92 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: done ? 'rgba(46,125,95,0.2)' : '#0f1620',
                          border: `2px solid ${done ? '#2e7d5f' : BORDER}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}><s.icon size={17} color={done ? '#4fd18b' : '#8b96a8'} /></div>
                        <div style={{ fontSize: 11, textAlign: 'center', color: done ? 'white' : '#8b96a8', fontWeight: done ? 'bold' : 'normal' }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: 10, color: '#5a6578', textAlign: 'center' }}>
                          {entry ? entry.timestamp.slice(0, 16).replace('T', ' ') : ''}
                        </div>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div style={{ width: 24, height: 2, background: i < selectedIndex ? '#2e7d5f' : BORDER, flexShrink: 0, marginBottom: 30 }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Events table */}
          {selectedBatch && (
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <strong style={{ color: 'white', fontSize: 14 }}>Supply Chain Events</strong>
                <Link to={`/batches/${selectedBatch.id}`} style={{ color: GOLD, fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View Full Batch <ExternalLink size={12} />
                </Link>
              </div>
              {selectedEntries.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No events logged yet</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                        <th style={{ padding: '8px 6px' }}>#</th>
                        <th style={{ padding: '8px 6px' }}>Event</th>
                        <th style={{ padding: '8px 6px' }}>Timestamp</th>
                        <th style={{ padding: '8px 6px' }}>Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEntries.map((e, i) => (
                        <tr key={e.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                          <td style={{ padding: '8px 6px', color: '#8b96a8' }}>{i + 1}</td>
                          <td style={{ padding: '8px 6px', fontWeight: 'bold' }}>{e.event_type}</td>
                          <td style={{ padding: '8px 6px', color: '#8b96a8', whiteSpace: 'nowrap' }}>{e.timestamp}</td>
                          <td style={{ padding: '8px 6px', fontFamily: 'monospace', fontSize: 12 }} title={e.hash}>{e.hash.slice(0, 14)}…</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {selectedBatch && (
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
              <strong style={{ color: 'white', fontSize: 13 }}>Batch Details</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                {productIcon(18)}
                <div>
                  <div style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>{selectedBatch.product_name}</div>
                  <div style={{ fontSize: 11, color: '#8b96a8', fontFamily: 'monospace' }}>{selectedBatch.batch_code}</div>
                </div>
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{ background: 'rgba(201,165,69,0.15)', color: GOLD, padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>
                  {selectedBatch.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                {infoField('Origin', selectedBatch.origin_location)}
                {infoField('Quantity', `${selectedBatch.quantity} ${selectedBatch.unit || ''}`)}
                {infoField('Ingredients', selectedBatch.ingredients)}
                {infoField('Farmer', selectedBatch.farmer_name)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                <Link to={`/batches/${selectedBatch.id}`} style={{
                  background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 12px',
                  cursor: 'pointer', fontWeight: 'bold', fontSize: 13, textAlign: 'center', textDecoration: 'none'
                }}>View Full Details</Link>
                <Link to={`/batches/${selectedBatch.id}`} style={{
                  background: 'none', color: GOLD, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '8px 12px',
                  fontSize: 13, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}><QrCodeIcon size={14} /> View QR Code</Link>
              </div>
            </div>
          )}

          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
            <strong style={{ color: 'white', fontSize: 13 }}>Quick Links</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {quickLink('View All Batches', '/products', Package)}
              {quickLink('Blockchain Ledger', '/ledger', Link2)}
              {quickLink('Reports & Analytics', '/reports', ShieldCheck)}
            </div>
          </div>

          <div style={{
            background: 'rgba(201,165,69,0.08)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16,
            textAlign: 'center', color: GOLD, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}><Leaf size={14} /> Transparency · Trust · Empowerment</div>
        </div>
      </div>
    </Layout>
  );
}

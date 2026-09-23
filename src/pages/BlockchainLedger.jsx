import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Package, ShieldCheck, Clock, Check, X, Route, QrCode } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';
import { STAGES, stageIndex } from '../stages';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

const EVENT_COLORS = {
  created: '#4fd18b',
  packed: '#c9a545',
  shipped: '#6fb1e8',
  delivered: '#a97fe0',
  INGREDIENT_REGISTERED: '#4fd18b',
  RECEIVED: '#6fb1e8',
  BATCH_STARTED: '#8b96a8',
  TRANSFORMED: '#e0a336',
  QUALITY_CHECKED: '#4fd18b',
  PACKAGED: '#c9a545',
  QR_BOUND: '#7b5fd6',
  TRANSFERRED_TO_SELLER: '#d6336c',
  RECEIVED_AT_HUB: '#6fb1e8',
  WAREHOUSED: '#e0a336',
  DISPATCHED: '#3b82c4',
  DELIVERED: '#a97fe0',
};

export default function BlockchainLedger({ user, onLogout }) {
  const [ledger, setLedger] = useState([]);
  const [batches, setBatches] = useState([]);
  const [verification, setVerification] = useState(null);
  const [checking, setChecking] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [search, setSearch] = useState('');

  const load = () => api.get('/ledger').then(r => setLedger(r.data));
  const loadBatches = () => api.get('/batches').then(r => setBatches(r.data));

  const verifyAll = async () => {
    setChecking(true);
    const res = await api.get('/ledger/verify-all');
    setVerification(res.data);
    setChecking(false);
  };

  useEffect(() => { load(); loadBatches(); verifyAll(); }, []);

  const batchOptions = useMemo(() => {
    const map = new Map();
    ledger.forEach(e => map.set(e.batch_id, e.product_name));
    return [...map.entries()];
  }, [ledger]);

  useEffect(() => {
    if (!selectedBatchId && batchOptions.length > 0) setSelectedBatchId(batchOptions[0][0]);
  }, [batchOptions, selectedBatchId]);

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  const selectedEntries = useMemo(() => (
    ledger
      .filter(e => e.batch_id === selectedBatchId)
      .filter(e => !search || e.hash.includes(search) || e.event_type.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  ), [ledger, selectedBatchId, search]);

  const currentIndex = selectedBatch ? stageIndex(selectedBatch.status) : -1;
  const selectedValid = verification?.results.find(r => r.batchId === selectedBatchId)?.valid;

  const uniqueBatches = new Set(ledger.map(e => e.batch_id)).size;
  const chainHealth = verification
    ? `${verification.results.filter(r => r.valid).length}/${verification.results.length}`
    : '—';
  const latestBlock = ledger[0]?.timestamp || '—';

  const statTile = (label, value, Icon, color) => (
    <div style={{
      background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10,
      padding: 16, flex: '1 1 180px', display: 'flex', alignItems: 'center', gap: 12
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}><Icon size={18} color="white" /></div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>{value}</div>
        <div style={{ fontSize: 11, color: '#8b96a8' }}>{label}</div>
      </div>
    </div>
  );

  const selectStyle = {
    background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white',
    padding: '8px 10px', borderRadius: 6, fontSize: 13
  };

  const infoField = (label, value) => (
    <div>
      <div style={{ color: '#8b96a8', fontSize: 11, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: 'white', fontSize: 13, marginTop: 2 }}>{value || '—'}</div>
    </div>
  );

  return (
    <Layout user={user} onLogout={onLogout} title="Blockchain Ledger">
      {/* Stat tiles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        {statTile('Total Blocks', ledger.length, Link2, '#7b5fd6')}
        {statTile('Batches Tracked', uniqueBatches, Package, '#3b82c4')}
        {statTile('Chain Health', chainHealth, ShieldCheck, verification?.allValid === false ? '#c4443b' : '#2e7d5f')}
        {statTile('Latest Block', latestBlock === '—' ? '—' : latestBlock.slice(0, 16).replace('T', ' '), Clock, GOLD)}
      </div>

      {/* Verify banner */}
      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ color: 'white' }}>Chain Integrity</strong>
            <div style={{ fontSize: 13, color: '#8b96a8', marginTop: 4 }}>
              Recomputes every block's SHA-256 hash and confirms the previous-hash links are unbroken.
            </div>
          </div>
          <button onClick={verifyAll} disabled={checking} style={{
            background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6,
            padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold'
          }}>{checking ? 'Checking...' : 'Verify Chain'}</button>
        </div>

        {verification && (
          <div style={{
            marginTop: 14, padding: 12, borderRadius: 8,
            background: verification.allValid ? 'rgba(46,125,95,0.15)' : 'rgba(198,40,40,0.15)',
            border: `1px solid ${verification.allValid ? '#2e7d5f' : '#c62828'}`,
            color: verification.allValid ? '#5fd6a8' : '#e07a7a',
            fontSize: 14
          }}>
            {verification.allValid
              ? `All ${verification.results.length} batch chains verified - intact.`
              : `Chain issue detected in ${verification.results.filter(r => !r.valid).length} batch(es).`}
          </div>
        )}
      </div>

      {ledger.length === 0 ? (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '40px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>
          No blocks yet
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Column 1: batch picker + 12-stage checklist */}
          <div style={{ flex: '0 0 240px', background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
            <strong style={{ color: 'white', fontSize: 13 }}>Batches</strong>
            <select value={selectedBatchId || ''} onChange={e => setSelectedBatchId(e.target.value)}
              style={{ ...selectStyle, width: '100%', marginTop: 10 }}>
              {batchOptions.map(([id, name]) => (
                <option key={id} value={id}>{name} ({id.slice(0, 8)}…)</option>
              ))}
            </select>

            <div style={{ marginTop: 16, borderTop: `1px solid ${BORDER}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STAGES.map((s, i) => {
                const done = i <= currentIndex;
                return (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, opacity: done ? 1 : 0.45 }}>
                    <s.icon size={13} color={done ? '#4fd18b' : '#8b96a8'} />
                    <span style={{ color: done ? '#cfd6e0' : '#8b96a8', flex: 1 }}>{s.key}</span>
                    {done && <Check size={13} color="#4fd18b" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: batch summary + blocks table */}
          <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            {selectedBatch && (
              <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, background: 'rgba(201,165,69,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}><Package size={20} color={GOLD} /></div>
                    <div>
                      <strong style={{ color: 'white', fontSize: 16 }}>{selectedBatch.product_name}</strong>
                      <div style={{ marginTop: 4 }}>
                        <span style={{
                          background: 'rgba(201,165,69,0.15)', color: GOLD, padding: '2px 10px',
                          borderRadius: 6, fontSize: 12, fontFamily: 'monospace'
                        }}>{selectedBatch.batch_code}</span>
                      </div>
                    </div>
                  </div>
                  {selectedValid !== undefined && (
                    <span style={{
                      background: selectedValid ? 'rgba(46,125,95,0.15)' : 'rgba(198,40,40,0.15)',
                      color: selectedValid ? '#4fd18b' : '#e0708e',
                      padding: '3px 12px', borderRadius: 12, fontSize: 12,
                      display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
                    }}>{selectedValid ? <Check size={13} /> : <X size={13} />} {selectedValid ? 'Chain Valid' : 'Chain Broken'}</span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, marginTop: 20 }}>
                  {infoField('Ingredients', selectedBatch.ingredients)}
                  {infoField('Quantity', `${selectedBatch.initial_quantity ? `${selectedBatch.initial_quantity} → ` : ''}${selectedBatch.quantity} ${selectedBatch.unit || ''}`)}
                  {infoField('Origin', selectedBatch.origin_location)}
                  {infoField('Status', <span style={{
                    background: 'rgba(201,165,69,0.15)', color: GOLD, padding: '2px 10px', borderRadius: 12, fontSize: 12
                  }}>{selectedBatch.status}</span>)}
                </div>
              </div>
            )}

            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
                <strong style={{ color: 'white', fontSize: 14 }}>Blockchain Blocks</strong>
                <input placeholder="Search hash or event…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ ...selectStyle, fontSize: 12, padding: '6px 10px' }} />
              </div>
              {selectedEntries.length === 0 ? (
                <div style={{ color: '#8b96a8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No blocks yet for this batch</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#cfd6e0' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                        <th style={{ padding: '8px 6px' }}>#</th>
                        <th style={{ padding: '8px 6px' }}>Event</th>
                        <th style={{ padding: '8px 6px' }}>Hash</th>
                        <th style={{ padding: '8px 6px' }}>Previous Hash</th>
                        <th style={{ padding: '8px 6px' }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEntries.map((e, i) => (
                        <tr key={e.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                          <td style={{ padding: '8px 6px', color: '#8b96a8' }}>{i + 1}</td>
                          <td style={{ padding: '8px 6px' }}>
                            <span style={{
                              background: `${EVENT_COLORS[e.event_type] || GOLD}22`,
                              color: EVENT_COLORS[e.event_type] || GOLD,
                              padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 'bold', whiteSpace: 'nowrap'
                            }}>{e.event_type}</span>
                          </td>
                          <td style={{ padding: '8px 6px', fontFamily: 'monospace', fontSize: 12 }} title={e.hash}>{e.hash.slice(0, 14)}…</td>
                          <td style={{ padding: '8px 6px', fontFamily: 'monospace', fontSize: 12, color: '#5a6578' }} title={e.prev_hash}>
                            {e.prev_hash === 'GENESIS' ? 'GENESIS' : e.prev_hash.slice(0, 14) + '…'}
                          </td>
                          <td style={{ padding: '8px 6px', fontSize: 12, color: '#8b96a8', whiteSpace: 'nowrap' }}>{e.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: timeline + quick actions */}
          <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
              <strong style={{ color: 'white', fontSize: 13 }}>Block Events Timeline</strong>
              <div style={{ marginTop: 14 }}>
                {selectedEntries.length === 0 ? (
                  <div style={{ color: '#8b96a8', fontSize: 12 }}>No events yet</div>
                ) : selectedEntries.map((e, i) => (
                  <div key={e.id} style={{ display: 'flex', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, flexShrink: 0, marginTop: 4 }} />
                      {i < selectedEntries.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 22, background: BORDER }} />}
                    </div>
                    <div style={{ paddingBottom: 14 }}>
                      <div style={{ fontSize: 12, color: '#cfd6e0', fontWeight: 'bold' }}>{e.event_type}</div>
                      <div style={{ fontSize: 11, color: '#8b96a8' }}>{e.timestamp}</div>
                      <div style={{ fontSize: 10, color: '#5a6578', marginTop: 1 }}>Block #{i + 1}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedBatch && (
              <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
                <strong style={{ color: 'white', fontSize: 13 }}>Quick Actions</strong>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to={`/batches/${selectedBatch.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 8, color: GOLD, fontSize: 13, textDecoration: 'none',
                    background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10
                  }}><Route size={15} /> View Batch Journey</Link>
                  <Link to={`/batches/${selectedBatch.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 8, color: GOLD, fontSize: 13, textDecoration: 'none',
                    background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10
                  }}><QrCode size={15} /> View QR Code</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

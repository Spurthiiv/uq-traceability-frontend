import { useEffect, useState } from 'react';
import { Trash2, FileSearch, ClipboardList, ShieldCheck } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

const inputStyle = { background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white', padding: 8, borderRadius: 6 };

const TABS = [
  { key: 'audit', label: 'Audit Log', Icon: FileSearch },
  { key: 'requests', label: 'Data Requests', Icon: ClipboardList },
  { key: 'consent', label: 'Consent Registry', Icon: ShieldCheck },
];

const ACTION_COLOR = { CREATE: '#4fd18b', UPDATE: '#3b82c4', DELETE: '#e0708e' };

export default function ComplianceAudit({ user, onLogout }) {
  const [tab, setTab] = useState('audit');
  const [auditLog, setAuditLog] = useState([]);
  const [requests, setRequests] = useState([]);
  const [consents, setConsents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ requesterName: '', requesterContact: '', requestType: 'access', notes: '' });
  const [consentForm, setConsentForm] = useState({ subjectName: '', subjectContact: '', consentType: 'data_processing', granted: true });
  const [auditFilter, setAuditFilter] = useState({ entity: '', action: '' });

  const load = () => {
    const params = Object.fromEntries(Object.entries(auditFilter).filter(([, v]) => v));
    api.get('/compliance/audit-log', { params }).then(r => setAuditLog(r.data));
    api.get('/compliance/data-requests').then(r => setRequests(r.data));
    api.get('/compliance/consent-records').then(r => setConsents(r.data));
  };
  useEffect(() => { load(); }, [auditFilter]);

  const createRequest = async () => {
    if (!requestForm.requesterName) return;
    await api.post('/compliance/data-requests', requestForm);
    setRequestForm({ requesterName: '', requesterContact: '', requestType: 'access', notes: '' });
    setShowForm(false);
    load();
  };
  const updateRequestStatus = async (id, status) => { await api.patch(`/compliance/data-requests/${id}/status`, { status }); load(); };
  const deleteRequest = async (id) => {
    if (!window.confirm('Delete this data request record?')) return;
    await api.delete(`/compliance/data-requests/${id}`);
    load();
  };

  const createConsent = async () => {
    if (!consentForm.subjectName) return;
    await api.post('/compliance/consent-records', { ...consentForm, recordedBy: user.name });
    setConsentForm({ subjectName: '', subjectContact: '', consentType: 'data_processing', granted: true });
    setShowForm(false);
    load();
  };
  const deleteConsent = async (id) => {
    if (!window.confirm('Delete this consent record?')) return;
    await api.delete(`/compliance/consent-records/${id}`);
    load();
  };

  const entities = [...new Set(auditLog.map(a => a.entity))];

  return (
    <Layout user={user} onLogout={onLogout} title="Compliance & Audit">
      <div style={{ color: '#8b96a8', fontSize: 11, marginTop: -12, marginBottom: 16, fontStyle: 'italic' }}>
        BRD Section 7.6 (ADM-08) — a real audit trail of every admin action, plus DPDP data-subject request tracking and a consent registry.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setShowForm(false); }} style={{
              padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: tab === t.key ? GOLD : '#243044', color: tab === t.key ? '#1a2332' : '#cfd6e0',
              fontWeight: tab === t.key ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: 6
            }}><t.Icon size={14} /> {t.label}</button>
          ))}
        </div>
        {tab !== 'audit' && (
          <button onClick={() => setShowForm(!showForm)} style={{
            background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold'
          }}>+ New {tab === 'requests' ? 'Data Request' : 'Consent Record'}</button>
        )}
      </div>

      {tab === 'audit' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <select value={auditFilter.entity} style={inputStyle} onChange={e => setAuditFilter({ ...auditFilter, entity: e.target.value })}>
            <option value="">All entities</option>
            {entities.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={auditFilter.action} style={inputStyle} onChange={e => setAuditFilter({ ...auditFilter, action: e.target.value })}>
            <option value="">All actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>
        </div>
      )}

      {showForm && tab === 'requests' && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input placeholder="Requester name" value={requestForm.requesterName} style={inputStyle} onChange={e => setRequestForm({ ...requestForm, requesterName: e.target.value })} />
          <input placeholder="Contact (email/phone)" value={requestForm.requesterContact} style={inputStyle} onChange={e => setRequestForm({ ...requestForm, requesterContact: e.target.value })} />
          <select value={requestForm.requestType} style={inputStyle} onChange={e => setRequestForm({ ...requestForm, requestType: e.target.value })}>
            <option value="access">Access</option>
            <option value="erasure">Erasure</option>
            <option value="correction">Correction</option>
          </select>
          <input placeholder="Notes" value={requestForm.notes} style={{ ...inputStyle, flex: '1 1 200px' }} onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })} />
          <button onClick={createRequest} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Log Request</button>
        </div>
      )}

      {showForm && tab === 'consent' && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input placeholder="Subject name" value={consentForm.subjectName} style={inputStyle} onChange={e => setConsentForm({ ...consentForm, subjectName: e.target.value })} />
          <input placeholder="Contact (email/phone)" value={consentForm.subjectContact} style={inputStyle} onChange={e => setConsentForm({ ...consentForm, subjectContact: e.target.value })} />
          <select value={consentForm.consentType} style={inputStyle} onChange={e => setConsentForm({ ...consentForm, consentType: e.target.value })}>
            <option value="data_processing">Data Processing</option>
            <option value="marketing">Marketing</option>
            <option value="third_party_sharing">Third-Party Sharing</option>
          </select>
          <select value={consentForm.granted ? '1' : '0'} style={inputStyle} onChange={e => setConsentForm({ ...consentForm, granted: e.target.value === '1' })}>
            <option value="1">Granted</option>
            <option value="0">Withdrawn</option>
          </select>
          <button onClick={createConsent} style={{ background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>Log Consent</button>
        </div>
      )}

      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20 }}>
        {tab === 'audit' && (
          auditLog.length === 0 ? <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No audit events recorded yet</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '10px 8px 10px 0' }}>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Entity ID</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map(a => (
                  <tr key={a.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '10px 8px 10px 0', color: '#8b96a8', fontSize: 12, whiteSpace: 'nowrap' }}>{a.created_at}</td>
                    <td>{a.user_name}</td>
                    <td><span style={{ background: `${ACTION_COLOR[a.action]}22`, color: ACTION_COLOR[a.action], padding: '2px 10px', borderRadius: 12, fontSize: 12 }}>{a.action}</span></td>
                    <td style={{ textTransform: 'capitalize' }}>{a.entity}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#8b96a8' }}>{a.entity_id ? a.entity_id.slice(0, 8) + '…' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'requests' && (
          requests.length === 0 ? <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No data-subject requests logged yet</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '10px 8px 10px 0' }}>Requester</th><th>Type</th><th>Notes</th><th>Logged</th><th>Status</th><th></th><th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '10px 8px 10px 0' }}>{r.requester_name}<div style={{ fontSize: 11, color: '#8b96a8' }}>{r.requester_contact}</div></td>
                    <td style={{ textTransform: 'capitalize' }}>{r.request_type}</td>
                    <td style={{ color: '#8b96a8' }}>{r.notes || '—'}</td>
                    <td style={{ color: '#8b96a8', fontSize: 12 }}>{r.created_at}</td>
                    <td>
                      <span style={{
                        background: r.status === 'completed' ? 'rgba(46,125,95,0.15)' : r.status === 'rejected' ? 'rgba(198,40,40,0.15)' : 'rgba(201,165,69,0.15)',
                        color: r.status === 'completed' ? '#4fd18b' : r.status === 'rejected' ? '#e0708e' : GOLD,
                        padding: '3px 10px', borderRadius: 12, fontSize: 12, textTransform: 'capitalize'
                      }}>{r.status}</span>
                    </td>
                    <td>
                      {r.status === 'open' && (
                        <select defaultValue="" onChange={e => e.target.value && updateRequestStatus(r.id, e.target.value)} style={{ ...inputStyle, padding: '4px 8px', fontSize: 12 }}>
                          <option value="" disabled>Update…</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      )}
                      {r.status === 'in_progress' && (
                        <select defaultValue="" onChange={e => e.target.value && updateRequestStatus(r.id, e.target.value)} style={{ ...inputStyle, padding: '4px 8px', fontSize: 12 }}>
                          <option value="" disabled>Update…</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      )}
                    </td>
                    <td><button onClick={() => deleteRequest(r.id)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'consent' && (
          consents.length === 0 ? <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No consent records yet</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '10px 8px 10px 0' }}>Subject</th><th>Consent Type</th><th>Status</th><th>Recorded By</th><th>Date</th><th></th>
                </tr>
              </thead>
              <tbody>
                {consents.map(c => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '10px 8px 10px 0' }}>{c.subject_name}<div style={{ fontSize: 11, color: '#8b96a8' }}>{c.subject_contact}</div></td>
                    <td style={{ textTransform: 'capitalize' }}>{c.consent_type.replace(/_/g, ' ')}</td>
                    <td>
                      <span style={{
                        background: c.granted ? 'rgba(46,125,95,0.15)' : 'rgba(198,40,40,0.15)',
                        color: c.granted ? '#4fd18b' : '#e0708e', padding: '3px 10px', borderRadius: 12, fontSize: 12
                      }}>{c.granted ? 'Granted' : 'Withdrawn'}</span>
                    </td>
                    <td style={{ color: '#8b96a8' }}>{c.recorded_by || '—'}</td>
                    <td style={{ color: '#8b96a8', fontSize: 12 }}>{c.created_at}</td>
                    <td><button onClick={() => deleteConsent(c.id)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </Layout>
  );
}

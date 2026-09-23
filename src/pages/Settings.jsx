import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

const inputStyle = {
  width: '100%', padding: 8, marginTop: 4, marginBottom: 14, boxSizing: 'border-box',
  background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white', borderRadius: 6
};

const TABS = ['General', 'Notifications', 'Supply Chain', 'Finance', 'Traceability', 'Security'];

function fromServer(s) {
  return {
    organizationName: s.organization_name, appName: s.app_name, tagline: s.tagline,
    defaultLanguage: s.default_language, timezone: s.timezone, currency: s.currency,

    notificationsEnabled: !!s.notifications_enabled, emailNotifications: !!s.email_notifications,
    orderNotifications: !!s.order_notifications, qualityAlerts: !!s.quality_alerts,
    financeAlerts: !!s.finance_alerts, complaintAlerts: !!s.complaint_alerts,
    supplyChainAlerts: !!s.supply_chain_alerts,

    defaultBatchStatus: s.default_batch_status, qrVerificationEnabled: !!s.qr_verification_enabled,
    customerTraceabilityEnabled: !!s.customer_traceability_enabled,
    blockchainLedgerEnabled: !!s.blockchain_ledger_enabled,
    qcRequiredBeforePackaging: !!s.qc_required_before_packaging,
    qcRequiredBeforeDispatch: !!s.qc_required_before_dispatch,

    defaultCpCommissionPercent: s.default_cp_commission_percent, settlementCycle: s.settlement_cycle,
    minimumSettlementAmount: s.minimum_settlement_amount,
    gstPercent: s.gst_percent, platformFeePercent: s.platform_fee_percent, deliveryFee: s.delivery_fee,

    publicTraceabilityEnabled: !!s.public_traceability_enabled, qrBaseUrl: s.qr_base_url || '',
    showOrigin: !!s.show_origin, showProcessingJourney: !!s.show_processing_journey,
    showQualityInfo: !!s.show_quality_info, showSellerInfo: !!s.show_seller_info,
    showHubInfo: !!s.show_hub_info, showDeliveryJourney: !!s.show_delivery_journey,
    showBlockchainVerification: !!s.show_blockchain_verification,

    sessionTimeoutMinutes: s.session_timeout_minutes, passwordMinLength: s.password_min_length,
    passwordRequireNumber: !!s.password_require_number, twoFactorEnabled: !!s.two_factor_enabled,
  };
}

const TAB_FIELDS = {
  General: ['organizationName', 'appName', 'tagline', 'defaultLanguage', 'timezone', 'currency'],
  Notifications: ['notificationsEnabled', 'emailNotifications', 'orderNotifications', 'qualityAlerts', 'financeAlerts', 'complaintAlerts', 'supplyChainAlerts'],
  'Supply Chain': ['defaultBatchStatus', 'qrVerificationEnabled', 'customerTraceabilityEnabled', 'blockchainLedgerEnabled', 'qcRequiredBeforePackaging', 'qcRequiredBeforeDispatch'],
  Finance: ['defaultCpCommissionPercent', 'settlementCycle', 'minimumSettlementAmount', 'gstPercent', 'platformFeePercent', 'deliveryFee'],
  Traceability: ['publicTraceabilityEnabled', 'qrBaseUrl', 'showOrigin', 'showProcessingJourney', 'showQualityInfo', 'showSellerInfo', 'showHubInfo', 'showDeliveryJourney', 'showBlockchainVerification'],
  Security: ['sessionTimeoutMinutes', 'passwordMinLength', 'passwordRequireNumber', 'twoFactorEnabled'],
};

export default function Settings({ user, onLogout }) {
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState('General');
  const [saved, setSaved] = useState(false);
  const [loginActivity, setLoginActivity] = useState([]);

  const load = () => {
    api.get('/settings').then(r => setForm(fromServer(r.data)));
    api.get('/auth/login-activity').then(r => setLoginActivity(r.data));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = {};
    TAB_FIELDS[tab].forEach(f => { payload[f] = form[f]; });
    await api.put('/settings', payload);
    setSaved(true);
    load(); // reload from server so we're showing what actually persisted
    setTimeout(() => setSaved(false), 2500);
  };

  if (!form) return <Layout user={user} onLogout={onLogout} title="Settings"><p style={{ color: '#cfd6e0' }}>Loading...</p></Layout>;

  const field = (label, key, type = 'text') => (
    <div>
      <label style={{ fontSize: 13, color: '#8b96a8' }}>{label}</label>
      <input type={type} value={form[key] ?? ''} style={inputStyle}
        onChange={e => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })} />
    </div>
  );

  const select = (label, key, options) => (
    <div>
      <label style={{ fontSize: 13, color: '#8b96a8' }}>{label}</label>
      <select value={form[key] ?? ''} style={inputStyle} onChange={e => setForm({ ...form, [key]: e.target.value })}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const toggle = (label, key, hint) => (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#cfd6e0', marginBottom: 14, cursor: 'pointer' }}>
      <input type="checkbox" checked={!!form[key]} style={{ marginTop: 2 }}
        onChange={e => setForm({ ...form, [key]: e.target.checked })} />
      <span>
        {label}
        {hint && <div style={{ fontSize: 11, color: '#5a6578', marginTop: 2 }}>{hint}</div>}
      </span>
    </label>
  );

  return (
    <Layout user={user} onLogout={onLogout} title="Settings">
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '10px 16px', fontSize: 13,
            color: tab === t ? GOLD : '#8b96a8',
            borderBottom: tab === t ? `2px solid ${GOLD}` : '2px solid transparent',
            marginBottom: -1, fontWeight: tab === t ? 'bold' : 'normal'
          }}>{t}</button>
        ))}
      </div>

      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20, maxWidth: 480 }}>
        {tab === 'General' && <>
          {field('Organization Name', 'organizationName')}
          {field('App Name', 'appName')}
          {field('Tagline', 'tagline')}
          {select('Default Language', 'defaultLanguage', ['en', 'hi', 'kn'])}
          {select('Timezone', 'timezone', ['Asia/Kolkata', 'UTC'])}
          {select('Currency', 'currency', ['INR', 'USD'])}
        </>}

        {tab === 'Notifications' && <>
          {toggle('Enable Notifications', 'notificationsEnabled', 'Master switch — turning this off disables all notification types below.')}
          {toggle('Email Notifications', 'emailNotifications')}
          {toggle('Order Notifications', 'orderNotifications')}
          {toggle('Quality Alerts', 'qualityAlerts')}
          {toggle('Finance Alerts', 'financeAlerts')}
          {toggle('Complaint Alerts', 'complaintAlerts')}
          {toggle('Supply Chain Alerts', 'supplyChainAlerts')}
          <div style={{ fontSize: 11, color: '#5a6578', marginTop: 8, fontStyle: 'italic' }}>
            These are stored preferences only — there's no email/SMS delivery system wired up yet, so no notifications actually get sent.
          </div>
        </>}

        {tab === 'Supply Chain' && <>
          {select('Default Batch Status', 'defaultBatchStatus', ['created', 'packed', 'shipped', 'delivered'])}
          {toggle('QR Verification Enabled', 'qrVerificationEnabled')}
          {toggle('Customer Traceability Enabled', 'customerTraceabilityEnabled')}
          {toggle('Blockchain Ledger Enabled', 'blockchainLedgerEnabled')}
          {toggle('Required QC Before Packaging', 'qcRequiredBeforePackaging', 'Not yet enforced in the batch creation flow — stored as a preference.')}
          {toggle('Required QC Before Dispatch', 'qcRequiredBeforeDispatch', 'Not yet enforced in the batch creation flow — stored as a preference.')}
        </>}

        {tab === 'Finance' && <>
          {field('Default Currency', 'currency')}
          {field('Default CP Commission %', 'defaultCpCommissionPercent', 'number')}
          {select('Settlement Cycle', 'settlementCycle', ['weekly', 'biweekly', 'monthly'])}
          {field('Minimum Settlement Amount', 'minimumSettlementAmount', 'number')}
          <div style={{ fontSize: 11, color: '#5a6578', marginTop: 4, fontStyle: 'italic' }}>
            Shown in Reports & Analytics as the configured rate — existing settlement amounts already entered are not recalculated retroactively.
          </div>

          <div style={{ color: GOLD, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', margin: '20px 0 10px', letterSpacing: 0.5 }}>Taxes & Fees</div>
          {field('GST %', 'gstPercent', 'number')}
          {field('Platform Fee %', 'platformFeePercent', 'number')}
          {field('Delivery Fee (₹)', 'deliveryFee', 'number')}
          <div style={{ fontSize: 11, color: '#5a6578', marginTop: -8, fontStyle: 'italic' }}>
            GST is applied on generated invoices; Delivery Fee drives Estimated Rider Payouts on the Finance page. Platform Fee % is stored for reference only and not yet applied automatically.
          </div>
        </>}

        {tab === 'Traceability' && <>
          {toggle('Public Traceability Enabled', 'publicTraceabilityEnabled', 'When off, the /trace/:batchId page returns not-found for every batch.')}
          {field('QR Base URL (optional override)', 'qrBaseUrl')}
          <div style={{ fontSize: 11, color: '#5a6578', marginTop: -8, marginBottom: 14 }}>
            Leave blank to auto-detect from whatever address the admin app was loaded from.
          </div>
          {toggle('Show Origin', 'showOrigin')}
          {toggle('Show Processing Journey', 'showProcessingJourney')}
          {toggle('Show Quality Information', 'showQualityInfo', 'Hides FSSAI license / shelf life on the public page when off.')}
          {toggle('Show Seller Information', 'showSellerInfo', 'Hides the "Produced by" farmer/seller name when off.')}
          {toggle('Show Hub Information', 'showHubInfo', 'Hides Queen Hub / Warehouse journey stages when off.')}
          {toggle('Show Delivery Journey', 'showDeliveryJourney')}
          {toggle('Show Blockchain Verification', 'showBlockchainVerification', 'Hides the verified badge and block hashes when off.')}
          <div style={{ fontSize: 11, color: '#5a6578', marginTop: 4, fontStyle: 'italic' }}>
            These toggles actually change what the public /trace/:batchId page returns — verified live against the backend.
          </div>
        </>}

        {tab === 'Security' && <>
          {field('Session Timeout (minutes)', 'sessionTimeoutMinutes', 'number')}
          <div style={{ fontSize: 11, color: '#5a6578', marginTop: -8, marginBottom: 14 }}>
            Applies to new logins — controls how long a login token stays valid (currently {Math.round((form.sessionTimeoutMinutes || 0) / 1440)} days).
          </div>
          {field('Minimum Password Length', 'passwordMinLength', 'number')}
          {toggle('Require a Number in Password', 'passwordRequireNumber', 'Stored as policy text — not yet enforced on the login/signup forms.')}
          {toggle('Two-Factor Authentication', 'twoFactorEnabled', 'Not implemented in this app yet — leaving this on does not actually enable 2FA.')}

          <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 14, paddingTop: 14 }}>
            <strong style={{ color: 'white', fontSize: 13 }}>Recent Login Activity</strong>
            {loginActivity.length === 0 ? (
              <div style={{ color: '#8b96a8', fontSize: 12, marginTop: 8 }}>No logins recorded yet.</div>
            ) : (
              <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
                {loginActivity.map((l, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#cfd6e0', padding: '6px 0', borderTop: i === 0 ? 'none' : `1px solid ${BORDER}` }}>
                    <strong>{l.name || l.email}</strong> ({l.role}) — <span style={{ color: '#8b96a8' }}>{l.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>}

        <div style={{ marginTop: 16, borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
          <button onClick={save} style={{
            background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6,
            padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold'
          }}>Save Settings</button>
          {saved && <span style={{ marginLeft: 10, color: '#4fd18b', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={14} /> Settings saved successfully</span>}
        </div>
      </div>
    </Layout>
  );
}

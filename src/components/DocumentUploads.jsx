import { useEffect, useRef, useState } from 'react';
import { FileText, Upload, Trash2, Eye } from 'lucide-react';
import { api } from '../api';

const BORDER = '#2a3547';
const GOLD = '#c9a545';

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}

// Attaches real uploaded files (FSSAI certificates, lab report images) to any
// entity via the generic /documents vault — not a placeholder text field.
export default function DocumentUploads({ entityType, entityId, docType, label }) {
  const [docs, setDocs] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  const load = () => {
    if (!entityId) return;
    api.get('/documents', { params: { entityType, entityId } })
      .then(r => setDocs(r.data.filter(d => d.doc_type === docType)));
  };
  useEffect(() => { load(); }, [entityType, entityId, docType]);

  const upload = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    formData.append('docType', docType);
    try {
      await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const view = async (doc) => {
    // Open the tab synchronously, inside the click handler, so the browser
    // still treats it as a user gesture — opening it only after the awaited
    // fetch below resolves gets silently blocked as a popup.
    const w = window.open('', '_blank');
    if (!w) {
      alert('Your browser blocked the popup. Please allow popups for this site and try again.');
      return;
    }
    const res = await api.get(`/uploads/${doc.stored_name}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    w.location.href = url;
  };

  const remove = async (doc) => {
    if (!window.confirm(`Delete "${doc.original_name}"? This cannot be undone.`)) return;
    await api.delete(`/documents/${doc.id}`);
    load();
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, color: '#8b96a8', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {docs.map(doc => (
        <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: `1px solid ${BORDER}`, fontSize: 12 }}>
          <FileText size={14} color={GOLD} />
          <span style={{ color: '#cfd6e0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.original_name}</span>
          <span style={{ color: '#5a6578' }}>{formatSize(doc.size_bytes)}</span>
          <button onClick={() => view(doc)} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', display: 'flex' }} title="View"><Eye size={14} /></button>
          <button onClick={() => remove(doc)} style={{ background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex' }} title="Delete"><Trash2 size={14} /></button>
        </div>
      ))}
      {docs.length === 0 && <div style={{ color: '#5a6578', fontSize: 12, padding: '4px 0' }}>Not uploaded yet</div>}
      <label style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: GOLD,
        cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.6 : 1,
      }}>
        <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload file (JPG, PNG or PDF, max 5MB)'}
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={uploading}
          style={{ display: 'none' }} onChange={e => upload(e.target.files[0])} />
      </label>
      {error && <div style={{ color: '#e0708e', fontSize: 11, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

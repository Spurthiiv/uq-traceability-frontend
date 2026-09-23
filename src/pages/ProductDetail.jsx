import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';
import DocumentUploads from '../components/DocumentUploads';

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

const FORM_FIELDS = [
  'name', 'unit', 'category', 'description', 'price',
  'protein_per_100g', 'carbs_per_100g', 'total_sugar_per_100g', 'added_sugar_per_100g',
  'total_fat_per_100g', 'saturated_fat_per_100g', 'trans_fat_per_100g',
  'cholesterol_per_100g', 'sodium_per_100g', 'energy_per_100g',
  'key_features', 'fssai_license', 'shelf_life', 'disclaimer',
  'customer_care_email', 'country_of_origin', 'manufacturer_address',
  'return_policy', 'sugar_profile', 'seller_name', 'seller_address', 'seller_fssai'
];

const inputStyle = {
  background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white',
  padding: 8, borderRadius: 6
};

export default function ProductDetail({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get(`/products/${id}`).then(r => setProduct(r.data));
  useEffect(() => { load(); }, [id]);

  const startEditing = () => {
    const initial = {};
    FORM_FIELDS.forEach(f => { initial[f] = product[f] || ''; });
    setForm(initial);
    setError('');
    setEditing(true);
  };

  const saveEdits = async () => {
    setError('');
    try {
      await api.patch(`/products/${id}`, form);
      setEditing(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes');
    }
  };

  const deleteProduct = async () => {
    if (!window.confirm(`Delete product "${product.name}" from the catalog? This does not delete any existing batches.`)) return;
    await api.delete(`/products/${id}`);
    navigate('/products');
  };

  if (!product) {
    return (
      <Layout user={user} onLogout={onLogout} title="Product Detail">
        <p style={{ color: '#cfd6e0' }}>Loading...</p>
      </Layout>
    );
  }

  const hasNutrition = NUTRITION_ROWS.some(([, key]) => product[key]);
  const features = (product.key_features || '').split('\n').map(f => f.trim()).filter(Boolean);

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

  const field = (label, key, extraStyle) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...extraStyle }}>
      <label style={{ fontSize: 11, color: '#8b96a8' }}>{label}</label>
      <input value={form[key]} style={inputStyle}
        onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  const textareaField = (label, key, rows = 2) => (
    <div style={{ marginTop: 8 }}>
      <label style={{ fontSize: 11, color: '#8b96a8', display: 'block', marginBottom: 4 }}>{label}</label>
      <textarea value={form[key]} rows={rows} style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
        onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  const sectionLabel = (text) => (
    <div style={{ color: GOLD, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', margin: '16px 0 8px', letterSpacing: 0.5 }}>{text}</div>
  );

  return (
    <Layout user={user} onLogout={onLogout} title="Product Detail" breadcrumb={product.name}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Link to="/products" style={{ color: GOLD, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={14} /> Back to products
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          {!editing && (
            <button onClick={startEditing} style={{
              background: GOLD, color: '#1a2332', border: 'none',
              borderRadius: 6, cursor: 'pointer', padding: '6px 14px', fontSize: 13, fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: 6
            }}><Pencil size={14} /> Edit Product</button>
          )}
          <button onClick={deleteProduct} style={{
            background: 'rgba(198,40,40,0.15)', border: '1px solid #6b2c2c', color: '#e07a7a',
            borderRadius: 6, cursor: 'pointer', padding: '6px 14px', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6
          }}><Trash2 size={14} /> Delete Product</button>
        </div>
      </div>

      {editing ? (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
          {sectionLabel('Basic Info')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {field('Product name', 'name', { flex: '1 1 200px' })}
            {field('Unit (kg, jars, pieces...)', 'unit', { flex: '1 1 160px' })}
            {field('Category', 'category', { flex: '1 1 160px' })}
            {field('Price (₹ per unit)', 'price', { flex: '1 1 160px' })}
          </div>
          {textareaField('Description', 'description')}

          {sectionLabel('Key Features (one per line)')}
          <textarea value={form.key_features} rows={3} style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
            placeholder={'A flavourful blend of hand-picked, exotic spices\nInfuses exquisite aroma and robust flavour to any dish'}
            onChange={e => setForm({ ...form, key_features: e.target.value })} />

          {sectionLabel('Nutrition — Per 100g')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {field('Protein', 'protein_per_100g')}
            {field('Total Carbohydrates', 'carbs_per_100g')}
            {field('Total Sugar', 'total_sugar_per_100g')}
            {field('Added Sugar', 'added_sugar_per_100g')}
            {field('Total Fat', 'total_fat_per_100g')}
            {field('Saturated Fat', 'saturated_fat_per_100g')}
            {field('Trans Fat', 'trans_fat_per_100g')}
            {field('Cholesterol', 'cholesterol_per_100g')}
            {field('Sodium', 'sodium_per_100g')}
            {field('Energy', 'energy_per_100g')}
            {field('Sugar Profile', 'sugar_profile')}
          </div>

          {sectionLabel('Compliance & Origin')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {field('FSSAI License', 'fssai_license')}
            {field('Shelf Life', 'shelf_life')}
            {field('Country of Origin', 'country_of_origin')}
            {field('Customer Care Email', 'customer_care_email')}
          </div>
          {textareaField("Manufacturer's Name and Address", 'manufacturer_address')}
          {textareaField('Return Policy', 'return_policy')}
          {textareaField('Disclaimer', 'disclaimer')}

          {sectionLabel('Seller')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {field('Seller Name', 'seller_name')}
            {field('Seller FSSAI', 'seller_fssai')}
          </div>
          {textareaField('Seller Address', 'seller_address')}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={saveEdits} style={{
              background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px',
              cursor: 'pointer', fontWeight: 'bold'
            }}>Save changes</button>
            <button onClick={() => setEditing(false)} style={{
              background: '#243044', color: '#cfd6e0', border: `1px solid ${BORDER}`, borderRadius: 6,
              padding: '8px 16px', cursor: 'pointer'
            }}>Cancel</button>
          </div>
          {error && <div style={{ color: '#e0708e', fontSize: 12, marginTop: 8 }}>{error}</div>}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 20, marginBottom: 4 }}>
          <div style={{ flex: 2 }}>
            {sectionCard('Product Details', <>
              <h2 style={{ color: 'white', margin: '0 0 4px' }}>{product.name}</h2>
              <div style={{ color: '#8b96a8', fontSize: 13, marginBottom: 12 }}>
                {product.category && <span>{product.category} · </span>}
                {product.batch_count} {product.batch_count === 1 ? 'batch' : 'batches'} produced
              </div>
              {product.description && <p style={{ color: '#cfd6e0', fontSize: 13, lineHeight: 1.6 }}>{product.description}</p>}
              {infoRow('Unit', product.unit)}
              {infoRow('Price', product.price ? `₹${product.price}` : null)}
            </>)}

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
                  {product.sugar_profile && (
                    <tr style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '8px 0', color: '#8b96a8' }}>Sugar Profile</td>
                      <td style={{ padding: '8px 0', color: 'white', textAlign: 'right', fontWeight: 'bold' }}>{product.sugar_profile}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ))}

            {product.disclaimer && sectionCard('Disclaimer', (
              <p style={{ color: '#8b96a8', fontSize: 12, lineHeight: 1.6, fontStyle: 'italic' }}>{product.disclaimer}</p>
            ))}

            {!hasNutrition && features.length === 0 && !product.description && (
              <div style={{ color: '#8b96a8', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                No nutrition, features or description yet — click "Edit Product" above to add them.
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            {sectionCard('Compliance & Origin', <>
              {infoRow('FSSAI License', product.fssai_license)}
              {infoRow('Shelf Life', product.shelf_life)}
              {infoRow('Country of Origin', product.country_of_origin)}
              {infoRow('Customer Care', product.customer_care_email)}
              {infoRow("Manufacturer", product.manufacturer_address)}
              {infoRow('Return Policy', product.return_policy)}
              {!product.fssai_license && !product.shelf_life && !product.country_of_origin &&
                !product.customer_care_email && !product.manufacturer_address && !product.return_policy && (
                <div style={{ color: '#8b96a8', fontSize: 12, padding: '8px 0' }}>Not filled in yet</div>
              )}
              <DocumentUploads entityType="product" entityId={product.id} docType="fssai_certificate" label="FSSAI Certificate" />
            </>)}

            {(product.seller_name || product.seller_address || product.seller_fssai) && sectionCard('Seller', <>
              {infoRow('Name', product.seller_name)}
              {infoRow('Address', product.seller_address)}
              {infoRow('FSSAI', product.seller_fssai)}
              <DocumentUploads entityType="product" entityId={product.id} docType="seller_fssai_certificate" label="Seller FSSAI Certificate" />
            </>)}
          </div>
        </div>
      )}
    </Layout>
  );
}

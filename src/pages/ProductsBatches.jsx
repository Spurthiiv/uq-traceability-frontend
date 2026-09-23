import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Package, Boxes, ShieldCheck, Layers, Download, ExternalLink } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';
import { STAGES, stageIndex } from '../stages';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

const EMPTY_PRODUCT_FORM = {
  name: '', unit: '', category: '', description: '', price: '',
  protein_per_100g: '', carbs_per_100g: '', total_sugar_per_100g: '', added_sugar_per_100g: '',
  total_fat_per_100g: '', saturated_fat_per_100g: '', trans_fat_per_100g: '',
  cholesterol_per_100g: '', sodium_per_100g: '', energy_per_100g: '',
  key_features: '', fssai_license: '', shelf_life: '', disclaimer: '',
  customer_care_email: '', country_of_origin: '', manufacturer_address: '',
  return_policy: '', sugar_profile: '', seller_name: '', seller_address: '', seller_fssai: ''
};

export default function ProductsBatches({ user, onLogout }) {
  const [tab, setTab] = useState('batches');
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [batchForm, setBatchForm] = useState({ productName: '', farmerName: '', originLocation: '', harvestDate: '', initialQuantity: '', quantity: '', unit: '', ingredients: '' });
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [productError, setProductError] = useState('');
  const [expandedBatchId, setExpandedBatchId] = useState(null);
  const [expandedQr, setExpandedQr] = useState(null);

  const loadBatches = () => api.get('/batches').then(r => setBatches(r.data));
  const loadProducts = () => api.get('/products').then(r => setProducts(r.data));
  useEffect(() => { loadBatches(); loadProducts(); api.get('/master-data/categories').then(r => setCategories(r.data)); }, []);

  const createBatch = async () => {
    await api.post('/batches', batchForm);
    setBatchForm({ productName: '', farmerName: '', originLocation: '', harvestDate: '', initialQuantity: '', quantity: '', unit: '', ingredients: '' });
    setShowForm(false);
    loadBatches();
  };

  const deleteBatch = async (id, productName) => {
    if (!window.confirm(`Delete batch "${productName}"? This cannot be undone.`)) return;
    await api.delete(`/batches/${id}`);
    if (expandedBatchId === id) setExpandedBatchId(null);
    loadBatches();
  };

  const createProduct = async () => {
    setProductError('');
    try {
      await api.post('/products', productForm);
      setProductForm(EMPTY_PRODUCT_FORM);
      setShowForm(false);
      loadProducts();
    } catch (err) {
      setProductError(err.response?.data?.error || 'Failed to create product');
    }
  };

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Delete product "${name}" from the catalog? This does not delete any existing batches.`)) return;
    await api.delete(`/products/${id}`);
    loadProducts();
  };

  const toggleExpand = (batch) => {
    if (expandedBatchId === batch.id) {
      setExpandedBatchId(null);
      setExpandedQr(null);
      return;
    }
    setExpandedBatchId(batch.id);
    setExpandedQr(null);
    api.get(`/batches/${batch.id}/qr`).then(r => setExpandedQr(r.data));
  };

  const statusColor = (status) => {
    if (status === 'DELIVERED') return { bg: 'rgba(46,125,95,0.15)', color: '#4fd18b' };
    return { bg: 'rgba(201,165,69,0.15)', color: GOLD };
  };

  const inputStyle = {
    background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white',
    padding: 8, borderRadius: 6
  };

  const field = (label, key, extraStyle) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...extraStyle }}>
      <label style={{ fontSize: 11, color: '#8b96a8' }}>{label}</label>
      <input value={productForm[key]} style={inputStyle}
        onChange={e => setProductForm({ ...productForm, [key]: e.target.value })} />
    </div>
  );

  const sectionLabel = (text) => (
    <div style={{ color: GOLD, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', margin: '16px 0 8px', letterSpacing: 0.5 }}>{text}</div>
  );

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

  const productIcon = (size = 16) => (
    <div style={{
      width: size + 18, height: size + 18, borderRadius: 8, background: 'rgba(201,165,69,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}><Package size={size} color={GOLD} /></div>
  );

  const totalBatchesAcrossProducts = products.reduce((sum, p) => sum + (p.batch_count || 0), 0);
  const productsWithBatches = products.filter(p => (p.batch_count || 0) > 0).length;
  const productsWithCompliance = products.filter(p => p.fssai_license).length;

  const delivered = batches.filter(b => b.status === 'DELIVERED').length;
  const inProgress = batches.filter(b => b.status !== 'DELIVERED').length;

  return (
    <Layout user={user} onLogout={onLogout} title="Products & Batches">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <button onClick={() => { setTab('batches'); setShowForm(false); }} style={{
            padding: '8px 16px', borderRadius: 6, border: 'none', marginRight: 8, cursor: 'pointer',
            background: tab === 'batches' ? GOLD : '#243044',
            color: tab === 'batches' ? '#1a2332' : '#cfd6e0', fontWeight: tab === 'batches' ? 'bold' : 'normal'
          }}>Batches</button>
          <button onClick={() => { setTab('products'); setShowForm(false); }} style={{
            padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === 'products' ? GOLD : '#243044',
            color: tab === 'products' ? '#1a2332' : '#cfd6e0', fontWeight: tab === 'products' ? 'bold' : 'normal'
          }}>Products</button>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6,
          padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold'
        }}>{tab === 'batches' ? '+ New Batch' : '+ New Product'}</button>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        {tab === 'batches' ? (
          <>
            {statTile('Total Batches', batches.length, Boxes, '#7b5fd6')}
            {statTile('In Progress', inProgress, Layers, GOLD)}
            {statTile('Delivered', delivered, ShieldCheck, '#2e7d5f')}
          </>
        ) : (
          <>
            {statTile('Total Products', products.length, Package, '#7b5fd6')}
            {statTile('Total Batches', totalBatchesAcrossProducts, Boxes, '#3b82c4')}
            {statTile('Products with Batches', productsWithBatches, Layers, GOLD)}
            {statTile('With Compliance Info', productsWithCompliance, ShieldCheck, '#2e7d5f')}
          </>
        )}
      </div>

      {showForm && tab === 'batches' && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input list="product-names" placeholder="Product name" value={batchForm.productName} style={inputStyle}
            onChange={e => setBatchForm({ ...batchForm, productName: e.target.value })} />
          <datalist id="product-names">
            {products.map(p => <option key={p.id} value={p.name} />)}
          </datalist>
          <input placeholder="Farmer name" value={batchForm.farmerName} style={inputStyle}
            onChange={e => setBatchForm({ ...batchForm, farmerName: e.target.value })} />
          <input placeholder="Origin location" value={batchForm.originLocation} style={inputStyle}
            onChange={e => setBatchForm({ ...batchForm, originLocation: e.target.value })} />
          <input placeholder="Harvest date (YYYY-MM-DD)" value={batchForm.harvestDate} style={inputStyle}
            onChange={e => setBatchForm({ ...batchForm, harvestDate: e.target.value })} />
          <input placeholder="Initial quantity (optional)" value={batchForm.initialQuantity} style={inputStyle}
            onChange={e => setBatchForm({ ...batchForm, initialQuantity: e.target.value })} />
          <input placeholder="Final quantity" value={batchForm.quantity} style={inputStyle}
            onChange={e => setBatchForm({ ...batchForm, quantity: e.target.value })} />
          <input placeholder="Unit (kg, boxes...)" value={batchForm.unit} style={inputStyle}
            onChange={e => setBatchForm({ ...batchForm, unit: e.target.value })} />
          <input placeholder="Ingredients (comma-separated)" value={batchForm.ingredients} style={inputStyle}
            onChange={e => setBatchForm({ ...batchForm, ingredients: e.target.value })} />
          <button onClick={createBatch} style={{
            background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold'
          }}>Create batch</button>
        </div>
      )}

      {showForm && tab === 'products' && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          {sectionLabel('Basic Info')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {field('Product name', 'name', { flex: '1 1 200px' })}
            {field('Unit (kg, jars, pieces...)', 'unit', { flex: '1 1 160px' })}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px' }}>
              <label style={{ fontSize: 11, color: '#8b96a8' }}>Category</label>
              <input list="category-options" value={productForm.category} style={inputStyle}
                onChange={e => setProductForm({ ...productForm, category: e.target.value })} />
              <datalist id="category-options">
                {categories.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            {field('Price (₹ per unit)', 'price', { flex: '1 1 160px' })}
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 11, color: '#8b96a8', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea value={productForm.description} rows={2} style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
              onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
          </div>

          {sectionLabel('Key Features (one per line)')}
          <textarea value={productForm.key_features} rows={3} style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
            placeholder={'A flavourful blend of hand-picked, exotic spices\nInfuses exquisite aroma and robust flavour to any dish'}
            onChange={e => setProductForm({ ...productForm, key_features: e.target.value })} />

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
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 11, color: '#8b96a8', display: 'block', marginBottom: 4 }}>Manufacturer's Name and Address</label>
            <textarea value={productForm.manufacturer_address} rows={2} style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
              onChange={e => setProductForm({ ...productForm, manufacturer_address: e.target.value })} />
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 11, color: '#8b96a8', display: 'block', marginBottom: 4 }}>Return Policy</label>
            <textarea value={productForm.return_policy} rows={2} style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
              onChange={e => setProductForm({ ...productForm, return_policy: e.target.value })} />
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 11, color: '#8b96a8', display: 'block', marginBottom: 4 }}>Disclaimer</label>
            <textarea value={productForm.disclaimer} rows={2} style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
              onChange={e => setProductForm({ ...productForm, disclaimer: e.target.value })} />
          </div>

          {sectionLabel('Seller')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {field('Seller Name', 'seller_name')}
            {field('Seller FSSAI', 'seller_fssai')}
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 11, color: '#8b96a8', display: 'block', marginBottom: 4 }}>Seller Address</label>
            <textarea value={productForm.seller_address} rows={2} style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
              onChange={e => setProductForm({ ...productForm, seller_address: e.target.value })} />
          </div>

          <button onClick={createProduct} style={{
            background: GOLD, color: '#1a2332', border: 'none', borderRadius: 6, padding: '8px 16px',
            cursor: 'pointer', fontWeight: 'bold', marginTop: 16
          }}>Create product</button>
          {productError && <div style={{ color: '#e0708e', fontSize: 12, marginTop: 8 }}>{productError}</div>}
        </div>
      )}

      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 20 }}>
        {tab === 'batches' ? (
          batches.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No batches yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '10px 8px' }}>Product</th>
                  <th>Ingredients</th>
                  <th>Quantity</th>
                  <th>Manufactured</th>
                  <th>Status</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {batches.map(b => {
                  const sc = statusColor(b.status);
                  const expanded = expandedBatchId === b.id;
                  return (
                    <Fragment key={b.id}>
                      <tr onClick={() => toggleExpand(b)} style={{ borderTop: `1px solid ${BORDER}`, cursor: 'pointer', background: expanded ? 'rgba(201,165,69,0.06)' : 'transparent' }}>
                        <td style={{ padding: '10px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {productIcon(14)}
                            <div>
                              <div style={{ color: 'white' }}>{b.product_name}</div>
                              <div style={{ fontSize: 11, color: '#8b96a8', fontFamily: 'monospace' }}>{b.batch_code || b.id.slice(0, 8) + '…'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: '#8b96a8' }}>{b.ingredients || '—'}</td>
                        <td>{b.initial_quantity ? `${b.initial_quantity} → ` : ''}{b.quantity} {b.unit}</td>
                        <td>{b.harvest_date}</td>
                        <td>
                          <span style={{ background: sc.bg, color: sc.color, padding: '3px 12px', borderRadius: 12, fontSize: 12 }}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          <Link to={`/batches/${b.id}`} onClick={ev => ev.stopPropagation()} style={{ color: GOLD, fontSize: 12 }}>View Journey / QR</Link>
                        </td>
                        <td>
                          <button onClick={(ev) => { ev.stopPropagation(); deleteBatch(b.id, b.product_name); }} style={{
                            background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex', alignItems: 'center'
                          }}><Trash2 size={15} /></button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <div style={{ background: '#0f1620', border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, margin: '4px 0 12px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                              <div style={{ flex: '1 1 280px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                {productIcon(20)}
                                <div>
                                  <strong style={{ color: 'white', fontSize: 14 }}>{b.product_name}</strong>
                                  <div style={{ fontSize: 12, color: '#8b96a8', fontFamily: 'monospace', marginTop: 2 }}>{b.batch_code}</div>
                                  <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, flexWrap: 'wrap' }}>
                                    <div><div style={{ color: '#8b96a8' }}>Quantity</div><div style={{ color: 'white' }}>{b.initial_quantity ? `${b.initial_quantity} → ` : ''}{b.quantity} {b.unit}</div></div>
                                    <div><div style={{ color: '#8b96a8' }}>Origin</div><div style={{ color: 'white' }}>{b.origin_location || '—'}</div></div>
                                    <div><div style={{ color: '#8b96a8' }}>Manufactured</div><div style={{ color: 'white' }}>{b.harvest_date || '—'}</div></div>
                                  </div>
                                </div>
                              </div>

                              <div style={{ flex: '2 1 320px' }}>
                                <div style={{ fontSize: 11, color: '#8b96a8', marginBottom: 8, textTransform: 'uppercase' }}>Batch Status</div>
                                <div style={{ display: 'flex', overflowX: 'auto', gap: 4 }}>
                                  {STAGES.map((s, i) => {
                                    const done = i <= stageIndex(b.status);
                                    return (
                                      <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, width: 70 }}>
                                        <div style={{
                                          width: 26, height: 26, borderRadius: '50%',
                                          background: done ? 'rgba(46,125,95,0.2)' : '#1a2332',
                                          border: `1px solid ${done ? '#2e7d5f' : BORDER}`,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}><s.icon size={12} color={done ? '#4fd18b' : '#8b96a8'} /></div>
                                        <div style={{ fontSize: 9, textAlign: 'center', color: done ? 'white' : '#8b96a8' }}>{s.label}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div style={{ flex: '0 0 160px', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, color: '#8b96a8', marginBottom: 8, textTransform: 'uppercase' }}>QR Code</div>
                                {expandedQr ? (
                                  <>
                                    <img src={expandedQr.qrDataUrl} alt="QR code" style={{ width: 100, height: 100, background: 'white', borderRadius: 6, padding: 6 }} />
                                    <a href={expandedQr.qrDataUrl} download={`${b.batch_code}-qr.png`} style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8,
                                      color: GOLD, fontSize: 12, textDecoration: 'none'
                                    }}><Download size={13} /> Download QR</a>
                                    <Link to={`/batches/${b.id}`} style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6,
                                      color: '#8b96a8', fontSize: 12, textDecoration: 'none'
                                    }}><ExternalLink size={12} /> Full Details</Link>
                                  </>
                                ) : (
                                  <div style={{ color: '#8b96a8', fontSize: 12 }}>Loading…</div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )
        ) : (
          products.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#8b96a8', fontSize: 13 }}>No products yet — click "+ New Product" to add one</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cfd6e0', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#8b96a8', fontSize: 12, borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '10px 8px' }}>Product</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th>Batches</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {productIcon(14)}
                        <Link to={`/products/${p.id}`} style={{ color: GOLD }}>{p.name}</Link>
                      </div>
                    </td>
                    <td style={{ color: '#8b96a8' }}>{p.category || '—'}</td>
                    <td>{p.unit || '—'}</td>
                    <td>{p.price ? `₹${p.price}` : '—'}</td>
                    <td style={{ color: '#8b96a8' }}>{p.description || '—'}</td>
                    <td>{p.batch_count}</td>
                    <td>
                      <button onClick={() => deleteProduct(p.id, p.name)} style={{
                        background: 'none', border: 'none', color: '#e0708e', cursor: 'pointer', display: 'flex', alignItems: 'center'
                      }}><Trash2 size={15} /></button>
                    </td>
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

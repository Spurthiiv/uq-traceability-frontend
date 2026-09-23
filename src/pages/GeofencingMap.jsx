import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvent } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Building2, Crosshair, X, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import Layout from '../Layout';

const CARD_BG = '#1a2332';
const BORDER = '#2a3547';
const GOLD = '#c9a545';

// A default center for hubs/zones that have no coordinates yet — Hassan
// district, Karnataka, matching this deployment's existing hub/zone names
// (e.g. "hassan", "bengaluru") rather than an arbitrary world coordinate.
const DEFAULT_CENTER = [13.0, 76.1];

const STATUS_COLOR = { draft: '#8b96a8', pilot: '#3b82c4', active: '#4fd18b', saturated: GOLD, frozen: '#e0708e', inactive: '#8b96a8' };
const WARNING = '#e0708e';

// Leaflet's default marker images don't resolve correctly through Vite's
// asset pipeline — a colored div marker sidesteps that entirely and matches
// the app's own theme instead of the stock red pin.
function dotIcon(color) {
  return divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function ClickCapture({ onClick }) {
  useMapEvent('click', (e) => onClick(e.latlng));
  return null;
}

export default function GeofencingMap({ user, onLogout }) {
  const [zones, setZones] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [armed, setArmed] = useState(null); // { type: 'zone'|'hub', id }
  const [radiusDraft, setRadiusDraft] = useState({});

  const load = () => {
    api.get('/master-data/zones').then(r => setZones(r.data));
    api.get('/master-data/hubs').then(r => setHubs(r.data));
  };
  useEffect(() => { load(); }, []);

  const handleMapClick = async (latlng) => {
    if (!armed) return;
    const { lat, lng } = latlng;
    if (armed.type === 'hub') {
      await api.patch(`/master-data/hubs/${armed.id}/location`, { latitude: lat, longitude: lng });
    } else {
      const radiusKm = radiusDraft[armed.id] || zones.find(z => z.id === armed.id)?.radius_km || 2;
      await api.patch(`/master-data/zones/${armed.id}/location`, { latitude: lat, longitude: lng, radiusKm });
    }
    setArmed(null);
    load();
  };

  const saveRadius = async (zone) => {
    if (zone.latitude == null) return;
    await api.patch(`/master-data/zones/${zone.id}/location`, {
      latitude: zone.latitude, longitude: zone.longitude, radiusKm: radiusDraft[zone.id] ?? zone.radius_km,
    });
    load();
  };

  const rowStyle = (isArmed) => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
    borderTop: `1px solid ${BORDER}`, background: isArmed ? 'rgba(201,165,69,0.08)' : 'transparent',
  });

  return (
    <Layout user={user} onLogout={onLogout} title="Geofencing Map">
      <div style={{ color: '#8b96a8', fontSize: 11, marginTop: -12, marginBottom: 16, fontStyle: 'italic' }}>
        BRD Section 7.6 (ADM-03) — real hub locations and zone geofences (center + radius) plotted on an OpenStreetMap base. Click "Set Location" on a row, then click the map to place it.
      </div>

      {armed && (
        <div style={{ background: 'rgba(201,165,69,0.15)', border: `1px solid ${GOLD}`, borderRadius: 8, padding: '8px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: GOLD, fontSize: 13 }}>
          <span><Crosshair size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Click anywhere on the map to place this {armed.type === 'hub' ? 'hub' : 'zone'}.</span>
          <button onClick={() => setArmed(null)} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 60%', minWidth: 0, borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}`, height: 560 }}>
          <MapContainer center={DEFAULT_CENTER} zoom={9} style={{ height: '100%', width: '100%', cursor: armed ? 'crosshair' : '' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickCapture onClick={handleMapClick} />
            {zones.filter(z => z.latitude != null).map(z => (
              <Circle key={z.id} center={[z.latitude, z.longitude]} radius={(z.radius_km || 2) * 1000}
                pathOptions={{ color: STATUS_COLOR[z.status] || GOLD, fillColor: STATUS_COLOR[z.status] || GOLD, fillOpacity: 0.12, weight: 2 }}>
                <Popup>
                  <strong>{z.name}</strong><br />
                  {z.zone_level} · {z.status}<br />
                  {z.hub_count} hub(s) · {z.radius_km} km radius
                </Popup>
              </Circle>
            ))}
            {hubs.filter(h => h.latitude != null).map(h => (
              <Marker key={h.id} position={[h.latitude, h.longitude]} icon={dotIcon(h.withinZone === false ? WARNING : (STATUS_COLOR[h.status] || GOLD))}>
                <Popup>
                  <strong>{h.name}</strong><br />
                  {h.zone_name ? `Zone: ${h.zone_name}` : 'No zone assigned'}<br />
                  {h.address || 'No address on file'}
                  {h.withinZone === false && (
                    <><br /><span style={{ color: WARNING }}>⚠ {h.distanceFromZoneKm} km from "{h.zone_name}" — outside its geofence radius</span></>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div style={{ flex: '1 1 40%', minWidth: 280 }}>
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
              <MapPin size={15} color={GOLD} /> Zones ({zones.filter(z => z.latitude != null).length}/{zones.length} placed)
            </div>
            {zones.length === 0 && <div style={{ color: '#8b96a8', fontSize: 12 }}>No zones yet — add one in Master Data first.</div>}
            {zones.map(z => (
              <div key={z.id} style={rowStyle(armed?.type === 'zone' && armed.id === z.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'white', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.name}</div>
                  <div style={{ color: '#8b96a8', fontSize: 11 }}>{z.latitude != null ? `${z.latitude.toFixed(4)}, ${z.longitude.toFixed(4)}` : 'Not placed'}</div>
                </div>
                <input type="number" placeholder="km" value={radiusDraft[z.id] ?? z.radius_km ?? 2} style={{ width: 50, background: '#0f1620', border: `1px solid ${BORDER}`, color: 'white', padding: 4, borderRadius: 4, fontSize: 12 }}
                  onChange={e => setRadiusDraft({ ...radiusDraft, [z.id]: e.target.value })}
                  onBlur={() => saveRadius(z)} />
                <button onClick={() => setArmed({ type: 'zone', id: z.id })} style={{
                  background: armed?.type === 'zone' && armed.id === z.id ? GOLD : '#243044',
                  color: armed?.type === 'zone' && armed.id === z.id ? '#1a2332' : GOLD,
                  border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap'
                }}>{z.latitude != null ? 'Re-place' : 'Set Location'}</button>
              </div>
            ))}
          </div>

          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
              <Building2 size={15} color={GOLD} /> Hubs ({hubs.filter(h => h.latitude != null).length}/{hubs.length} placed)
            </div>
            {hubs.length === 0 && <div style={{ color: '#8b96a8', fontSize: 12 }}>No hubs yet — add one in Master Data first.</div>}
            {hubs.map(h => (
              <div key={h.id} style={rowStyle(armed?.type === 'hub' && armed.id === h.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'white', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {h.name}
                    {h.withinZone === false && (
                      <span title={`${h.distanceFromZoneKm} km from "${h.zone_name}"'s center — outside its geofence radius`} style={{ color: WARNING, display: 'inline-flex' }}>
                        <AlertTriangle size={12} />
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#8b96a8', fontSize: 11 }}>{h.latitude != null ? `${h.latitude.toFixed(4)}, ${h.longitude.toFixed(4)}` : 'Not placed'}</div>
                </div>
                <button onClick={() => setArmed({ type: 'hub', id: h.id })} style={{
                  background: armed?.type === 'hub' && armed.id === h.id ? GOLD : '#243044',
                  color: armed?.type === 'hub' && armed.id === h.id ? '#1a2332' : GOLD,
                  border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap'
                }}>{h.latitude != null ? 'Re-place' : 'Set Location'}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

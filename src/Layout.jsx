import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', roles: ['ADMIN','OPS','QUEEN','LOGISTICS','RETAILER'] },
  { label: 'Supply Chain', path: '/supply-chain', roles: ['ADMIN','OPS'] },
  { label: 'Blockchain Ledger', path: '/ledger', roles: ['ADMIN','OPS'] },
  { label: 'Products & Batches', path: '/products', roles: ['ADMIN','OPS','QUEEN'] },
  { label: 'Quality & Compliance', path: '/quality', roles: ['ADMIN','OPS'] },
  { label: 'Finance & Settlements', path: '/finance', roles: ['ADMIN','OPS'] },
  { label: 'Reports & Analytics', path: '/reports', roles: ['ADMIN'] },
  { label: 'Master Data', path: '/master-data', roles: ['ADMIN'] },
  { label: 'Geofencing Map', path: '/geofencing', roles: ['ADMIN'] },
  { label: 'Compliance & Audit', path: '/compliance', roles: ['ADMIN'] },
  { label: 'Users & Roles', path: '/users', roles: ['ADMIN'] },
  { label: 'Settings', path: '/settings', roles: ['ADMIN'] },
];

const NAVY = '#1a2332';
const NAVY_DARK = '#141b28';
const GOLD = '#c9a545';
const GOLD_LIGHT = '#e0c46a';

export default function Layout({ user, onLogout, title, breadcrumb, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const visibleNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1620' }}>
      {/* Sidebar */}
      <div style={{
        width: collapsed ? 64 : 240, flexShrink: 0, background: NAVY_DARK,
        color: '#cfd6e0', display: 'flex', flexDirection: 'column', padding: '20px 0',
        transition: 'width 0.2s', overflow: 'hidden', boxShadow: '2px 0 12px rgba(0,0,0,0.25)',
        position: 'relative', zIndex: 1
      }}>
        <div style={{ padding: '0 16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: GOLD, color: NAVY_DARK, fontWeight: 'bold', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>UQ</div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 15, color: 'white' }}>Udyami Queens</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>Empowering Women Entrepreneurs</div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, marginTop: 10 }}>
          {visibleNavItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`nav-link${active ? ' active' : ''}`} style={{
                display: 'flex', alignItems: 'center',
                padding: '10px 16px', color: active ? GOLD_LIGHT : '#cfd6e0', textDecoration: 'none',
                background: active ? 'rgba(201,165,69,0.12)' : 'transparent',
                borderLeft: active ? `3px solid ${GOLD}` : '3px solid transparent',
                fontSize: 14, whiteSpace: 'nowrap'
              }}>
                {!collapsed && item.label}
              </Link>
            );
          })}
        </div>

        {!collapsed && (
          <div style={{
            margin: '0 16px', padding: 14, borderRadius: 10,
            background: 'rgba(201,165,69,0.1)', border: `1px solid rgba(201,165,69,0.3)`,
            fontSize: 12, textAlign: 'center', color: GOLD_LIGHT
          }}>
            Stronger Women<br />Stronger Communities
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowX: 'auto' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px', background: NAVY, borderBottom: '1px solid #2a3547',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', position: 'relative', zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setCollapsed(!collapsed)} style={{
              background: '#243044', border: 'none', color: '#cfd6e0', width: 32, height: 32,
              borderRadius: 6, cursor: 'pointer', fontSize: 14
            }}>{collapsed ? '>' : '<'}</button>
            <div style={{ fontWeight: 'bold', fontSize: 15, color: 'white' }}>
              Welcome back, {user.name.split(' ')[0]}
            </div>
          </div>

          <input placeholder="Search by Batch ID, Order ID, or Product..." style={{
            flex: 1, maxWidth: 380, margin: '0 24px', padding: 8, borderRadius: 6,
            border: '1px solid #2a3547', background: '#0f1620', color: '#cfd6e0'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: '#243044', padding: '6px 12px', borderRadius: 6,
              fontSize: 12, color: '#cfd6e0'
            }}>EN</span>
            <span style={{
              background: GOLD, width: 30, height: 30, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 'bold', color: NAVY_DARK
            }}>{user.name[0]}</span>
            <div style={{ fontSize: 12 }}>
              <div style={{ color: 'white', fontWeight: 'bold' }}>{user.name}</div>
              <div style={{ color: '#8b96a8' }}>{user.role}</div>
            </div>
            <button onClick={handleLogout} style={{
              background: '#3a1f1f', border: '1px solid #6b2c2c', color: '#e07a7a',
              borderRadius: 6, cursor: 'pointer', padding: '6px 14px', fontSize: 12, marginLeft: 6
            }}>Logout</button>
          </div>
        </div>

        {/* Page header */}
        <div style={{ padding: '20px 24px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, background: NAVY,
            border: '1px solid #2a3547', borderRadius: 10, padding: '16px 20px', marginBottom: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <div style={{ width: 4, height: 32, borderRadius: 4, background: GOLD }} />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 18, color: 'white' }}>{title}</div>
              <div style={{ fontSize: 12, color: GOLD_LIGHT }}>
                Dashboard {breadcrumb ? `/ ${breadcrumb}` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: '0 24px 24px', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
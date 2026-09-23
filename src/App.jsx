import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BatchDetail from './pages/BatchDetail';
import TracePage from './pages/TracePage';
import SupplyChain from './pages/SupplyChain';
import BlockchainLedger from './pages/BlockchainLedger';
import ProductsBatches from './pages/ProductsBatches';
import ProductDetail from './pages/ProductDetail';
import QualityCompliance from './pages/QualityCompliance';
import FinanceSettlements from './pages/FinanceSettlements';
import ReportsAnalytics from './pages/ReportsAnalytics';
import UsersRoles from './pages/UsersRoles';
import Settings from './pages/Settings';
import MasterData from './pages/MasterData';
import ComplianceAudit from './pages/ComplianceAudit';
import GeofencingMap from './pages/GeofencingMap';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('uq_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('uq_token');
    localStorage.removeItem('uq_user');
    setUser(null);
  };

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" /> : <Login onLogin={setUser} />
        } />
        <Route path="/dashboard" element={
          user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="/batches/:id" element={
          user ? <BatchDetail user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        <Route path="/trace/:id" element={<TracePage />} />
<Route path="/supply-chain" element={
  user ? <SupplyChain user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
} />
<Route path="/ledger" element={
  user ? <BlockchainLedger user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
} />
<Route path="/products" element={
  user ? <ProductsBatches user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
} />
<Route path="/products/:id" element={
  user ? <ProductDetail user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
} />
<Route path="/quality" element={
  user ? <QualityCompliance user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
} />
<Route path="/finance" element={
  user ? <FinanceSettlements user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
} />
<Route path="/reports" element={
  user ? <ReportsAnalytics user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
} />
<Route path="/master-data" element={
  user ? <MasterData user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
} />
<Route path="/compliance" element={
  user ? <ComplianceAudit user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
} />
<Route path="/geofencing" element={
  user ? <GeofencingMap user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
} />
<Route path="/users" element={
  user ? <UsersRoles user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
} />
<Route path="/settings" element={
  user ? <Settings user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
} />
<Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
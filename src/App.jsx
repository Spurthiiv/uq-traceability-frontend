import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import CeoDashboard from './pages/CeoDashboard';
import DistrictDashboard from './pages/DistrictDashboard';
import OperationsDashboard from './pages/OperationsDashboard';
import TrainingDashboard from './pages/TrainingDashboard';
import SellerDashboard from './pages/SellerDashboard';
import HubDashboard from './pages/HubDashboard';
import RiderDashboard from './pages/RiderDashboard';

// Authentication removed at the user's explicit request — there is no login
// page, and every visitor is treated as this fixed ADMIN identity.
const user = { id: 'no-auth-admin', name: 'Admin', role: 'ADMIN', email: 'admin@local' };

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/batches/:id" element={<BatchDetail user={user} />} />
        <Route path="/trace/:id" element={<TracePage />} />
        <Route path="/supply-chain" element={<SupplyChain user={user} />} />
        <Route path="/ledger" element={<BlockchainLedger user={user} />} />
        <Route path="/products" element={<ProductsBatches user={user} />} />
        <Route path="/products/:id" element={<ProductDetail user={user} />} />
        <Route path="/quality" element={<QualityCompliance user={user} />} />
        <Route path="/finance" element={<FinanceSettlements user={user} />} />
        <Route path="/reports" element={<ReportsAnalytics user={user} />} />
        <Route path="/master-data" element={<MasterData user={user} />} />
        <Route path="/compliance" element={<ComplianceAudit user={user} />} />
        <Route path="/geofencing" element={<GeofencingMap user={user} />} />
        <Route path="/ceo-dashboard" element={<CeoDashboard user={user} />} />
        <Route path="/district-dashboard" element={<DistrictDashboard user={user} />} />
        <Route path="/operations-dashboard" element={<OperationsDashboard user={user} />} />
        <Route path="/training" element={<TrainingDashboard user={user} />} />
        <Route path="/seller-dashboard" element={<SellerDashboard user={user} />} />
        <Route path="/hub-dashboard" element={<HubDashboard user={user} />} />
        <Route path="/rider-dashboard" element={<RiderDashboard user={user} />} />
        <Route path="/users" element={<UsersRoles user={user} />} />
        <Route path="/settings" element={<Settings user={user} />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

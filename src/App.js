import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AdminLoginScreen from './components/AdminLogin';
import CashierLoginScreen from './components/CashierLogin';
import AdminScreen from './components/AdminScreen';
import ChangeAdmin from './components/ChangeAdmin';
import AdminPharmacy from './components/AdminPharmacy';
import InvestigationAdmin from './components/InvestigationAdmin';
import CashierDashboard from './components/CashierDashboard';
import IndoorPharmacy from './components/cashier/IndoorPharmacy';
import AdminAction from './components/AdminAction';
import OutdoorPharmacy from './components/cashier/OutdoorPharmacy';
import Investigation from './components/cashier/Investigation';
import Dressing from "./components/cashier/Dressing";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/adminlogin" element={<AdminLoginScreen />} />
        <Route path="/cashier" element={<CashierLoginScreen />} />
        <Route path="/admin" element={<AdminScreen />} />
        <Route path="/change-admin-credentials" element={<ChangeAdmin />} />
        <Route path="/admin-pharmacy" element={<AdminPharmacy />} />
        <Route path="/admin-investigation" element={<InvestigationAdmin />} />
        <Route path="/cashier-dashboard" element={<CashierDashboard />} />
        <Route path="/indoor-pharmacy" element={<IndoorPharmacy />} />
        <Route path="/admin-action" element={<AdminAction />} />
        <Route path="/outdoor-pharmacy" element={<OutdoorPharmacy />} />
        <Route path="/investigation" element={<Investigation />} />
        <Route path="/dressing" element={<Dressing />} />
      </Routes>
    </Router>
  );
}

export default App;

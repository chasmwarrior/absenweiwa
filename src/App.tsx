/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Locations from './pages/Locations';
import BotSettings from './pages/BotSettings';
import Reports from './pages/Reports';
import PendingActions from './pages/PendingActions';
import EmployeeStats from './pages/EmployeeStats';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/stats/:id" element={<EmployeeStats />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pending" element={<PendingActions />} />
          <Route path="users" element={<Users />} />
          <Route path="locations" element={<Locations />} />
          <Route path="bot-settings" element={<BotSettings />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


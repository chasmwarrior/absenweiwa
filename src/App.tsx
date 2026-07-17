import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ChangeNumber from './pages/ChangeNumber';
import Register from './pages/Register';
import Locations from './pages/Locations';
import BotSettings from './pages/BotSettings';
import CustomCommands from './pages/CustomCommands';
import ActiveCommands from './pages/ActiveCommands';
import Reports from './pages/Reports';
import PendingActions from './pages/PendingActions';
import EmployeeStats from './pages/EmployeeStats';
import AuditLogs from './pages/AuditLogs';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/change-number" element={<ChangeNumber />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<PrivateRoute />}>
              <Route path="/stats/:id" element={<EmployeeStats />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="pending" element={<PendingActions />} />
                <Route path="users" element={<Users />} />
                <Route path="locations" element={<Locations />} />
                <Route path="bot-settings" element={<BotSettings />} />
                <Route path="custom-commands" element={<CustomCommands />} />
                <Route path="active-commands" element={<ActiveCommands />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="audit-logs" element={<AuditLogs />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LoadingProvider>
  );
}

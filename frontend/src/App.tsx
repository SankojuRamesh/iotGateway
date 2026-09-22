import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { AuthProvider } from "@/features/auth/AuthContext";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { PasswordResetConfirmPage, PasswordResetRequestPage } from "@/features/auth/PasswordResetPage";
import { OverviewPage } from "@/features/overview/OverviewPage";
import { DashboardPage } from "@/features/dashboards/DashboardPage";
import { DeviceListPage } from "@/features/devices/DeviceListPage";
import { DeviceDetailPage } from "@/features/devices/DeviceDetailPage";
import { DeviceTypesPage } from "@/features/devices/DeviceTypesPage";
import { SitesPage } from "@/features/sites/SitesPage";
import { MembersPage } from "@/features/members/MembersPage";
import { AlertsPage } from "@/features/alerts/AlertsPage";
import { ReportsPage } from "@/features/reports/ReportsPage";

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/password-reset" element={<PasswordResetRequestPage />} />
        <Route path="/reset-password" element={<PasswordResetConfirmPage />} />

        <Route path="/" element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
        <Route path="/dashboards" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/devices" element={<ProtectedRoute><DeviceListPage /></ProtectedRoute>} />
        <Route path="/devices/:deviceId" element={<ProtectedRoute><DeviceDetailPage /></ProtectedRoute>} />
        <Route path="/device-types" element={<ProtectedRoute><DeviceTypesPage /></ProtectedRoute>} />
        <Route path="/sites" element={<ProtectedRoute><SitesPage /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

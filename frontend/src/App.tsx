import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import { RequireRole } from "@/components/RequireRole";

import Landing from "@/pages/Landing";
import PublicMap from "@/pages/PublicMap";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

import { CitizenLayout } from "@/components/layout/CitizenLayout";
import CitizenHome from "@/pages/citizen/CitizenHome";
import CitizenMap from "@/pages/citizen/CitizenMap";
import ReportWizard from "@/pages/citizen/ReportWizard";
import MyReports from "@/pages/citizen/MyReports";
import ReportDetails from "@/pages/citizen/ReportDetails";

import { MunicipalLayout } from "@/components/layout/MunicipalLayout";
import OperationsDashboard from "@/pages/ops/OperationsDashboard";
import OpsMap from "@/pages/ops/OpsMap";
import OpsAnalytics from "@/pages/ops/OpsAnalytics";
import Departments from "@/pages/ops/Departments";
import OpsReportDetails from "@/pages/ops/OpsReportDetails";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/map" element={<PublicMap />} />
            <Route path="/login" element={<Login />} />

            {/* Citizen application — no login required, matches the app's device-based report tracking */}
            <Route path="/app" element={<CitizenLayout />}>
              <Route index element={<CitizenHome />} />
              <Route path="map" element={<CitizenMap />} />
              <Route path="reports" element={<MyReports />} />
              <Route path="reports/:id" element={<ReportDetails />} />
            </Route>
            <Route path="/app/report" element={<ReportWizard />} />

            {/* Municipal application — auth-gated */}
            <Route
              path="/ops"
              element={
                <RequireRole role="municipal_staff">
                  <MunicipalLayout />
                </RequireRole>
              }
            >
              <Route index element={<OperationsDashboard />} />
              <Route path="map" element={<OpsMap />} />
              <Route path="analytics" element={<OpsAnalytics />} />
              <Route path="departments" element={<Departments />} />
              <Route path="reports/:id" element={<OpsReportDetails />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
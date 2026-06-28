import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppDataProvider, useAppData } from "./context/AppDataContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Driver pages
import DriverDashboard from "./pages/driver/DriverDashboard";
import Queue from "./pages/driver/Queue";
import Vehicles from "./pages/driver/Vehicles";
import History from "./pages/driver/History";
import Profile from "./pages/driver/Profile";

// Operator pages
import OperatorDashboard from "./pages/operator/OperatorDashboard";
import OpQueue from "./pages/operator/OpQueue";
import OpStations from "./pages/operator/OpStations";
import OpViolations from "./pages/operator/OpViolations";
import OpDrivers from "./pages/operator/OpDrivers";

import "./styles/global.css";

function AppRoutes() {
  const { currentUser } = useAppData();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={currentUser ? <Navigate to={currentUser.role === "operator" ? "/operator/dashboard" : "/dashboard"} replace /> : <Login />} />
      <Route
        path="/register"
        element={
          currentUser ? (
            <Navigate to={currentUser.role === "operator" ? "/operator/dashboard" : "/dashboard"} replace />
          ) : (
            <Register />
          )
        }
      />

      {/* Driver routes */}
      <Route path="/dashboard" element={<ProtectedRoute role="driver"><Layout><DriverDashboard /></Layout></ProtectedRoute>} />
      <Route path="/queue" element={<ProtectedRoute role="driver"><Layout><Queue /></Layout></ProtectedRoute>} />
      <Route path="/vehicles" element={<ProtectedRoute role="driver"><Layout><Vehicles /></Layout></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute role="driver"><Layout><History /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute role="driver"><Layout><Profile /></Layout></ProtectedRoute>} />

      {/* Operator routes */}
      <Route path="/operator/dashboard" element={<ProtectedRoute role="operator"><Layout><OperatorDashboard /></Layout></ProtectedRoute>} />
      <Route path="/operator/queue" element={<ProtectedRoute role="operator"><Layout><OpQueue /></Layout></ProtectedRoute>} />
      <Route path="/operator/stations" element={<ProtectedRoute role="operator"><Layout><OpStations /></Layout></ProtectedRoute>} />
      <Route path="/operator/violations" element={<ProtectedRoute role="operator"><Layout><OpViolations /></Layout></ProtectedRoute>} />
      <Route path="/operator/drivers" element={<ProtectedRoute role="operator"><Layout><OpDrivers /></Layout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={currentUser ? (currentUser.role === "operator" ? "/operator/dashboard" : "/dashboard") : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppDataProvider>
          <AppRoutes />
        </AppDataProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
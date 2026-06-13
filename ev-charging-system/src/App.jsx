import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DriverDashboard from "./pages/DriverDashboard";
import Queue from "./pages/Queue";
import Bookings from "./pages/Bookings";
import Vehicles from "./pages/Vehicles";
import OpOverview from "./pages/operator/OpOverview";
import OpPorts from "./pages/operator/OpPorts";
import OpQueue from "./pages/operator/OpQueue";
import OpViolations from "./pages/operator/OpViolations";
import { useAppData } from "./context/AppDataContext";
import "./styles/global.css";

function AppShell() {
  const { currentRole, currentUser } = useAppData();
  const [role, setRole] = useState("driver");

  if (!currentUser?.uid) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (currentRole === "driver" || currentRole === "operator") {
      setRole(currentRole);
    }
  }, [currentRole]);

  return (
    <Layout currentRole={role} onRoleChange={setRole}>
      <Routes>
        <Route path="/dashboard" element={<DriverDashboard />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/vehicles" element={<Vehicles />} />

        <Route path="/operator/overview" element={<OpOverview />} />
        <Route path="/operator/ports" element={<OpPorts />} />
        <Route path="/operator/queue" element={<OpQueue />} />
        <Route path="/operator/violations" element={<OpViolations />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}

export default App;
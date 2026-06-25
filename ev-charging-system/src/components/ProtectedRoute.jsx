import { Navigate } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";

export default function ProtectedRoute({ children, role }) {
  const { currentUser } = useAppData();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (role && currentUser.role !== role) {
    return (
      <Navigate
        to={currentUser.role === "operator" ? "/operator/dashboard" : "/dashboard"}
        replace
      />
    );
  }

  return children;
}

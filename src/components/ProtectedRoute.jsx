
import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context/useApp";

export default function ProtectedRoute({ roles, children }) {
  const { user, authLoading } = useApp();
  const { pathname } = useLocation();

  if (authLoading) {
    return <p className="muted">Restoring your session...</p>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnTo: pathname }}
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/events" replace />;
  }

  return children;
}

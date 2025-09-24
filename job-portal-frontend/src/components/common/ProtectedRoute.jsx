import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (roles.length > 0 && user?.roles) {
    const hasRequiredRole = roles.some((role) => user.roles.includes(role));

    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

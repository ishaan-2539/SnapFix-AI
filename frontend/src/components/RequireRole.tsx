import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function RequireRole({
  role,
  children,
}: {
  role: "citizen" | "municipal_staff";
  children: React.ReactElement;
}) {
  const { session, role: userRole, loading } = useAuth();

  if (loading) return null;

  if (!session) return <Navigate to="/login" replace />;
  if (userRole !== role) return <Navigate to="/login" replace />;

  return children;
}
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/stores/auth.store";

const AUTH_REGISTER_PATH = "/auth/register";

export function GuestGuard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (isAuthenticated && location.pathname !== AUTH_REGISTER_PATH) {
    return <Navigate to="/products" replace />;
  }

  return <Outlet />;
}

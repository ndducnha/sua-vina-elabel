import { createBrowserRouter, Navigate } from "react-router";
import { AuthGuard } from "@/guards/AuthGuard";
import { GuestGuard } from "@/guards/GuestGuard";
import { AuthLayout } from "@/layouts/AuthLayout";
import { MainLayout } from "@/layouts/MainLayout";
import { LoginPage } from "@/pages/auth/login";
import { ProductPage } from "@/pages/product";
import { ProductDetailsPage } from "@/pages/product-details";
import { InventoryPage } from "@/pages/inventory/InventoryPage";
import { ProductionBatchesPage } from "@/pages/production/ProductionBatchesPage";
import { OrdersPage } from "@/pages/orders/OrdersPage";
import { CustomersPage } from "@/pages/customers/CustomersPage";
import { SuppliersPage } from "@/pages/suppliers/SuppliersPage";
import { ReportsPage } from "@/pages/reports/ReportsPage";
import { StaffPage } from "@/pages/staff/StaffPage";
import { ELabelSyncSettingsPage } from "@/pages/settings/ELabelSyncSettingsPage";
import { QrExportPage } from "@/pages/qr-export/QrExportPage";

// Strip trailing slash so React Router accepts the basename (it requires no trailing "/").
const ROUTER_BASENAME = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") || "/";

export const router = createBrowserRouter(
  [
    { path: "/", element: <Navigate to="/auth/login" replace /> },

    {
      element: <GuestGuard />,
      children: [
        {
          element: <AuthLayout />,
          children: [{ path: "/auth/login", element: <LoginPage /> }],
        },
      ],
    },

    {
      element: <AuthGuard />,
      children: [
        {
          element: <MainLayout />,
          children: [
            { path: "/dashboard", element: <Navigate to="/products" replace /> },

            // Products / eLabel
            { path: "/products", element: <ProductPage /> },
            { path: "/products/:productId", element: <ProductDetailsPage /> },
            { path: "/products/:productId/qr-export", element: <QrExportPage /> },

            // Internal modules (fake data)
            { path: "/inventory", element: <InventoryPage /> },
            { path: "/production", element: <ProductionBatchesPage /> },
            { path: "/orders", element: <OrdersPage /> },
            { path: "/customers", element: <CustomersPage /> },
            { path: "/suppliers", element: <SuppliersPage /> },
            { path: "/reports", element: <ReportsPage /> },
            { path: "/staff", element: <StaffPage /> },

            // Settings
            { path: "/settings/elabel-sync", element: <ELabelSyncSettingsPage /> },
          ],
        },
      ],
    },

    { path: "*", element: <Navigate to="/auth/login" replace /> },
  ],
  { basename: ROUTER_BASENAME },
);

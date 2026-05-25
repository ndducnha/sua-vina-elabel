import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  Cog,
  Factory,
  LayoutDashboard,
  Link2,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  UserCog,
  Users,
} from "lucide-react";

export type SidebarNavItemConfig = {
  titleKey: string;
  href: string;
  icon: LucideIcon;
  /** When true: no navigation; muted styling (e.g. coming soon). */
  disabled?: boolean;
  /** Optional section header above this item (rendered as a label, not clickable). */
  sectionKey?: string;
};

export const SidebarNavItems: SidebarNavItemConfig[] = [
  {
    sectionKey: "sidebar.sectionOverview",
    titleKey: "sidebar.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    disabled: true,
  },

  {
    sectionKey: "sidebar.sectionProducts",
    titleKey: "sidebar.eLabel",
    href: "/products",
    icon: Tags,
  },
  { titleKey: "sidebar.inventory", href: "/inventory", icon: Boxes },
  { titleKey: "sidebar.production", href: "/production", icon: Factory },

  {
    sectionKey: "sidebar.sectionSales",
    titleKey: "sidebar.orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  { titleKey: "sidebar.customers", href: "/customers", icon: Users },
  { titleKey: "sidebar.suppliers", href: "/suppliers", icon: Truck },

  {
    sectionKey: "sidebar.sectionInsights",
    titleKey: "sidebar.reports",
    href: "/reports",
    icon: BarChart3,
  },
  { titleKey: "sidebar.staff", href: "/staff", icon: UserCog },

  {
    sectionKey: "sidebar.sectionSettings",
    titleKey: "sidebar.elabelSync",
    href: "/settings/elabel-sync",
    icon: Link2,
  },
  { titleKey: "sidebar.systemSettings", href: "/settings/system", icon: Settings, disabled: true },
  { titleKey: "sidebar.preferences", href: "/settings/preferences", icon: Cog, disabled: true },
];

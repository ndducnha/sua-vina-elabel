import { BrandLogo } from "@/components/BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarNavItems } from "@/constants";
import { cn } from "@/lib/utils";
import { getUserDisplayName, getUserPrimaryEmail, parseUserRole } from "@/models/auth.model";
import { logoutAndRedirectToLogin } from "@/lib/auth-logout";
import { useAuthStore } from "@/stores/auth.store";
import { ChevronLeft, ChevronRight, LogOut, Menu, User, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router";

export function MainLayout() {
  const { t: translate } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logoutAndRedirectToLogin();
  };

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

  const normalizedRole = user?.role != null ? parseUserRole(user.role) : null;

  return (
    <div className='flex h-svh overflow-hidden bg-page-bg text-main-text'>
      {/* Mobile overlay */}
      {mobileNavOpen && <div className='fixed inset-0 z-40 bg-black/30 lg:hidden' onClick={() => setMobileNavOpen(false)} />}

      {/* Sidebar — desktop: static, mobile: slide-in */}
      <aside
        className={cn(
          "flex flex-col overflow-x-hidden border-r transition-all duration-300 bg-white",
          // Desktop
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:shadow-xl",
          mobileNavOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
          sidebarOpen ? "w-64" : "lg:w-16 max-lg:w-64",
        )}
      >
        {/* Logo area */}
        <div className='flex min-h-14 min-w-64 items-center justify-between gap-2 border-b px-4 py-2'>
          <div className='flex min-w-0 flex-1 items-center gap-2'>
            <BrandLogo className='w-7 shrink-0' />
            {(sidebarOpen || mobileNavOpen) && (
              <span className='min-w-0 flex-1 text-pretty wrap-break-word text-sm font-bold leading-snug text-primary'>
                {translate("common.systemTitle")}
              </span>
            )}
          </div>
          {/* Close button for mobile */}
          <button className='lg:hidden p-1 rounded-md hover:bg-gray-100' onClick={() => setMobileNavOpen(false)}>
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Navigation */}
        <nav className='flex-1 space-y-0.5 overflow-y-auto p-2'>
          {SidebarNavItems.map((item) => {
            const active = !item.disabled && isActive(item.href);
            return (
              <div key={item.href}>
                {item.sectionKey && (sidebarOpen || mobileNavOpen) && (
                  <p className='mt-3 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 first:mt-1'>
                    {translate(item.sectionKey)}
                  </p>
                )}
                <button
                  type='button'
                  disabled={item.disabled}
                  aria-disabled={item.disabled}
                  title={item.disabled ? translate(item.titleKey) : undefined}
                  onClick={() => {
                    if (item.disabled) return;
                    navigate(item.href);
                    setMobileNavOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative text-left cursor-pointer",
                    item.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                    active ? "font-semibold bg-nav-active-bg text-nav-active-text" : !item.disabled && "hover:bg-blue-50",
                    !sidebarOpen && "lg:justify-center",
                  )}
                >
                  {active ? <span className='absolute left-0 top-1 bottom-1 w-1 rounded bg-nav-active-text' /> : null}
                  <item.icon className='h-4 w-4 shrink-0' />
                  {(sidebarOpen || mobileNavOpen) && (
                    <span className='min-w-0 truncate leading-snug'>{translate(item.titleKey)}</span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content area */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Header */}
        <header className='flex h-14 items-center justify-between border-b px-4 bg-white'>
          {/* Hamburger — toggles sidebar on desktop, mobile drawer on mobile */}
          <Button
            variant='ghost'
            size='icon'
            onClick={() => {
              // On mobile, toggle mobile drawer; on desktop toggle sidebar collapse
              if (window.innerWidth < 1024) {
                setMobileNavOpen(!mobileNavOpen);
              } else {
                setSidebarOpen(!sidebarOpen);
              }
            }}
          >
            {/* Desktop: ChevronLeft/ChevronRight, Mobile: Menu */}
            <span className="hidden lg:inline-flex">
              {sidebarOpen ? <ChevronLeft className='h-7 w-7' /> : <ChevronRight className='h-7 w-7' />}
            </span>
            <span className="lg:hidden">
              <Menu className='h-6 w-6' />
            </span>
          </Button>

          <div className='flex items-center gap-2'>
            <LanguageSwitcher />
            <Separator orientation='vertical' className='h-6' />

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant='ghost' size='icon'>
                    <User className='h-5 w-5' />
                  </Button>
                }
              />
              <DropdownMenuContent align='end' className='w-fit'>
                <div className='px-2 py-1.5 flex flex-col gap-1'>
                  <p className='text-sm font-medium'>{user ? getUserDisplayName(user) : "—"}</p>
                  <p className='text-xs text-muted-foreground'>{user ? getUserPrimaryEmail(user) || "—" : "—"}</p>
                  {/* user role */}
                  <p className='text-xs text-muted-foreground'>
                    {normalizedRole ? translate(`role.${normalizedRole}`) : ""}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className='mr-2 h-4 w-4' />
                  {translate("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className='flex-1 overflow-auto p-6'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

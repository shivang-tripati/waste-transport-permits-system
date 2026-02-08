"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui';
import { AuthListener } from '@/components/provider/auth-listener';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Scale,
  User,
  Menu,
  X,
  LogOut,
  ExternalLink
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Permits',
    href: '/dashboard/permits',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    label: 'Projects',
    href: '/dashboard/projects',
    icon: <Briefcase className="w-5 h-5" />,
    roles: ['COMPANY_USER'],
  },
  {
    label: 'Weighments',
    href: '/dashboard/weighments',
    icon: <Scale className="w-5 h-5" />,
  },
  {
    label: 'Profile',
    href: '/dashboard/profile',
    icon: <User className="w-5 h-5" />,
  },
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filteredNavItems = navItems.filter(item =>
    !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <AuthListener>

      <div className="min-h-screen bg-gray-50 flex">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
              <div className="flex items-center">
                <span className="text-xl font-bold">MFG</span>
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600 rounded">
                  {user?.role === 'COMPANY_USER' ? 'Company' : 'Individual'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-slate-300"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-2"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {filteredNavItems.find((item) =>
                  pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                )?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/verify"
                target="_blank"
                className="hidden sm:flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Verify Permit
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthListener>
  );
}

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

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const filteredNavItems = navItems.filter(item =>
    !item.roles || (user?.role && item.roles.includes(user.role))
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/') || pathname === href;
  };

  return (
    <AuthListener>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <button
            aria-label="Close sidebar"
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside id="sidebar" className={cn(
          "fixed inset-y-0 left-0 w-72 bg-slate-900 text-white z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">TPS</span>
                <span className="hidden md:inline ml-1 px-2 py-0.5 text-xs bg-blue-600 rounded">
                  {user?.role === 'COMPANY_USER' ? 'Company' : 'Individual'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-slate-300"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                    isActive(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <button
                  className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2"
                  onClick={() => setIsProfileOpen((s) => !s)}
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                >
                  <span className="text-sm font-medium">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href="/dashboard/profile" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Profile
                  </Button>
                </Link>
                <Button onClick={logout} variant="ghost" size="sm" className="text-slate-300">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
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
                aria-label="Open sidebar"
                aria-controls="sidebar"
                aria-expanded={isSidebarOpen}
              >
                <Menu className="w-6 h-6" />
              </Button>

              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {filteredNavItems.find((item) => isActive(item.href))?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/dashboard/permits/new" className="hidden sm:inline-flex">
                <Button size="sm" className="mr-2">
                  New Permit
                </Button>
              </Link>

              <Link href="/compliance/verify" target="_blank" className="hidden sm:flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                Permit Verification
                <ExternalLink className="w-4 h-4" />
              </Link>

              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen((s) => !s)}
                  className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                >
                  <span className="text-sm font-medium text-gray-700">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                </button>

                {isProfileOpen && (
                  <div role="menu" aria-orientation="vertical" className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-lg py-1">
                    <Link href="/dashboard/profile" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">Profile</Link>
                    <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">Logout</button>
                  </div>
                )}
              </div>
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

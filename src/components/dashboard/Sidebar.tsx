'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  CheckSquare,
  Target,
  BookOpen,
  BarChart3,
  FolderOpen,
  Settings,
  LogOut,
  Gauge,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Daily', href: '/dashboard/daily', icon: Calendar },
  { name: 'Time Tracking', href: '/dashboard/time', icon: Clock },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Goals', href: '/dashboard/goals', icon: Target },
  { name: 'Measures', href: '/dashboard/measures', icon: Gauge },
  { name: 'Progress Log', href: '/dashboard/progress', icon: BookOpen },
  { name: 'Buckets', href: '/dashboard/buckets', icon: FolderOpen },
  { name: 'Trends', href: '/dashboard/trends', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">Goals</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        <Link
          href="/dashboard/settings"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-5 h-5 text-gray-400" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Target,
  BookOpen,
  FolderOpen,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

const moreLinks = [
  { name: 'Goals', href: '/dashboard/goals', icon: Target, color: 'text-blue-600' },
  { name: 'Progress Log', href: '/dashboard/progress', icon: BookOpen, color: 'text-purple-600' },
  { name: 'Buckets', href: '/dashboard/buckets', icon: FolderOpen, color: 'text-green-600' },
  { name: 'Trends', href: '/dashboard/trends', icon: BarChart3, color: 'text-orange-600' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, color: 'text-gray-600' },
];

export default function MorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">More</h1>
        <p className="text-gray-500">Access all features</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {moreLinks.map((link) => (
          <Link key={link.name} href={link.href}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <link.icon className={`w-8 h-8 ${link.color}`} />
                <span className="font-medium text-gray-900">{link.name}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

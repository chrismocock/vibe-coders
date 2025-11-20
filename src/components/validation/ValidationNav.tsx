'use client';

import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  AlertCircle,
  TrendingUp,
  Users,
  UserCheck,
  Wrench,
  DollarSign,
  Rocket,
  Menu,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '', icon: LayoutDashboard },
  { label: 'Problem', href: 'problem', icon: AlertCircle },
  { label: 'Market', href: 'market', icon: TrendingUp },
  { label: 'Competition', href: 'competition', icon: Users },
  { label: 'Audience', href: 'audience', icon: UserCheck },
  { label: 'Feasibility', href: 'feasibility', icon: Wrench },
  { label: 'Pricing', href: 'pricing', icon: DollarSign },
  { label: 'Go-To-Market', href: 'go-to-market', icon: Rocket },
];

export function ValidationNav() {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params.id as string;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Determine active section
  const getActiveSection = () => {
    const validateIndex = pathname.indexOf('/validate/');
    if (validateIndex === -1) return '';
    const afterValidate = pathname.substring(validateIndex + '/validate/'.length);
    const section = afterValidate.split('/')[0];
    return section || '';
  };

  const activeSection = getActiveSection();

  const NavContent = () => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const href = `/project/${projectId}/validate${item.href ? `/${item.href}` : ''}`;
        const isActive = activeSection === item.href || (activeSection === '' && item.href === '');
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-neutral-200 lg:bg-white">
        <div className="flex flex-col gap-2 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Validation</h2>
          <NavContent />
        </div>
      </aside>

      {/* Mobile Sheet */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Validation</h2>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}


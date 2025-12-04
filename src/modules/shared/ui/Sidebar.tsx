'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight,
  Clock,
  LogOut,
  Settings,
  Menu,
  X,
  ChevronRight,
  Factory,
  Users,
  UserCog,
  Bell,
  History,
  Calculator,
  ShoppingCart,
  DollarSign,
  Truck,
  ClipboardList,
} from 'lucide-react';
import { createClient } from '@/modules/shared/services/supabase-client';
import { useRouter } from 'next/navigation';
import { NotificationDropdown } from '@/modules/notifications/components/NotificationDropdown';

const sidebarItems = [
  {
    title: 'แดชบอร์ด',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'ออเดอร์',
    href: '/orders',
    icon: ShoppingCart,
    color: 'text-[#34C759]',
  },
  {
    title: 'คำนวณราคา',
    href: '/calculator',
    icon: Calculator,
    color: 'text-[#5AC8FA]',
  },
  {
    title: 'จัดการสินค้า',
    href: '/products',
    icon: Package,
  },
  {
    title: 'เบิก/นำเข้า',
    href: '/stock',
    icon: ArrowLeftRight,
  },
  {
    title: 'ประวัติสต๊อก',
    href: '/stock/history',
    icon: Clock,
  },
  {
    title: 'การผลิต',
    href: '/production',
    icon: Factory,
    color: 'text-[#FF9500]',
  },
  {
    title: 'คิวผลิต',
    href: '/production/queue',
    icon: ClipboardList,
    color: 'text-[#AF52DE]',
  },
  {
    title: 'การเงิน',
    href: '/finance',
    icon: DollarSign,
    color: 'text-[#34C759]',
  },
  {
    title: 'Suppliers',
    href: '/suppliers',
    icon: Truck,
    color: 'text-[#007AFF]',
  },
  {
    title: 'ลูกค้าสัมพันธ์',
    href: '/crm',
    icon: Users,
    color: 'text-[#5AC8FA]',
  },
];

const bottomItems = [
  {
    title: 'จัดการผู้ใช้',
    href: '/users',
    icon: UserCog,
  },
  {
    title: 'Audit Logs',
    href: '/audit',
    icon: History,
  },
  {
    title: 'ตั้งค่า',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, email, role:roles(display_name)')
          .eq('id', authUser.id)
          .single();
        
        setUser(profile || { full_name: 'ผู้ใช้งาน', email: authUser.email });
      }
    };
    fetchUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-[#007AFF] flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-[17px] font-semibold text-white leading-tight">อนาจักร</h1>
              <p className="text-[11px] text-[#86868B] font-medium">Superapp</p>
            </div>
          </Link>
          <NotificationDropdown />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <p className="px-4 py-2 text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">เมนูหลัก</p>
        {sidebarItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/stock' 
            ? pathname === '/stock'
            : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#007AFF]/15 text-[#007AFF]' 
                    : 'text-[#A1A1A6] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                <span className="font-medium text-[15px]">{item.title}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
              </div>
            </Link>
          );
        })}

        {/* Separator */}
        <div className="h-px bg-white/10 mx-3 my-3" />
        
        <p className="px-4 py-2 text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">โมดูลเพิ่มเติม</p>
        {sidebarItems.slice(5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? `bg-[#007AFF]/15 ${item.color || 'text-[#007AFF]'}` 
                    : 'text-[#A1A1A6] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : item.color}`} strokeWidth={isActive ? 2 : 1.5} />
                <span className="font-medium text-[15px]">{item.title}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 space-y-1">
        {/* Divider */}
        <div className="h-px bg-white/10 mx-3 mb-3" />
        
        {/* Bottom Items */}
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#007AFF]/15 text-[#007AFF]' 
                    : 'text-[#A1A1A6] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="font-medium text-[15px]">{item.title}</span>
              </div>
            </Link>
          );
        })}
        
        {/* User Profile */}
        <div className="mt-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5AC8FA] flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-white truncate">
                {user?.full_name || 'ผู้ใช้งาน'}
              </p>
              <p className="text-[12px] text-[#86868B] truncate">
                {user?.role?.display_name || user?.email || '-'}
              </p>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-2 rounded-lg text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all duration-200"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-[#1D1D1F] text-white apple-shadow"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen w-[260px] bg-[#1D1D1F] flex-col fixed left-0 top-0 z-50">
        <SidebarContent />
      </div>


      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Sidebar */}
          <div className="lg:hidden fixed left-0 top-0 h-screen w-[280px] bg-[#1D1D1F] z-50 transform transition-transform duration-300">
            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-5 right-4 p-2 rounded-lg text-[#86868B] hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <SidebarContent />
          </div>
        </>
      )}
    </>
  );
}

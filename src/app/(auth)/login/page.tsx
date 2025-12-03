'use client';

import { Button, Input, Label } from '@/modules/shared/ui';
import { createClient } from '@/modules/shared/services/supabase-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[380px] mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-[#007AFF] flex items-center justify-center">
              <span className="text-white font-semibold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-[19px] font-semibold text-[#1D1D1F]">อนาจักร</h1>
              <p className="text-[11px] text-[#86868B] font-medium tracking-wide">Superapp</p>
            </div>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-[32px] font-semibold text-[#1D1D1F] leading-tight">ยินดีต้อนรับ</h2>
            <p className="text-[#86868B] mt-2 text-[15px]">
              เข้าสู่ระบบเพื่อจัดการงานโรงงานของคุณ
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#FF3B30]/10 text-[#FF3B30] text-[14px] font-medium">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                icon={<Mail className="w-4 h-4" />}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="password" className="mb-0">รหัสผ่าน</Label>
                <Link href="#" className="text-[13px] text-[#007AFF] hover:underline font-medium">
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="กรอกรหัสผ่าน"
                icon={<Lock className="w-4 h-4" />}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              variant="primary"
              className="w-full h-12 text-[15px] mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-[14px] text-[#86868B]">
            ยังไม่มีบัญชี?{' '}
            <Link href="#" className="text-[#007AFF] hover:underline font-medium">
              ติดต่อผู้ดูแลระบบ
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-[#1D1D1F]">
        {/* Gradient Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#007AFF]/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#5AC8FA]/20 rounded-full blur-[100px]" />
        </div>

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center p-12 text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#34C759]" />
            <span className="text-[13px] font-medium text-white/80">ระบบปฏิบัติการโรงงาน</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-[48px] font-semibold text-white leading-tight mb-6">
            อนาจักร<br />
            <span className="text-gradient-blue">โรงงานเสื้อยืด</span>
          </h2>

          <p className="text-[17px] text-white/60 max-w-md leading-relaxed">
            แพลตฟอร์มบริหารจัดการโรงงานครบวงจร<br />
            สต๊อก การผลิต และลูกค้าสัมพันธ์ ในที่เดียว
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-12">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[14px] text-white/70">📦 จัดการสต๊อก</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[14px] text-white/70">🏭 ติดตามการผลิต</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[14px] text-white/70">📊 รายงาน</span>
            </div>
          </div>

          {/* Bottom decoration */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white/30">
            <div className="h-px w-12 bg-white/20" />
            <span className="text-[11px] font-medium tracking-widest">POWERED BY SUPABASE</span>
            <div className="h-px w-12 bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

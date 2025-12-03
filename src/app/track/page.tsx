'use client';

import { Button, Input } from '@/modules/shared/ui';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Phone, AlertCircle } from 'lucide-react';
import { createClient } from '@/modules/shared/services/supabase-client';

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!orderNumber.trim() || !phone.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      // Search for order with matching order_number and customer_phone
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('access_token')
        .eq('order_number', orderNumber.trim().toUpperCase())
        .eq('customer_phone', phone.trim())
        .single();

      if (fetchError || !order) {
        setError('ไม่พบออเดอร์ กรุณาตรวจสอบเลขออเดอร์และเบอร์โทรศัพท์');
        return;
      }

      // Redirect to customer order page
      router.push(`/order/${order.access_token}`);
    } catch (err) {
      console.error('Error searching order:', err);
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5F7] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#007AFF] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#007AFF]/30">
            <span className="text-[#1D1D1F] font-bold text-2xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">อนาจักร</h1>
          <p className="text-[#86868B]">Garment Factory</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl p-6 border border-[#E8E8ED] shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-[#007AFF]" />
            <h2 className="text-lg font-semibold text-[#1D1D1F]">ตรวจสอบสถานะออเดอร์</h2>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm text-[#86868B] mb-2">เลขออเดอร์</label>
              <Input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ORD-2024-0001"
              />
            </div>
            
            <div>
              <label className="block text-sm text-[#86868B] mb-2">เบอร์โทรศัพท์</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812345678"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังค้นหา...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  ค้นหาออเดอร์
                </div>
              )}
            </Button>
          </form>
        </div>

        {/* Help */}
        <div className="text-center mt-6">
          <p className="text-[#86868B] text-sm mb-2">หาออเดอร์ไม่เจอ?</p>
          <a 
            href="https://line.me/ti/p/~yourlineid" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#34C759] hover:underline"
          >
            <Phone className="w-4 h-4" />
            ติดต่อเจ้าหน้าที่ LINE
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-[#C7C7CC] text-xs mt-8">
          © 2024 อนาจักร. All rights reserved.
        </p>
      </div>
    </div>
  );
}

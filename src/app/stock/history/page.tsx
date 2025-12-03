'use client';

import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dropdown, Input } from '@/modules/shared/ui';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Search, 
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings2,
  Download,
  RefreshCw
} from 'lucide-react';
import { useTransactions } from '@/modules/stock/hooks/useTransactions';

const typeConfig = {
  IN: {
    label: 'รับเข้า',
    icon: ArrowDownToLine,
    color: 'text-[#34C759]',
    bgColor: 'bg-[#34C759]/10',
    badgeVariant: 'success' as const,
  },
  OUT: {
    label: 'เบิกออก',
    icon: ArrowUpFromLine,
    color: 'text-[#FF9500]',
    bgColor: 'bg-[#FF9500]/10',
    badgeVariant: 'warning' as const,
  },
  ADJUST: {
    label: 'ปรับปรุง',
    icon: Settings2,
    color: 'text-[#007AFF]',
    bgColor: 'bg-[#007AFF]/10',
    badgeVariant: 'info' as const,
  },
};

export default function TransactionHistoryPage() {
  const { transactions, loading, error, refresh } = useTransactions();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          tx.product?.model?.toLowerCase().includes(searchLower) ||
          tx.product?.color?.toLowerCase().includes(searchLower) ||
          tx.product?.sku?.toLowerCase().includes(searchLower) ||
          tx.ref_order_id?.toLowerCase().includes(searchLower) ||
          tx.reason?.toLowerCase().includes(searchLower) ||
          tx.note?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (typeFilter && tx.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, search, typeFilter]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, typeof transactions> = {};
    
    filteredTransactions.forEach((tx) => {
      const date = new Date(tx.created_at).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(tx);
    });

    return groups;
  }, [filteredTransactions]);

  return (
    <div className="flex-1 min-h-screen bg-[#F5F5F7]">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#007AFF]" />
              </div>
              <h1 className="text-[28px] font-semibold text-[#1D1D1F]">ประวัติการเคลื่อนไหว</h1>
            </div>
            <p className="text-[#86868B]">ดูประวัติการ รับเข้า/เบิกออก/ปรับปรุง สต๊อกทั้งหมด</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              ส่งออก
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={refresh}>
              <RefreshCw className="w-4 h-4" />
              รีเฟรช
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-3"
        >
          {(['IN', 'OUT', 'ADJUST'] as const).map((type) => {
            const config = typeConfig[type];
            const count = transactions.filter(t => t.type === type).length;
            const Icon = config.icon;

            return (
              <Card key={type}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${config.bgColor}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-[28px] font-semibold text-[#1D1D1F]">{count}</p>
                      <p className="text-[13px] text-[#86868B]">{config.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="!p-4 !shadow-none border border-[#E8E8ED]">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] z-10" />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อสินค้า, SKU, เลข Order..."
                  className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#F5F5F7] text-[15px] text-[#1D1D1F] border-0 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Dropdown
                options={[
                  { value: '', label: 'ทุกประเภท' },
                  { value: 'IN', label: '🟢 รับเข้า' },
                  { value: 'OUT', label: '🟠 เบิกออก' },
                  { value: 'ADJUST', label: '🔵 ปรับปรุง' },
                ]}
                value={typeFilter}
                onChange={setTypeFilter}
                placeholder="ทุกประเภท"
                className="w-full sm:w-48"
              />
            </div>
          </Card>
        </motion.div>

        {/* Transaction List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>รายการทั้งหมด</CardTitle>
              <CardDescription>
                พบ {filteredTransactions.length} รายการ
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="w-12 h-12 rounded-full border-4 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                  <div className="w-16 h-16 rounded-xl bg-[#FF3B30]/10 flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-[#FF3B30]" />
                  </div>
                  <h3 className="font-semibold text-[#1D1D1F] mb-1">เกิดข้อผิดพลาด</h3>
                  <p className="text-[13px] text-[#86868B] max-w-sm">{error}</p>
                  <button 
                    onClick={refresh}
                    className="mt-4 px-4 py-2 bg-[#007AFF] text-white rounded-lg text-[14px] font-medium hover:bg-[#0066CC] transition-colors"
                  >
                    ลองใหม่
                  </button>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                  <div className="w-16 h-16 rounded-xl bg-[#F5F5F7] flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-[#86868B]" />
                  </div>
                  <h3 className="font-semibold text-[#1D1D1F] mb-1">ไม่พบรายการ</h3>
                  <p className="text-[13px] text-[#86868B]">ยังไม่มีประวัติการเคลื่อนไหวสต๊อก</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedTransactions).map(([date, txs], groupIndex) => (
                    <div key={date}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1 bg-[#E8E8ED]" />
                        <span className="text-[13px] font-medium text-[#86868B] px-3">{date}</span>
                        <div className="h-px flex-1 bg-[#E8E8ED]" />
                      </div>
                      <div className="space-y-3">
                        {txs.map((tx, index) => {
                          const config = typeConfig[tx.type];
                          const TypeIcon = config.icon;
                          const time = new Date(tx.created_at).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                          return (
                            <motion.div
                              key={tx.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: groupIndex * 0.1 + index * 0.05 }}
                              className="flex items-center gap-4 p-4 rounded-xl border border-[#E8E8ED] hover:border-[#D2D2D7] hover:shadow-sm bg-white transition-all"
                            >
                              <div className={`p-3 rounded-xl ${config.bgColor}`}>
                                <TypeIcon className={`w-5 h-5 ${config.color}`} />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-[#1D1D1F]">
                                    {tx.product ? `${tx.product.model} - ${tx.product.color} (${tx.product.size})` : 'สินค้า'}
                                  </span>
                                  <Badge variant={config.badgeVariant} size="sm">
                                    {config.label}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#86868B]">
                                  <span className="font-mono">{tx.product?.sku || '-'}</span>
                                  {tx.ref_order_id && (
                                    <>
                                      <span>•</span>
                                      <span>Order: {tx.ref_order_id}</span>
                                    </>
                                  )}
                                  {tx.reason && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[200px]">{tx.reason}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <p className={`font-semibold text-[20px] ${config.color}`}>
                                  {tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : '±'}
                                  {tx.quantity}
                                </p>
                                <p className="text-[12px] text-[#86868B]">{time}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

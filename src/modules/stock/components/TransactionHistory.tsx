'use client';

import { useState, useMemo } from 'react';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Settings2,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/modules/shared/ui/Card';
import { Badge } from '@/modules/shared/ui/Badge';
import { Button } from '@/modules/shared/ui/Button';
import { Transaction } from '../types';
import { cn } from '@/lib/utils';

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
  showFilters?: boolean;
  itemsPerPage?: number;
}

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
    color: 'text-[#AF52DE]',
    bgColor: 'bg-[#AF52DE]/10',
    badgeVariant: 'info' as const,
  },
};

export function TransactionHistory({ 
  transactions, 
  isLoading,
  showFilters = true,
  itemsPerPage = 10 
}: TransactionHistoryProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT' | 'ADJUST'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const todaySummary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todayIn = 0;
    let todayOut = 0;
    
    transactions.forEach(tx => {
      const txDate = new Date(tx.created_at);
      txDate.setHours(0, 0, 0, 0);
      
      if (txDate.getTime() === today.getTime()) {
        if (tx.type === 'IN') todayIn += tx.quantity;
        else if (tx.type === 'OUT') todayOut += tx.quantity;
      }
    });
    
    return { todayIn, todayOut };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filterType !== 'ALL' && tx.type !== filterType) return false;
      
      if (search) {
        const searchLower = search.toLowerCase();
        const productMatch = 
          (tx.product?.model || '').toLowerCase().includes(searchLower) ||
          (tx.product?.color || '').toLowerCase().includes(searchLower) ||
          (tx.product?.sku || '').toLowerCase().includes(searchLower) ||
          (tx.reason || '').toLowerCase().includes(searchLower);
        if (!productMatch) return false;
      }
      
      return true;
    });
  }, [transactions, filterType, search]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (type: typeof filterType) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-8 h-8 rounded-full border-2 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle>ประวัติการเคลื่อนไหว</CardTitle>
            <CardDescription>รายการ In/Out ทั้งหมด</CardDescription>
          </div>
          {transactions.length > 0 && (
            <div className="flex items-center gap-2 text-[12px]">
              <Badge variant="success" size="sm">
                วันนี้ +{todaySummary.todayIn}
              </Badge>
              <Badge variant="warning" size="sm">
                วันนี้ -{todaySummary.todayOut}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      {showFilters && transactions.length > 0 && (
        <div className="px-4 pb-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            <input
              type="text"
              placeholder="ค้นหา..."
              className="w-full h-9 pl-10 pr-3 rounded-xl bg-[#F5F5F7] text-[14px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          <div className="flex gap-1">
            {(['ALL', 'IN', 'OUT', 'ADJUST'] as const).map(type => (
              <button
                key={type}
                onClick={() => handleFilterChange(type)}
                className={cn(
                  'px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all',
                  filterType === type
                    ? type === 'ALL' ? 'bg-[#1D1D1F] text-[#1D1D1F]'
                    : type === 'IN' ? 'bg-[#34C759] text-[#1D1D1F]'
                    : type === 'OUT' ? 'bg-[#FF9500] text-[#1D1D1F]'
                    : 'bg-[#AF52DE] text-[#1D1D1F]'
                    : 'bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED]'
                )}
              >
                {type === 'ALL' ? 'ทั้งหมด' : typeConfig[type].label}
              </button>
            ))}
          </div>
        </div>
      )}

      <CardContent className="pt-0">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
            <div className="w-14 h-14 rounded-xl bg-[#F5F5F7] flex items-center justify-center mb-4">
              <Clock className="w-7 h-7 text-[#86868B]" />
            </div>
            <h3 className="font-semibold text-[#1D1D1F] mb-1">ยังไม่มีประวัติ</h3>
            <p className="text-[13px] text-[#86868B]">รายการเคลื่อนไหวสต๊อกจะแสดงที่นี่</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[150px] text-center">
            <Filter className="w-10 h-10 text-[#D2D2D7] mb-3" />
            <p className="text-[13px] text-[#86868B]">ไม่พบรายการที่ค้นหา</p>
            <button 
              onClick={() => {
                setSearch('');
                setFilterType('ALL');
                setCurrentPage(1);
              }}
              className="text-[13px] text-[#007AFF] hover:underline mt-2 font-medium"
            >
              ล้างตัวกรอง
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedTransactions.map((tx) => {
                const config = typeConfig[tx.type];
                const TypeIcon = config.icon;
                const date = new Date(tx.created_at);

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F5F5F7] transition-colors"
                  >
                    <div className={cn('p-2 rounded-lg', config.bgColor)}>
                      <TypeIcon className={cn('w-4 h-4', config.color)} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1D1D1F] text-[14px] truncate">
                          {tx.product?.model} {tx.product?.color} {tx.product?.size}
                        </span>
                      </div>
                      {tx.reason && (
                        <p className="text-[12px] text-[#FF9500] mt-0.5 truncate">
                          📋 {tx.reason}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-[#86868B] mt-0.5">
                        <span>
                          {date.toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {tx.ref_order_id && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{tx.ref_order_id}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={cn(
                          'font-semibold text-[18px]',
                          tx.type === 'IN' ? 'text-[#34C759]' : 
                          tx.type === 'OUT' ? 'text-[#FF9500]' : 'text-[#AF52DE]'
                        )}
                      >
                        {tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : '±'}
                        {tx.quantity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F5F5F7]">
                <span className="text-[12px] text-[#86868B]">
                  {filteredTransactions.length} รายการ
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-[13px] text-[#1D1D1F] px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

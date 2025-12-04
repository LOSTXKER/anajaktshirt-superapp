'use client';

import {
  Check,
  Clock,
  AlertTriangle,
  Lock,
  Unlock,
  ChevronRight,
  Palette,
  Image,
  Package,
  CreditCard,
  Play,
} from 'lucide-react';
import { Button, Card } from '@/modules/shared/ui';
import type { ApprovalGate, OrderGatesSummary } from '../../types/orders';

// ---------------------------------------------
// Single Approval Gate Item
// ---------------------------------------------

interface ApprovalGateItemProps {
  gate: ApprovalGate;
  isActive?: boolean;
  onClick?: () => void;
}

export function ApprovalGateItem({
  gate,
  isActive = false,
  onClick,
}: ApprovalGateItemProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { 
          bg: 'bg-[#34C759]', 
          text: 'text-white', 
          ringColor: 'ring-[#34C759]',
          Icon: Check,
        };
      case 'in_progress':
        return { 
          bg: 'bg-[#007AFF]', 
          text: 'text-white',
          ringColor: 'ring-[#007AFF]',
          Icon: Clock,
        };
      case 'rejected':
        return { 
          bg: 'bg-[#FF3B30]', 
          text: 'text-white',
          ringColor: 'ring-[#FF3B30]',
          Icon: AlertTriangle,
        };
      default:
        return { 
          bg: 'bg-[#E8E8ED]', 
          text: 'text-[#86868B]',
          ringColor: 'ring-[#E8E8ED]',
          Icon: Clock,
        };
    }
  };

  const getGateIcon = (gateType: string) => {
    switch (gateType) {
      case 'design':
        return Palette;
      case 'mockup':
        return Image;
      case 'material':
        return Package;
      case 'payment':
        return CreditCard;
      case 'production_start':
        return Play;
      default:
        return Clock;
    }
  };

  const statusConfig = getStatusConfig(gate.status);
  const GateIcon = getGateIcon(gate.gate_type);
  const StatusIcon = statusConfig.Icon;

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
        isActive
          ? 'border-[#007AFF] bg-[#007AFF]/5'
          : gate.status === 'approved'
          ? 'border-[#34C759]/30 bg-[#34C759]/5'
          : 'border-[#E8E8ED] bg-white hover:border-[#007AFF]/30'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusConfig.bg}`}>
          <StatusIcon className={`w-5 h-5 ${statusConfig.text}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <GateIcon className="w-4 h-4 text-[#86868B]" />
            <span className="font-semibold text-[#1D1D1F]">{gate.gate_name_th}</span>
            {gate.is_mandatory && (
              <span className="px-1.5 py-0.5 text-xs bg-[#FF9500]/10 text-[#FF9500] rounded">
                บังคับ
              </span>
            )}
          </div>
          
          {gate.description && (
            <p className="text-sm text-[#86868B] mt-0.5">{gate.description}</p>
          )}

          {/* Progress */}
          {gate.total_items > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-[#86868B] mb-1">
                <span>{gate.approved_items}/{gate.total_items} รายการ</span>
                <span>{gate.progress_percent}%</span>
              </div>
              <div className="h-1.5 bg-[#E8E8ED] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    gate.status === 'approved' ? 'bg-[#34C759]' : 'bg-[#007AFF]'
                  }`}
                  style={{ width: `${gate.progress_percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Customer Confirmation */}
          {gate.requires_customer_approval && gate.customer_confirmed && (
            <div className="flex items-center gap-1 mt-2 text-xs text-[#34C759]">
              <Check className="w-3 h-3" />
              ลูกค้ายืนยันแล้ว
            </div>
          )}

          {/* Rejection reason */}
          {gate.status === 'rejected' && gate.rejection_reason && (
            <div className="mt-2 p-2 bg-[#FF3B30]/5 rounded-lg">
              <p className="text-xs text-[#FF3B30]">{gate.rejection_reason}</p>
            </div>
          )}

          {/* Notes */}
          {gate.notes && gate.status !== 'rejected' && (
            <p className="text-xs text-[#86868B] mt-2 italic">💬 {gate.notes}</p>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-[#86868B]" />
      </div>
    </button>
  );
}

// ---------------------------------------------
// Approval Gates Summary Card
// ---------------------------------------------

interface ApprovalGatesSummaryProps {
  summary: OrderGatesSummary;
  onGateClick?: (gate: ApprovalGate) => void;
}

export function ApprovalGatesSummary({
  summary,
  onGateClick,
}: ApprovalGatesSummaryProps) {
  const allGatesPassed = summary.production_unlocked;

  return (
    <Card className="p-6 apple-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1D1D1F]">Approval Gates</h2>
        <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${
          allGatesPassed
            ? 'bg-[#34C759]/10 text-[#34C759]'
            : 'bg-[#FF9500]/10 text-[#FF9500]'
        }`}>
          {allGatesPassed ? (
            <>
              <Unlock className="w-4 h-4" />
              <span className="text-sm font-medium">พร้อมผลิต</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">รอดำเนินการ</span>
            </>
          )}
        </div>
      </div>

      {/* Production Status Banner */}
      {!allGatesPassed && summary.blocking_gates.length > 0 && (
        <div className="mb-4 p-3 bg-[#FF9500]/10 rounded-xl">
          <div className="flex items-center gap-2 text-[#FF9500] mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium text-sm">ยังไม่สามารถเริ่มผลิตได้</span>
          </div>
          <p className="text-sm text-[#1D1D1F]">
            รอดำเนินการ: {summary.blocking_gates.join(', ')}
          </p>
        </div>
      )}

      {/* Gates List */}
      <div className="space-y-3">
        {summary.gates.map((gate, index) => (
          <div key={gate.id} className="relative">
            {/* Connector line */}
            {index < summary.gates.length - 1 && (
              <div className={`absolute left-5 top-14 w-0.5 h-6 ${
                gate.status === 'approved' ? 'bg-[#34C759]' : 'bg-[#E8E8ED]'
              }`} />
            )}
            <ApprovalGateItem
              gate={gate}
              onClick={() => onGateClick?.(gate)}
            />
          </div>
        ))}
      </div>

      {/* Production Ready Button */}
      {allGatesPassed && (
        <div className="mt-4 pt-4 border-t border-[#E8E8ED]">
          <Button className="w-full gap-2 bg-[#34C759] hover:bg-[#2DB84D]">
            <Play className="w-4 h-4" />
            เริ่มการผลิต
          </Button>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------
// Compact Gates Progress (for order list/cards)
// ---------------------------------------------

interface CompactGatesProgressProps {
  summary: OrderGatesSummary;
}

export function CompactGatesProgress({ summary }: CompactGatesProgressProps) {
  const gates = ['design', 'mockup', 'material'] as const;
  
  const getGateStatus = (gateType: string) => {
    const gate = summary.gates.find(g => g.gate_type === gateType);
    return gate?.status || 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-[#34C759]';
      case 'in_progress':
        return 'bg-[#007AFF]';
      case 'rejected':
        return 'bg-[#FF3B30]';
      default:
        return 'bg-[#E8E8ED]';
    }
  };

  const gateLabels = {
    design: 'ออกแบบ',
    mockup: 'ตัวอย่าง',
    material: 'วัสดุ',
  };

  return (
    <div className="flex items-center gap-1">
      {gates.map((gateType, index) => {
        const status = getGateStatus(gateType);
        return (
          <div key={gateType} className="flex items-center gap-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${getStatusColor(status)}`}
              title={`${gateLabels[gateType]}: ${status}`}
            >
              {status === 'approved' ? (
                <Check className="w-3 h-3 text-white" />
              ) : status === 'in_progress' ? (
                <Clock className="w-3 h-3 text-white" />
              ) : (
                <span className="w-2 h-2 bg-[#86868B] rounded-full" />
              )}
            </div>
            {index < gates.length - 1 && (
              <div className={`w-4 h-0.5 ${
                getGateStatus(gates[index]) === 'approved' ? 'bg-[#34C759]' : 'bg-[#E8E8ED]'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}


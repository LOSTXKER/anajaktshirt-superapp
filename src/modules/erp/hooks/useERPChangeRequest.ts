'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  mockChangeRequests,
  mockChangeRequestLogs,
  getChangeRequestStats,
} from '../mocks/data';
import type {
  ChangeRequest,
  ChangeRequestLog,
  ChangeRequestStats,
  ChangeRequestFilters,
  PHASE_FEES_CONFIG,
} from '../types/change-requests';
import type { OrderPhase } from '../types/enums';

// ---------------------------------------------
// useERPChangeRequests - List & Filter
// ---------------------------------------------

export function useERPChangeRequests(filters: ChangeRequestFilters = {}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const changeRequests = useMemo(() => {
    let result = [...mockChangeRequests];

    if (filters.order_id) {
      result = result.filter(cr => cr.order_id === filters.order_id);
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      result = result.filter(cr => statuses.includes(cr.status));
    }

    if (filters.change_type) {
      result = result.filter(cr => cr.change_type === filters.change_type);
    }

    if (filters.change_category) {
      result = result.filter(cr => cr.change_category === filters.change_category);
    }

    if (filters.order_phase) {
      result = result.filter(cr => cr.order_phase === filters.order_phase);
    }

    // Sort by created_at desc
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [filters]);

  const stats = useMemo(() => getChangeRequestStats(), []);

  return {
    changeRequests,
    stats,
    loading,
    total: changeRequests.length,
  };
}

// ---------------------------------------------
// useERPChangeRequest - Single
// ---------------------------------------------

export function useERPChangeRequest(id: string) {
  const [loading, setLoading] = useState(true);
  const [changeRequest, setChangeRequest] = useState<ChangeRequest | null>(null);
  const [logs, setLogs] = useState<ChangeRequestLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = mockChangeRequests.find(cr => cr.id === id);
      if (found) {
        setChangeRequest(found);
        setLogs(mockChangeRequestLogs.filter(log => log.change_request_id === id));
      } else {
        setError('Change request not found');
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [id]);

  return {
    changeRequest,
    logs,
    loading,
    error,
  };
}

// ---------------------------------------------
// useERPChangeRequestCalculator - Fee Calculator
// ---------------------------------------------

import { PHASE_FEES_CONFIG as phaseFeesConfig } from '../types/change-requests';

export function useERPChangeRequestCalculator() {
  const getPhaseConfig = useCallback((phase: OrderPhase) => {
    return phaseFeesConfig.find(p => p.phase === phase) || phaseFeesConfig[0];
  }, []);

  const calculateFees = useCallback((
    phase: OrderPhase,
    changeType: string,
    baseAmount: number = 0,
    options?: {
      quantityChange?: number;
      isRush?: boolean;
      wasteQty?: number;
      wasteUnitCost?: number;
    }
  ) => {
    const config = getPhaseConfig(phase);
    const fees = config.fees;
    
    let baseFee = 0;
    let designFee = 0;
    let reworkFee = 0;
    let materialFee = 0;
    let wasteFee = 0;
    let rushFee = 0;
    
    switch (changeType) {
      case 'design_revision':
        designFee = fees.design_revision;
        break;
      case 'quantity_change':
        if (options?.quantityChange && options.quantityChange > 0) {
          materialFee = baseAmount * (fees.quantity_change_percent / 100);
        }
        break;
      case 'size_change':
      case 'color_change':
        baseFee = fees.size_color_change;
        break;
      case 'add_work':
        baseFee = baseAmount * (fees.add_work_percent / 100);
        break;
      case 'remove_work':
        baseFee = baseAmount * (fees.remove_work_penalty_percent / 100);
        break;
      case 'cancel':
        baseFee = baseAmount * (fees.cancel_penalty_percent / 100);
        break;
    }
    
    if (options?.wasteQty && options?.wasteUnitCost) {
      wasteFee = options.wasteQty * options.wasteUnitCost;
    }
    
    if (options?.isRush) {
      rushFee = Math.max(baseFee + designFee + reworkFee + materialFee + wasteFee, 0) * 0.5; // 50% rush fee
    }
    
    const totalFee = baseFee + designFee + reworkFee + materialFee + wasteFee + rushFee;
    
    return {
      base_fee: baseFee,
      design_fee: designFee,
      rework_fee: reworkFee,
      material_fee: materialFee,
      waste_fee: wasteFee,
      rush_fee: rushFee,
      other_fee: 0,
      discount: 0,
      total_fee: totalFee,
    };
  }, [getPhaseConfig]);

  const getImpactLevel = useCallback((
    phase: OrderPhase,
    productionStarted: boolean,
    affectsSchedule: boolean
  ): 'none' | 'low' | 'medium' | 'high' | 'critical' => {
    if (phase === 'draft') return 'none';
    if (phase === 'design') return 'low';
    if (phase === 'mockup_approved' && !productionStarted) return 'low';
    if (phase === 'pre_production') return affectsSchedule ? 'medium' : 'low';
    if (phase === 'in_production') return productionStarted ? 'high' : 'medium';
    if (phase === 'qc_complete') return 'critical';
    return 'medium';
  }, []);

  return {
    getPhaseConfig,
    calculateFees,
    getImpactLevel,
    phaseFeesConfig,
  };
}

// ---------------------------------------------
// Status Display Helpers
// ---------------------------------------------

export const CHANGE_REQUEST_STATUS_CONFIG = {
  pending_quote: { label: 'Pending Quote', label_th: 'รอเสนอราคา', color: 'bg-yellow-100 text-yellow-700' },
  awaiting_customer: { label: 'Awaiting Customer', label_th: 'รอลูกค้าตอบ', color: 'bg-blue-100 text-blue-700' },
  awaiting_payment: { label: 'Awaiting Payment', label_th: 'รอชำระเงิน', color: 'bg-orange-100 text-orange-700' },
  in_progress: { label: 'In Progress', label_th: 'กำลังดำเนินการ', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completed', label_th: 'เสร็จสิ้น', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', label_th: 'ยกเลิก', color: 'bg-gray-100 text-gray-700' },
  rejected: { label: 'Rejected', label_th: 'ลูกค้าปฏิเสธ', color: 'bg-red-100 text-red-700' },
} as const;

export const CHANGE_TYPE_CONFIG = {
  design_revision: { label: 'Design Revision', label_th: 'แก้ไขแบบ', icon: '🎨' },
  quantity_change: { label: 'Quantity Change', label_th: 'เปลี่ยนจำนวน', icon: '📊' },
  size_change: { label: 'Size Change', label_th: 'เปลี่ยนไซส์', icon: '📏' },
  color_change: { label: 'Color Change', label_th: 'เปลี่ยนสี', icon: '🎨' },
  add_work: { label: 'Add Work', label_th: 'เพิ่มงาน', icon: '➕' },
  remove_work: { label: 'Remove Work', label_th: 'ลดงาน', icon: '➖' },
  material_change: { label: 'Material Change', label_th: 'เปลี่ยนวัสดุ', icon: '🧵' },
  shipping_change: { label: 'Shipping Change', label_th: 'เปลี่ยนที่อยู่จัดส่ง', icon: '📦' },
  due_date_change: { label: 'Due Date Change', label_th: 'เปลี่ยนวันส่ง', icon: '📅' },
  cancel: { label: 'Cancel Order', label_th: 'ยกเลิกออเดอร์', icon: '❌' },
  other: { label: 'Other', label_th: 'อื่นๆ', icon: '📝' },
} as const;

export const IMPACT_LEVEL_CONFIG = {
  none: { label: 'None', label_th: 'ไม่มีผลกระทบ', color: 'bg-gray-100 text-gray-600' },
  low: { label: 'Low', label_th: 'ต่ำ', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', label_th: 'ปานกลาง', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', label_th: 'สูง', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', label_th: 'วิกฤต', color: 'bg-red-100 text-red-700' },
} as const;


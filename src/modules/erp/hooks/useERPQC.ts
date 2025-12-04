'use client';

import { useState, useEffect } from 'react';
import { supabaseQCRepository } from '../repositories/supabase/qcRepository';
import type {
  QCRecord,
  QCTemplate,
  QCRecordFilters,
  CreateQCRecordInput,
  QCActionInput,
  QCStats,
} from '../types/qc';
import type { PaginationParams } from '../types/common';

// ---------------------------------------------
// QC CONFIGS
// ---------------------------------------------

export const QC_RESULT_CONFIG = {
  pass: { label: 'Pass', label_th: 'ผ่าน', color: 'bg-green-100 text-green-700', icon: '✓' },
  fail: { label: 'Fail', label_th: 'ไม่ผ่าน', color: 'bg-red-100 text-red-700', icon: '✗' },
  partial: { label: 'Partial', label_th: 'ผ่านบางส่วน', color: 'bg-yellow-100 text-yellow-700', icon: '⚠' },
};

export const QC_STAGE_CONFIG: Record<string, { label: string; label_th: string; order: number; icon?: string }> = {
  material_check: { label: 'Material Check', label_th: 'ตรวจวัสดุ', order: 1, icon: '📦' },
  pre_production: { label: 'Pre-Production', label_th: 'ก่อนผลิต', order: 2, icon: '🔍' },
  in_process: { label: 'In Process', label_th: 'ระหว่างผลิต', order: 3, icon: '⚙️' },
  post_production: { label: 'Post-Production', label_th: 'หลังผลิต', order: 4, icon: '✅' },
  final_inspection: { label: 'Final Inspection', label_th: 'ตรวจสอบสุดท้าย', order: 5, icon: '🎯' },
};

export const DEFECT_SEVERITY_CONFIG = {
  critical: { label: 'Critical', label_th: 'ร้ายแรง', color: 'bg-red-100 text-red-700' },
  major: { label: 'Major', label_th: 'สำคัญ', color: 'bg-orange-100 text-orange-700' },
  minor: { label: 'Minor', label_th: 'เล็กน้อย', color: 'bg-yellow-100 text-yellow-700' },
};

export function useERPQCRecords(filters?: QCRecordFilters, pagination?: PaginationParams) {
  const [qcRecords, setQCRecords] = useState<QCRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQCRecords = async () => {
      try {
        setLoading(true);
        const result = await supabaseQCRepository.findMany(filters, pagination);
        setQCRecords(result.data);
        setTotalCount(result.totalCount ?? result.pagination?.total ?? 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQCRecords();
  }, [filters?.order_id, filters?.production_job_id, filters?.qc_stage_code, filters?.overall_result, pagination?.page, pagination?.limit]);

  const createQCRecord = async (input: CreateQCRecordInput) => {
    try {
      const result = await supabaseQCRepository.create(input);
      if (result.success && result.data) {
        setQCRecords(prev => [result.data!, ...prev]);
        return result.data;
      }
      throw new Error(result.message || 'Failed to create QC record');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const takeAction = async (input: QCActionInput) => {
    try {
      const result = await supabaseQCRepository.takeAction(input);
      if (result.success) {
        // Refresh list
        const refreshResult = await supabaseQCRepository.findMany(filters, pagination);
        setQCRecords(refreshResult.data);
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const markFollowUpComplete = async (recordId: string) => {
    try {
      const result = await supabaseQCRepository.markFollowUpComplete(recordId);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Calculate inline stats matching QCStats type
  const today = new Date().toISOString().split('T')[0];
  const stats: QCStats = {
    total_records: totalCount,
    pending_qc: qcRecords.filter(r => r.status === 'pending' || r.status === 'in_progress').length,
    failed_today: qcRecords.filter(r => r.result === 'fail' && r.checked_at?.startsWith(today)).length,
    rework_in_progress: qcRecords.filter(r => r.status === 'pending_rework').length,
    avg_pass_rate: totalCount > 0 ? Math.round((qcRecords.filter(r => r.result === 'pass').length / totalCount) * 100) : 0,
    avg_check_time_minutes: 0, // Would need actual data to calculate
  };

  return {
    qcRecords,
    records: qcRecords, // Alias for compatibility
    totalCount,
    loading,
    error,
    stats, // Stats for convenience
    createQCRecord,
    takeAction,
    markFollowUpComplete,
  };
}

export function useERPQCTemplates(workTypeCode?: string) {
  const [templates, setTemplates] = useState<QCTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const data = await supabaseQCRepository.getTemplates(workTypeCode);
        setTemplates(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [workTypeCode]);

  return { templates, loading, error };
}

export function useERPQCStats(filters?: QCRecordFilters) {
  const [stats, setStats] = useState<QCStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await supabaseQCRepository.getStats(filters);
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [filters?.order_id, filters?.production_job_id]);

  return { stats, loading, error };
}

// ---------------------------------------------
// useERPQCForOrder - QC Records filtered by Order ID
// ---------------------------------------------

export function useERPQCForOrder(orderId: string) {
  const { 
    qcRecords, 
    totalCount, 
    loading, 
    error, 
    createQCRecord,
    takeAction,
  } = useERPQCRecords({ order_id: orderId });

  const { stats } = useERPQCStats({ order_id: orderId });

  // Group records by stage
  const recordsByStage = qcRecords.reduce((acc, record) => {
    const stage = record.stage || record.qc_stage_code;
    if (!acc[stage]) {
      acc[stage] = [];
    }
    acc[stage].push(record);
    return acc;
  }, {} as Record<string, QCRecord[]>);

  // Calculate pass rate
  const passRate = totalCount > 0 
    ? (qcRecords.filter(r => (r.result || r.overall_result) === 'pass').length / totalCount) * 100 
    : 0;

  // Summary for the UI (matching QCSummaryCard expected structure)
  const passed = qcRecords.filter(r => (r.result || r.overall_result) === 'pass').length;
  const failed = qcRecords.filter(r => r.result === 'fail').length;
  const rework = qcRecords.filter(r => r.actions?.some(a => a.action_type === 'rework')).length;
  
  const summary = {
    total_records: totalCount,
    total_checked: totalCount,
    total_passed: passed,
    total_failed: failed,
    total_rework: rework,
    overall_pass_rate: Math.round(passRate),
    has_pending_rework: qcRecords.some(r => r.status === 'pending_rework'),
    pending_follow_ups: qcRecords.filter(r => r.follow_up_required && !r.follow_up_completed).length,
  };

  return {
    records: qcRecords,
    totalCount,
    loading,
    error,
    stats,
    summary, // Alias for the UI
    recordsByStage,
    passRate,
    createRecord: createQCRecord,
    takeAction,
  };
}

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

export const QC_STAGE_CONFIG = {
  material_check: { label: 'Material Check', label_th: 'ตรวจวัสดุ', order: 1 },
  pre_production: { label: 'Pre-Production', label_th: 'ก่อนผลิต', order: 2 },
  in_process: { label: 'In Process', label_th: 'ระหว่างผลิต', order: 3 },
  post_production: { label: 'Post-Production', label_th: 'หลังผลิต', order: 4 },
  final_inspection: { label: 'Final Inspection', label_th: 'ตรวจสอบสุดท้าย', order: 5 },
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
        setTotalCount(result.totalCount);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQCRecords();
  }, [filters?.order_id, filters?.production_job_id, filters?.stage, filters?.overall_result, pagination?.page, pagination?.pageSize]);

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

  return {
    qcRecords,
    totalCount,
    loading,
    error,
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

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  mockQCRecords,
  mockQCStageConfigs,
  mockDefectTypes,
  getQCStats,
  getQCRecordsForOrder,
  getQCRecordsForJob,
} from '../mocks/data';
import type {
  QCRecord,
  QCStats,
  QCStageConfig,
  DefectType,
  QCRecordFilters,
  QCCheckpoint,
} from '../types/qc';

// ---------------------------------------------
// useERPQCRecords - List & Filter
// ---------------------------------------------

export function useERPQCRecords(filters: QCRecordFilters = {}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const records = useMemo(() => {
    let result = [...mockQCRecords];

    if (filters.order_id) {
      result = result.filter(r => r.order_id === filters.order_id);
    }

    if (filters.job_id) {
      result = result.filter(r => r.job_id === filters.job_id);
    }

    if (filters.qc_stage_code) {
      result = result.filter(r => r.qc_stage_code === filters.qc_stage_code);
    }

    if (filters.overall_result) {
      result = result.filter(r => r.overall_result === filters.overall_result);
    }

    if (filters.checked_by) {
      result = result.filter(r => r.checked_by === filters.checked_by);
    }

    if (filters.has_failures) {
      result = result.filter(r => r.failed_qty > 0);
    }

    if (filters.follow_up_required) {
      result = result.filter(r => r.follow_up_required);
    }

    // Sort by checked_at desc
    result.sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime());

    return result;
  }, [filters]);

  const stats = useMemo(() => getQCStats(), []);

  return {
    records,
    stats,
    loading,
    total: records.length,
  };
}

// ---------------------------------------------
// useERPQCRecord - Single
// ---------------------------------------------

export function useERPQCRecord(id: string) {
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<QCRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = mockQCRecords.find(r => r.id === id);
      if (found) {
        setRecord(found);
      } else {
        setError('QC record not found');
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [id]);

  return {
    record,
    loading,
    error,
  };
}

// ---------------------------------------------
// useERPQCForOrder - QC Records for Order
// ---------------------------------------------

export function useERPQCForOrder(orderId: string) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const records = useMemo(() => getQCRecordsForOrder(orderId), [orderId]);

  const summary = useMemo(() => {
    if (records.length === 0) return null;

    const totalChecked = records.reduce((sum, r) => sum + r.checked_qty, 0);
    const totalPassed = records.reduce((sum, r) => sum + r.passed_qty, 0);
    const totalFailed = records.reduce((sum, r) => sum + r.failed_qty, 0);
    const totalRework = records.reduce((sum, r) => sum + r.rework_qty, 0);

    return {
      total_records: records.length,
      total_checked: totalChecked,
      total_passed: totalPassed,
      total_failed: totalFailed,
      total_rework: totalRework,
      overall_pass_rate: totalChecked > 0 ? Math.round((totalPassed / totalChecked) * 100) : 0,
      has_pending_rework: records.some(r => r.rework_qty > 0 && r.follow_up_required),
      pending_follow_ups: records.filter(r => r.follow_up_required && !r.follow_up_completed_at).length,
    };
  }, [records]);

  return {
    records,
    summary,
    loading,
  };
}

// ---------------------------------------------
// useERPQCForJob - QC Records for Job
// ---------------------------------------------

export function useERPQCForJob(jobId: string) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const records = useMemo(() => getQCRecordsForJob(jobId), [jobId]);

  const latestRecord = useMemo(() => {
    if (records.length === 0) return null;
    return records.reduce((latest, r) => 
      new Date(r.checked_at) > new Date(latest.checked_at) ? r : latest,
      records[0]
    );
  }, [records]);

  return {
    records,
    latestRecord,
    loading,
  };
}

// ---------------------------------------------
// useERPQCConfig - Stage & Defect Config
// ---------------------------------------------

export function useERPQCConfig() {
  const stages = useMemo(() => mockQCStageConfigs, []);
  const defectTypes = useMemo(() => mockDefectTypes, []);

  const getStageByCode = useCallback((code: string) => {
    return stages.find(s => s.code === code);
  }, [stages]);

  const getDefectsByCategory = useCallback((category: string) => {
    return defectTypes.filter(d => d.category === category);
  }, [defectTypes]);

  return {
    stages,
    defectTypes,
    getStageByCode,
    getDefectsByCategory,
  };
}

// ---------------------------------------------
// QC Calculator
// ---------------------------------------------

export function useERPQCCalculator() {
  const calculatePassRate = useCallback((passed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((passed / total) * 100);
  }, []);

  const determineOverallResult = useCallback((
    passRate: number,
    hasRework: boolean,
    hasCriticalFail: boolean
  ): 'pass' | 'pass_with_rework' | 'fail' => {
    if (hasCriticalFail || passRate < 80) return 'fail';
    if (hasRework || passRate < 100) return 'pass_with_rework';
    return 'pass';
  }, []);

  const checkForCriticalDefects = useCallback((checkpoints: QCCheckpoint[]) => {
    return checkpoints.some(cp => !cp.passed && cp.defect_severity === 'critical');
  }, []);

  return {
    calculatePassRate,
    determineOverallResult,
    checkForCriticalDefects,
  };
}

// ---------------------------------------------
// Status Display Helpers
// ---------------------------------------------

export const QC_RESULT_CONFIG = {
  pass: { label: 'Pass', label_th: 'ผ่าน', color: 'bg-green-100 text-green-700', icon: '✅' },
  pass_with_rework: { label: 'Pass with Rework', label_th: 'ผ่าน (มีซ่อม)', color: 'bg-yellow-100 text-yellow-700', icon: '⚠️' },
  fail: { label: 'Fail', label_th: 'ไม่ผ่าน', color: 'bg-red-100 text-red-700', icon: '❌' },
  pending: { label: 'Pending', label_th: 'รอตรวจ', color: 'bg-gray-100 text-gray-700', icon: '⏳' },
} as const;

export const QC_STAGE_CONFIG = {
  material: { label: 'Material', label_th: 'วัตถุดิบ', icon: '📦' },
  pre_production: { label: 'Pre-Production', label_th: 'ก่อนผลิต', icon: '🔧' },
  in_process: { label: 'In-Process', label_th: 'ระหว่างผลิต', icon: '⚙️' },
  post_production: { label: 'Post-Production', label_th: 'หลังผลิต', icon: '🏭' },
  final: { label: 'Final', label_th: 'ขั้นสุดท้าย', icon: '✨' },
} as const;

export const DEFECT_SEVERITY_CONFIG = {
  minor: { label: 'Minor', label_th: 'เล็กน้อย', color: 'bg-yellow-100 text-yellow-700' },
  major: { label: 'Major', label_th: 'ปานกลาง', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', label_th: 'รุนแรง', color: 'bg-red-100 text-red-700' },
} as const;


'use client';

import { useState, useMemo } from 'react';
import { Card, Button, Input, Modal, useToast } from '@/modules/shared/ui';
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit,
  Save,
  Timer,
  Zap,
  Rocket,
  FileText,
  DollarSign,
  Palette,
  Factory,
  ClipboardCheck,
  Truck,
} from 'lucide-react';
import type { OrderStatus } from '../types';

interface SLATimelineProps {
  orderId: string;
  currentStatus: OrderStatus;
  orderDate: string;
  dueDate: string | null;
  timeline?: TimelineData;
  onSave?: (timeline: TimelineData) => void;
}

interface TimelineData {
  priority_level: 'normal' | 'urgent' | 'express';
  estimated_days: number;
  steps: {
    key: string;
    deadline: string | null;
    actual: string | null;
  }[];
}

const TIMELINE_STEPS = [
  { key: 'quoted', label: 'เสนอราคา', icon: FileText, defaultDays: 1 },
  { key: 'payment', label: 'ชำระเงิน', icon: DollarSign, defaultDays: 3 },
  { key: 'design', label: 'ออกแบบ', icon: Palette, defaultDays: 3 },
  { key: 'mockup', label: 'อนุมัติ Mockup', icon: CheckCircle2, defaultDays: 2 },
  { key: 'production', label: 'ผลิต', icon: Factory, defaultDays: 5 },
  { key: 'qc', label: 'QC', icon: ClipboardCheck, defaultDays: 1 },
  { key: 'shipping', label: 'จัดส่ง', icon: Truck, defaultDays: 2 },
];

const PRIORITY_CONFIG = {
  normal: { label: 'ปกติ', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock, multiplier: 1 },
  urgent: { label: 'ด่วน', color: 'text-orange-600', bg: 'bg-orange-100', icon: Timer, multiplier: 0.7 },
  express: { label: 'ด่วนมาก', color: 'text-red-600', bg: 'bg-red-100', icon: Rocket, multiplier: 0.5 },
};

// Helper to get step index from status
const getStepIndexFromStatus = (status: OrderStatus): number => {
  switch (status) {
    case 'draft':
    case 'quoted':
      return 0;
    case 'awaiting_payment':
    case 'partial_paid':
      return 1;
    case 'designing':
    case 'awaiting_mockup_approval':
      return 2;
    case 'in_production':
    case 'awaiting_material':
    case 'queued':
      return 4;
    case 'qc_pending':
      return 5;
    case 'ready_to_ship':
    case 'shipped':
      return 6;
    case 'completed':
      return 7;
    default:
      return 0;
  }
};

export function SLATimeline({ orderId, currentStatus, orderDate, dueDate, timeline, onSave }: SLATimelineProps) {
  const { success } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'express'>(timeline?.priority_level || 'normal');
  
  // Generate default deadlines based on order date and priority
  const generateDefaultDeadlines = useMemo(() => {
    const startDate = new Date(orderDate);
    const multiplier = PRIORITY_CONFIG[priority].multiplier;
    let currentDate = new Date(startDate);
    
    return TIMELINE_STEPS.map((step) => {
      const daysToAdd = Math.ceil(step.defaultDays * multiplier);
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + daysToAdd);
      
      return {
        key: step.key,
        deadline: currentDate.toISOString().split('T')[0],
        actual: null,
      };
    });
  }, [orderDate, priority]);

  const [steps, setSteps] = useState(timeline?.steps || generateDefaultDeadlines);

  const currentStepIndex = getStepIndexFromStatus(currentStatus);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate total estimated days
  const totalDays = useMemo(() => {
    if (steps.length === 0) return 0;
    const start = new Date(orderDate);
    const end = new Date(steps[steps.length - 1]?.deadline || orderDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [steps, orderDate]);

  // Check if on track
  const isOnTrack = useMemo(() => {
    if (currentStepIndex >= TIMELINE_STEPS.length) return true;
    const currentDeadline = steps[currentStepIndex]?.deadline;
    if (!currentDeadline) return true;
    return today <= new Date(currentDeadline);
  }, [currentStepIndex, steps, today]);

  // Days remaining
  const daysRemaining = useMemo(() => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [dueDate, today]);

  const handleDeadlineChange = (index: number, date: string) => {
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[index] = { ...newSteps[index], deadline: date };
      return newSteps;
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        priority_level: priority,
        estimated_days: totalDays,
        steps,
      });
    }
    success('บันทึก Timeline เรียบร้อย');
    setIsEditing(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getStepStatus = (index: number, deadline: string | null, actual: string | null) => {
    if (actual) return 'completed';
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) {
      if (!deadline) return 'current';
      const deadlineDate = new Date(deadline);
      if (today > deadlineDate) return 'overdue';
      const daysUntil = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 1) return 'warning';
      return 'current';
    }
    return 'pending';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'text-green-600', bg: 'bg-green-500', border: 'border-green-500', icon: CheckCircle2 };
      case 'current':
        return { color: 'text-blue-600', bg: 'bg-blue-500', border: 'border-blue-500', icon: Clock };
      case 'warning':
        return { color: 'text-yellow-600', bg: 'bg-yellow-500', border: 'border-yellow-500', icon: AlertTriangle };
      case 'overdue':
        return { color: 'text-red-600', bg: 'bg-red-500', border: 'border-red-500', icon: XCircle };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-300', border: 'border-gray-300', icon: Clock };
    }
  };

  const priorityConfig = PRIORITY_CONFIG[priority];
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Priority Level */}
        <Card className={`p-4 ${priorityConfig.bg}`}>
          <div className="flex items-center gap-3">
            <PriorityIcon className={`w-8 h-8 ${priorityConfig.color}`} />
            <div>
              <p className="text-sm text-[#86868B]">ความเร่งด่วน</p>
              <p className={`text-lg font-bold ${priorityConfig.color}`}>{priorityConfig.label}</p>
            </div>
          </div>
        </Card>

        {/* Days Remaining */}
        <Card className={`p-4 ${
          daysRemaining === null ? 'bg-gray-100' :
          daysRemaining < 0 ? 'bg-red-100' : 
          daysRemaining <= 3 ? 'bg-yellow-100' : 'bg-green-100'
        }`}>
          <div className="flex items-center gap-3">
            <Calendar className={`w-8 h-8 ${
              daysRemaining === null ? 'text-gray-600' :
              daysRemaining < 0 ? 'text-red-600' : 
              daysRemaining <= 3 ? 'text-yellow-600' : 'text-green-600'
            }`} />
            <div>
              <p className="text-sm text-[#86868B]">เหลือเวลา</p>
              <p className={`text-lg font-bold ${
                daysRemaining === null ? 'text-gray-600' :
                daysRemaining < 0 ? 'text-red-600' : 
                daysRemaining <= 3 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {daysRemaining === null ? 'ไม่ระบุ' :
                 daysRemaining < 0 ? `เกิน ${Math.abs(daysRemaining)} วัน` :
                 daysRemaining === 0 ? 'วันนี้!' :
                 `${daysRemaining} วัน`}
              </p>
            </div>
          </div>
        </Card>

        {/* On Track Status */}
        <Card className={`p-4 ${isOnTrack ? 'bg-green-100' : 'bg-red-100'}`}>
          <div className="flex items-center gap-3">
            {isOnTrack ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <p className="text-sm text-[#86868B]">สถานะ</p>
              <p className={`text-lg font-bold ${isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                {isOnTrack ? 'ตรงเวลา' : 'ล่าช้า'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="p-6 bg-white border border-[#E8E8ED]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#1D1D1F]">Timeline & กำหนดส่ง</h3>
            <p className="text-sm text-[#86868B]">ระยะเวลาโดยประมาณ {totalDays} วัน</p>
          </div>
          {!isEditing ? (
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              แก้ไข
            </Button>
          ) : (
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              บันทึก
            </Button>
          )}
        </div>

        {/* Priority Selector (when editing) */}
        {isEditing && (
          <div className="mb-6 p-4 bg-[#F5F5F7] rounded-xl">
            <p className="text-sm text-[#86868B] mb-2">ความเร่งด่วน</p>
            <div className="flex gap-2">
              {(Object.keys(PRIORITY_CONFIG) as Array<keyof typeof PRIORITY_CONFIG>).map((key) => {
                const config = PRIORITY_CONFIG[key];
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setPriority(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      priority === key
                        ? `${config.bg} ${config.color} ring-2 ring-offset-2 ring-current`
                        : 'bg-white text-[#86868B] hover:bg-[#E8E8ED]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline Steps */}
        <div className="relative">
          {TIMELINE_STEPS.map((step, index) => {
            const stepData = steps[index];
            const status = getStepStatus(index, stepData?.deadline || null, stepData?.actual || null);
            const statusConfig = getStatusConfig(status);
            const Icon = step.icon;
            const StatusIcon = statusConfig.icon;

            return (
              <div key={step.key} className="flex items-start gap-4 relative">
                {/* Line */}
                {index < TIMELINE_STEPS.length - 1 && (
                  <div 
                    className={`absolute left-5 top-10 w-0.5 h-16 ${
                      status === 'completed' ? 'bg-green-500' : 'bg-[#E8E8ED]'
                    }`}
                  />
                )}

                {/* Circle */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  status === 'completed' ? 'bg-green-500 text-white' :
                  status === 'current' ? 'bg-blue-500 text-white ring-4 ring-blue-200' :
                  status === 'warning' ? 'bg-yellow-500 text-white' :
                  status === 'overdue' ? 'bg-red-500 text-white' :
                  'bg-[#F5F5F7] text-[#86868B] border-2 border-[#E8E8ED]'
                }`}>
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium ${statusConfig.color}`}>{step.label}</span>
                    {status === 'overdue' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        เกินกำหนด!
                      </span>
                    )}
                    {status === 'warning' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600">
                        ใกล้ครบกำหนด
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    {isEditing ? (
                      <Input
                        type="date"
                        value={stepData?.deadline || ''}
                        onChange={(e) => handleDeadlineChange(index, e.target.value)}
                        className="w-40"
                      />
                    ) : (
                      <>
                        <span className="text-[#86868B]">
                          กำหนด: <span className={statusConfig.color}>{formatDate(stepData?.deadline || null)}</span>
                        </span>
                        {stepData?.actual && (
                          <span className="text-green-600">
                            เสร็จ: {formatDate(stepData.actual)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default SLATimeline;


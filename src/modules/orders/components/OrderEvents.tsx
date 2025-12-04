'use client';

import { useState } from 'react';
import { Card, Button, Input, Modal, useToast, Dropdown } from '@/modules/shared/ui';
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  RefreshCw,
  Pause,
  Play,
  RotateCcw,
  Package,
  Palette,
  Printer,
  Truck,
  DollarSign,
  AlertCircle,
  Ban,
  Zap,
  ArrowRight,
  FileText,
  Camera,
  User,
  Settings,
} from 'lucide-react';
import type { Order } from '../types';

interface OrderEventsProps {
  order: Order;
  events?: OrderEvent[];
  onAddEvent?: (event: Omit<OrderEvent, 'id' | 'created_at'>) => Promise<boolean>;
  onResolveEvent?: (eventId: string, resolution: string) => Promise<boolean>;
}

export type EventCategory = 
  | 'customer_request'    // ลูกค้าขอเปลี่ยน
  | 'design_revision'     // แก้ไขงานออกแบบ
  | 'production_issue'    // ปัญหาการผลิต
  | 'quality_issue'       // ปัญหาคุณภาพ
  | 'material_issue'      // ปัญหาวัตถุดิบ
  | 'delivery_issue'      // ปัญหาจัดส่ง
  | 'payment_issue'       // ปัญหาการชำระ
  | 'complaint'           // ร้องเรียน
  | 'refund_request'      // ขอคืนเงิน
  | 'replacement'         // ทำใหม่/เปลี่ยน
  | 'order_hold'          // พักออเดอร์
  | 'priority_change'     // เปลี่ยนความเร่งด่วน
  | 'scope_change'        // เปลี่ยนขอบเขตงาน
  | 'other';              // อื่นๆ

export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EventStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface OrderEvent {
  id: string;
  order_id: string;
  
  category: EventCategory;
  severity: EventSeverity;
  status: EventStatus;
  
  title: string;
  description: string;
  
  // Impact
  affects_deadline: boolean;
  deadline_extension_days: number | null;
  affects_cost: boolean;
  additional_cost: number | null;
  
  // Resolution
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  
  // Evidence
  attachments: string[];
  
  created_by: string | null;
  created_at: string;
}

const EVENT_CATEGORIES: Record<EventCategory, {
  label: string;
  icon: typeof AlertTriangle;
  color: string;
  bg: string;
  examples: string[];
}> = {
  customer_request: {
    label: 'ลูกค้าขอเปลี่ยน',
    icon: User,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    examples: ['เปลี่ยนสี', 'เปลี่ยนขนาด', 'เปลี่ยนจำนวน', 'เปลี่ยนที่อยู่']
  },
  design_revision: {
    label: 'แก้ไขออกแบบ',
    icon: Palette,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
    examples: ['แก้ไขโลโก้', 'เปลี่ยนฟอนต์', 'ปรับตำแหน่ง', 'เพิ่มข้อความ']
  },
  production_issue: {
    label: 'ปัญหาผลิต',
    icon: Printer,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    examples: ['สีเพี้ยน', 'พิมพ์ผิดตำแหน่ง', 'เครื่องเสีย', 'งานไม่ตรง Mockup']
  },
  quality_issue: {
    label: 'ปัญหาคุณภาพ',
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    examples: ['QC ไม่ผ่าน', 'งานไม่ได้มาตรฐาน', 'หมึกลอก', 'ตะเข็บไม่เรียบ']
  },
  material_issue: {
    label: 'ปัญหาวัตถุดิบ',
    icon: Package,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    examples: ['เสื้อหมด', 'สีไม่ตรง', 'ผ้าไม่ได้คุณภาพ', 'รอของเข้า']
  },
  delivery_issue: {
    label: 'ปัญหาจัดส่ง',
    icon: Truck,
    color: 'text-cyan-600',
    bg: 'bg-cyan-100',
    examples: ['ของหาย', 'ส่งผิดที่', 'ของเสียหาย', 'ส่งไม่ถึง']
  },
  payment_issue: {
    label: 'ปัญหาการชำระ',
    icon: DollarSign,
    color: 'text-green-600',
    bg: 'bg-green-100',
    examples: ['โอนไม่ตรงยอด', 'ลืมโอน', 'ขอผ่อนชำระ', 'เช็คเด้ง']
  },
  complaint: {
    label: 'ร้องเรียน',
    icon: MessageCircle,
    color: 'text-rose-600',
    bg: 'bg-rose-100',
    examples: ['ไม่พอใจงาน', 'ส่งช้า', 'บริการไม่ดี', 'ไม่ตรงตามสั่ง']
  },
  refund_request: {
    label: 'ขอคืนเงิน',
    icon: RotateCcw,
    color: 'text-red-600',
    bg: 'bg-red-100',
    examples: ['คืนเงินเต็ม', 'คืนบางส่วน', 'เปลี่ยนเป็น Credit']
  },
  replacement: {
    label: 'ทำใหม่/เปลี่ยน',
    icon: RefreshCw,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    examples: ['ทำใหม่ทั้งหมด', 'ทำเพิ่มบางตัว', 'เปลี่ยนตัวที่เสีย']
  },
  order_hold: {
    label: 'พักออเดอร์',
    icon: Pause,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    examples: ['ลูกค้าขอพัก', 'รอวัตถุดิบ', 'รอชำระเงิน', 'รออนุมัติ']
  },
  priority_change: {
    label: 'เปลี่ยนความเร่งด่วน',
    icon: Zap,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    examples: ['เร่งงาน', 'เลื่อนงาน', 'ยกเลิกความเร่ง']
  },
  scope_change: {
    label: 'เปลี่ยนขอบเขตงาน',
    icon: Settings,
    color: 'text-teal-600',
    bg: 'bg-teal-100',
    examples: ['เพิ่มรายการ', 'ลดรายการ', 'เปลี่ยนประเภทงาน']
  },
  other: {
    label: 'อื่นๆ',
    icon: FileText,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    examples: ['หมายเหตุพิเศษ', 'ข้อมูลเพิ่มเติม']
  },
};

const SEVERITY_CONFIG = {
  low: { label: 'ต่ำ', color: 'text-green-600', bg: 'bg-green-100' },
  medium: { label: 'ปานกลาง', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  high: { label: 'สูง', color: 'text-orange-600', bg: 'bg-orange-100' },
  critical: { label: 'วิกฤต', color: 'text-red-600', bg: 'bg-red-100' },
};

const STATUS_CONFIG = {
  open: { label: 'เปิด', color: 'text-red-600', bg: 'bg-red-100' },
  in_progress: { label: 'กำลังแก้ไข', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  resolved: { label: 'แก้ไขแล้ว', color: 'text-green-600', bg: 'bg-green-100' },
  closed: { label: 'ปิด', color: 'text-gray-600', bg: 'bg-gray-100' },
};

export function OrderEvents({ order, events = [], onAddEvent, onResolveEvent }: OrderEventsProps) {
  const { success, error: showError } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<OrderEvent | null>(null);
  const [filter, setFilter] = useState<EventStatus | 'all'>('all');
  
  // New Event Form
  const [newEvent, setNewEvent] = useState({
    category: '' as EventCategory | '',
    severity: 'medium' as EventSeverity,
    title: '',
    description: '',
    affects_deadline: false,
    deadline_extension_days: 0,
    affects_cost: false,
    additional_cost: 0,
  });

  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);

  // Stats
  const openEvents = events.filter(e => e.status === 'open').length;
  const inProgressEvents = events.filter(e => e.status === 'in_progress').length;
  const totalAdditionalCost = events
    .filter(e => e.affects_cost && e.additional_cost)
    .reduce((sum, e) => sum + (e.additional_cost || 0), 0);
  const totalDelayDays = events
    .filter(e => e.affects_deadline && e.deadline_extension_days)
    .reduce((sum, e) => sum + (e.deadline_extension_days || 0), 0);

  const handleAddEvent = async () => {
    if (!newEvent.category || !newEvent.title) return;
    
    setSaving(true);
    try {
      if (onAddEvent) {
        const result = await onAddEvent({
          order_id: order.id,
          category: newEvent.category as EventCategory,
          severity: newEvent.severity,
          status: 'open',
          title: newEvent.title,
          description: newEvent.description,
          affects_deadline: newEvent.affects_deadline,
          deadline_extension_days: newEvent.affects_deadline ? newEvent.deadline_extension_days : null,
          affects_cost: newEvent.affects_cost,
          additional_cost: newEvent.affects_cost ? newEvent.additional_cost : null,
          resolution: null,
          resolved_by: null,
          resolved_at: null,
          attachments: [],
          created_by: null,
        });
        
        if (result) {
          success('บันทึกเหตุการณ์เรียบร้อย');
          setShowAddModal(false);
          setNewEvent({
            category: '',
            severity: 'medium',
            title: '',
            description: '',
            affects_deadline: false,
            deadline_extension_days: 0,
            affects_cost: false,
            additional_cost: 0,
          });
        }
      } else {
        // Demo mode
        success('บันทึกเหตุการณ์เรียบร้อย (Demo)');
        setShowAddModal(false);
      }
    } catch (err) {
      showError('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedEvent || !resolution.trim()) return;
    
    setSaving(true);
    try {
      if (onResolveEvent) {
        const result = await onResolveEvent(selectedEvent.id, resolution);
        if (result) {
          success('บันทึกการแก้ไขเรียบร้อย');
          setShowResolveModal(false);
          setSelectedEvent(null);
          setResolution('');
        }
      } else {
        success('บันทึกการแก้ไขเรียบร้อย (Demo)');
        setShowResolveModal(false);
      }
    } catch (err) {
      showError('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.status === filter);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={`p-4 ${openEvents > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${openEvents > 0 ? 'text-red-600' : 'text-green-600'}`} />
            <span className="text-sm text-[#86868B]">ปัญหาที่ยังเปิด</span>
          </div>
          <div className={`text-2xl font-bold mt-1 ${openEvents > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {openEvents}
          </div>
        </Card>
        
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-[#86868B]">กำลังแก้ไข</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{inProgressEvents}</div>
        </Card>
        
        <Card className={`p-4 ${totalDelayDays > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-[#E8E8ED]'}`}>
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${totalDelayDays > 0 ? 'text-orange-600' : 'text-[#86868B]'}`} />
            <span className="text-sm text-[#86868B]">ขยายเวลารวม</span>
          </div>
          <div className={`text-2xl font-bold mt-1 ${totalDelayDays > 0 ? 'text-orange-600' : 'text-[#1D1D1F]'}`}>
            {totalDelayDays} วัน
          </div>
        </Card>
        
        <Card className={`p-4 ${totalAdditionalCost > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-[#E8E8ED]'}`}>
          <div className="flex items-center gap-2">
            <DollarSign className={`w-5 h-5 ${totalAdditionalCost > 0 ? 'text-red-600' : 'text-[#86868B]'}`} />
            <span className="text-sm text-[#86868B]">ค่าใช้จ่ายเพิ่ม</span>
          </div>
          <div className={`text-2xl font-bold mt-1 ${totalAdditionalCost > 0 ? 'text-red-600' : 'text-[#1D1D1F]'}`}>
            {formatCurrency(totalAdditionalCost)}
          </div>
        </Card>
      </div>

      {/* Quick Add Buttons */}
      <Card className="p-6 bg-white border border-[#E8E8ED]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1D1D1F]">บันทึกเหตุการณ์ด่วน</h3>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
          {(Object.keys(EVENT_CATEGORIES) as EventCategory[]).slice(0, 7).map((category) => {
            const config = EVENT_CATEGORIES[category];
            const Icon = config.icon;
            
            return (
              <button
                key={category}
                onClick={() => {
                  setNewEvent(prev => ({ ...prev, category }));
                  setShowAddModal(true);
                }}
                className={`p-3 rounded-xl text-center transition-all hover:scale-105 ${config.bg}`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-1 ${config.color}`} />
                <p className="text-xs font-medium text-[#1D1D1F] truncate">{config.label}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Events List */}
      <Card className="p-6 bg-white border border-[#E8E8ED]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1D1D1F]">
            รายการเหตุการณ์ ({events.length})
          </h3>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="flex gap-1 bg-[#F5F5F7] p-1 rounded-lg">
              {(['all', 'open', 'in_progress', 'resolved'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    filter === status
                      ? 'bg-white text-[#007AFF] shadow-sm'
                      : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  {status === 'all' ? 'ทั้งหมด' : STATUS_CONFIG[status].label}
                </button>
              ))}
            </div>
            
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              เพิ่ม
            </Button>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
            <p className="text-[#86868B]">ไม่มีเหตุการณ์</p>
            <p className="text-sm text-[#86868B]">ออเดอร์นี้ดำเนินไปได้ด้วยดี 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => {
              const categoryConfig = EVENT_CATEGORIES[event.category];
              const severityConfig = SEVERITY_CONFIG[event.severity];
              const statusConfig = STATUS_CONFIG[event.status];
              const Icon = categoryConfig.icon;
              
              return (
                <div 
                  key={event.id} 
                  className={`p-4 rounded-xl border-l-4 ${
                    event.status === 'open' ? 'bg-red-50 border-red-500' :
                    event.status === 'in_progress' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-[#F5F5F7] border-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg ${categoryConfig.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${categoryConfig.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${categoryConfig.bg} ${categoryConfig.color}`}>
                            {categoryConfig.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${severityConfig.bg} ${severityConfig.color}`}>
                            {severityConfig.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <h4 className="font-medium text-[#1D1D1F] mt-1">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-[#86868B] mt-1">{event.description}</p>
                        )}
                        
                        {/* Impact */}
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          {event.affects_deadline && event.deadline_extension_days && (
                            <span className="text-orange-600">
                              ⏱️ ขยายเวลา +{event.deadline_extension_days} วัน
                            </span>
                          )}
                          {event.affects_cost && event.additional_cost && (
                            <span className="text-red-600">
                              💰 ค่าใช้จ่ายเพิ่ม {formatCurrency(event.additional_cost)}
                            </span>
                          )}
                        </div>
                        
                        {/* Resolution */}
                        {event.resolution && (
                          <div className="mt-2 p-2 bg-green-100 rounded text-sm text-green-700">
                            <span className="font-medium">วิธีแก้ไข:</span> {event.resolution}
                          </div>
                        )}
                        
                        <div className="text-xs text-[#86868B] mt-2">
                          {formatDate(event.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    {event.status !== 'resolved' && event.status !== 'closed' && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowResolveModal(true);
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        แก้ไขแล้ว
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add Event Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="บันทึกเหตุการณ์"
        size="lg"
      >
        <div className="space-y-4 p-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm text-[#86868B] mb-2">ประเภท</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(EVENT_CATEGORIES) as EventCategory[]).map((category) => {
                const config = EVENT_CATEGORIES[category];
                const Icon = config.icon;
                const isSelected = newEvent.category === category;
                
                return (
                  <button
                    key={category}
                    onClick={() => setNewEvent(prev => ({ ...prev, category }))}
                    className={`p-2 rounded-lg text-center transition-all ${
                      isSelected
                        ? `${config.bg} ${config.color} ring-2 ring-current`
                        : 'bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED]'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <p className="text-xs truncate">{config.label}</p>
                  </button>
                );
              })}
            </div>
            
            {/* Examples */}
            {newEvent.category && (
              <div className="mt-2 flex flex-wrap gap-1">
                {EVENT_CATEGORIES[newEvent.category].examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setNewEvent(prev => ({ ...prev, title: ex }))}
                    className="text-xs px-2 py-1 bg-[#F5F5F7] rounded hover:bg-[#E8E8ED] text-[#86868B]"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm text-[#86868B] mb-2">ความรุนแรง</label>
            <div className="flex gap-2">
              {(Object.keys(SEVERITY_CONFIG) as EventSeverity[]).map((severity) => {
                const config = SEVERITY_CONFIG[severity];
                const isSelected = newEvent.severity === severity;
                
                return (
                  <button
                    key={severity}
                    onClick={() => setNewEvent(prev => ({ ...prev, severity }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? `${config.bg} ${config.color} ring-2 ring-current`
                        : 'bg-[#F5F5F7] text-[#86868B] hover:bg-[#E8E8ED]'
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-[#86868B] mb-2">หัวข้อ</label>
            <Input
              value={newEvent.title}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              placeholder="ระบุหัวข้อปัญหา"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-[#86868B] mb-2">รายละเอียด</label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#E8E8ED] rounded-xl text-[#1D1D1F] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              placeholder="อธิบายรายละเอียดเพิ่มเติม..."
            />
          </div>

          {/* Impact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-[#86868B] mb-2">
                <input
                  type="checkbox"
                  checked={newEvent.affects_deadline}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, affects_deadline: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                กระทบกำหนดส่ง
              </label>
              {newEvent.affects_deadline && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={newEvent.deadline_extension_days || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, deadline_extension_days: parseInt(e.target.value) || 0 }))}
                    className="w-20"
                  />
                  <span className="text-sm text-[#86868B]">วัน</span>
                </div>
              )}
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm text-[#86868B] mb-2">
                <input
                  type="checkbox"
                  checked={newEvent.affects_cost}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, affects_cost: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                มีค่าใช้จ่ายเพิ่ม
              </label>
              {newEvent.affects_cost && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={newEvent.additional_cost || ''}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, additional_cost: parseInt(e.target.value) || 0 }))}
                    className="w-28"
                  />
                  <span className="text-sm text-[#86868B]">บาท</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleAddEvent} 
              disabled={!newEvent.category || !newEvent.title || saving}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resolve Event Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="บันทึกการแก้ไข"
      >
        <div className="p-4 space-y-4">
          {selectedEvent && (
            <div className="p-3 bg-[#F5F5F7] rounded-lg">
              <p className="font-medium text-[#1D1D1F]">{selectedEvent.title}</p>
              <p className="text-sm text-[#86868B]">{selectedEvent.description}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm text-[#86868B] mb-2">วิธีแก้ไข</label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#E8E8ED] rounded-xl text-[#1D1D1F] resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              placeholder="อธิบายวิธีที่ใช้แก้ไขปัญหา..."
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowResolveModal(false)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleResolve} 
              disabled={!resolution.trim() || saving}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default OrderEvents;


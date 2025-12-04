'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Package,
  Palette,
  Gift,
  FileText,
  Search,
  Plus,
  Trash2,
  ChevronDown,
  X,
  Zap,
  Clock,
  AlertTriangle,
  Sparkles,
  Printer,
  Scissors,
  Tag,
  Box,
  Info,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { Button, Card, Input, Modal, useToast, Dropdown } from '@/modules/shared/ui';
import {
  useERPCustomers,
  useERPProducts,
  useERPWorkTypes,
  useERPAddonTypes,
  useERPPrintConfig,
  useERPOrderConfig,
  useERPWorkDependencies,
} from '@/modules/erp';
import { useOrderMutations } from '@/modules/orders/hooks/useOrderMutations';
import type { Customer, Product, OrderType, PriorityLevel, WorkType } from '@/modules/erp';

// ---------------------------------------------
// Types
// ---------------------------------------------

interface WorkItemForm {
  id: string;
  work_type_code: string;
  description: string;
  quantity: number;
  unit_price: number;
  position_code: string;
  print_size_code: string;
  products: ProductItemForm[];
  is_required?: boolean; // งานบังคับตาม Order Type
  design_ready?: boolean; // ลูกค้าส่งไฟล์พร้อมผลิต
  design_note?: string; // หมายเหตุการออกแบบ
}

interface ProductItemForm {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
}

interface AddonItemForm {
  id: string;
  addon_code: string;
  addon_name: string;
  quantity: number;
  unit_price: number;
}

interface OrderFormData {
  // Step 1
  order_type_code: string;
  customer_id: string;
  customer: Customer | null;
  priority_code: string;
  sales_channel: string;
  due_date: string;
  // Step 2
  work_items: WorkItemForm[];
  // Step 3
  addons: AddonItemForm[];
  // Step 4
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_district: string;
  shipping_province: string;
  shipping_postal_code: string;
  needs_tax_invoice: boolean;
  billing_name: string;
  billing_tax_id: string;
  payment_terms: string;
  customer_note: string;
  internal_note: string;
  discount_percent: number;
  discount_amount: number;
}

// ---------------------------------------------
// Main Component
// ---------------------------------------------

const STEPS = [
  { id: 1, name: 'ประเภทงาน', icon: FileText },
  { id: 2, name: 'สินค้า & งาน', icon: Package },
  { id: 3, name: 'Addons', icon: Gift },
  { id: 4, name: 'สรุป', icon: Check },
];

export default function CreateOrderPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  
  // Current step
  const [currentStep, setCurrentStep] = useState(1);
  
  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<OrderFormData>({
    order_type_code: '',
    customer_id: '',
    customer: null,
    priority_code: 'normal',
    sales_channel: 'line',
    due_date: '',
    work_items: [],
    addons: [],
    shipping_name: '',
    shipping_phone: '',
    shipping_address: '',
    shipping_district: '',
    shipping_province: '',
    shipping_postal_code: '',
    needs_tax_invoice: false,
    billing_name: '',
    billing_tax_id: '',
    payment_terms: 'full',
    customer_note: '',
    internal_note: '',
    discount_percent: 0,
    discount_amount: 0,
  });

  // Hooks
  const { orderTypes, priorityLevels, salesChannels } = useERPOrderConfig();
  const { workTypes, getWorkTypeByCode, workTypesByCategory } = useERPWorkTypes();
  const { addonTypes, getAddonTypeByCode } = useERPAddonTypes();
  const { positions, sizes, getPositionByCode, getSizeByCode } = useERPPrintConfig();
  const { createOrder, loading: creatingOrder } = useOrderMutations();
  
  // Work Dependencies Hook
  const {
    availableWorkTypes,
    requiredWorkTypes,
    suggestedWorkTypes,
    workCategories,
    getDependenciesFor,
    canAddWorkType,
    getMissingDependencies,
    buildWorkflowOrder,
  } = useERPWorkDependencies(formData.order_type_code);

  // Selected order type
  const selectedOrderType = orderTypes.find(ot => ot.code === formData.order_type_code);
  const selectedPriority = priorityLevels.find(p => p.code === formData.priority_code);

  // Current work item codes (for dependency checking)
  const currentWorkItemCodes = useMemo(() => {
    return formData.work_items.map(wi => wi.work_type_code);
  }, [formData.work_items]);

  // Build workflow order for display
  const workflowOrder = useMemo(() => {
    return buildWorkflowOrder(currentWorkItemCodes);
  }, [currentWorkItemCodes, buildWorkflowOrder]);

  // Auto-add required work types when order type changes
  useEffect(() => {
    if (requiredWorkTypes.length > 0 && formData.order_type_code) {
      const existingCodes = formData.work_items.map(wi => wi.work_type_code);
      const missingRequired = requiredWorkTypes.filter(
        wt => !existingCodes.includes(wt.code)
      );
      
      if (missingRequired.length > 0) {
        const newItems = missingRequired.map((wt, index) => ({
          id: `wi-req-${Date.now()}-${index}`,
          work_type_code: wt.code,
          description: '',
          quantity: 1,
          unit_price: wt.base_price,
          position_code: '',
          print_size_code: '',
          products: [],
          is_required: true, // Mark as required
        }));
        
        setFormData(prev => ({
          ...prev,
          work_items: [...newItems, ...prev.work_items.filter(wi => !missingRequired.some(r => r.code === wi.work_type_code))],
        }));
      }
    }
  }, [requiredWorkTypes, formData.order_type_code]);

  // Calculate totals
  const calculations = useMemo(() => {
    // Work items total
    const workItemsTotal = formData.work_items.reduce((sum, item) => {
      const workTotal = item.quantity * item.unit_price;
      const productsTotal = item.products.reduce((pSum, p) => pSum + (p.quantity * p.product.price), 0);
      return sum + workTotal + productsTotal;
  }, 0);

    // Addons total
    const addonsTotal = formData.addons.reduce((sum, addon) => {
      return sum + (addon.quantity * addon.unit_price);
    }, 0);

    const subtotal = workItemsTotal + addonsTotal;

    // Discount
    const discountAmount = formData.discount_percent > 0 
      ? (subtotal * formData.discount_percent / 100) 
      : formData.discount_amount;

    // Priority surcharge
    const surchargePercent = selectedPriority?.surcharge_percent || 0;
    const surchargeAmount = (subtotal - discountAmount) * surchargePercent / 100;

    // Total
    const total = subtotal - discountAmount + surchargeAmount;

    return {
      workItemsTotal,
      addonsTotal,
      subtotal,
      discountAmount,
      surchargePercent,
      surchargeAmount,
      total,
    };
  }, [formData.work_items, formData.addons, formData.discount_percent, formData.discount_amount, selectedPriority]);

  // Validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 1:
        return formData.order_type_code && formData.customer_id && formData.due_date;
      case 2:
        return formData.work_items.length > 0;
      case 3:
        return true; // Addons are optional
      case 4:
        return formData.shipping_name && formData.shipping_phone && formData.shipping_address;
      default:
        return false;
    }
  }, [currentStep, formData]);

  // Handlers
  const handleNext = () => {
    if (canProceed && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer,
      shipping_name: customer.default_address?.name || customer.name,
      shipping_phone: customer.default_address?.phone || customer.phone || '',
      shipping_address: customer.default_address?.address || '',
      shipping_district: customer.default_address?.district || '',
      shipping_province: customer.default_address?.province || '',
      shipping_postal_code: customer.default_address?.postal_code || '',
      billing_name: customer.company_name || customer.name,
      billing_tax_id: customer.tax_id || '',
    }));
    setShowCustomerModal(false);
    success('เลือกลูกค้าแล้ว');
  };

  const handleAddWorkItem = () => {
    const newItem: WorkItemForm = {
      id: `wi-${Date.now()}`,
      work_type_code: 'dtf',
      description: '',
      quantity: 1,
      unit_price: 0,
      position_code: 'front_chest_center',
      print_size_code: 'a4',
      products: [],
    };
    setFormData(prev => ({
      ...prev,
      work_items: [...prev.work_items, newItem],
    }));
  };

  const handleUpdateWorkItem = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      work_items: prev.work_items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
      }),
    }));
  };

  const handleRemoveWorkItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      work_items: prev.work_items.filter(item => item.id !== id),
    }));
  };

  const handleAddProductToWorkItem = (workItemId: string, product: Product) => {
    setFormData(prev => ({
      ...prev,
      work_items: prev.work_items.map(item => {
        if (item.id === workItemId) {
          // Check if product already added
          const exists = item.products.find(p => p.product_id === product.id);
          if (exists) {
            return {
              ...item,
              products: item.products.map(p =>
                p.product_id === product.id
                  ? { ...p, quantity: p.quantity + 1 }
                  : p
              ),
            };
          }
          return {
            ...item,
            products: [
              ...item.products,
              {
                id: `prod-${Date.now()}`,
      product_id: product.id,
                product,
      quantity: 1,
              },
            ],
    };
      }
      return item;
      }),
    }));
    setShowProductModal(false);
    success('เพิ่มสินค้าแล้ว');
  };

  const handleUpdateProductQuantity = (workItemId: string, productId: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      work_items: prev.work_items.map(item => {
      if (item.id === workItemId) {
        return {
          ...item,
          products: item.products.map(p => 
              p.id === productId
                ? { ...p, quantity: Math.max(1, quantity) }
                : p
          ),
        };
      }
      return item;
      }),
    }));
  };

  const handleRemoveProduct = (workItemId: string, productId: string) => {
    setFormData(prev => ({
      ...prev,
      work_items: prev.work_items.map(item => {
      if (item.id === workItemId) {
          return {
            ...item,
            products: item.products.filter(p => p.id !== productId),
          };
      }
      return item;
      }),
    }));
  };

  const handleToggleAddon = (addonCode: string) => {
    const addon = getAddonTypeByCode(addonCode);
    if (!addon) return;

    setFormData(prev => {
      const exists = prev.addons.find(a => a.addon_code === addonCode);
      if (exists) {
        return {
          ...prev,
          addons: prev.addons.filter(a => a.addon_code !== addonCode),
        };
      }
      return {
        ...prev,
        addons: [
          ...prev.addons,
          {
            id: `addon-${Date.now()}`,
            addon_code: addonCode,
            addon_name: addon.name_th,
            quantity: 1,
            unit_price: addon.base_price,
          },
        ],
      };
    });
  };

  // Calculate pricing
  const calculateSubtotal = () => {
    const workItemsTotal = formData.work_items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
    
    const addonsTotal = formData.addons.reduce((sum, addon) => {
      return sum + (addon.quantity * addon.unit_price);
    }, 0);
    
    return workItemsTotal + addonsTotal;
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = formData.discount_amount || 0;
    return subtotal - discount;
  };

  const handleSubmit = async () => {
    try {
      // Calculate pricing
      const pricing = {
        subtotal: calculateSubtotal(),
        discount_percent: formData.discount_percent,
        discount_amount: formData.discount_amount,
        total_amount: calculateGrandTotal(),
        tax_amount: 0,
      };

      // Build order input
      const orderInput = {
        customer_id: formData.customer_id || undefined,
        order_type_code: formData.order_type_code,
        priority: parseInt(formData.priority_code) || 0,
        sales_channel: formData.sales_channel,
        due_date: formData.due_date || undefined,
        total_quantity: formData.work_items.reduce((sum, wi) => sum + wi.quantity, 0),
        pricing,
        shipping_address: formData.shipping_address ? {
          name: formData.shipping_name,
          phone: formData.shipping_phone,
          address: formData.shipping_address,
          district: formData.shipping_district,
          province: formData.shipping_province,
          postal_code: formData.shipping_postal_code,
        } : null,
        notes: formData.customer_note || undefined,
        internal_notes: formData.internal_note || undefined,
      };

      console.log('Creating order:', orderInput);
      
      const result = await createOrder(orderInput);
      
      if (result.success) {
        success('สร้างออเดอร์สำเร็จ!');
        router.push('/orders');
      } else {
        showError(result.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } catch (err: any) {
      console.error('Error creating order:', err);
      showError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  };

  // ---------------------------------------------
  // Render
  // ---------------------------------------------

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8ED] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
        <Link href="/orders">
                <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
                  ย้อนกลับ
          </Button>
        </Link>
        <div>
                <h1 className="text-xl font-bold text-[#1D1D1F]">สร้างออเดอร์ใหม่</h1>
                <p className="text-sm text-[#86868B]">ERP Workflow</p>
              </div>
        </div>
      </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-6">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isCompleted && setCurrentStep(step.id)}
                    disabled={!isCompleted}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#007AFF] text-white'
                        : isCompleted
                        ? 'bg-[#34C759]/10 text-[#34C759] hover:bg-[#34C759]/20'
                        : 'bg-[#F5F5F7] text-[#86868B]'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium hidden md:inline">{step.name}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 md:w-16 h-0.5 mx-2 ${
                      isCompleted ? 'bg-[#34C759]' : 'bg-[#E8E8ED]'
                    }`} />
                  )}
          </div>
              );
            })}
          </div>
        </div>
        </div>
        
      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Step 1: Order Type & Customer */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Order Type Selection - Production Mode */}
            <Card className="p-6 apple-card">
              <h2 className="text-lg font-semibold text-[#1D1D1F] mb-2">รูปแบบการผลิต</h2>
              <p className="text-sm text-[#86868B] mb-4">เลือกรูปแบบตามวัตถุประสงค์ของออเดอร์</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {orderTypes.map((type) => {
                  const isSelected = formData.order_type_code === type.code;
                  const IconComponent = type.icon === 'shirt' ? Package :
                                        type.icon === 'scissors' ? Palette :
                                        type.icon === 'palette' ? Palette :
                                        type.icon === 'printer' ? FileText : Package;
                  
                  return (
                    <button
                      key={type.code}
                      onClick={() => setFormData(prev => ({ ...prev, order_type_code: type.code }))}
                      className={`p-5 rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-[#007AFF] bg-[#007AFF]/5 ring-2 ring-[#007AFF]/20'
                          : 'border-[#E8E8ED] hover:border-[#007AFF]/50 hover:bg-[#F5F5F7]'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-[#007AFF] text-white' : 'bg-[#F5F5F7] text-[#86868B]'
                        }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-[#1D1D1F]">{type.name_th}</div>
                            {type.lead_days_min && type.lead_days_max && (
                              <div className="text-xs text-[#86868B] bg-[#F5F5F7] px-2 py-0.5 rounded-full">
                                ⏱️ {type.lead_days_min}-{type.lead_days_max} วัน
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-[#86868B] mt-0.5">{type.description}</div>
                        </div>
                      </div>
                      
                      {/* Features */}
                      {type.features && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {type.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                feature.available
                                  ? 'bg-[#34C759]/10 text-[#34C759]'
                                  : 'bg-[#E8E8ED] text-[#86868B] line-through'
                              }`}
                            >
                              {feature.available ? '✓' : '✗'} {feature.label}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Workflow Preview (shown when selected) */}
                      {isSelected && type.workflow_steps && (
                        <div className="mt-3 pt-3 border-t border-[#E8E8ED]">
                          <div className="text-xs text-[#86868B] mb-2">📋 ขั้นตอนการทำงาน:</div>
                          <div className="flex flex-wrap gap-1">
                            {type.workflow_steps.map((step, idx) => (
                              <span key={idx} className="text-xs text-[#1D1D1F] flex items-center gap-1">
                                {idx > 0 && <span className="text-[#86868B]">→</span>}
                                <span className="bg-[#F5F5F7] px-2 py-0.5 rounded">{step}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Selected Type Full Description */}
              {selectedOrderType?.description_full && (
                <div className="mt-4 p-4 bg-[#007AFF]/5 rounded-xl border border-[#007AFF]/20">
                  <div className="text-sm text-[#1D1D1F]">
                    <span className="font-medium">ℹ️ {selectedOrderType.name_th}:</span>{' '}
                    {selectedOrderType.description_full}
                  </div>
                </div>
              )}
            </Card>

            {/* Customer Selection */}
            <Card className="p-6 apple-card">
              <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">ลูกค้า</h2>
              {formData.customer ? (
                <div className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#007AFF]/10 rounded-xl flex items-center justify-center">
                      <User className="w-6 h-6 text-[#007AFF]" />
          </div>
        <div>
                      <div className="font-semibold text-[#1D1D1F]">{formData.customer.name}</div>
                      <div className="text-sm text-[#86868B]">
                        {formData.customer.phone} • {formData.customer.tier} member
        </div>
      </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowCustomerModal(true)}
                  >
                    เปลี่ยน
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="w-full p-6 border-2 border-dashed border-[#E8E8ED] rounded-2xl hover:border-[#007AFF] hover:bg-[#007AFF]/5 transition-all"
                >
                  <div className="flex flex-col items-center gap-2 text-[#86868B]">
                    <User className="w-8 h-8" />
                    <span className="font-medium">เลือกลูกค้า</span>
                  </div>
                </button>
              )}
            </Card>

            {/* Priority & Due Date */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 apple-card">
                <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">ความเร่งด่วน</h2>
                <div className="grid grid-cols-2 gap-2">
                  {priorityLevels.map((priority) => (
                    <button
                      key={priority.code}
                      onClick={() => setFormData(prev => ({ ...prev, priority_code: priority.code }))}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        formData.priority_code === priority.code
                          ? 'border-[#007AFF] bg-[#007AFF]/5'
                          : 'border-[#E8E8ED] hover:border-[#007AFF]/50'
                      }`}
                    >
          <div className="flex items-center gap-2">
                        {priority.code === 'normal' && <Clock className="w-4 h-4 text-[#86868B]" />}
                        {priority.code === 'rush' && <Zap className="w-4 h-4 text-[#FF9500]" />}
                        {priority.code === 'urgent' && <AlertTriangle className="w-4 h-4 text-[#FF3B30]" />}
                        {priority.code === 'emergency' && <Sparkles className="w-4 h-4 text-[#AF52DE]" />}
                        <span className="text-sm font-medium">{priority.name_th}</span>
          </div>
                      {priority.surcharge_percent > 0 && (
                        <div className="text-xs text-[#FF9500] mt-1">+{priority.surcharge_percent}%</div>
                      )}
                    </button>
                  ))}
        </div>
              </Card>
        
              <Card className="p-6 apple-card">
                <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">กำหนดส่ง</h2>
            <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="bg-[#F5F5F7] border-0"
                  min={new Date().toISOString().split('T')[0]}
                />
                {selectedPriority && (
                  <p className="text-xs text-[#86868B] mt-2">
                    ต้องการอย่างน้อย {selectedPriority.min_lead_days} วันทำการ
                  </p>
                )}

                <h3 className="text-sm font-semibold text-[#1D1D1F] mt-6 mb-2">ช่องทางขาย</h3>
                <Dropdown
                  value={formData.sales_channel}
                  onChange={(value) => setFormData(prev => ({ ...prev, sales_channel: value }))}
                  options={salesChannels.map(ch => ({
                    value: ch.code,
                    label: ch.name_th
                  }))}
                  placeholder="เลือกช่องทางขาย"
                />
              </Card>
          </div>
          </div>
        )}

        {/* Step 2: Products & Work Items with Dependencies */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Workflow Diagram (if has items) */}
            {workflowOrder.length > 0 && (
              <Card className="p-4 apple-card bg-gradient-to-r from-[#007AFF]/5 to-[#5856D6]/5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-[#007AFF]" />
                  <span className="text-sm font-medium text-[#1D1D1F]">ลำดับการผลิต</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {workflowOrder.map((step, index) => {
                    const wt = getWorkTypeByCode(step.code);
                    return (
                      <div key={step.code} className="flex items-center gap-2">
                        <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          step.parallel.length > 0
                            ? 'bg-[#5856D6]/10 text-[#5856D6] border border-[#5856D6]/20'
                            : 'bg-[#007AFF]/10 text-[#007AFF]'
                        }`}>
                          <span className="text-xs text-[#86868B] mr-1">{step.order}.</span>
                          {wt?.name_th || step.code}
                          {step.parallel.length > 0 && (
                            <span className="text-xs ml-1 opacity-70">
                              (พร้อม {step.parallel.map(p => getWorkTypeByCode(p)?.name_th).join(', ')})
                            </span>
                          )}
                        </div>
                        {index < workflowOrder.length - 1 && (
                          <ChevronRight className="w-4 h-4 text-[#86868B]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Required Work Types (if any) */}
            {requiredWorkTypes.length > 0 && (
              <Card className="p-4 apple-card border-[#FF9500]/20 bg-[#FF9500]/5">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-[#FF9500]" />
                  <span className="text-sm font-medium text-[#1D1D1F]">
                    งานบังคับสำหรับ "{selectedOrderType?.name_th}"
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {requiredWorkTypes.map(wt => {
                    const isAdded = currentWorkItemCodes.includes(wt.code);
                    return (
                      <span
                        key={wt.code}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                          isAdded
                            ? 'bg-[#34C759]/10 text-[#34C759]'
                            : 'bg-[#FF9500]/10 text-[#FF9500]'
                        }`}
                      >
                        {isAdded ? '✓' : '○'} {wt.name_th}
                      </span>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Add Work by Category */}
            <Card className="p-6 apple-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1D1D1F]">เพิ่มงาน</h2>
                  <p className="text-sm text-[#86868B]">เลือกงานที่ต้องการ (สามารถเลือกได้หลายงาน)</p>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="space-y-4">
                {workCategories.map(category => {
                  const categoryWorkTypes = availableWorkTypes.filter(
                    wt => wt.category_code === category.code
                  );
                  
                  if (categoryWorkTypes.length === 0) return null;

                  const CategoryIcon = 
                    category.code === 'printing' ? Printer :
                    category.code === 'embroidery' ? Palette :
                    category.code === 'garment' ? Scissors :
                    category.code === 'labeling' ? Tag :
                    category.code === 'packaging' ? Box : Package;

                  return (
                    <div key={category.code} className="border border-[#E8E8ED] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}15` }}
                        >
                          <CategoryIcon className="w-4 h-4" style={{ color: category.color }} />
                        </div>
                        <span className="font-medium text-[#1D1D1F]">{category.name_th}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {categoryWorkTypes.map(wt => {
                          const isAdded = currentWorkItemCodes.includes(wt.code);
                          const isRequired = requiredWorkTypes.some(r => r.code === wt.code);
                          const canAdd = canAddWorkType(wt.code, currentWorkItemCodes);
                          const missingDeps = getMissingDependencies(wt.code, currentWorkItemCodes);
                          const isSuggested = suggestedWorkTypes.some(s => s.code === wt.code);
                          
                          return (
                            <button
                              key={wt.code}
                              onClick={() => {
                                if (isAdded) {
                                  // Remove if not required
                                  if (!isRequired) {
                                    handleRemoveWorkItem(
                                      formData.work_items.find(wi => wi.work_type_code === wt.code)?.id || ''
                                    );
                                  }
                                } else if (canAdd) {
                                  // Add work item
                                  const newItem: WorkItemForm = {
                                    id: `wi-${Date.now()}`,
                                    work_type_code: wt.code,
                                    description: '',
                                    quantity: 1,
                                    unit_price: wt.base_price,
                                    position_code: wt.requires_design ? 'front_chest_center' : '',
                                    print_size_code: wt.requires_design ? 'a4' : '',
                                    products: [],
                                    is_required: isRequired,
                                  };
                                  setFormData(prev => ({
                                    ...prev,
                                    work_items: [...prev.work_items, newItem],
                                  }));
                                }
                              }}
                              disabled={isRequired && isAdded}
                              className={`relative px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                isAdded
                                  ? 'bg-[#007AFF] text-white'
                                  : canAdd
                                  ? 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#007AFF]/10'
                                  : 'bg-[#F5F5F7] text-[#86868B] opacity-50 cursor-not-allowed'
                              } ${isRequired ? 'ring-2 ring-[#FF9500]/50' : ''}`}
                              title={!canAdd ? `ต้องเพิ่ม ${missingDeps.map(d => getWorkTypeByCode(d)?.name_th).join(', ')} ก่อน` : ''}
                            >
                              {isAdded && <Check className="w-3 h-3 inline mr-1" />}
                              {wt.name_th}
                              {isRequired && <Lock className="w-3 h-3 inline ml-1 opacity-70" />}
                              {isSuggested && !isAdded && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#34C759] rounded-full" />
                              )}
                              {wt.in_house_capable && (
                                <span className="ml-1 text-xs opacity-70">🏠</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Selected Work Items */}
            <Card className="p-6 apple-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#1D1D1F]">
                  งานที่เลือก ({formData.work_items.length})
                </h2>
              </div>

              {formData.work_items.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-[#E8E8ED] rounded-2xl text-center">
                  <Package className="w-12 h-12 text-[#86868B] mx-auto mb-3" />
                  <p className="text-[#86868B]">ยังไม่มีรายการงาน</p>
                  <p className="text-xs text-[#86868B] mt-1">เลือกงานจากหมวดหมู่ด้านบน</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.work_items.map((item, index) => (
                    <WorkItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      workTypes={availableWorkTypes}
                      positions={positions}
                      sizes={sizes}
                      isRequired={item.is_required || false}
                      onUpdate={(field, value) => handleUpdateWorkItem(item.id, field, value)}
                      onRemove={() => handleRemoveWorkItem(item.id)}
                      onAddProduct={() => {
                        setSelectedWorkItemId(item.id);
                        setShowProductModal(true);
                      }}
                      onUpdateProductQuantity={(productId, qty) => 
                        handleUpdateProductQuantity(item.id, productId, qty)
                      }
                      onRemoveProduct={(productId) => handleRemoveProduct(item.id, productId)}
                      showProducts={selectedOrderType?.requires_products || false}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Step 3: Addons */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <Card className="p-6 apple-card">
              <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">เลือก Addons (บริการเสริม)</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {addonTypes.map((addon) => {
                  const isSelected = formData.addons.some(a => a.addon_code === addon.code);
                  return (
                    <button
                      key={addon.code}
                      onClick={() => handleToggleAddon(addon.code)}
                      className={`p-4 rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-[#007AFF] bg-[#007AFF]/5'
                          : 'border-[#E8E8ED] hover:border-[#007AFF]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-[#1D1D1F]">{addon.name_th}</span>
                        {isSelected && <Check className="w-5 h-5 text-[#007AFF]" />}
                      </div>
                      <div className="text-sm text-[#86868B]">
                        ฿{addon.base_price}/{addon.price_type === 'per_piece' ? 'ชิ้น' : 'ออเดอร์'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {formData.addons.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[#E8E8ED]">
                  <h3 className="font-medium text-[#1D1D1F] mb-3">Addons ที่เลือก</h3>
                  <div className="space-y-2">
                    {formData.addons.map((addon) => (
                      <div key={addon.id} className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-xl">
                        <span className="text-sm font-medium">{addon.addon_name}</span>
                        <div className="flex items-center gap-3">
            <Input
                            type="number"
                            value={addon.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              setFormData(prev => ({
                                ...prev,
                                addons: prev.addons.map(a =>
                                  a.id === addon.id ? { ...a, quantity: qty } : a
                                ),
                              }));
                            }}
                            className="w-20 text-center bg-white"
                            min={1}
                          />
                          <span className="text-sm text-[#86868B]">
                            ฿{(addon.quantity * addon.unit_price).toLocaleString()}
                          </span>
          </div>
        </div>
                    ))}
                  </div>
                </div>
              )}
      </Card>
        </div>
        )}

        {/* Step 4: Summary */}
        {currentStep === 4 && (
          <div className="space-y-6">
            {/* Shipping Info */}
            <Card className="p-6 apple-card">
              <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">ที่อยู่จัดส่ง</h2>
              <div className="grid md:grid-cols-2 gap-4">
          <div>
                  <label className="block text-sm font-medium text-[#86868B] mb-1.5">ชื่อผู้รับ</label>
            <Input
                    value={formData.shipping_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipping_name: e.target.value }))}
                    className="bg-[#F5F5F7] border-0"
                    placeholder="ชื่อ-นามสกุล"
            />
          </div>
          <div>
                  <label className="block text-sm font-medium text-[#86868B] mb-1.5">เบอร์โทร</label>
            <Input
                    value={formData.shipping_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipping_phone: e.target.value }))}
                    className="bg-[#F5F5F7] border-0"
                    placeholder="08X-XXX-XXXX"
            />
          </div>
          <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#86868B] mb-1.5">ที่อยู่</label>
            <Input
                    value={formData.shipping_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipping_address: e.target.value }))}
                    className="bg-[#F5F5F7] border-0"
                    placeholder="บ้านเลขที่ ซอย ถนน"
            />
          </div>
          <div>
                  <label className="block text-sm font-medium text-[#86868B] mb-1.5">เขต/อำเภอ</label>
            <Input
                    value={formData.shipping_district}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipping_district: e.target.value }))}
                    className="bg-[#F5F5F7] border-0"
            />
          </div>
          <div>
                  <label className="block text-sm font-medium text-[#86868B] mb-1.5">จังหวัด</label>
            <Input
                    value={formData.shipping_province}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipping_province: e.target.value }))}
                    className="bg-[#F5F5F7] border-0"
            />
          </div>
              </div>
            </Card>

            {/* Notes */}
            <Card className="p-6 apple-card">
              <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">หมายเหตุ</h2>
              <div className="space-y-4">
          <div>
                  <label className="block text-sm font-medium text-[#86868B] mb-1.5">หมายเหตุลูกค้า</label>
                  <textarea
                    value={formData.customer_note}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_note: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#F5F5F7] border-0 rounded-xl text-sm resize-none"
                    rows={3}
                    placeholder="ข้อความจากลูกค้า..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#86868B] mb-1.5">หมายเหตุภายใน</label>
                  <textarea
                    value={formData.internal_note}
                    onChange={(e) => setFormData(prev => ({ ...prev, internal_note: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#F5F5F7] border-0 rounded-xl text-sm resize-none"
                    rows={3}
                    placeholder="บันทึกภายในสำหรับทีม..."
            />
          </div>
        </div>
      </Card>

            {/* Order Summary */}
            <Card className="p-6 apple-card">
              <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">สรุปออเดอร์</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#86868B]">งานพิมพ์/สกรีน ({formData.work_items.length} รายการ)</span>
                  <span>฿{calculations.workItemsTotal.toLocaleString()}</span>
          </div>
                {calculations.addonsTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868B]">Addons ({formData.addons.length} รายการ)</span>
                    <span>฿{calculations.addonsTotal.toLocaleString()}</span>
        </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#86868B]">รวมก่อนหักส่วนลด</span>
                  <span>฿{calculations.subtotal.toLocaleString()}</span>
                </div>
                {calculations.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-[#34C759]">
                    <span>ส่วนลด</span>
                    <span>-฿{calculations.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {calculations.surchargeAmount > 0 && (
                  <div className="flex justify-between text-sm text-[#FF9500]">
                    <span>ค่าเร่งด่วน (+{calculations.surchargePercent}%)</span>
                    <span>+฿{calculations.surchargeAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-[#E8E8ED]">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-[#1D1D1F]">รวมทั้งสิ้น</span>
                    <span className="text-lg font-bold text-[#007AFF]">
                      ฿{calculations.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E8E8ED]">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            ย้อนกลับ
            </Button>
          
          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="gap-2 bg-[#007AFF] hover:bg-[#0066DB]"
            >
              ถัดไป
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
                  <Button 
              onClick={handleSubmit}
              disabled={!canProceed}
              className="gap-2 bg-[#34C759] hover:bg-[#2DB84D]"
            >
              <Check className="w-4 h-4" />
              สร้างออเดอร์
                  </Button>
          )}
        </div>
                </div>

      {/* Customer Selection Modal */}
      <CustomerSelectionModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelect={handleSelectCustomer}
      />

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelect={(product) => {
          if (selectedWorkItemId) {
            handleAddProductToWorkItem(selectedWorkItemId, product);
          }
        }}
      />

    </div>
  );
}

// ---------------------------------------------
// Sub-components
// ---------------------------------------------

interface WorkItemCardProps {
  item: WorkItemForm;
  index: number;
  workTypes: WorkType[];
  positions: any[];
  sizes: any[];
  isRequired?: boolean;
  showProducts?: boolean;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  onAddProduct: () => void;
  onUpdateProductQuantity: (productId: string, qty: number) => void;
  onRemoveProduct: (productId: string) => void;
}

function WorkItemCard({
  item,
  index,
  workTypes,
  positions,
  sizes,
  isRequired = false,
  showProducts = true,
  onUpdate,
  onRemove,
  onAddProduct,
  onUpdateProductQuantity,
  onRemoveProduct,
}: WorkItemCardProps) {
  const workType = workTypes.find(wt => wt.code === item.work_type_code);
  const requiresDesign = workType?.requires_design || false;
  const requiresMaterial = workType?.requires_material || false;
  
  return (
    <div className={`p-4 rounded-2xl ${
      isRequired ? 'bg-[#FF9500]/5 border border-[#FF9500]/20' : 'bg-[#F5F5F7]'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[#1D1D1F]">
            {workType?.name_th || `งานที่ ${index + 1}`}
          </h3>
          {isRequired && (
            <span className="px-2 py-0.5 text-xs bg-[#FF9500]/20 text-[#FF9500] rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" /> บังคับ
            </span>
          )}
          {workType?.in_house_capable && (
            <span className="px-2 py-0.5 text-xs bg-[#34C759]/20 text-[#34C759] rounded-full">
              🏠 ทำเองได้
            </span>
          )}
          {workType?.can_outsource && !workType?.in_house_capable && (
            <span className="px-2 py-0.5 text-xs bg-[#5856D6]/20 text-[#5856D6] rounded-full">
              📤 Outsource
            </span>
          )}
        </div>
        {!isRequired && (
          <button onClick={onRemove} className="p-2 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Design requirement section */}
      {requiresDesign && (
        <div className="mb-4 p-3 bg-white rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1D1D1F]">🎨 การออกแบบ</span>
          </div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => onUpdate('design_ready', true)}
              className={`flex-1 p-2 rounded-lg text-sm ${
                item.design_ready === true
                  ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/30'
                  : 'bg-[#F5F5F7] text-[#86868B]'
              }`}
            >
              ลูกค้าส่งไฟล์พร้อมผลิต
            </button>
            <button
              onClick={() => onUpdate('design_ready', false)}
              className={`flex-1 p-2 rounded-lg text-sm ${
                item.design_ready === false
                  ? 'bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/30'
                  : 'bg-[#F5F5F7] text-[#86868B]'
              }`}
            >
              ต้องออกแบบก่อน
            </button>
          </div>
          <Input
            placeholder="หมายเหตุการออกแบบ (เช่น โลโก้ตามไฟล์, สีตามเสื้อ)"
            value={item.design_note || ''}
            onChange={(e) => onUpdate('design_note', e.target.value)}
            className="bg-[#F5F5F7] border-0 text-sm"
          />
        </div>
      )}

      <div className={`grid gap-3 mb-4 ${requiresDesign ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {/* Position (only for design work) */}
        {requiresDesign && (
          <div>
            <label className="block text-xs font-medium text-[#86868B] mb-1">ตำแหน่ง</label>
            <Dropdown
              value={item.position_code || ''}
              onChange={(value) => onUpdate('position_code', value)}
              options={[
                { value: '', label: '-- เลือกตำแหน่ง --' },
                ...positions.map(pos => ({
                  value: pos.code,
                  label: pos.name_th || pos.name
                }))
              ]}
              placeholder="เลือกตำแหน่ง"
              size="sm"
            />
          </div>
        )}
        {/* Size (only for design work) */}
        {requiresDesign && (
          <div>
            <label className="block text-xs font-medium text-[#86868B] mb-1">ขนาด</label>
            <Dropdown
              value={item.print_size_code || ''}
              onChange={(value) => onUpdate('print_size_code', value)}
              options={[
                { value: '', label: '-- เลือกขนาด --' },
                ...sizes.map(size => ({
                  value: size.code,
                  label: size.name_th || size.name
                }))
              ]}
              placeholder="เลือกขนาด"
              size="sm"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-[#86868B] mb-1">ราคา/ชิ้น</label>
          <Input
            type="number"
            value={item.unit_price}
            onChange={(e) => onUpdate('unit_price', parseFloat(e.target.value) || 0)}
            className="bg-white border-0"
            min={0}
          />
        </div>
      </div>

      {/* Products in this work item (only if showProducts) */}
      {showProducts && (
        <div className="mt-4 pt-4 border-t border-[#E8E8ED]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#86868B]">สินค้าที่ใช้งาน</span>
            <Button size="sm" variant="secondary" onClick={onAddProduct} className="gap-1">
              <Plus className="w-3 h-3" />
              เพิ่มสินค้า
            </Button>
          </div>
          
          {item.products.length === 0 ? (
            <p className="text-sm text-[#86868B] italic">ยังไม่ได้เลือกสินค้า</p>
          ) : (
            <div className="space-y-2">
              {item.products.map(prod => (
                <div key={prod.id} className="flex items-center justify-between p-3 bg-white rounded-xl">
                  <div>
                    <div className="text-sm font-medium">{prod.product.model}</div>
                    <div className="text-xs text-[#86868B]">
                      {prod.product.color_th} / {prod.product.size} • ฿{prod.product.price}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={prod.quantity}
                      onChange={(e) => onUpdateProductQuantity(prod.id, parseInt(e.target.value) || 1)}
                      className="w-16 text-center bg-[#F5F5F7] border-0"
                      min={1}
                    />
                    <button
                      onClick={() => onRemoveProduct(prod.id)}
                      className="p-1.5 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Customer Selection Modal
function CustomerSelectionModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}) {
  const [search, setSearch] = useState('');
  const { customers, loading } = useERPCustomers({ search });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="เลือกลูกค้า" size="lg">
      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
              <Input
            placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#F5F5F7] border-0"
              />
            </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => onSelect(customer)}
              className="w-full p-4 bg-[#F5F5F7] hover:bg-[#007AFF]/10 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center justify-between">
            <div>
                  <div className="font-semibold text-[#1D1D1F]">{customer.name}</div>
                  <div className="text-sm text-[#86868B]">
                    {customer.phone} {customer.email && `• ${customer.email}`}
            </div>
            </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  customer.tier === 'platinum' ? 'bg-[#5856D6]/10 text-[#5856D6]' :
                  customer.tier === 'gold' ? 'bg-[#FF9500]/10 text-[#FF9500]' :
                  customer.tier === 'silver' ? 'bg-[#8E8E93]/10 text-[#8E8E93]' :
                  'bg-[#D1D1D6]/10 text-[#8E8E93]'
                }`}>
                  {customer.tier}
                </span>
            </div>
            </button>
          ))}
          </div>
          </div>
    </Modal>
  );
}

// Product Selection Modal
function ProductSelectionModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}) {
  const [search, setSearch] = useState('');
  const { products, loading, filterOptions } = useERPProducts({ search, inStock: true });
  const [selectedModel, setSelectedModel] = useState('');

  const filteredProducts = selectedModel
    ? products.filter(p => p.model === selectedModel)
    : products;

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="เลือกสินค้า" size="lg">
        <div className="p-4">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <Input
              placeholder="ค้นหา SKU, ชื่อสินค้า..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#F5F5F7] border-0"
            />
          </div>
          <Dropdown
            value={selectedModel}
            onChange={(value) => setSelectedModel(value)}
            options={[
              { value: '', label: 'ทุกรุ่น' },
              ...filterOptions.models.map(model => ({
                value: model,
                label: model
              }))
            ]}
            placeholder="ทุกรุ่น"
            size="sm"
            className="w-48"
          />
          </div>

        <div className="max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {filteredProducts.map((product) => (
                <button
                  key={product.id}
                onClick={() => onSelect(product)}
                className="p-3 bg-[#F5F5F7] hover:bg-[#007AFF]/10 rounded-xl text-left transition-colors"
              >
                <div className="text-sm font-medium text-[#1D1D1F]">{product.model}</div>
                <div className="text-xs text-[#86868B]">
                  {product.color_th} / {product.size}
                  </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold text-[#007AFF]">฿{product.price}</span>
                  <span className={`text-xs ${product.available_qty > 10 ? 'text-[#34C759]' : 'text-[#FF9500]'}`}>
                    คงเหลือ {product.available_qty}
                  </span>
                  </div>
                </button>
            ))}
          </div>
        </div>
    </div>
    </Modal>
  );
}

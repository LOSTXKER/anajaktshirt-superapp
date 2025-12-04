'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Button, Card, Input, Modal, useToast } from '@/modules/shared/ui';
import {
  useERPCustomers,
  useERPProducts,
  useERPWorkTypes,
  useERPAddonTypes,
  useERPPrintConfig,
  useERPOrderConfig,
} from '@/modules/erp';
import type { Customer, Product, OrderType, PriorityLevel } from '@/modules/erp';

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
  const { workTypes, getWorkTypeByCode } = useERPWorkTypes();
  const { addonTypes, getAddonTypeByCode } = useERPAddonTypes();
  const { positions, sizes, getPositionByCode, getSizeByCode } = useERPPrintConfig();

  // Selected order type
  const selectedOrderType = orderTypes.find(ot => ot.code === formData.order_type_code);
  const selectedPriority = priorityLevels.find(p => p.code === formData.priority_code);

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

  const handleSubmit = async () => {
    try {
      // TODO: Call createOrder service
      console.log('Creating order:', formData);
      success('สร้างออเดอร์สำเร็จ!');
      router.push('/orders');
    } catch (err) {
      showError('เกิดข้อผิดพลาด กรุณาลองใหม่');
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
            {/* Order Type Selection */}
            <Card className="p-6 apple-card">
              <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">ประเภทงาน</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {orderTypes.map((type) => (
                  <button
                    key={type.code}
                    onClick={() => setFormData(prev => ({ ...prev, order_type_code: type.code }))}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      formData.order_type_code === type.code
                        ? 'border-[#007AFF] bg-[#007AFF]/5'
                        : 'border-[#E8E8ED] hover:border-[#007AFF]/50'
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#1D1D1F]">{type.name_th}</div>
                    <div className="text-xs text-[#86868B] mt-1">{type.description}</div>
                  </button>
                ))}
              </div>
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
                <select
                  value={formData.sales_channel}
                  onChange={(e) => setFormData(prev => ({ ...prev, sales_channel: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#F5F5F7] border-0 rounded-xl text-sm"
                >
                  {salesChannels.map((ch) => (
                    <option key={ch.code} value={ch.code}>{ch.name_th}</option>
                  ))}
                </select>
              </Card>
          </div>
          </div>
        )}

        {/* Step 2: Products & Work Items */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card className="p-6 apple-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#1D1D1F]">งานพิมพ์/สกรีน</h2>
                <Button onClick={handleAddWorkItem} className="gap-2">
                  <Plus className="w-4 h-4" />
                  เพิ่มงาน
                </Button>
              </div>

              {formData.work_items.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-[#E8E8ED] rounded-2xl text-center">
                  <Package className="w-12 h-12 text-[#86868B] mx-auto mb-3" />
                  <p className="text-[#86868B]">ยังไม่มีรายการงาน</p>
                  <Button onClick={handleAddWorkItem} variant="secondary" className="mt-4">
                    เพิ่มงานพิมพ์/สกรีน
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.work_items.map((item, index) => (
                    <WorkItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      workTypes={workTypes}
                      positions={positions}
                      sizes={sizes}
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

      {/* Dev Mode Indicator */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-lg">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          Mock Data Mode
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------
// Sub-components
// ---------------------------------------------

interface WorkItemCardProps {
  item: WorkItemForm;
  index: number;
  workTypes: any[];
  positions: any[];
  sizes: any[];
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
  onUpdate,
  onRemove,
  onAddProduct,
  onUpdateProductQuantity,
  onRemoveProduct,
}: WorkItemCardProps) {
  const workType = workTypes.find(wt => wt.code === item.work_type_code);
  
  return (
    <div className="p-4 bg-[#F5F5F7] rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#1D1D1F]">งานที่ {index + 1}</h3>
        <button onClick={onRemove} className="p-2 text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-3 mb-4">
                  <div>
          <label className="block text-xs font-medium text-[#86868B] mb-1">ประเภทงาน</label>
                    <select
                      value={item.work_type_code}
            onChange={(e) => onUpdate('work_type_code', e.target.value)}
            className="w-full px-3 py-2 bg-white border-0 rounded-xl text-sm"
                    >
            {workTypes.map(wt => (
                        <option key={wt.code} value={wt.code}>{wt.name_th}</option>
                      ))}
                    </select>
                  </div>
                  <div>
          <label className="block text-xs font-medium text-[#86868B] mb-1">ตำแหน่ง</label>
                    <select
                      value={item.position_code}
            onChange={(e) => onUpdate('position_code', e.target.value)}
            className="w-full px-3 py-2 bg-white border-0 rounded-xl text-sm"
                    >
            {positions.map(pos => (
                        <option key={pos.code} value={pos.code}>{pos.name_th}</option>
                      ))}
                    </select>
                  </div>
                  <div>
          <label className="block text-xs font-medium text-[#86868B] mb-1">ขนาด</label>
                    <select
                      value={item.print_size_code}
            onChange={(e) => onUpdate('print_size_code', e.target.value)}
            className="w-full px-3 py-2 bg-white border-0 rounded-xl text-sm"
                    >
            {sizes.map(size => (
              <option key={size.code} value={size.code}>{size.name_th}</option>
                      ))}
                    </select>
                  </div>
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

      {/* Products in this work item */}
      <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#86868B]">สินค้า</span>
          <Button size="sm" variant="secondary" onClick={onAddProduct} className="gap-1">
            <Plus className="w-3 h-3" />
            เพิ่ม
                    </Button>
                  </div>
                  
                  {item.products.length === 0 ? (
          <p className="text-sm text-[#86868B] italic">ยังไม่มีสินค้า</p>
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
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-4 py-2 bg-[#F5F5F7] border-0 rounded-xl text-sm"
          >
            <option value="">ทุกรุ่น</option>
            {filterOptions.models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
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

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  User,
  MapPin,
  Package,
  Plus,
  Trash2,
  Save,
  Calendar,
  DollarSign,
  FileText,
  Search,
  X,
  Check,
  Printer,
  Scissors,
  ShoppingBag,
  Clock,
  Info,
  Palette,
  Layers,
  Gift,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Button, Card, Input, Modal, useToast, QuantityInput, PriceInput, Dropdown } from '@/modules/shared/ui';
import { useOrderMutations } from '@/modules/orders/hooks/useOrderMutations';
import { useCustomers } from '@/modules/crm/hooks/useCustomers';
import { useProducts } from '@/modules/stock/hooks/useProducts';
import {
  ORDER_TYPES,
  PRINT_METHODS,
  PRINT_POSITIONS,
  PRINT_SIZES,
  SHIRT_MODELS,
  FABRIC_TYPES,
  SHIRT_SIZES,
  SHIRT_COLORS,
  ADDONS,
  calculatePrintPrice,
  estimateProductionTime,
} from '@/modules/orders/config/orderConfig';

// Types
interface CustomerInfo {
  id?: string;
  name: string;
  phone: string;
  email: string;
  line_id: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postal_code: string;
}

interface ShirtSelection {
  id: string;
  source: 'stock' | 'custom' | 'customer';
  product_id?: string;
  product_name?: string;
  product_sku?: string;
  model?: string;
  fabric?: string;
  color?: string;
  sizes: { size: string; quantity: number }[];
  unit_price: number;
}

interface PrintWork {
  id: string;
  method: string;
  position: string;
  size: string;
  colors?: number;
  design_file?: string;
  design_note?: string;
  unit_price: number;
  setup_cost: number;
}

interface AddonSelection {
  id: string;
  addon_id: string;
  quantity: number;
  unit_price: number;
}

interface OrderSummary {
  subtotal_shirts: number;
  subtotal_prints: number;
  subtotal_addons: number;
  setup_costs: number;
  discount: number;
  shipping_cost: number;
  total: number;
}

// Wizard Steps
const STEPS = [
  { id: 'type', label: 'ประเภทออเดอร์', icon: Package },
  { id: 'customer', label: 'ข้อมูลลูกค้า', icon: User },
  { id: 'shirts', label: 'เลือกเสื้อ', icon: ShoppingBag },
  { id: 'print', label: 'งานพิมพ์', icon: Printer },
  { id: 'addons', label: 'บริการเสริม', icon: Gift },
  { id: 'summary', label: 'สรุปออเดอร์', icon: FileText },
];

export default function CreateOrderPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { createOrder, creating } = useOrderMutations();
  const { customers } = useCustomers();
  const { products } = useProducts();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [orderType, setOrderType] = useState<string>('');
  
  // Customer
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '', phone: '', email: '', line_id: '',
    address: '', subdistrict: '', district: '', province: '', postal_code: '',
  });
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Shirts
  const [shirts, setShirts] = useState<ShirtSelection[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Print Works
  const [printWorks, setPrintWorks] = useState<PrintWork[]>([]);

  // Add-ons
  const [addons, setAddons] = useState<AddonSelection[]>([]);

  // Order Info
  const [orderInfo, setOrderInfo] = useState({
    due_date: '',
    sales_channel: '',
    payment_terms: 'full',
    notes: '',
    discount: 0,
    shipping_cost: 0,
    requires_tax_invoice: false,
  });

  // Get order type config
  const selectedOrderType = useMemo(() => 
    ORDER_TYPES.find(t => t.id === orderType), 
    [orderType]
  );

  // Get total quantity
  const totalQuantity = useMemo(() => 
    shirts.reduce((sum, s) => sum + s.sizes.reduce((sq, sz) => sq + sz.quantity, 0), 0),
    [shirts]
  );

  // Calculate summary
  const summary = useMemo((): OrderSummary => {
    const subtotal_shirts = shirts.reduce((sum, s) => {
      const qty = s.sizes.reduce((sq, sz) => sq + sz.quantity, 0);
      return sum + (s.unit_price * qty);
    }, 0);

    let subtotal_prints = 0;
    let setup_costs = 0;
    printWorks.forEach(pw => {
      const qty = totalQuantity;
      subtotal_prints += pw.unit_price * qty;
      setup_costs += pw.setup_cost;
    });

    const subtotal_addons = addons.reduce((sum, a) => {
      const addon = ADDONS.find(ad => ad.id === a.addon_id);
      return sum + ((addon?.price || 0) * a.quantity);
    }, 0);

    const subtotal = subtotal_shirts + subtotal_prints + subtotal_addons + setup_costs;
    const total = subtotal - orderInfo.discount + orderInfo.shipping_cost;

    return {
      subtotal_shirts,
      subtotal_prints,
      subtotal_addons,
      setup_costs,
      discount: orderInfo.discount,
      shipping_cost: orderInfo.shipping_cost,
      total,
    };
  }, [shirts, printWorks, addons, totalQuantity, orderInfo.discount, orderInfo.shipping_cost]);

  // Estimated production time
  const estimatedTime = useMemo(() => {
    if (!orderType) return { days: 0, hours: 0 };
    const methods = printWorks.map(pw => pw.method);
    return estimateProductionTime(orderType, totalQuantity, methods);
  }, [orderType, totalQuantity, printWorks]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 10);
    const search = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.name?.toLowerCase().includes(search) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [customers, customerSearch]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 20);
    const search = productSearch.toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.sku?.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [products, productSearch]);

  // Navigation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return !!orderType;
      case 1: return !!customerInfo.name && !!customerInfo.phone;
      case 2: 
        if (orderType === 'print_only') return true;
        return shirts.length > 0 && shirts.every(s => s.sizes.some(sz => sz.quantity > 0));
      case 3:
        if (!selectedOrderType?.requires_design) return true;
        return printWorks.length > 0;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  }, [currentStep, orderType, customerInfo, shirts, printWorks, selectedOrderType]);

  const nextStep = () => {
    if (canProceed && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Select customer
  const selectCustomer = (customer: any) => {
    setCustomerInfo({
      id: customer.id,
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      line_id: customer.line_id || '',
      address: customer.address || '',
      subdistrict: customer.subdistrict || '',
      district: customer.district || '',
      province: customer.province || '',
      postal_code: customer.postal_code || '',
    });
    setShowCustomerSearch(false);
    setCustomerSearch('');
  };

  // Add shirt from stock
  const addShirtFromStock = (product: any) => {
    setShirts([...shirts, {
      id: `shirt-${Date.now()}`,
      source: 'stock',
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      sizes: SHIRT_SIZES.map(sz => ({ size: sz.id, quantity: 0 })),
      unit_price: product.selling_price || 0,
    }]);
    setShowProductModal(false);
    setProductSearch('');
  };

  // Add custom shirt
  const addCustomShirt = () => {
    setShirts([...shirts, {
      id: `shirt-${Date.now()}`,
      source: 'custom',
      model: 'round_neck',
      fabric: 'cotton100',
      color: 'white',
      sizes: SHIRT_SIZES.map(sz => ({ size: sz.id, quantity: 0 })),
      unit_price: 150,
    }]);
  };

  // Remove shirt
  const removeShirt = (id: string) => {
    setShirts(shirts.filter(s => s.id !== id));
  };

  // Update shirt
  const updateShirt = (id: string, field: string, value: any) => {
    setShirts(shirts.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Update shirt size quantity
  const updateShirtSize = (shirtId: string, size: string, quantity: number) => {
    setShirts(shirts.map(s => {
      if (s.id !== shirtId) return s;
      return {
        ...s,
        sizes: s.sizes.map(sz => sz.size === size ? { ...sz, quantity } : sz),
      };
    }));
  };

  // Add print work
  const addPrintWork = () => {
    const newPrint: PrintWork = {
      id: `print-${Date.now()}`,
      method: 'dtg',
      position: 'front_center',
      size: 'm',
      colors: 1,
      design_note: '',
      unit_price: 50,
      setup_cost: 0,
    };
    
    const { unitPrice, setupCost } = calculatePrintPrice(
      newPrint.method, newPrint.size, totalQuantity, newPrint.colors
    );
    newPrint.unit_price = unitPrice;
    newPrint.setup_cost = setupCost;
    
    setPrintWorks([...printWorks, newPrint]);
  };

  // Remove print work
  const removePrintWork = (id: string) => {
    setPrintWorks(printWorks.filter(p => p.id !== id));
  };

  // Update print work
  const updatePrintWork = (id: string, field: string, value: any) => {
    setPrintWorks(printWorks.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      
      // Recalculate price
      const { unitPrice, setupCost } = calculatePrintPrice(
        updated.method, updated.size, totalQuantity, updated.colors
      );
      updated.unit_price = unitPrice;
      updated.setup_cost = setupCost;
      
      return updated;
    }));
  };

  // Toggle addon
  const toggleAddon = (addonId: string) => {
    const existing = addons.find(a => a.addon_id === addonId);
    if (existing) {
      setAddons(addons.filter(a => a.addon_id !== addonId));
    } else {
      const addon = ADDONS.find(a => a.id === addonId);
      setAddons([...addons, {
        id: `addon-${Date.now()}`,
        addon_id: addonId,
        quantity: totalQuantity || 1,
        unit_price: addon?.price || 0,
      }]);
    }
  };

  // Update addon quantity
  const updateAddonQuantity = (addonId: string, quantity: number) => {
    setAddons(addons.map(a => 
      a.addon_id === addonId ? { ...a, quantity } : a
    ));
  };

  // Submit order
  const handleSubmit = async () => {
    try {
      // Build work items from shirts + print works
      const workItems = [];
      
      // Add shirt items
      for (const shirt of shirts) {
        for (const sz of shirt.sizes) {
          if (sz.quantity > 0) {
            workItems.push({
              work_type_code: orderType === 'custom_cut' ? 'custom_cut' : 'ready_made',
              work_type_name: orderType === 'custom_cut' ? 'สั่งตัด' : 'เสื้อสต็อก',
              position_code: 'full',
              position_name: 'เต็มตัว',
              print_size_code: sz.size,
              print_size_name: SHIRT_SIZES.find(s => s.id === sz.size)?.name || sz.size,
              quantity: sz.quantity,
              unit_price: shirt.unit_price,
              description: shirt.product_name || `${SHIRT_MODELS.find(m => m.id === shirt.model)?.name} ${FABRIC_TYPES.find(f => f.id === shirt.fabric)?.name} ${SHIRT_COLORS.find(c => c.id === shirt.color)?.name}`,
              products: shirt.product_id ? [{
                product_id: shirt.product_id,
                quantity: sz.quantity,
                unit_price: shirt.unit_price,
              }] : [],
            });
          }
        }
      }

      // Add print work items
      for (const pw of printWorks) {
        const method = PRINT_METHODS.find(m => m.id === pw.method);
        const position = PRINT_POSITIONS.find(p => p.id === pw.position);
        const size = PRINT_SIZES.find(s => s.id === pw.size);
        
        workItems.push({
          work_type_code: pw.method,
          work_type_name: method?.name || pw.method,
          position_code: pw.position,
          position_name: position?.name || pw.position,
          print_size_code: pw.size,
          print_size_name: size?.name || pw.size,
          quantity: totalQuantity,
          unit_price: pw.unit_price,
          description: `${method?.name} ${position?.name} ${size?.name}${pw.design_note ? ` - ${pw.design_note}` : ''}`,
          products: [],
        });
      }

      // Build order data
      const orderData = {
        customer_id: customerInfo.id,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email,
        customer_line_id: customerInfo.line_id,
        shipping_address: customerInfo.address,
        shipping_subdistrict: customerInfo.subdistrict,
        shipping_district: customerInfo.district,
        shipping_province: customerInfo.province,
        shipping_postal_code: customerInfo.postal_code,
        due_date: orderInfo.due_date || null,
        sales_channel: orderInfo.sales_channel,
        payment_terms: orderInfo.payment_terms,
        notes: orderInfo.notes,
        discount_amount: orderInfo.discount,
        shipping_cost: orderInfo.shipping_cost,
        requires_tax_invoice: orderInfo.requires_tax_invoice,
        subtotal: summary.subtotal_shirts + summary.subtotal_prints + summary.subtotal_addons + summary.setup_costs,
        total_amount: summary.total,
        work_items: workItems,
        metadata: {
          order_type: orderType,
          addons: addons.map(a => ({
            addon_id: a.addon_id,
            quantity: a.quantity,
            unit_price: a.unit_price,
          })),
          estimated_days: estimatedTime.days,
        },
      };

      const result = await createOrder(orderData);
      
      if (result) {
        showSuccess('สร้างออเดอร์สำเร็จ!');
        router.push(`/orders/${result.id}`);
      }
    } catch (error) {
      showError('เกิดข้อผิดพลาด: ' + (error as Error).message);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderTypeSelection();
      case 1:
        return renderCustomerInfo();
      case 2:
        return renderShirtSelection();
      case 3:
        return renderPrintWork();
      case 4:
        return renderAddons();
      case 5:
        return renderSummary();
      default:
        return null;
    }
  };

  // Step 1: Type Selection
  const renderTypeSelection = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1D1D1F] mb-6">เลือกประเภทออเดอร์</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ORDER_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setOrderType(type.id)}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              orderType === type.id
                ? 'border-[#007AFF] bg-[#007AFF]/5'
                : 'border-[#E8E8ED] bg-white hover:border-[#007AFF]/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">{type.icon}</span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#1D1D1F]">{type.name}</h3>
                <p className="text-sm text-[#86868B] mt-1">{type.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {type.features.map((feat, i) => (
                    <span key={i} className="px-2 py-1 bg-[#F5F5F7] rounded text-xs text-[#1D1D1F]">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
              {orderType === type.id && (
                <Check className="w-6 h-6 text-[#007AFF]" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 2: Customer Info
  const renderCustomerInfo = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1D1D1F]">ข้อมูลลูกค้า</h2>
        <Button
          variant="secondary"
          onClick={() => setShowCustomerSearch(true)}
        >
          <Search className="w-4 h-4 mr-2" />
          ค้นหาลูกค้าเดิม
        </Button>
      </div>

      {/* Basic Info */}
      <Card className="p-4 bg-white border-[#E8E8ED]">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-[#007AFF]" />
          <h3 className="font-semibold text-[#1D1D1F]">ข้อมูลติดต่อ</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#86868B] mb-1">ชื่อ-สกุล / บริษัท *</label>
            <Input
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              placeholder="ชื่อลูกค้า"
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">เบอร์โทร *</label>
            <Input
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              placeholder="08X-XXX-XXXX"
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">Email</label>
            <Input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              placeholder="email@example.com"
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">Line ID</label>
            <Input
              value={customerInfo.line_id}
              onChange={(e) => setCustomerInfo({ ...customerInfo, line_id: e.target.value })}
              placeholder="Line ID"
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
        </div>
      </Card>

      {/* Address */}
      <Card className="p-4 bg-white border-[#E8E8ED]">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-[#34C759]" />
          <h3 className="font-semibold text-[#1D1D1F]">ที่อยู่จัดส่ง</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#86868B] mb-1">ที่อยู่</label>
            <Input
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
              placeholder="บ้านเลขที่ ถนน ซอย"
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#86868B] mb-1">แขวง/ตำบล</label>
              <Input
                value={customerInfo.subdistrict}
                onChange={(e) => setCustomerInfo({ ...customerInfo, subdistrict: e.target.value })}
                className="bg-[#F5F5F7] border-[#E8E8ED]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#86868B] mb-1">เขต/อำเภอ, จังหวัด</label>
              <Input
                value={customerInfo.district}
                onChange={(e) => setCustomerInfo({ ...customerInfo, district: e.target.value })}
                className="bg-[#F5F5F7] border-[#E8E8ED]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#86868B] mb-1">จังหวัด</label>
              <Input
                value={customerInfo.province}
                onChange={(e) => setCustomerInfo({ ...customerInfo, province: e.target.value })}
                className="bg-[#F5F5F7] border-[#E8E8ED]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#86868B] mb-1">รหัสไปรษณีย์</label>
              <Input
                value={customerInfo.postal_code}
                onChange={(e) => setCustomerInfo({ ...customerInfo, postal_code: e.target.value })}
                className="bg-[#F5F5F7] border-[#E8E8ED]"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Customer Search Modal */}
      <Modal
        isOpen={showCustomerSearch}
        onClose={() => setShowCustomerSearch(false)}
        title="ค้นหาลูกค้าเดิม"
      >
        <div className="space-y-4">
          <Input
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, หรือ Email"
            className="bg-[#F5F5F7] border-[#E8E8ED]"
          />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredCustomers.map(customer => (
              <button
                key={customer.id}
                onClick={() => selectCustomer(customer)}
                className="w-full p-3 text-left bg-[#F5F5F7] hover:bg-[#E8E8ED] rounded-lg transition-colors"
              >
                <div className="font-medium text-[#1D1D1F]">{customer.name}</div>
                <div className="text-sm text-[#86868B]">
                  {customer.phone} {customer.email && `• ${customer.email}`}
                </div>
              </button>
            ))}
            {filteredCustomers.length === 0 && (
              <p className="text-center text-[#86868B] py-4">ไม่พบลูกค้า</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );

  // Step 3: Shirt Selection
  const renderShirtSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1D1D1F]">เลือกเสื้อ</h2>
        <div className="flex gap-2">
          {selectedOrderType?.requires_stock && (
            <Button onClick={() => setShowProductModal(true)}>
              <Search className="w-4 h-4 mr-2" />
              เลือกจากสต็อก
            </Button>
          )}
          {orderType === 'custom_cut' && (
            <Button variant="secondary" onClick={addCustomShirt}>
              <Plus className="w-4 h-4 mr-2" />
              สร้างเสื้อใหม่
            </Button>
          )}
        </div>
      </div>

      {orderType === 'print_only' && (
        <Card className="p-6 bg-[#FFF3CD] border-[#FFE69C]">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#856404] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-[#856404]">ลูกค้าส่งเสื้อมาเอง</h4>
              <p className="text-sm text-[#856404] mt-1">
                กรุณาระบุจำนวนเสื้อที่ลูกค้าจะส่งมาในขั้นตอนถัดไป
              </p>
            </div>
          </div>
        </Card>
      )}

      {shirts.length === 0 && orderType !== 'print_only' ? (
        <Card className="p-8 bg-white border-[#E8E8ED] text-center">
          <ShoppingBag className="w-12 h-12 text-[#86868B] mx-auto mb-4" />
          <p className="text-[#86868B]">ยังไม่ได้เลือกเสื้อ</p>
          <p className="text-sm text-[#86868B] mt-1">
            {selectedOrderType?.requires_stock ? 'กดปุ่มเลือกจากสต็อก' : 'กดปุ่มสร้างเสื้อใหม่'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {shirts.map((shirt, index) => (
            <Card key={shirt.id} className="p-4 bg-white border-[#E8E8ED]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-[#1D1D1F]">
                  {shirt.source === 'stock' 
                    ? `${shirt.product_name} (${shirt.product_sku})`
                    : `เสื้อ #${index + 1}`
                  }
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => removeShirt(shirt.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Custom shirt options */}
              {shirt.source === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">รุ่นเสื้อ</label>
                    <Dropdown
                      value={shirt.model || ''}
                      onChange={(val) => updateShirt(shirt.id, 'model', val)}
                      options={SHIRT_MODELS.map(m => ({ value: m.id, label: `${m.icon} ${m.name}` }))}
                      placeholder="เลือกรุ่น"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">เนื้อผ้า</label>
                    <Dropdown
                      value={shirt.fabric || ''}
                      onChange={(val) => updateShirt(shirt.id, 'fabric', val)}
                      options={FABRIC_TYPES.map(f => ({ value: f.id, label: f.name }))}
                      placeholder="เลือกเนื้อผ้า"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">สีเสื้อ</label>
                    <Dropdown
                      value={shirt.color || ''}
                      onChange={(val) => updateShirt(shirt.id, 'color', val)}
                      options={SHIRT_COLORS.map(c => ({ 
                        value: c.id, 
                        label: c.name,
                      }))}
                      placeholder="เลือกสี"
                    />
                  </div>
                </div>
              )}

              {/* Size quantities */}
              <div>
                <label className="block text-xs text-[#86868B] mb-2">จำนวนแต่ละไซส์</label>
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                  {shirt.sizes.map(sz => {
                    const sizeInfo = SHIRT_SIZES.find(s => s.id === sz.size);
                    return (
                      <div key={sz.size} className="text-center">
                        <div className="text-xs text-[#86868B] mb-1">{sizeInfo?.name}</div>
                        <QuantityInput
                          min={0}
                          value={sz.quantity}
                          onChange={(val) => updateShirtSize(shirt.id, sz.size, val)}
                          className="text-center bg-[#F5F5F7] border-[#E8E8ED]"
                          emptyValue={0}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unit price */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-[#86868B] mb-1">ราคา/ตัว (บาท)</label>
                  <PriceInput
                    min={0}
                    value={shirt.unit_price}
                    onChange={(val) => updateShirt(shirt.id, 'unit_price', val)}
                    className="bg-[#F5F5F7] border-[#E8E8ED]"
                  />
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#86868B]">รวม</div>
                  <div className="text-lg font-bold text-[#007AFF]">
                    ฿{(shirt.unit_price * shirt.sizes.reduce((sum, sz) => sum + sz.quantity, 0)).toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Product Selection Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="เลือกเสื้อจากสต็อก"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="ค้นหาด้วยชื่อหรือ SKU"
            className="bg-[#F5F5F7] border-[#E8E8ED]"
          />
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addShirtFromStock(product)}
                className="w-full p-3 text-left bg-[#F5F5F7] hover:bg-[#E8E8ED] rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#1D1D1F]">{product.name}</div>
                    <div className="text-sm text-[#86868B]">
                      SKU: {product.sku} • คงเหลือ: {product.stock_quantity || 0}
                    </div>
                  </div>
                  <div className="text-[#007AFF] font-medium">
                    ฿{(product.selling_price || 0).toLocaleString()}
                  </div>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-center text-[#86868B] py-4">ไม่พบสินค้า</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );

  // Step 4: Print Work
  const renderPrintWork = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1D1D1F]">งานพิมพ์/สกรีน</h2>
        <Button onClick={addPrintWork}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มตำแหน่งพิมพ์
        </Button>
      </div>

      {/* Print methods info */}
      <Card className="p-4 bg-[#F5F5F7] border-[#E8E8ED]">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-[#007AFF]" />
          <span className="text-sm font-medium text-[#1D1D1F]">วิธีพิมพ์ที่แนะนำ</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRINT_METHODS.slice(0, 4).map(method => (
            <div key={method.id} className="px-3 py-2 bg-white rounded-lg text-xs">
              <span className="mr-1">{method.icon}</span>
              <span className="font-medium">{method.name}</span>
              <span className="text-[#86868B] ml-1">
                ฿{method.base_price}+/ตัว
              </span>
            </div>
          ))}
        </div>
      </Card>

      {printWorks.length === 0 ? (
        <Card className="p-8 bg-white border-[#E8E8ED] text-center">
          <Printer className="w-12 h-12 text-[#86868B] mx-auto mb-4" />
          <p className="text-[#86868B]">ยังไม่ได้เพิ่มงานพิมพ์</p>
          <p className="text-sm text-[#86868B] mt-1">กดปุ่มเพิ่มตำแหน่งพิมพ์</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {printWorks.map((pw, index) => {
            const method = PRINT_METHODS.find(m => m.id === pw.method);
            return (
              <Card key={pw.id} className="p-4 bg-white border-[#E8E8ED]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-[#1D1D1F]">
                    ตำแหน่งที่ {index + 1}: {PRINT_POSITIONS.find(p => p.id === pw.position)?.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => removePrintWork(pw.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">วิธีพิมพ์</label>
                    <Dropdown
                      value={pw.method}
                      onChange={(val) => updatePrintWork(pw.id, 'method', val)}
                      options={PRINT_METHODS.map(m => ({ 
                        value: m.id, 
                        label: `${m.icon} ${m.name}`,
                      }))}
                      placeholder="เลือกวิธีพิมพ์"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">ตำแหน่ง</label>
                    <Dropdown
                      value={pw.position}
                      onChange={(val) => updatePrintWork(pw.id, 'position', val)}
                      options={PRINT_POSITIONS.map(p => ({ 
                        value: p.id, 
                        label: `${p.icon} ${p.name}`,
                      }))}
                      placeholder="เลือกตำแหน่ง"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">ขนาด</label>
                    <Dropdown
                      value={pw.size}
                      onChange={(val) => updatePrintWork(pw.id, 'size', val)}
                      options={PRINT_SIZES.map(s => ({ value: s.id, label: s.name }))}
                      placeholder="เลือกขนาด"
                    />
                  </div>
                  {(pw.method === 'screen' || pw.method === 'embroidery') && (
                    <div>
                      <label className="block text-xs text-[#86868B] mb-1">จำนวนสี</label>
                      <QuantityInput
                        min={1}
                        max={method?.color_limit || 12}
                        value={pw.colors || 1}
                        onChange={(val) => updatePrintWork(pw.id, 'colors', val)}
                        className="bg-[#F5F5F7] border-[#E8E8ED]"
                        emptyValue={1}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-xs text-[#86868B] mb-1">หมายเหตุงานพิมพ์</label>
                  <Input
                    value={pw.design_note || ''}
                    onChange={(e) => updatePrintWork(pw.id, 'design_note', e.target.value)}
                    placeholder="รายละเอียดเพิ่มเติม เช่น โลโก้หน้า, ชื่อหลัง..."
                    className="bg-[#F5F5F7] border-[#E8E8ED]"
                  />
                </div>

                {/* Price preview */}
                <div className="mt-4 p-3 bg-[#F5F5F7] rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868B]">ราคา/ตัว</span>
                    <span className="text-[#1D1D1F]">฿{pw.unit_price.toFixed(2)}</span>
                  </div>
                  {pw.setup_cost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#86868B]">ค่าเซ็ตอัพ</span>
                      <span className="text-[#1D1D1F]">฿{pw.setup_cost.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t border-[#E8E8ED]">
                    <span className="text-[#86868B]">รวม ({totalQuantity} ตัว)</span>
                    <span className="text-[#007AFF]">
                      ฿{((pw.unit_price * totalQuantity) + pw.setup_cost).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // Step 5: Addons
  const renderAddons = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#1D1D1F]">บริการเสริม (Add-ons)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ADDONS.map(addon => {
          const selected = addons.find(a => a.addon_id === addon.id);
          return (
            <Card
              key={addon.id}
              className={`p-4 cursor-pointer transition-all ${
                selected
                  ? 'bg-[#007AFF]/5 border-[#007AFF]'
                  : 'bg-white border-[#E8E8ED] hover:border-[#007AFF]/50'
              }`}
              onClick={() => toggleAddon(addon.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{addon.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-[#1D1D1F]">{addon.name}</h4>
                    {selected && <Check className="w-5 h-5 text-[#007AFF]" />}
                  </div>
                  <p className="text-xs text-[#86868B] mt-1">{addon.description}</p>
                  <div className="text-sm font-medium text-[#007AFF] mt-2">
                    ฿{addon.price}/ชิ้น
                  </div>
                </div>
              </div>

              {selected && (
                <div className="mt-4 pt-4 border-t border-[#E8E8ED]" onClick={e => e.stopPropagation()}>
                  <label className="block text-xs text-[#86868B] mb-1">จำนวน</label>
                  <QuantityInput
                    min={1}
                    value={selected.quantity}
                    onChange={(val) => updateAddonQuantity(addon.id, val)}
                    className="bg-[#F5F5F7] border-[#E8E8ED]"
                    emptyValue={1}
                  />
                  <div className="text-right text-sm font-medium text-[#007AFF] mt-2">
                    รวม ฿{(addon.price * selected.quantity).toLocaleString()}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Step 6: Summary
  const renderSummary = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#1D1D1F]">สรุปออเดอร์</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer */}
          <Card className="p-4 bg-white border-[#E8E8ED]">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-[#007AFF]" />
              <h3 className="font-semibold text-[#1D1D1F]">ลูกค้า</h3>
            </div>
            <div className="text-sm text-[#1D1D1F]">
              <p className="font-medium">{customerInfo.name}</p>
              <p className="text-[#86868B]">{customerInfo.phone}</p>
              {customerInfo.address && (
                <p className="text-[#86868B] mt-1">
                  {customerInfo.address} {customerInfo.subdistrict} {customerInfo.district} {customerInfo.province} {customerInfo.postal_code}
                </p>
              )}
            </div>
          </Card>

          {/* Items */}
          <Card className="p-4 bg-white border-[#E8E8ED]">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-[#34C759]" />
              <h3 className="font-semibold text-[#1D1D1F]">รายการสินค้า</h3>
            </div>
            <div className="space-y-3">
              {shirts.map((shirt, i) => {
                const qty = shirt.sizes.reduce((sum, sz) => sum + sz.quantity, 0);
                if (qty === 0) return null;
                return (
                  <div key={shirt.id} className="flex justify-between text-sm">
                    <span className="text-[#1D1D1F]">
                      {shirt.product_name || `เสื้อ #${i + 1}`} x {qty}
                    </span>
                    <span className="text-[#86868B]">
                      ฿{(shirt.unit_price * qty).toLocaleString()}
                    </span>
                  </div>
                );
              })}
              {printWorks.map((pw, i) => {
                const method = PRINT_METHODS.find(m => m.id === pw.method);
                const position = PRINT_POSITIONS.find(p => p.id === pw.position);
                return (
                  <div key={pw.id} className="flex justify-between text-sm">
                    <span className="text-[#1D1D1F]">
                      {method?.name} ({position?.name}) x {totalQuantity}
                    </span>
                    <span className="text-[#86868B]">
                      ฿{((pw.unit_price * totalQuantity) + pw.setup_cost).toLocaleString()}
                    </span>
                  </div>
                );
              })}
              {addons.map(addon => {
                const addonInfo = ADDONS.find(a => a.id === addon.addon_id);
                return (
                  <div key={addon.id} className="flex justify-between text-sm">
                    <span className="text-[#1D1D1F]">
                      {addonInfo?.name} x {addon.quantity}
                    </span>
                    <span className="text-[#86868B]">
                      ฿{((addonInfo?.price || 0) * addon.quantity).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Order info */}
          <Card className="p-4 bg-white border-[#E8E8ED]">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-[#FF9500]" />
              <h3 className="font-semibold text-[#1D1D1F]">รายละเอียดออเดอร์</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#86868B] mb-1">กำหนดส่ง</label>
                <Input
                  type="date"
                  value={orderInfo.due_date}
                  onChange={(e) => setOrderInfo({ ...orderInfo, due_date: e.target.value })}
                  className="bg-[#F5F5F7] border-[#E8E8ED]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#86868B] mb-1">ช่องทางขาย</label>
                <Dropdown
                  value={orderInfo.sales_channel}
                  onChange={(val) => setOrderInfo({ ...orderInfo, sales_channel: val })}
                  options={[
                    { value: '', label: 'เลือกช่องทาง' },
                    { value: 'line', label: 'LINE' },
                    { value: 'facebook', label: 'Facebook' },
                    { value: 'instagram', label: 'Instagram' },
                    { value: 'phone', label: 'โทรศัพท์' },
                    { value: 'walk_in', label: 'Walk-in' },
                    { value: 'website', label: 'Website' },
                  ]}
                  placeholder="เลือกช่องทาง"
                />
              </div>
              <div>
                <label className="block text-sm text-[#86868B] mb-1">เงื่อนไขชำระเงิน</label>
                <Dropdown
                  value={orderInfo.payment_terms}
                  onChange={(val) => setOrderInfo({ ...orderInfo, payment_terms: val })}
                  options={[
                    { value: 'full', label: 'ชำระเต็มจำนวน' },
                    { value: '50_50', label: 'มัดจำ 50%' },
                    { value: '30_70', label: 'มัดจำ 30%' },
                  ]}
                  placeholder="เลือกเงื่อนไข"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tax_invoice"
                  checked={orderInfo.requires_tax_invoice}
                  onChange={(e) => setOrderInfo({ ...orderInfo, requires_tax_invoice: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="tax_invoice" className="text-sm text-[#1D1D1F]">
                  ต้องการใบกำกับภาษี
                </label>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-[#86868B] mb-1">หมายเหตุ</label>
              <textarea
                value={orderInfo.notes}
                onChange={(e) => setOrderInfo({ ...orderInfo, notes: e.target.value })}
                placeholder="หมายเหตุเพิ่มเติม..."
                className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F] text-sm resize-none h-20"
              />
            </div>
          </Card>
        </div>

        {/* Price summary */}
        <div className="space-y-4">
          <Card className="p-4 bg-white border-[#E8E8ED]">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-[#34C759]" />
              <h3 className="font-semibold text-[#1D1D1F]">สรุปราคา</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#86868B]">ค่าเสื้อ ({totalQuantity} ตัว)</span>
                <span className="text-[#1D1D1F]">฿{summary.subtotal_shirts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#86868B]">ค่างานพิมพ์</span>
                <span className="text-[#1D1D1F]">฿{summary.subtotal_prints.toLocaleString()}</span>
              </div>
              {summary.setup_costs > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#86868B]">ค่าเซ็ตอัพ</span>
                  <span className="text-[#1D1D1F]">฿{summary.setup_costs.toLocaleString()}</span>
                </div>
              )}
              {summary.subtotal_addons > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#86868B]">บริการเสริม</span>
                  <span className="text-[#1D1D1F]">฿{summary.subtotal_addons.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 border-t border-[#E8E8ED]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#86868B]">ส่วนลด</span>
                  <PriceInput
                    min={0}
                    value={orderInfo.discount}
                    onChange={(val) => setOrderInfo({ ...orderInfo, discount: val })}
                    className="w-24 text-right bg-[#F5F5F7] border-[#E8E8ED] text-sm"
                  />
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-[#86868B]">ค่าจัดส่ง</span>
                  <PriceInput
                    min={0}
                    value={orderInfo.shipping_cost}
                    onChange={(val) => setOrderInfo({ ...orderInfo, shipping_cost: val })}
                    className="w-24 text-right bg-[#F5F5F7] border-[#E8E8ED] text-sm"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-[#E8E8ED]">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#1D1D1F]">รวมทั้งสิ้น</span>
                  <span className="text-xl font-bold text-[#007AFF]">
                    ฿{summary.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Estimated time */}
          <Card className="p-4 bg-[#F5F5F7] border-[#E8E8ED]">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-[#FF9500]" />
              <h3 className="font-semibold text-[#1D1D1F]">ระยะเวลาผลิต (โดยประมาณ)</h3>
            </div>
            <p className="text-2xl font-bold text-[#FF9500]">
              {estimatedTime.days} วัน {estimatedTime.hours > 0 && `${estimatedTime.hours} ชม.`}
            </p>
          </Card>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={creating}
            className="w-full bg-[#34C759] hover:bg-[#2FB84E]"
          >
            {creating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังสร้าง...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                สร้างออเดอร์
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8E8ED] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/orders">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[#1D1D1F]">สร้างออเดอร์ใหม่</h1>
                <p className="text-sm text-[#86868B]">
                  {selectedOrderType?.name || 'เลือกประเภทออเดอร์'}
                </p>
              </div>
            </div>
            {totalQuantity > 0 && (
              <div className="text-right">
                <div className="text-sm text-[#86868B]">จำนวนทั้งหมด</div>
                <div className="text-lg font-bold text-[#007AFF]">{totalQuantity} ตัว</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-[#E8E8ED]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isDisabled = index > currentStep && !canProceed;

              return (
                <button
                  key={step.id}
                  onClick={() => !isDisabled && index <= currentStep && setCurrentStep(index)}
                  disabled={isDisabled}
                  className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                    isActive
                      ? 'text-[#007AFF]'
                      : isCompleted
                        ? 'text-[#34C759] cursor-pointer'
                        : 'text-[#86868B]'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'bg-[#007AFF] text-white'
                      : isCompleted
                        ? 'bg-[#34C759] text-white'
                        : 'bg-[#F5F5F7] text-[#86868B]'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden md:block">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E8ED] p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ย้อนกลับ
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed}
            >
              ถัดไป
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}


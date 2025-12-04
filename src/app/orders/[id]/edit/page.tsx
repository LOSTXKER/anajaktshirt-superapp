'use client';

import { Button, Card, Input, Modal, useToast, QuantityInput, PriceInput } from '@/modules/shared/ui';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  MapPin,
  Package,
  Plus,
  Trash2,
  Save,
  DollarSign,
  FileText,
  Search,
  X,
  Loader2,
} from 'lucide-react';
import { useOrder, useWorkTypes, usePrintPositions, usePrintSizes } from '@/modules/orders/hooks/useOrders';
import { useOrderMutations } from '@/modules/orders/hooks/useOrderMutations';
import { useCustomers } from '@/modules/crm/hooks/useCustomers';
import { useProducts } from '@/modules/stock/hooks/useProducts';
import type { UpdateOrderInput } from '@/modules/orders/types';

interface WorkItemForm {
  id: string;
  isNew?: boolean;
  work_type_code: string;
  work_type_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  position_code: string;
  position_name: string;
  print_size_code: string;
  print_size_name: string;
  products: ProductForm[];
}

interface ProductForm {
  id: string;
  isNew?: boolean;
  product_id: string;
  product_sku: string;
  product_name: string;
  product_model: string;
  product_color: string;
  product_size: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
}

export default function EditOrderPage() {
  const params = useParams();
  const orderId = params.id as string;
  const router = useRouter();
  const { success, error: showError } = useToast();
  
  // Data hooks
  const { order, loading: orderLoading, refetch } = useOrder(orderId);
  const { updateOrder, loading: mutationLoading } = useOrderMutations();
  const { workTypes } = useWorkTypes();
  const { positions } = usePrintPositions();
  const { sizes } = usePrintSizes();
  const { customers } = useCustomers();
  const { products } = useProducts();

  // Form State
  const [customerInfo, setCustomerInfo] = useState({
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_line_id: '',
  });

  const [shippingInfo, setShippingInfo] = useState({
    shipping_name: '',
    shipping_phone: '',
    shipping_address: '',
    shipping_district: '',
    shipping_province: '',
    shipping_postal_code: '',
  });

  const [orderInfo, setOrderInfo] = useState({
    due_date: '',
    customer_note: '',
    internal_note: '',
    sales_channel: '' as string,
    discount_amount: 0,
    discount_percent: 0,
    discount_reason: '',
    shipping_cost: 0,
    payment_terms: 'full' as string,
    needs_tax_invoice: false,
    tracking_number: '',
    shipping_method: '',
  });

  const [workItems, setWorkItems] = useState<WorkItemForm[]>([]);
  
  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Load order data
  useEffect(() => {
    if (order) {
      setCustomerInfo({
        customer_id: order.customer_id || '',
        customer_name: order.customer_name || '',
        customer_phone: order.customer_phone || '',
        customer_email: order.customer_email || '',
        customer_line_id: order.customer_line_id || '',
      });

      setShippingInfo({
        shipping_name: order.shipping_name || '',
        shipping_phone: order.shipping_phone || '',
        shipping_address: order.shipping_address || '',
        shipping_district: order.shipping_district || '',
        shipping_province: order.shipping_province || '',
        shipping_postal_code: order.shipping_postal_code || '',
      });

      setOrderInfo({
        due_date: order.due_date?.split('T')[0] || '',
        customer_note: order.customer_note || '',
        internal_note: order.internal_note || '',
        sales_channel: order.sales_channel || '',
        discount_amount: order.discount_amount || 0,
        discount_percent: order.discount_percent || 0,
        discount_reason: order.discount_reason || '',
        shipping_cost: order.shipping_cost || 0,
        payment_terms: order.payment_terms || 'full',
        needs_tax_invoice: order.needs_tax_invoice || false,
        tracking_number: order.tracking_number || '',
        shipping_method: order.shipping_method || '',
      });

      // Load work items
      if (order.work_items) {
        setWorkItems(order.work_items.map(item => ({
          id: item.id,
          work_type_code: item.work_type_code || '',
          work_type_name: item.work_type_name || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          position_code: item.position_code || '',
          position_name: item.position_name || '',
          print_size_code: item.print_size_code || '',
          print_size_name: item.print_size_name || '',
          products: (item.products || []).map(p => ({
            id: p.id,
            product_id: p.product_id || '',
            product_sku: p.product_sku || '',
            product_name: p.product_name || '',
            product_model: p.product_model || '',
            product_color: p.product_color || '',
            product_size: p.product_size || '',
            quantity: p.quantity || 1,
            unit_cost: p.unit_cost || 0,
            unit_price: p.unit_price || 0,
          })),
        })));
      }
    }
  }, [order]);

  // Calculate totals
  const subtotal = workItems.reduce((sum, item) => {
    const workItemTotal = item.quantity * item.unit_price;
    const productsTotal = item.products.reduce((pSum, p) => pSum + (p.quantity * p.unit_price), 0);
    return sum + workItemTotal + productsTotal;
  }, 0);

  const discountAmount = orderInfo.discount_percent > 0 
    ? (subtotal * orderInfo.discount_percent / 100) 
    : orderInfo.discount_amount;

  const total = subtotal - discountAmount + orderInfo.shipping_cost;

  // Select customer from modal
  const selectCustomer = (customer: any) => {
    setCustomerInfo({
      customer_id: customer.id,
      customer_name: customer.name || customer.company_name || '',
      customer_phone: customer.phone || '',
      customer_email: customer.email || '',
      customer_line_id: customer.line_id || '',
    });
    setShowCustomerModal(false);
  };

  // Update work item
  const updateWorkItem = (id: string, field: string, value: any) => {
    setWorkItems(items => items.map(item => {
      if (item.id === id) {
        if (field === 'work_type_code') {
          const workType = workTypes.find(wt => wt.code === value);
          return { ...item, work_type_code: value, work_type_name: workType?.name_th || '' };
        }
        if (field === 'position_code') {
          const position = positions.find(p => p.code === value);
          return { ...item, position_code: value, position_name: position?.name_th || '' };
        }
        if (field === 'print_size_code') {
          const size = sizes.find(s => s.code === value);
          return { ...item, print_size_code: value, print_size_name: size?.name || '' };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Submit update
  const handleSubmit = async () => {
    if (!customerInfo.customer_name) {
      showError('กรุณากรอกชื่อลูกค้า');
      return;
    }

    try {
      const updateInput: UpdateOrderInput = {
        ...customerInfo,
        ...shippingInfo,
        ...orderInfo,
        discount_amount: discountAmount,
      };

      const result = await updateOrder(orderId, updateInput);
      
      if (result.success) {
        success('บันทึกการแก้ไขเรียบร้อย');
        router.push(`/orders/${orderId}`);
      } else {
        throw new Error(result.error || 'ไม่สามารถบันทึกได้');
      }
    } catch (err: any) {
      console.error('Error updating order:', err);
      showError(err.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter(c => 
    !customerSearch || 
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.contact_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-[#86868B]">
        <Package className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2 text-[#1D1D1F]">ไม่พบออเดอร์</h2>
        <Link href="/orders" className="text-[#007AFF] hover:underline">
          กลับไปหน้ารายการ
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/orders/${orderId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">แก้ไขออเดอร์</h1>
          <p className="text-[#86868B]">{order.order_number}</p>
        </div>
      </div>

      {/* Customer Info */}
      <Card className="p-6 bg-white border-[#E8E8ED] mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-[#1D1D1F]">ข้อมูลลูกค้า</h2>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowCustomerModal(true)}>
            <Search className="w-4 h-4 mr-2" />
            ค้นหาลูกค้า
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#86868B] mb-1">ชื่อลูกค้า *</label>
            <Input
              value={customerInfo.customer_name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, customer_name: e.target.value })}
              placeholder="ชื่อ-นามสกุล หรือ ชื่อบริษัท"
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">เบอร์โทร</label>
            <Input
              value={customerInfo.customer_phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, customer_phone: e.target.value })}
              placeholder="0812345678"
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">อีเมล</label>
            <Input
              type="email"
              value={customerInfo.customer_email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, customer_email: e.target.value })}
              placeholder="email@example.com"
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">LINE ID</label>
            <Input
              value={customerInfo.customer_line_id}
              onChange={(e) => setCustomerInfo({ ...customerInfo, customer_line_id: e.target.value })}
              placeholder="@lineid"
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
        </div>
      </Card>

      {/* Shipping Info */}
      <Card className="p-6 bg-white border-[#E8E8ED] mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-semibold text-[#1D1D1F]">ที่อยู่จัดส่ง</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#86868B] mb-1">ชื่อผู้รับ</label>
            <Input
              value={shippingInfo.shipping_name}
              onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_name: e.target.value })}
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">เบอร์โทรผู้รับ</label>
            <Input
              value={shippingInfo.shipping_phone}
              onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_phone: e.target.value })}
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-[#86868B] mb-1">ที่อยู่</label>
            <Input
              value={shippingInfo.shipping_address}
              onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_address: e.target.value })}
              placeholder="บ้านเลขที่ ถนน ซอย"
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">แขวง/ตำบล</label>
            <Input
              value={shippingInfo.shipping_district}
              onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_district: e.target.value })}
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">เขต/อำเภอ, จังหวัด</label>
            <Input
              value={shippingInfo.shipping_province}
              onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_province: e.target.value })}
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#86868B] mb-1">รหัสไปรษณีย์</label>
            <Input
              value={shippingInfo.shipping_postal_code}
              onChange={(e) => setShippingInfo({ ...shippingInfo, shipping_postal_code: e.target.value })}
              className="bg-[#F5F5F7] border-[#E8E8ED]"
            />
          </div>
        </div>
      </Card>

      {/* Work Items (Read-only for now) */}
      <Card className="p-6 bg-white border-[#E8E8ED] mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-[#1D1D1F]">รายการงาน</h2>
        </div>

        {workItems.length === 0 ? (
          <div className="text-center py-8 text-[#86868B]">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>ไม่มีรายการงาน</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workItems.map((item, index) => (
              <div key={item.id} className="p-4 bg-[#F5F5F7] rounded-lg border border-[#E8E8ED]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#1D1D1F] font-medium">
                    {index + 1}. {item.work_type_name || 'ไม่ระบุประเภท'}
                  </span>
                  <span className="text-[#007AFF] font-semibold">
                    ฿{(item.quantity * item.unit_price).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-[#86868B]">
                  {item.position_name && <span>{item.position_name}</span>}
                  {item.print_size_name && <span> • {item.print_size_name}</span>}
                  {item.quantity && <span> • {item.quantity} ชิ้น</span>}
                </div>
                {item.description && (
                  <p className="text-sm text-[#86868B] mt-1">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
        
        <p className="text-xs text-[#86868B] mt-4">
          * การแก้ไขรายการงานต้องทำจากหน้ารายละเอียดออเดอร์
        </p>
      </Card>

      {/* Order Details & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Order Details */}
        <Card className="p-6 bg-white border-[#E8E8ED]">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-[#1D1D1F]">รายละเอียดออเดอร์</h2>
          </div>
          
          <div className="space-y-4">
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
              <select
                value={orderInfo.sales_channel}
                onChange={(e) => setOrderInfo({ ...orderInfo, sales_channel: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F]"
              >
                <option value="">เลือกช่องทาง</option>
                <option value="line">LINE</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="phone">โทรศัพท์</option>
                <option value="walk_in">Walk-in</option>
                <option value="website">Website</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#86868B] mb-1">เลข Tracking</label>
              <Input
                value={orderInfo.tracking_number}
                onChange={(e) => setOrderInfo({ ...orderInfo, tracking_number: e.target.value })}
                placeholder="เลข Tracking พัสดุ"
                className="bg-[#F5F5F7] border-[#E8E8ED]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#86868B] mb-1">หมายเหตุจากลูกค้า</label>
              <textarea
                value={orderInfo.customer_note}
                onChange={(e) => setOrderInfo({ ...orderInfo, customer_note: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[#86868B] mb-1">หมายเหตุภายใน</label>
              <textarea
                value={orderInfo.internal_note}
                onChange={(e) => setOrderInfo({ ...orderInfo, internal_note: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F] resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Summary */}
        <Card className="p-6 bg-white border-[#E8E8ED]">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-[#1D1D1F]">สรุปยอด</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-[#1D1D1F]">
              <span>ยอดรวม</span>
              <span>฿{subtotal.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[#86868B] text-sm">ส่วนลด</span>
              <PriceInput
                min={0}
                value={orderInfo.discount_amount}
                onChange={(val) => setOrderInfo({ ...orderInfo, discount_amount: val, discount_percent: 0 })}
                placeholder="฿"
                className="w-20 text-sm bg-[#F5F5F7] border-[#E8E8ED]"
              />
              <span className="text-[#86868B] text-sm">หรือ</span>
              <PriceInput
                min={0}
                value={orderInfo.discount_percent}
                onChange={(val) => setOrderInfo({ ...orderInfo, discount_percent: Math.min(val, 100), discount_amount: 0 })}
                placeholder="%"
                className="w-16 text-sm bg-[#F5F5F7] border-[#E8E8ED]"
              />
              <span className="text-[#86868B] text-sm">%</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>ส่วนลด</span>
                <span>-฿{discountAmount.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-[#86868B] text-sm">ค่าส่ง</span>
              <PriceInput
                min={0}
                value={orderInfo.shipping_cost}
                onChange={(val) => setOrderInfo({ ...orderInfo, shipping_cost: val })}
                placeholder="฿"
                className="w-24 text-sm bg-[#F5F5F7] border-[#E8E8ED]"
              />
            </div>
            
            <div className="pt-3 mt-3 border-t border-[#E8E8ED]">
              <div className="flex justify-between text-xl font-bold text-[#1D1D1F]">
                <span>ยอดรวมทั้งสิ้น</span>
                <span className="text-emerald-500">฿{total.toLocaleString()}</span>
              </div>
            </div>

            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={orderInfo.needs_tax_invoice}
                onChange={(e) => setOrderInfo({ ...orderInfo, needs_tax_invoice: e.target.checked })}
                className="rounded border-[#E8E8ED]"
              />
              <span className="text-[#1D1D1F] text-sm">ต้องการใบกำกับภาษี</span>
            </label>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href={`/orders/${orderId}`}>
          <Button variant="secondary">ยกเลิก</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={mutationLoading}>
          {mutationLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              บันทึกการแก้ไข
            </>
          )}
        </Button>
      </div>

      {/* Customer Search Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="ค้นหาลูกค้า"
      >
        <div className="space-y-4">
          <Input
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, เบอร์โทร..."
            className="bg-[#F5F5F7] border-[#E8E8ED]"
          />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredCustomers.length === 0 ? (
              <p className="text-center text-[#86868B] py-4">ไม่พบลูกค้า</p>
            ) : (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => selectCustomer(customer)}
                  className="w-full text-left p-3 bg-[#F5F5F7] hover:bg-[#E8E8ED] rounded-lg transition-colors"
                >
                  <div className="text-[#1D1D1F]">{customer.name}</div>
                  <div className="text-sm text-[#86868B]">{customer.phone}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}


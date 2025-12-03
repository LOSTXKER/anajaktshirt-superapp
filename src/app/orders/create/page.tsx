'use client';

import { Button, Card, Input, Modal, useToast, QuantityInput, PriceInput } from '@/modules/shared/ui';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
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
} from 'lucide-react';
import { useOrderMutations } from '@/modules/orders/hooks/useOrderMutations';
import { useWorkTypes, usePrintPositions, usePrintSizes } from '@/modules/orders/hooks/useOrders';
import { useCustomers } from '@/modules/crm/hooks/useCustomers';
import { useProducts } from '@/modules/stock/hooks/useProducts';
import type { CreateOrderInput, CreateWorkItemInput, CreateOrderProductInput } from '@/modules/orders/types';

interface WorkItemForm {
  id: string;
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

export default function CreateOrderPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const { createOrder, addWorkItem, addOrderProduct, loading } = useOrderMutations();
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
    sales_channel: '' as any,
    discount_amount: 0,
    discount_percent: 0,
    discount_reason: '',
    shipping_cost: 0,
    payment_terms: 'full' as any,
    needs_tax_invoice: false,
  });

  const [workItems, setWorkItems] = useState<WorkItemForm[]>([]);
  
  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedWorkItemId, setSelectedWorkItemId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

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
    
    // Also fill shipping if available
    if (customer.address) {
      setShippingInfo({
        shipping_name: customer.name || customer.company_name || '',
        shipping_phone: customer.phone || '',
        shipping_address: customer.address || '',
        shipping_district: customer.district || '',
        shipping_province: customer.province || '',
        shipping_postal_code: customer.postal_code || '',
      });
    }
    
    setShowCustomerModal(false);
  };

  // Add work item
  const addWorkItemForm = () => {
    const newItem: WorkItemForm = {
      id: `temp-${Date.now()}`,
      work_type_code: '',
      work_type_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      position_code: '',
      position_name: '',
      print_size_code: '',
      print_size_name: '',
      products: [],
    };
    setWorkItems([...workItems, newItem]);
  };

  // Update work item
  const updateWorkItem = (id: string, field: string, value: any) => {
    setWorkItems(items => items.map(item => {
      if (item.id === id) {
        // Handle work type change
        if (field === 'work_type_code') {
          const workType = workTypes.find(wt => wt.code === value);
          return {
            ...item,
            work_type_code: value,
            work_type_name: workType?.name_th || '',
          };
        }
        // Handle position change
        if (field === 'position_code') {
          const position = positions.find(p => p.code === value);
          return {
            ...item,
            position_code: value,
            position_name: position?.name_th || '',
          };
        }
        // Handle size change
        if (field === 'print_size_code') {
          const size = sizes.find(s => s.code === value);
          return {
            ...item,
            print_size_code: value,
            print_size_name: size?.name || '',
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Remove work item
  const removeWorkItem = (id: string) => {
    setWorkItems(items => items.filter(item => item.id !== id));
  };

  // Add product to work item
  const addProductToWorkItem = (workItemId: string, product: any) => {
    const newProduct: ProductForm = {
      id: `temp-${Date.now()}`,
      product_id: product.id,
      product_sku: product.sku,
      product_name: `${product.model} ${product.color} ${product.size}`,
      product_model: product.model,
      product_color: product.color,
      product_size: product.size,
      quantity: 1,
      unit_cost: product.cost || 0,
      unit_price: product.price || 0,
    };

    setWorkItems(items => items.map(item => {
      if (item.id === workItemId) {
        return { ...item, products: [...item.products, newProduct] };
      }
      return item;
    }));

    setShowProductModal(false);
    success('เพิ่มสินค้าแล้ว');
  };

  // Update product quantity
  const updateProductQuantity = (workItemId: string, productId: string, quantity: number) => {
    setWorkItems(items => items.map(item => {
      if (item.id === workItemId) {
        return {
          ...item,
          products: item.products.map(p => 
            p.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
          ),
        };
      }
      return item;
    }));
  };

  // Remove product from work item
  const removeProductFromWorkItem = (workItemId: string, productId: string) => {
    setWorkItems(items => items.map(item => {
      if (item.id === workItemId) {
        return { ...item, products: item.products.filter(p => p.id !== productId) };
      }
      return item;
    }));
  };

  // Submit order
  const handleSubmit = async () => {
    // Validation
    if (!customerInfo.customer_name) {
      showError('กรุณากรอกชื่อลูกค้า');
      return;
    }

    if (workItems.length === 0) {
      showError('กรุณาเพิ่มรายการงานอย่างน้อย 1 รายการ');
      return;
    }

    try {
      // 1. Create order
      const orderInput: CreateOrderInput = {
        ...customerInfo,
        ...shippingInfo,
        ...orderInfo,
        discount_amount: discountAmount,
      };

      const { success: orderSuccess, order, error: orderError } = await createOrder(orderInput);
      
      if (!orderSuccess || !order) {
        throw new Error(orderError || 'ไม่สามารถสร้างออเดอร์ได้');
      }

      // 2. Add work items
      for (const item of workItems) {
        const workItemInput: CreateWorkItemInput = {
          order_id: order.id,
          work_type_code: item.work_type_code,
          work_type_name: item.work_type_name,
          description: item.description || undefined,
          quantity: item.quantity,
          unit_price: item.unit_price,
          position_code: item.position_code || undefined,
          position_name: item.position_name || undefined,
          print_size_code: item.print_size_code || undefined,
          print_size_name: item.print_size_name || undefined,
        };

        const { success: workItemSuccess, workItemId, error: workItemError } = await addWorkItem(workItemInput);
        
        if (!workItemSuccess || !workItemId) {
          console.error('Error adding work item:', workItemError);
          continue;
        }

        // 3. Add products to work item
        for (const product of item.products) {
          const productInput: CreateOrderProductInput = {
            order_id: order.id,
            order_work_item_id: workItemId,
            product_id: product.product_id || undefined,
            product_sku: product.product_sku,
            product_name: product.product_name,
            product_model: product.product_model || undefined,
            product_color: product.product_color || undefined,
            product_size: product.product_size || undefined,
            quantity: product.quantity,
            unit_cost: product.unit_cost,
            unit_price: product.unit_price,
          };

          await addOrderProduct(productInput);
        }
      }

      success('สร้างออเดอร์สำเร็จ');
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      console.error('Error creating order:', err);
      showError(err.message || 'เกิดข้อผิดพลาดในการสร้างออเดอร์');
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter(c => 
    !customerSearch || 
    c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.contact_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.code?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );

  // Filter products
  const filteredProducts = products.filter(p =>
    !productSearch ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.model?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.color?.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">สร้างออเดอร์ใหม่</h1>
          <p className="text-[#86868B]">กรอกข้อมูลออเดอร์</p>
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

      {/* Work Items */}
      <Card className="p-6 bg-white border-[#E8E8ED] mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-[#1D1D1F]">รายการงาน</h2>
          </div>
          <Button onClick={addWorkItemForm}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มรายการ
          </Button>
        </div>

        {workItems.length === 0 ? (
          <div className="text-center py-8 text-[#86868B]">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>ยังไม่มีรายการงาน</p>
            <Button variant="secondary" className="mt-2" onClick={addWorkItemForm}>
              เพิ่มรายการแรก
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {workItems.map((item, index) => (
              <div key={item.id} className="p-4 bg-[#F5F5F7] rounded-lg border border-[#E8E8ED]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#1D1D1F] font-medium">รายการที่ {index + 1}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-400"
                    onClick={() => removeWorkItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">ประเภทงาน</label>
                    <select
                      value={item.work_type_code}
                      onChange={(e) => updateWorkItem(item.id, 'work_type_code', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E8E8ED] rounded-lg text-[#1D1D1F] text-sm"
                    >
                      <option value="">เลือกประเภทงาน</option>
                      {workTypes.map((wt) => (
                        <option key={wt.code} value={wt.code}>{wt.name_th}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">ตำแหน่ง</label>
                    <select
                      value={item.position_code}
                      onChange={(e) => updateWorkItem(item.id, 'position_code', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E8E8ED] rounded-lg text-[#1D1D1F] text-sm"
                    >
                      <option value="">เลือกตำแหน่ง</option>
                      {positions.map((pos) => (
                        <option key={pos.code} value={pos.code}>{pos.name_th}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">ขนาดพิมพ์</label>
                    <select
                      value={item.print_size_code}
                      onChange={(e) => updateWorkItem(item.id, 'print_size_code', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E8E8ED] rounded-lg text-[#1D1D1F] text-sm"
                    >
                      <option value="">เลือกขนาด</option>
                      {sizes.map((size) => (
                        <option key={size.code} value={size.code}>{size.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="md:col-span-1">
                    <label className="block text-xs text-[#86868B] mb-1">จำนวน</label>
                    <QuantityInput
                      min={1}
                      value={item.quantity}
                      onChange={(val) => updateWorkItem(item.id, 'quantity', val || 1)}
                      className="bg-white border-[#E8E8ED] text-sm"
                      emptyValue={1}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs text-[#86868B] mb-1">ราคา/หน่วย</label>
                    <PriceInput
                      min={0}
                      value={item.unit_price}
                      onChange={(val) => updateWorkItem(item.id, 'unit_price', val)}
                      className="bg-white border-[#E8E8ED] text-sm"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs text-[#86868B] mb-1">รวม</label>
                    <div className="px-3 py-2 bg-[#333] rounded-lg text-[#1D1D1F] text-sm">
                      ฿{(item.quantity * item.unit_price).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs text-[#86868B] mb-1">รายละเอียดเพิ่มเติม</label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateWorkItem(item.id, 'description', e.target.value)}
                    placeholder="รายละเอียดงาน..."
                    className="bg-white border-[#E8E8ED] text-sm"
                  />
                </div>

                {/* Products */}
                <div className="mt-4 pt-4 border-t border-[#E8E8ED]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#86868B]">สินค้าที่ใช้</span>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        setSelectedWorkItemId(item.id);
                        setShowProductModal(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      เพิ่มสินค้า
                    </Button>
                  </div>
                  
                  {item.products.length === 0 ? (
                    <p className="text-xs text-[#86868B] text-center py-2">ยังไม่มีสินค้า</p>
                  ) : (
                    <div className="space-y-2">
                      {item.products.map((product) => (
                        <div key={product.id} className="flex items-center gap-2 p-2 bg-white rounded">
                          <div className="flex-1">
                            <div className="text-sm text-[#1D1D1F]">{product.product_name}</div>
                            <div className="text-xs text-[#86868B]">SKU: {product.product_sku}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <QuantityInput
                              min={1}
                              value={product.quantity}
                              onChange={(val) => updateProductQuantity(item.id, product.id, val || 1)}
                              className="w-16 text-sm bg-[#F5F5F7] border-[#E8E8ED]"
                              emptyValue={1}
                            />
                            <span className="text-sm text-[#1D1D1F] w-20 text-right">
                              ฿{(product.quantity * product.unit_price).toLocaleString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                              onClick={() => removeProductFromWorkItem(item.id, product.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
              <label className="block text-sm text-[#86868B] mb-1">เงื่อนไขชำระเงิน</label>
              <select
                value={orderInfo.payment_terms}
                onChange={(e) => setOrderInfo({ ...orderInfo, payment_terms: e.target.value })}
                className="w-full px-3 py-2 bg-[#F5F5F7] border border-[#E8E8ED] rounded-lg text-[#1D1D1F]"
              >
                <option value="full">ชำระเต็มจำนวน</option>
                <option value="50_50">มัดจำ 50%</option>
                <option value="30_70">มัดจำ 30%</option>
              </select>
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
            <div className="flex justify-between text-gray-300">
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
              <div className="flex justify-between text-red-400">
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
            
            {orderInfo.shipping_cost > 0 && (
              <div className="flex justify-between text-gray-300">
                <span>ค่าจัดส่ง</span>
                <span>฿{orderInfo.shipping_cost.toLocaleString()}</span>
              </div>
            )}
            
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
              <span className="text-gray-300 text-sm">ต้องการใบกำกับภาษี</span>
            </label>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/orders">
          <Button variant="secondary">ยกเลิก</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              สร้างออเดอร์
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
        <div className="p-4">
          <Input
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, เบอร์โทร..."
            className="bg-[#F5F5F7] border-[#E8E8ED] mb-4"
          />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredCustomers.length === 0 ? (
              <p className="text-center text-[#86868B] py-4">ไม่พบลูกค้า</p>
            ) : (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => selectCustomer(customer)}
                  className="w-full text-left p-3 bg-white hover:bg-[#3a3a3a] rounded-lg transition-colors"
                >
                  <div className="text-[#1D1D1F]">{customer.name}</div>
                  <div className="text-sm text-[#86868B]">{customer.phone}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Product Search Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="เพิ่มสินค้า"
      >
        <div className="p-4">
          <Input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="ค้นหา SKU, รุ่น, สี..."
            className="bg-[#F5F5F7] border-[#E8E8ED] mb-4"
          />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-[#86868B] py-4">ไม่พบสินค้า</p>
            ) : (
              filteredProducts.slice(0, 50).map((product) => (
                <button
                  key={product.id}
                  onClick={() => selectedWorkItemId && addProductToWorkItem(selectedWorkItemId, product)}
                  className="w-full text-left p-3 bg-white hover:bg-[#3a3a3a] rounded-lg transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-[#1D1D1F]">{product.model} {product.color} {product.size}</div>
                    <div className="text-sm text-[#86868B]">SKU: {product.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-500">฿{product.price?.toLocaleString() || 0}</div>
                    <div className="text-xs text-[#86868B]">คงเหลือ: {product.quantity}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}


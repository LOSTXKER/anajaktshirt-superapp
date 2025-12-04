'use client';

import { useState, useRef } from 'react';
import { Card, Button, Modal, useToast } from '@/modules/shared/ui';
import {
  FileText,
  FileCheck,
  Receipt,
  Truck,
  Download,
  Printer,
  Eye,
  Send,
  Check,
  Copy,
} from 'lucide-react';
import type { Order, DocumentType } from '../types';

interface DocumentGeneratorProps {
  order: Order;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId: string;
    logo?: string;
  };
}

const DOCUMENT_TYPES = [
  { key: 'quotation', label: 'ใบเสนอราคา', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  { key: 'invoice', label: 'ใบแจ้งหนี้', icon: FileCheck, color: 'text-orange-600', bg: 'bg-orange-100' },
  { key: 'receipt', label: 'ใบเสร็จรับเงิน', icon: Receipt, color: 'text-green-600', bg: 'bg-green-100' },
  { key: 'delivery_note', label: 'ใบส่งของ', icon: Truck, color: 'text-purple-600', bg: 'bg-purple-100' },
];

const DEFAULT_COMPANY_INFO = {
  name: 'Anajak Shirt',
  address: '123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
  phone: '02-123-4567',
  email: 'contact@anajaktshirt.com',
  taxId: '0123456789012',
};

export function DocumentGenerator({ order, companyInfo = DEFAULT_COMPANY_INFO }: DocumentGeneratorProps) {
  const { success } = useToast();
  const [selectedDoc, setSelectedDoc] = useState<DocumentType | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDocumentNumber = (type: DocumentType) => {
    const prefix = {
      quotation: 'QT',
      invoice: 'INV',
      receipt: 'RC',
      delivery_note: 'DN',
      tax_invoice: 'TX',
    }[type];
    return `${prefix}-${order.order_number?.replace('ORD-', '') || '000'}`;
  };

  const getDocumentTitle = (type: DocumentType) => {
    return {
      quotation: 'ใบเสนอราคา / Quotation',
      invoice: 'ใบแจ้งหนี้ / Invoice',
      receipt: 'ใบเสร็จรับเงิน / Receipt',
      delivery_note: 'ใบส่งของ / Delivery Note',
      tax_invoice: 'ใบกำกับภาษี / Tax Invoice',
    }[type];
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedDoc ? getDocumentTitle(selectedDoc) : ''} - ${order.order_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Sarabun', 'Helvetica', sans-serif; padding: 20px; }
            @media print {
              body { padding: 0; }
              @page { margin: 15mm; }
            }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const copyDocNumber = () => {
    if (!selectedDoc) return;
    navigator.clipboard.writeText(getDocumentNumber(selectedDoc));
    success('คัดลอกเลขเอกสารแล้ว');
  };

  const renderDocument = () => {
    if (!selectedDoc) return null;

    return (
      <div ref={printRef} className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Sarabun, sans-serif' }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{companyInfo.name}</h1>
            <p className="text-sm text-gray-600 mt-1 max-w-xs">{companyInfo.address}</p>
            <p className="text-sm text-gray-600">โทร: {companyInfo.phone}</p>
            <p className="text-sm text-gray-600">Email: {companyInfo.email}</p>
            <p className="text-sm text-gray-600">เลขประจำตัวผู้เสียภาษี: {companyInfo.taxId}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-blue-600">{getDocumentTitle(selectedDoc)}</h2>
            <p className="text-lg font-mono mt-2">{getDocumentNumber(selectedDoc)}</p>
            <p className="text-sm text-gray-600 mt-1">วันที่: {formatDate(new Date().toISOString())}</p>
            {selectedDoc === 'quotation' && (
              <p className="text-sm text-gray-600">ยืนราคาถึง: {formatDate(
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              )}</p>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">ข้อมูลลูกค้า</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="text-gray-500">ชื่อ:</span> {order.customer_name}</p>
              <p><span className="text-gray-500">โทร:</span> {order.customer_phone || '-'}</p>
              <p><span className="text-gray-500">Email:</span> {order.customer_email || '-'}</p>
            </div>
            <div>
              {selectedDoc === 'delivery_note' ? (
                <>
                  <p className="font-medium text-gray-700">ที่อยู่จัดส่ง:</p>
                  <p>{order.shipping_address || '-'}</p>
                  <p>{order.shipping_district} {order.shipping_province} {order.shipping_postal_code}</p>
                </>
              ) : order.needs_tax_invoice && (
                <>
                  <p><span className="text-gray-500">ชื่อบริษัท:</span> {order.billing_name || '-'}</p>
                  <p><span className="text-gray-500">เลขประจำตัวผู้เสียภาษี:</span> {order.billing_tax_id || '-'}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reference */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            อ้างอิงออเดอร์: <span className="font-mono font-semibold">{order.order_number}</span>
          </p>
          {order.due_date && (
            <p className="text-sm text-gray-600">
              กำหนดส่งมอบ: <span className="font-semibold">{formatDate(order.due_date)}</span>
            </p>
          )}
        </div>

        {/* Items Table */}
        <table className="w-full mb-6 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left border">ลำดับ</th>
              <th className="p-3 text-left border">รายการ</th>
              <th className="p-3 text-center border">จำนวน</th>
              <th className="p-3 text-right border">ราคา/หน่วย</th>
              <th className="p-3 text-right border">รวม</th>
            </tr>
          </thead>
          <tbody>
            {order.work_items && order.work_items.length > 0 ? (
              order.work_items.map((item, index) => (
                <tr key={item.id}>
                  <td className="p-3 border text-center">{index + 1}</td>
                  <td className="p-3 border">
                    <div className="font-medium">{item.work_type_name}</div>
                    {item.description && (
                      <div className="text-gray-500 text-xs">{item.description}</div>
                    )}
                    {item.position_name && (
                      <div className="text-gray-500 text-xs">ตำแหน่ง: {item.position_name}</div>
                    )}
                  </td>
                  <td className="p-3 border text-center">{item.quantity}</td>
                  <td className="p-3 border text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="p-3 border text-right">{formatCurrency(item.total_price)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-3 border text-center">1</td>
                <td className="p-3 border">งานสั่งผลิตเสื้อ</td>
                <td className="p-3 border text-center">1</td>
                <td className="p-3 border text-right">{formatCurrency(order.subtotal)}</td>
                <td className="p-3 border text-right">{formatCurrency(order.subtotal)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mb-6">
          <div className="w-72">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">รวมเป็นเงิน</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between py-2 border-b text-red-600">
                <span>ส่วนลด {order.discount_reason && `(${order.discount_reason})`}</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            {order.shipping_cost > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">ค่าจัดส่ง</span>
                <span>{formatCurrency(order.shipping_cost)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 text-lg font-bold bg-blue-50 px-3 -mx-3 rounded">
              <span>ยอดรวมทั้งสิ้น</span>
              <span className="text-blue-600">{formatCurrency(order.total_amount)} บาท</span>
            </div>
            
            {/* Payment Info for Receipt */}
            {selectedDoc === 'receipt' && (
              <div className="mt-4 p-3 bg-green-50 rounded">
                <div className="flex justify-between text-green-700">
                  <span>ชำระแล้ว</span>
                  <span className="font-bold">{formatCurrency(order.paid_amount)} บาท</span>
                </div>
                {order.balance_due > 0 && (
                  <div className="flex justify-between text-orange-600 mt-1">
                    <span>ยอดค้างชำระ</span>
                    <span>{formatCurrency(order.balance_due)} บาท</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {selectedDoc === 'quotation' && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg text-sm">
            <h4 className="font-semibold text-yellow-800 mb-2">หมายเหตุ</h4>
            <ul className="list-disc list-inside text-yellow-700 space-y-1">
              <li>ราคานี้ยืนยันถึงวันที่ระบุข้างต้น</li>
              <li>กรุณาชำระเงินมัดจำ 50% ก่อนเริ่มงาน</li>
              <li>ระยะเวลาผลิต 7-14 วันทำการ หลังอนุมัติแบบ</li>
              <li>ราคานี้ยังไม่รวมค่าจัดส่ง (ถ้ามี)</li>
            </ul>
          </div>
        )}

        {/* Signature */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t">
          <div className="text-center">
            <div className="h-16 border-b border-gray-300 mb-2"></div>
            <p className="text-sm text-gray-600">ผู้รับของ / ลูกค้า</p>
            <p className="text-xs text-gray-400 mt-1">วันที่ ____/____/____</p>
          </div>
          <div className="text-center">
            <div className="h-16 border-b border-gray-300 mb-2"></div>
            <p className="text-sm text-gray-600">ผู้ส่งของ / ผู้ออกเอกสาร</p>
            <p className="text-xs text-gray-400 mt-1">{companyInfo.name}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-gray-400">
          <p>เอกสารนี้ออกโดยระบบ Anajak ERP</p>
          <p>พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Document Type Selection */}
      <Card className="p-6 bg-white border border-[#E8E8ED]">
        <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">สร้างเอกสาร</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DOCUMENT_TYPES.map((doc) => {
            const Icon = doc.icon;
            const isSelected = selectedDoc === doc.key;
            
            return (
              <button
                key={doc.key}
                onClick={() => setSelectedDoc(doc.key as DocumentType)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `${doc.bg} ${doc.color} border-current`
                    : 'bg-white border-[#E8E8ED] hover:border-[#007AFF] text-[#86868B] hover:text-[#007AFF]'
                }`}
              >
                <Icon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? doc.color : ''}`} />
                <p className="text-sm font-medium">{doc.label}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Document Actions */}
      {selectedDoc && (
        <Card className="p-6 bg-white border border-[#E8E8ED]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[#1D1D1F]">
                {getDocumentTitle(selectedDoc)}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono text-[#86868B]">
                  {getDocumentNumber(selectedDoc)}
                </span>
                <button onClick={copyDocNumber} className="text-[#007AFF] hover:text-[#0066CC]">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
                <Eye className="w-4 h-4 mr-2" />
                ดูตัวอย่าง
              </Button>
              <Button variant="secondary" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                พิมพ์
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                ดาวน์โหลด PDF
              </Button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-[#F5F5F7] rounded-xl">
            <div>
              <p className="text-sm text-[#86868B]">ลูกค้า</p>
              <p className="font-medium text-[#1D1D1F]">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-[#86868B]">ยอดรวม</p>
              <p className="font-medium text-[#1D1D1F]">฿{formatCurrency(order.total_amount)}</p>
            </div>
            <div>
              <p className="text-sm text-[#86868B]">สถานะชำระ</p>
              <p className={`font-medium ${
                order.payment_status === 'paid' ? 'text-green-600' :
                order.payment_status === 'partial' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {order.payment_status === 'paid' ? 'ชำระแล้ว' :
                 order.payment_status === 'partial' ? 'ชำระบางส่วน' :
                 'ยังไม่ชำระ'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={selectedDoc ? getDocumentTitle(selectedDoc) : ''}
        size="lg"
      >
        <div className="overflow-auto max-h-[70vh]">
          {renderDocument()}
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
            ปิด
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            พิมพ์
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default DocumentGenerator;


'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, ModalFooter } from '@/modules/shared/ui/Modal';
import { Button } from '@/modules/shared/ui/Button';
import { csvToProducts, generateImportTemplate, downloadCSV } from '../utils/csv';
import { ProductFormData } from '../types';
import { useProductMutations } from '../hooks/useProductMutations';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStatus = 'idle' | 'parsing' | 'preview' | 'importing' | 'success' | 'partial' | 'error';

interface ImportResult {
  success: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [products, setProducts] = useState<ProductFormData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  
  const { createProduct } = useProductMutations();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('parsing');
    setError(null);

    try {
      const text = await file.text();
      const parsedProducts = csvToProducts(text);
      
      if (parsedProducts.length === 0) {
        throw new Error('ไม่พบข้อมูลสินค้าในไฟล์ CSV');
      }

      setProducts(parsedProducts);
      setStatus('preview');
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateImportTemplate();
    downloadCSV(template, 'stock_import_template.csv');
  };

  const handleImport = async () => {
    setStatus('importing');
    setImportProgress({ current: 0, total: products.length });

    const result: ImportResult = {
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      setImportProgress({ current: i + 1, total: products.length });

      const createResult = await createProduct(product);
      
      if (createResult.success) {
        result.success++;
      } else if (createResult.isDuplicate) {
        // Duplicate SKU - skip or fail based on user preference
        if (skipDuplicates) {
          result.skipped++;
        } else {
          result.failed++;
          result.errors.push(`${product.sku}: SKU ซ้ำ`);
        }
      } else {
        // Other error
        result.failed++;
        result.errors.push(`${product.sku}: ${createResult.error}`);
      }
    }

    setImportResult(result);

    if (result.success === products.length) {
      setStatus('success');
      setTimeout(() => {
        onSuccess();
        handleReset();
        onClose();
      }, 1500);
    } else if (result.success > 0 || result.skipped > 0) {
      setStatus('partial');
      onSuccess(); // Refresh the product list
    } else {
      setError(`นำเข้าล้มเหลว\n${result.errors.slice(0, 5).join('\n')}`);
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setProducts([]);
    setError(null);
    setImportProgress({ current: 0, total: 0 });
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="นำเข้าสินค้าจาก CSV"
      description="อัปโหลดไฟล์ CSV เพื่อเพิ่มสินค้าจำนวนมาก"
      size="xl"
    >
      <div className="space-y-6">
        {/* Status: Idle - File Upload */}
        {status === 'idle' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#D2D2D7] rounded-xl p-8 text-center cursor-pointer hover:border-[#007AFF] hover:bg-[#007AFF]/5 transition-all"
            >
              <Upload className="w-12 h-12 mx-auto text-[#86868B] mb-4" />
              <p className="text-[#1D1D1F] font-medium mb-2">คลิกเพื่อเลือกไฟล์ CSV</p>
              <p className="text-[13px] text-[#86868B]">หรือลากไฟล์มาวางที่นี่</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-[#E8E8ED]" />
              <span className="text-[13px] text-[#86868B]">หรือ</span>
              <div className="h-px flex-1 bg-[#E8E8ED]" />
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleDownloadTemplate}
            >
              <Download className="w-4 h-4" />
              ดาวน์โหลดเทมเพลต CSV
            </Button>

            {/* CSV Format Guide */}
            <div className="p-4 bg-[#F5F5F7] rounded-xl">
              <p className="text-[13px] font-medium text-[#1D1D1F] mb-2">📋 รูปแบบ CSV ที่รองรับ:</p>
              <code className="text-[12px] text-[#86868B] block bg-white p-2 rounded-lg border border-[#E8E8ED]">
                SKU หลัก, SKU รอง, รุ่นเสื้อ, สี, ไซส์, ต้นทุนต่อหน่วย, ราคาขายต่อหน่วย
              </code>
            </div>
          </div>
        )}

        {/* Status: Parsing */}
        {status === 'parsing' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
            <p className="text-[#86868B]">กำลังอ่านไฟล์...</p>
          </div>
        )}

        {/* Status: Preview */}
        {status === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[#007AFF]/10 rounded-xl">
              <FileText className="w-6 h-6 text-[#007AFF]" />
              <div>
                <p className="font-medium text-[#007AFF]">พร้อมนำเข้า {products.length} รายการ</p>
                <p className="text-[13px] text-[#007AFF]/80">ตรวจสอบข้อมูลก่อนกดยืนยัน</p>
              </div>
            </div>

            <div className="max-h-[350px] overflow-auto border border-[#E8E8ED] rounded-xl">
              <table className="w-full text-[13px]">
                <thead className="bg-[#F5F5F7] sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-[#86868B] whitespace-nowrap">SKU หลัก</th>
                    <th className="px-3 py-2 text-left font-medium text-[#86868B] whitespace-nowrap">SKU รอง</th>
                    <th className="px-3 py-2 text-left font-medium text-[#86868B] whitespace-nowrap">รุ่นเสื้อ</th>
                    <th className="px-3 py-2 text-left font-medium text-[#86868B]">สี</th>
                    <th className="px-3 py-2 text-left font-medium text-[#86868B]">ไซส์</th>
                    <th className="px-3 py-2 text-right font-medium text-[#86868B]">ต้นทุน</th>
                    <th className="px-3 py-2 text-right font-medium text-[#86868B]">ราคาขาย</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={index} className="border-t border-[#F5F5F7] hover:bg-[#F5F5F7]/50">
                      <td className="px-3 py-2">
                        <code className="px-1.5 py-0.5 rounded bg-[#007AFF]/10 text-[#007AFF] text-[11px] font-mono">
                          {product.main_sku}
                        </code>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-[#86868B]">{product.sku}</td>
                      <td className="px-3 py-2 font-medium text-[#1D1D1F]">{product.model}</td>
                      <td className="px-3 py-2 text-[#86868B]">{product.color}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded bg-[#F5F5F7] text-[#1D1D1F] text-[11px] font-medium">
                          {product.size}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-[#86868B]">฿{product.cost?.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-medium text-[#1D1D1F]">฿{product.price?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Options */}
            <label className="flex items-center gap-3 p-3 bg-[#F5F5F7] rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="w-5 h-5 rounded border-[#D2D2D7] text-[#007AFF] focus:ring-[#007AFF]"
              />
              <div>
                <p className="text-[14px] font-medium text-[#1D1D1F]">ข้าม SKU ที่ซ้ำ</p>
                <p className="text-[12px] text-[#86868B]">ถ้าพบ SKU ซ้ำในระบบ จะข้ามไปนำเข้าตัวถัดไป</p>
              </div>
            </label>

            <ModalFooter>
              <Button variant="outline" onClick={handleReset}>
                เลือกไฟล์ใหม่
              </Button>
              <Button variant="primary" onClick={handleImport}>
                <Upload className="w-4 h-4 mr-2" />
                นำเข้า {products.length} รายการ
              </Button>
            </ModalFooter>
          </div>
        )}

        {/* Status: Importing */}
        {status === 'importing' && (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#E8E8ED] border-t-[#007AFF] animate-spin" />
            <div>
              <p className="text-[#1D1D1F] font-medium">กำลังนำเข้า...</p>
              <p className="text-[13px] text-[#86868B]">
                {importProgress.current} / {importProgress.total} รายการ
              </p>
            </div>
            <div className="w-full h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#007AFF]"
                initial={{ width: 0 }}
                animate={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Status: Success */}
        {status === 'success' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#34C759]/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#34C759]" />
            </div>
            <p className="text-[17px] font-medium text-[#1D1D1F]">นำเข้าสำเร็จ!</p>
            <p className="text-[13px] text-[#86868B]">เพิ่มสินค้า {products.length} รายการแล้ว</p>
          </motion.div>
        )}

        {/* Status: Partial Success */}
        {status === 'partial' && importResult && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4"
          >
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FF9500]/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[#FF9500]" />
              </div>
              <p className="text-[17px] font-medium text-[#1D1D1F]">นำเข้าเสร็จสิ้น</p>
            </div>

            {/* Result Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-[#34C759]/10 rounded-xl text-center">
                <p className="text-[24px] font-semibold text-[#34C759]">{importResult.success}</p>
                <p className="text-[12px] text-[#34C759]">สำเร็จ</p>
              </div>
              <div className="p-3 bg-[#FF9500]/10 rounded-xl text-center">
                <p className="text-[24px] font-semibold text-[#FF9500]">{importResult.skipped}</p>
                <p className="text-[12px] text-[#FF9500]">ข้าม (ซ้ำ)</p>
              </div>
              <div className="p-3 bg-[#FF3B30]/10 rounded-xl text-center">
                <p className="text-[24px] font-semibold text-[#FF3B30]">{importResult.failed}</p>
                <p className="text-[12px] text-[#FF3B30]">ล้มเหลว</p>
              </div>
            </div>

            {/* Error Details */}
            {importResult.errors.length > 0 && (
              <div className="p-3 bg-[#FF3B30]/10 rounded-xl">
                <p className="text-[12px] font-medium text-[#FF3B30] mb-2">รายละเอียดข้อผิดพลาด:</p>
                <ul className="text-[11px] text-[#FF3B30]/80 space-y-1">
                  {importResult.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {importResult.errors.length > 5 && (
                    <li>• และอีก {importResult.errors.length - 5} รายการ...</li>
                  )}
                </ul>
              </div>
            )}

            <ModalFooter>
              <Button variant="outline" onClick={handleReset}>
                นำเข้าเพิ่มเติม
              </Button>
              <Button variant="primary" onClick={() => { handleReset(); onClose(); }}>
                เสร็จสิ้น
              </Button>
            </ModalFooter>
          </motion.div>
        )}

        {/* Status: Error */}
        {status === 'error' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#FF3B30] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#FF3B30]">เกิดข้อผิดพลาด</p>
                  <p className="text-[13px] text-[#FF3B30]/80 whitespace-pre-line mt-1">{error}</p>
                </div>
              </div>
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={handleReset}>
                ลองใหม่
              </Button>
            </ModalFooter>
          </div>
        )}
      </div>
    </Modal>
  );
}

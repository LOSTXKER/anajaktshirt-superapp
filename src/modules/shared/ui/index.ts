/**
 * Shared UI Components
 * ใช้สำหรับ import ทุก component จากที่เดียว
 * 
 * @example
 * import { Button, Card, Modal, StatusBadge } from '@/modules/shared/ui';
 */

// Core Components
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, StatCard } from './Card';

export { Input, Textarea, Label } from './Input';
export type { InputProps, TextareaProps, LabelProps } from './Input';

export { Modal, ModalFooter } from './Modal';

export { Select } from './Select';
export type { SelectProps } from './Select';

export { Badge } from './Badge';

export { Dropdown } from './Dropdown';

// Status Components
export { StatusBadge, PaymentStatusBadge, PriorityBadge } from './StatusBadge';

// State Components
export { EmptyState, LoadingState, ErrorState } from './EmptyState';

// Layout Components
export { PageHeader, PageContainer, Section } from './PageHeader';

// Navigation
export { Sidebar } from './Sidebar';

// Toast
export { ToastProvider, useToast, ConfirmDialog } from './Toast';
export type { ConfirmDialogProps } from './Toast';

// File Upload
export { FileUpload, ImageUpload } from './FileUpload';

// Number Input
export { NumberInput, QuantityInput, PriceInput } from './NumberInput';


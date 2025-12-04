'use client';

import { useState } from 'react';
import { createClient } from '@/modules/shared/services/supabase-client';

const supabase = createClient();
import { auditService } from '@/modules/audit/services/auditService';
import type {
  Order,
  OrderStatus,
  CreateOrderInput,
  UpdateOrderInput,
  CreateWorkItemInput,
  CreateOrderProductInput,
  CreateOrderDesignInput,
  CreatePaymentInput,
} from '../types';

export function useOrderMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =============================================
  // ORDER CRUD
  // =============================================

  const createOrder = async (
    input: CreateOrderInput & { 
      work_items?: any[]; 
      subtotal?: number; 
      total_amount?: number;
      metadata?: any;
      notes?: string;
      requires_tax_invoice?: boolean;
      shipping_subdistrict?: string;
    }
  ): Promise<Order | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Generate order number
      const { data: orderNumber, error: orderNumError } = await supabase.rpc('generate_order_number');
      if (orderNumError) {
        console.warn('Failed to generate order number, using fallback');
      }
      
      // Generate access token
      const { data: accessToken, error: tokenError } = await supabase.rpc('generate_access_token');
      if (tokenError) {
        console.warn('Failed to generate access token, using fallback');
      }

      // Fallback order number if RPC fails
      const finalOrderNumber = orderNumber || `ORD-${Date.now()}`;
      const finalAccessToken = accessToken || crypto.randomUUID();

      // Calculate totals
      const subtotal = input.subtotal || 0;
      const discountAmount = input.discount_amount || 0;
      const shippingCost = input.shipping_cost || 0;
      const totalAmount = input.total_amount || (subtotal - discountAmount + shippingCost);

      const { data: order, error: createError } = await supabase
        .from('orders')
        .insert({
          order_number: finalOrderNumber,
          access_token: finalAccessToken,
          customer_id: input.customer_id || null,
          customer_name: input.customer_name,
          customer_phone: input.customer_phone || null,
          customer_email: input.customer_email || null,
          customer_line_id: input.customer_line_id || null,
          shipping_name: input.shipping_name || input.customer_name || null,
          shipping_phone: input.shipping_phone || input.customer_phone || null,
          shipping_address: input.shipping_address || null,
          shipping_subdistrict: input.shipping_subdistrict || null,
          shipping_district: input.shipping_district || null,
          shipping_province: input.shipping_province || null,
          shipping_postal_code: input.shipping_postal_code || null,
          billing_name: input.billing_name || null,
          billing_tax_id: input.billing_tax_id || null,
          billing_address: input.billing_address || null,
          billing_phone: input.billing_phone || null,
          needs_tax_invoice: input.needs_tax_invoice || input.requires_tax_invoice || false,
          due_date: input.due_date || null,
          customer_note: input.customer_note || null,
          internal_note: input.internal_note || input.notes || null,
          sales_channel: input.sales_channel || null,
          subtotal: subtotal,
          discount_amount: discountAmount,
          discount_percent: input.discount_percent || 0,
          discount_reason: input.discount_reason || null,
          shipping_cost: shippingCost,
          total_amount: totalAmount,
          payment_terms: input.payment_terms || 'full',
          status: 'draft',
          created_by: user?.id,
          sales_person_id: user?.id,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        })
        .select()
        .single();

      if (createError) {
        console.error('Order create error:', createError);
        throw createError;
      }

      // Create work items if provided
      if (input.work_items && input.work_items.length > 0) {
        console.log('Creating work items:', input.work_items.length);
        
        const workItemsToInsert = input.work_items.map(item => ({
          order_id: order.id,
          work_type_code: item.work_type_code || null,
          work_type_name: item.work_type_name || item.description || 'รายการงาน',
          position_code: item.position_code || null,
          position_name: item.position_name || null,
          print_size_code: item.print_size_code || null,
          print_size_name: item.print_size_name || null,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: (item.quantity || 1) * (item.unit_price || 0),
          description: item.description || null,
          status: 'pending',
        }));

        console.log('Work items to insert:', workItemsToInsert);

        const { data: createdItems, error: workItemsError } = await supabase
          .from('order_work_items')
          .insert(workItemsToInsert)
          .select();

        if (workItemsError) {
          console.error('Failed to create work items:', workItemsError);
          // Don't throw - order was created, just work items failed
        } else {
          console.log('Work items created successfully:', createdItems?.length);
        }
      } else {
        console.log('No work items to create');
      }

      // Audit log
      try {
        await auditService.log({
          userId: user?.id,
          action: 'create',
          entityType: 'order',
          entityId: order.id,
          newData: order,
        });
      } catch (auditErr) {
        console.warn('Audit log failed:', auditErr);
      }

      return order as Order;
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (
    orderId: string,
    input: UpdateOrderInput
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get old data for audit
      const { data: oldOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Audit log
      await auditService.log({
        userId: user?.id,
        action: 'update',
        entityType: 'order',
        entityId: orderId,
        oldData: oldOrder,
        newData: input,
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error updating order:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get current status
      const { data: order } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      const oldStatus = order?.status;

      // Update status
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Set completion/ship dates
      if (newStatus === 'completed') {
        updateData.completed_date = new Date().toISOString();
      } else if (newStatus === 'shipped') {
        updateData.shipped_date = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Record status history
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        from_status: oldStatus,
        to_status: newStatus,
        changed_by: user?.id,
        reason: reason || null,
      });

      // Audit log
      await auditService.log({
        userId: user?.id,
        action: 'update',
        entityType: 'order',
        entityId: orderId,
        oldData: { status: oldStatus },
        newData: { status: newStatus, reason },
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (
    orderId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> => {
    return updateOrderStatus(orderId, 'cancelled', reason);
  };

  // =============================================
  // WORK ITEMS
  // =============================================

  const addWorkItem = async (
    input: CreateWorkItemInput
  ): Promise<{ success: boolean; workItemId?: string; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const totalPrice = (input.quantity || 1) * (input.unit_price || 0);

      const { data, error: createError } = await supabase
        .from('order_work_items')
        .insert({
          order_id: input.order_id,
          work_type_id: input.work_type_id || null,
          work_type_code: input.work_type_code,
          work_type_name: input.work_type_name,
          description: input.description || null,
          quantity: input.quantity || 1,
          unit_price: input.unit_price || 0,
          total_price: totalPrice,
          position_code: input.position_code || null,
          position_name: input.position_name || null,
          print_size_code: input.print_size_code || null,
          print_size_name: input.print_size_name || null,
          assigned_to: input.assigned_to || null,
          due_date: input.due_date || null,
          priority: input.priority || 0,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (createError) throw createError;

      return { success: true, workItemId: data.id };
    } catch (err: any) {
      console.error('Error adding work item:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateWorkItem = async (
    workItemId: string,
    updates: Partial<CreateWorkItemInput>
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const updateData: any = { ...updates, updated_at: new Date().toISOString() };
      
      // Recalculate total if quantity or unit_price changed
      if (updates.quantity !== undefined || updates.unit_price !== undefined) {
        const { data: current } = await supabase
          .from('order_work_items')
          .select('quantity, unit_price')
          .eq('id', workItemId)
          .single();

        const qty = updates.quantity ?? current?.quantity ?? 1;
        const price = updates.unit_price ?? current?.unit_price ?? 0;
        updateData.total_price = qty * price;
      }

      const { error: updateError } = await supabase
        .from('order_work_items')
        .update(updateData)
        .eq('id', workItemId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err: any) {
      console.error('Error updating work item:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkItem = async (
    workItemId: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('order_work_items')
        .delete()
        .eq('id', workItemId);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (err: any) {
      console.error('Error deleting work item:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // ORDER PRODUCTS
  // =============================================

  const addOrderProduct = async (
    input: CreateOrderProductInput
  ): Promise<{ success: boolean; productId?: string; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const totalPrice = input.quantity * input.unit_price;

      const { data, error: createError } = await supabase
        .from('order_products')
        .insert({
          order_id: input.order_id,
          order_work_item_id: input.order_work_item_id || null,
          product_id: input.product_id || null,
          product_sku: input.product_sku,
          product_name: input.product_name,
          product_model: input.product_model || null,
          product_color: input.product_color || null,
          product_size: input.product_size || null,
          quantity: input.quantity,
          unit_cost: input.unit_cost || 0,
          unit_price: input.unit_price,
          total_price: totalPrice,
        })
        .select()
        .single();

      if (createError) throw createError;

      return { success: true, productId: data.id };
    } catch (err: any) {
      console.error('Error adding order product:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateOrderProduct = async (
    productId: string,
    updates: Partial<CreateOrderProductInput>
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const updateData: any = { ...updates };

      // Recalculate total if quantity or unit_price changed
      if (updates.quantity !== undefined || updates.unit_price !== undefined) {
        const { data: current } = await supabase
          .from('order_products')
          .select('quantity, unit_price')
          .eq('id', productId)
          .single();

        const qty = updates.quantity ?? current?.quantity ?? 1;
        const price = updates.unit_price ?? current?.unit_price ?? 0;
        updateData.total_price = qty * price;
      }

      const { error: updateError } = await supabase
        .from('order_products')
        .update(updateData)
        .eq('id', productId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err: any) {
      console.error('Error updating order product:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteOrderProduct = async (
    productId: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('order_products')
        .delete()
        .eq('id', productId);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (err: any) {
      console.error('Error deleting order product:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // DESIGNS
  // =============================================

  const addDesign = async (
    input: CreateOrderDesignInput
  ): Promise<{ success: boolean; designId?: string; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: createError } = await supabase
        .from('order_designs')
        .insert({
          order_id: input.order_id,
          order_work_item_id: input.order_work_item_id || null,
          design_name: input.design_name,
          position: input.position || null,
          brief_text: input.brief_text || null,
          assigned_designer_id: input.assigned_designer_id || null,
        })
        .select()
        .single();

      if (createError) throw createError;

      return { success: true, designId: data.id };
    } catch (err: any) {
      console.error('Error adding design:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const addDesignVersion = async (
    designId: string,
    fileUrl: string,
    thumbnailUrl?: string
  ): Promise<{ success: boolean; versionId?: string; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get current version number
      const { data: design } = await supabase
        .from('order_designs')
        .select('current_version, revision_count')
        .eq('id', designId)
        .single();

      const newVersion = (design?.current_version || 0) + 1;

      // Insert version
      const { data: version, error: versionError } = await supabase
        .from('design_versions')
        .insert({
          order_design_id: designId,
          version_number: newVersion,
          file_url: fileUrl,
          thumbnail_url: thumbnailUrl || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Update design
      await supabase
        .from('order_designs')
        .update({
          current_version: newVersion,
          revision_count: (design?.revision_count || 0) + 1,
          status: 'awaiting_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', designId);

      return { success: true, versionId: version.id };
    } catch (err: any) {
      console.error('Error adding design version:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const approveDesignVersion = async (
    versionId: string,
    feedback?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      // Update version
      const { data: version, error: versionError } = await supabase
        .from('design_versions')
        .update({
          status: 'approved',
          feedback: feedback || null,
          feedback_by: 'customer',
          feedback_at: new Date().toISOString(),
        })
        .eq('id', versionId)
        .select('order_design_id, file_url')
        .single();

      if (versionError) throw versionError;

      // Update design status to approved and set final file
      await supabase
        .from('order_designs')
        .update({
          status: 'approved',
          final_file_url: version.file_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', version.order_design_id);

      return { success: true };
    } catch (err: any) {
      console.error('Error approving design:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const rejectDesignVersion = async (
    versionId: string,
    feedback: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      // Update version
      const { data: version, error: versionError } = await supabase
        .from('design_versions')
        .update({
          status: 'rejected',
          feedback: feedback,
          feedback_by: 'customer',
          feedback_at: new Date().toISOString(),
        })
        .eq('id', versionId)
        .select('order_design_id')
        .single();

      if (versionError) throw versionError;

      // Update design status to revision_requested
      await supabase
        .from('order_designs')
        .update({
          status: 'revision_requested',
          updated_at: new Date().toISOString(),
        })
        .eq('id', version.order_design_id);

      return { success: true };
    } catch (err: any) {
      console.error('Error rejecting design:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // MOCKUPS
  // =============================================

  const addMockup = async (
    input: {
      order_id: string;
      design_id?: string;
      front_image_url?: string;
      back_image_url?: string;
      note?: string;
    }
  ): Promise<{ success: boolean; mockupId?: string; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get current version number for this design
      let newVersion = 1;
      if (input.design_id) {
        const { data: existingMockups } = await supabase
          .from('order_mockups')
          .select('version_number')
          .eq('order_design_id', input.design_id)
          .order('version_number', { ascending: false })
          .limit(1);
        newVersion = (existingMockups?.[0]?.version_number || 0) + 1;
      }

      const { data, error: createError } = await supabase
        .from('order_mockups')
        .insert({
          order_id: input.order_id,
          order_design_id: input.design_id || null,
          version_number: newVersion,
          front_image_url: input.front_image_url || null,
          back_image_url: input.back_image_url || null,
          note: input.note || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      return { success: true, mockupId: data.id };
    } catch (err: any) {
      console.error('Error adding mockup:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const approveMockup = async (
    mockupId: string,
    feedback?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('order_mockups')
        .update({
          status: 'approved',
          feedback: feedback || null,
          approved_at: new Date().toISOString(),
        })
        .eq('id', mockupId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err: any) {
      console.error('Error approving mockup:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const rejectMockup = async (
    mockupId: string,
    feedback: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('order_mockups')
        .update({
          status: 'rejected',
          feedback: feedback,
        })
        .eq('id', mockupId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err: any) {
      console.error('Error rejecting mockup:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // PAYMENTS
  // =============================================

  const addPayment = async (
    input: {
      order_id: string;
      amount: number;
      payment_type: 'deposit' | 'partial' | 'full';
      slip_image_url?: string;
      note?: string;
    }
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: createError } = await supabase
        .from('order_payments')
        .insert({
          order_id: input.order_id,
          amount: input.amount,
          payment_type: input.payment_type,
          slip_image_url: input.slip_image_url || null,
          note: input.note || null,
          status: 'pending',
          payment_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;

      return { success: true, paymentId: data.id };
    } catch (err: any) {
      console.error('Error adding payment:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };
  
  const confirmPayment = async (
    paymentId: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update payment status
      const { data: payment, error: updateError } = await supabase
        .from('order_payments')
        .update({
          status: 'confirmed',
          confirmed_by: user?.id,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .select('order_id, amount')
        .single();

      if (updateError) throw updateError;

      // Update order payment totals
      if (payment) {
        const { data: payments } = await supabase
          .from('order_payments')
          .select('amount')
          .eq('order_id', payment.order_id)
          .eq('status', 'confirmed');

        const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

        const { data: order } = await supabase
          .from('orders')
          .select('final_amount')
          .eq('id', payment.order_id)
          .single();

        const paymentStatus = totalPaid >= (order?.final_amount || 0) ? 'paid' : 
                              totalPaid > 0 ? 'partial' : 'unpaid';

        await supabase
          .from('orders')
          .update({
            paid_amount: totalPaid,
            balance_due: (order?.final_amount || 0) - totalPaid,
            payment_status: paymentStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.order_id);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error confirming payment:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const rejectPayment = async (
    paymentId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('order_payments')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err: any) {
      console.error('Error rejecting payment:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (
    paymentId: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update payment
      const { data: payment, error: updateError } = await supabase
        .from('order_payments')
        .update({
          status: approved ? 'verified' : 'rejected',
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          rejection_reason: approved ? null : rejectionReason,
        })
        .eq('id', paymentId)
        .select('order_id, amount')
        .single();

      if (updateError) throw updateError;

      // Update order paid_amount if approved
      if (approved && payment) {
        // Get total paid
        const { data: payments } = await supabase
          .from('order_payments')
          .select('amount')
          .eq('order_id', payment.order_id)
          .eq('status', 'verified');

        const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

        // Get order total
        const { data: order } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('id', payment.order_id)
          .single();

        const paymentStatus = totalPaid >= (order?.total_amount || 0) ? 'paid' : 
                              totalPaid > 0 ? 'partial' : 'unpaid';

        await supabase
          .from('orders')
          .update({
            paid_amount: totalPaid,
            payment_status: paymentStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.order_id);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // PRODUCTION
  // =============================================

  const sendToProduction = async (
    orderId: string,
    workItemIds?: string[] // If not provided, send all work items
  ): Promise<{ success: boolean; jobIds?: string[]; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get order with work items
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          work_items:order_work_items(*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const workItems = workItemIds 
        ? order.work_items.filter((item: any) => workItemIds.includes(item.id))
        : order.work_items;

      if (!workItems || workItems.length === 0) {
        throw new Error('ไม่มีรายการงานที่จะส่งเข้าผลิต');
      }

      const jobIds: string[] = [];

      // Create production job for each work item
      for (const item of workItems) {
        // Check if job already exists for this work item
        const { data: existingJob } = await supabase
          .from('production_jobs')
          .select('id')
          .eq('order_work_item_id', item.id)
          .single();

        if (existingJob) {
          jobIds.push(existingJob.id);
          continue; // Skip if already exists
        }

        // Generate job number - fallback if RPC doesn't exist
        let jobNumber = `PJ-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        try {
          const { data: rpcJobNumber, error: rpcError } = await supabase.rpc('generate_job_number');
          if (!rpcError && rpcJobNumber) {
            jobNumber = rpcJobNumber;
          }
        } catch (e) {
          // RPC might not exist, use fallback
          console.log('generate_job_number RPC not available, using fallback');
        }

        // Create production job
        const qty = item.quantity || 1;
        const custName = order.customer_name || 'ไม่ระบุชื่อ';
        const prodDesc = `${item.work_type_name || 'งาน'} - ${item.position_name || ''} ${item.print_size_name || ''}`.trim() || 'Production Job';
        
        const jobData = {
          job_number: jobNumber,
          order_id: orderId,
          order_work_item_id: item.id,
          work_type_code: item.work_type_code || 'GENERAL',
          work_type_name: item.work_type_name || 'งานทั่วไป',
          // Required NOT NULL fields (from old schema)
          customer_name: custName,
          product_description: prodDesc,
          quantity: qty,  // Old schema field (NOT NULL)
          // New schema fields
          ordered_qty: qty,
          status: 'pending',
          priority: 'normal',  // Old schema uses text, not int
          due_date: order.due_date || null,
          created_by: user?.id || null,
        };

        console.log('Creating production job with data:', jobData);

        const { data: job, error: jobError } = await supabase
          .from('production_jobs')
          .insert(jobData)
          .select()
          .single();

        if (jobError) {
          console.error('Job creation error:', jobError);
          throw jobError;
        }

        jobIds.push(job.id);

        // Update work item status
        await supabase
          .from('order_work_items')
          .update({ status: 'in_production' })
          .eq('id', item.id);
      }

      // Update order status to in_production if all items are sent
      const allSent = order.work_items.every((item: any) => 
        workItems.some((wi: any) => wi.id === item.id) || item.status === 'in_production'
      );

      if (allSent && order.status !== 'in_production') {
        await supabase
          .from('orders')
          .update({ 
            status: 'in_production',
            updated_at: new Date().toISOString() 
          })
          .eq('id', orderId);

        // Add status history
        await supabase.from('order_status_history').insert({
          order_id: orderId,
          from_status: order.status,
          to_status: 'in_production',
          reason: 'ส่งเข้าผลิตทั้งหมด',
          changed_by: user?.id,
        });
      }

      // Audit log
      await auditService.log({
        userId: user?.id,
        action: 'send_to_production',
        entityType: 'order',
        entityId: orderId,
        newData: { jobIds, workItemIds: workItems.map((w: any) => w.id) },
      });

      return { success: true, jobIds };
    } catch (err: any) {
      console.error('Error sending to production:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getProductionJobs = async (
    orderId: string
  ): Promise<{ success: boolean; jobs?: any[]; error?: string }> => {
    try {
      // First try with station join
      const { data: jobs, error } = await supabase
        .from('production_jobs')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('production_jobs table does not exist yet');
          return { success: true, jobs: [] };
        }
        throw error;
      }

      // Try to fetch station info separately if jobs exist
      if (jobs && jobs.length > 0) {
        const stationIds = [...new Set(jobs.filter(j => j.station_id).map(j => j.station_id))];
        if (stationIds.length > 0) {
          const { data: stations } = await supabase
            .from('production_stations')
            .select('id, code, name')
            .in('id', stationIds);
          
          // Map stations to jobs
          if (stations) {
            const stationMap = new Map(stations.map(s => [s.id, s]));
            jobs.forEach(job => {
              if (job.station_id) {
                job.station = stationMap.get(job.station_id) || null;
              }
            });
          }
        }
      }

      return { success: true, jobs: jobs || [] };
    } catch (err: any) {
      console.error('Error fetching production jobs:', err);
      // Return empty array instead of error for better UX
      return { success: true, jobs: [] };
    }
  };

  // =============================================
  // NOTES
  // =============================================

  const addNote = async (
    orderId: string,
    noteText: string,
    attachments?: string[],
    mentionedUsers?: string[]
  ): Promise<{ success: boolean; noteId?: string; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error: createError } = await supabase
        .from('order_notes')
        .insert({
          order_id: orderId,
          note_text: noteText,
          attachments: attachments || [],
          mentioned_users: mentionedUsers || [],
          created_by: user?.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      return { success: true, noteId: data.id };
    } catch (err: any) {
      console.error('Error adding note:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    // Orders
    createOrder,
    updateOrder,
    updateOrderStatus,
    cancelOrder,
    // Work Items
    addWorkItem,
    updateWorkItem,
    deleteWorkItem,
    // Products
    addOrderProduct,
    updateOrderProduct,
    deleteOrderProduct,
    // Designs
    addDesign,
    addDesignVersion,
    approveDesignVersion,
    rejectDesignVersion,
    // Mockups
    addMockup,
    approveMockup,
    rejectMockup,
    // Payments
    addPayment,
    confirmPayment,
    rejectPayment,
    verifyPayment,
    // Production
    sendToProduction,
    getProductionJobs,
    // Notes
    addNote,
  };
}


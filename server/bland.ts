// ============================================
// BLAND.AI WEBHOOK HANDLER
// ============================================

import { storage } from "./storage";

interface BlandCallData {
  call_id: string;
  call_length: number;
  to: string;
  from: string;
  completed: boolean;
  created_at: string;
  status: string;
  corrected_duration: string;
  end_at: string;
  variables: Record<string, any>;
  answered_by: string;
  summary: string;
  transcripts: Array<{
    id: number;
    created_at: string;
    text: string;
    user: string;
  }>;
  concatenated_transcript: string;
  analysis: Record<string, any>;
}

interface ExtractedCallInfo {
  customerName: string;
  phone: string;
  coatingType: "powder" | "ceramic" | "misc";
  partsDescription: string;
  isUrgent: boolean;
  summary: string;
}

export async function handleBlandWebhook(data: BlandCallData): Promise<{ success: boolean; estimateId?: string; error?: string }> {
  try {
    console.log('[Bland] Received webhook for call:', data.call_id);
    
    // Extract info from variables (set during the call)
    const variables = data.variables || {};
    
    const customerName = variables.customer_name || variables.name || 'Unknown Caller';
    const phone = variables.customer_phone || variables.phone || data.from || '';
    const coatingTypeRaw = (variables.coating_type || variables.service_type || '').toLowerCase();
    const partsDescription = variables.parts || variables.parts_description || variables.description || '';
    const isUrgent = variables.urgent === true || variables.urgent === 'yes' || variables.is_urgent === true;
    
    // Determine coating type
    let coatingType: "powder" | "ceramic" | "misc" = "misc";
    if (coatingTypeRaw.includes('powder')) {
      coatingType = "powder";
    } else if (coatingTypeRaw.includes('ceramic')) {
      coatingType = "ceramic";
    }
    
    // Build notes from call
    const notes = [
      `📞 Inbound call received via AI assistant`,
      ``,
      `Parts: ${partsDescription || 'Not specified'}`,
      `Service: ${coatingType === 'powder' ? 'Powder Coating' : coatingType === 'ceramic' ? 'Ceramic Coating' : 'TBD'}`,
      `Urgent: ${isUrgent ? 'YES ⚠️' : 'No'}`,
      ``,
      `Call Summary: ${data.summary || 'No summary available'}`,
      ``,
      `--- Full Transcript ---`,
      data.concatenated_transcript || 'No transcript available',
    ].join('\n');

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const formattedPhone = cleanPhone.length === 10 
      ? `${cleanPhone.slice(0,3)}-${cleanPhone.slice(3,6)}-${cleanPhone.slice(6)}` 
      : phone;

    // Create estimate in CRM
    const estimate = await storage.createEstimate({
      customerName: customerName,
      phone: formattedPhone,
      serviceType: coatingType,
      date: new Date(),
      notes: notes,
      total: "0",
      status: "pending",
    });

    console.log('[Bland] Created estimate:', estimate.id, 'for', customerName);
    
    return { success: true, estimateId: estimate.id };
    
  } catch (error: any) {
    console.error('[Bland] Webhook error:', error.message);
    return { success: false, error: error.message };
  }
}

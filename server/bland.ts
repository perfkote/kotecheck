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
  variables?: Record<string, any>;
  answered_by: string;
  summary: string;
  transcripts?: Array<{
    id: number;
    created_at: string;
    text: string;
    user: string;
  }>;
  concatenated_transcript: string;
  analysis?: Record<string, any>;
}

export async function handleBlandWebhook(data: BlandCallData): Promise<{ success: boolean; estimateId?: string; error?: string }> {
  try {
    console.log('[Bland] Received webhook for call:', data.call_id);
    console.log('[Bland] From:', data.from);
    console.log('[Bland] Summary:', data.summary);
    
    const transcript = data.concatenated_transcript || '';
    const summary = data.summary || '';
    
    // Try to extract info from transcript
    const extracted = extractInfoFromTranscript(transcript, summary);
    
    // Use caller ID as fallback phone
    const phone = extracted.phone || data.from || '';
    
    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const formattedPhone = cleanPhone.length === 10 
      ? `${cleanPhone.slice(0,3)}-${cleanPhone.slice(3,6)}-${cleanPhone.slice(6)}` 
      : phone;

    // Build notes from call
    const notes = [
      `📞 Inbound call via AI assistant`,
      ``,
      `Caller: ${extracted.name || 'Unknown'}`,
      `Phone: ${formattedPhone}`,
      `Service: ${extracted.coatingType === 'powder' ? 'Powder Coating' : extracted.coatingType === 'ceramic' ? 'Ceramic Coating' : 'TBD'}`,
      `Parts: ${extracted.parts || 'See transcript'}`,
      `Urgent: ${extracted.urgent ? 'YES ⚠️' : 'No'}`,
      ``,
      `--- Summary ---`,
      summary || 'No summary available',
      ``,
      `--- Full Transcript ---`,
      transcript || 'No transcript available',
    ].join('\n');

    // Create estimate in CRM
    const estimate = await storage.createEstimate({
      customerName: extracted.name || 'Phone Inquiry',
      phone: formattedPhone,
      serviceType: extracted.coatingType,
      date: new Date(),
      notes: notes,
      total: "0",
      status: "pending",
    });

    console.log('[Bland] Created estimate:', estimate.id, 'for', extracted.name || 'Unknown');
    
    return { success: true, estimateId: estimate.id };
    
  } catch (error: any) {
    console.error('[Bland] Webhook error:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// TRANSCRIPT PARSING
// ============================================

interface ExtractedInfo {
  name: string | null;
  phone: string | null;
  coatingType: "powder" | "ceramic" | "misc";
  parts: string | null;
  urgent: boolean;
}

function extractInfoFromTranscript(transcript: string, summary: string): ExtractedInfo {
  const text = `${transcript} ${summary}`.toLowerCase();
  
  // Detect coating type
  let coatingType: "powder" | "ceramic" | "misc" = "misc";
  if (text.includes('powder')) {
    coatingType = 'powder';
  } else if (text.includes('ceramic')) {
    coatingType = 'ceramic';
  }
  
  // Detect urgency
  const urgent = text.includes('urgent') || 
                 text.includes('rush') || 
                 text.includes('asap') || 
                 text.includes('quickly') ||
                 text.includes('hurry') ||
                 (text.includes('yes') && text.includes('urgent'));
  
  // Try to extract name (look for "my name is" or "this is" patterns)
  let name: string | null = null;
  const namePatterns = [
    /my name is ([a-z]+(?:\s+[a-z]+)?)/i,
    /this is ([a-z]+(?:\s+[a-z]+)?)/i,
    /i'm ([a-z]+(?:\s+[a-z]+)?)/i,
    /call me ([a-z]+)/i,
  ];
  for (const pattern of namePatterns) {
    const match = transcript.match(pattern);
    if (match) {
      name = match[1].trim();
      // Capitalize first letter of each word
      name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }
  
  // Try to extract phone number
  let phone: string | null = null;
  const phonePattern = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/;
  const phoneMatch = transcript.match(phonePattern);
  if (phoneMatch) {
    phone = phoneMatch[1];
  }
  
  // Try to extract parts description from summary (usually more concise)
  let parts: string | null = null;
  if (summary) {
    // The summary often contains what they want coated
    const partsPatterns = [
      /coat(?:ing|ed)?\s+(?:some\s+|their\s+|a\s+)?([^.]+)/i,
      /need(?:s|ed)?\s+(?:some\s+|their\s+|a\s+)?([^.]+?)\s+(?:coated|done)/i,
    ];
    for (const pattern of partsPatterns) {
      const match = summary.match(pattern);
      if (match) {
        parts = match[1].trim();
        break;
      }
    }
  }
  
  return { name, phone, coatingType, parts, urgent };
}

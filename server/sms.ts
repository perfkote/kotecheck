// ============================================
// TEXTBELT SMS SERVICE
// ============================================

const TEXTBELT_API_URL = 'https://textbelt.com/text';

// ============================================
// MESSAGE TEMPLATES
// ============================================

export const SMS_TEMPLATES = {
  jobReceived: (customerName: string) => 
    `Hi ${customerName.split(' ')[0]}, your items have been received at Performance Kote. We'll notify you when they're ready for pickup.`,
  
  jobFinished: (customerName: string) =>
    `Hi ${customerName.split(' ')[0]}, your items are complete and ready for pickup at Performance Kote. Thank you for your business!`,
};

// ============================================
// SEND SMS FUNCTION
// ============================================

interface SendSMSParams {
  to: string;
  message: string;
}

interface SendSMSResult {
  success: boolean;
  textId?: string;
  error?: string;
  quotaRemaining?: number;
}

export async function sendSMS({ to, message }: SendSMSParams): Promise<SendSMSResult> {
  const apiKey = process.env.TEXTBELT_API_KEY;
  
  if (!apiKey) {
    console.warn('[SMS] Textbelt not configured - missing API key');
    return { success: false, error: 'Textbelt not configured' };
  }

  // Clean phone number
  const cleanedPhone = formatPhoneE164(to);
  
  if (!cleanedPhone) {
    console.warn('[SMS] Invalid phone number:', to);
    return { success: false, error: 'Invalid phone number' };
  }

  try {
    const response = await fetch(TEXTBELT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanedPhone,
        message: message,
        key: apiKey,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`[SMS] Sent to ${cleanedPhone}: ${result.textId} (${result.quotaRemaining} texts remaining)`);
      return { 
        success: true, 
        textId: result.textId,
        quotaRemaining: result.quotaRemaining,
      };
    } else {
      console.error('[SMS] Failed to send:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error('[SMS] Request failed:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// JOB NOTIFICATION FUNCTIONS
// ============================================

export async function notifyJobReceived(customerName: string, phoneNumber: string): Promise<SendSMSResult> {
  const message = SMS_TEMPLATES.jobReceived(customerName);
  return sendSMS({ to: phoneNumber, message });
}

export async function notifyJobFinished(customerName: string, phoneNumber: string): Promise<SendSMSResult> {
  const message = SMS_TEMPLATES.jobFinished(customerName);
  return sendSMS({ to: phoneNumber, message });
}

// ============================================
// PHONE NUMBER FORMATTING
// ============================================

function formatPhoneE164(phone: string): string | null {
  if (!phone) return null;
  
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle US numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // Already has country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // Already in full format
  if (digits.length > 10) {
    return `+${digits}`;
  }
  
  // Invalid number
  return null;
}

// ============================================
// HELPER TO CHECK IF SMS IS ENABLED
// ============================================

export function isSMSEnabled(): boolean {
  return !!process.env.TEXTBELT_API_KEY;
}

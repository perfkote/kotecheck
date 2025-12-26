import type { Twilio } from 'twilio';

// ============================================
// CONFIGURATION (lazy loaded)
// ============================================

let client: Twilio | null = null;

function getClient(): Twilio | null {
  if (client) return client;
  
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    return null;
  }
  
  // Dynamic import to avoid build-time issues
  const twilio = require('twilio');
  client = twilio(accountSid, authToken);
  return client;
}

function getTwilioPhone(): string | undefined {
  return process.env.TWILIO_PHONE_NUMBER;
}

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
  messageId?: string;
  error?: string;
}

export async function sendSMS({ to, message }: SendSMSParams): Promise<SendSMSResult> {
  const twilioClient = getClient();
  const twilioPhone = getTwilioPhone();
  
  // Check if Twilio is configured
  if (!twilioClient) {
    console.warn('[SMS] Twilio not configured - missing credentials');
    return { success: false, error: 'Twilio not configured' };
  }

  if (!twilioPhone) {
    console.warn('[SMS] Twilio phone number not configured');
    return { success: false, error: 'Twilio phone number not configured' };
  }

  // Clean phone number - ensure it's in E.164 format
  const cleanedPhone = formatPhoneE164(to);
  
  if (!cleanedPhone) {
    console.warn('[SMS] Invalid phone number:', to);
    return { success: false, error: 'Invalid phone number' };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhone,
      to: cleanedPhone,
    });

    console.log(`[SMS] Sent to ${cleanedPhone}: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error: any) {
    console.error('[SMS] Failed to send:', error.message);
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
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
}

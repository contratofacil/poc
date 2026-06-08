import crypto from 'crypto';

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Simulates sending an email via SendGrid.
 * Since this is a mock, it prints to the console and simulates a slight delay if needed, 
 * but keeps it extremely fast (< 10ms) to ensure response times stay under 500ms.
 */
export async function sendVerificationEmail(
  email: string, 
  token: string
): Promise<EmailDispatchResult> {
  const messageId = `sg-mock-${crypto.randomUUID()}`;
  console.log(`[MOCK SENDGRID] Dispatching verification email to: ${email}`);
  console.log(`[MOCK SENDGRID] Verification URL: http://localhost:${process.env.PORT || 3000}/api/auth/verify?token=${token}`);
  console.log(`[MOCK SENDGRID] Message ID: ${messageId}`);
  
  return {
    success: true,
    messageId
  };
}

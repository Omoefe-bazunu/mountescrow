
'use client';

import { emailjsConfig } from '@/lib/config';
import emailjs from '@emailjs/browser';

interface EmailParams {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  deal_title?: string;
  deal_url?: string;
}

export async function sendEmail(params: EmailParams): Promise<void> {
  if (!emailjsConfig.serviceId || !emailjsConfig.templateId || !emailjsConfig.userId) {
    console.warn('EmailJS config is not complete. Skipping email notification.');
    return;
  }
  
  // Validate email parameters
  if (!params.to_email || !params.subject || !params.message) {
    console.error('Missing required email parameters:', { 
      hasEmail: !!params.to_email, 
      hasSubject: !!params.subject, 
      hasMessage: !!params.message 
    });
    return;
  }
  
  const templateParams = {
      ...params,
      to_email: params.to_email.trim(),
      to_name: params.to_name?.trim() || 'User',
      subject: params.subject.trim(),
      message: params.message.trim(),
      deal_title: params.deal_title || 'N/A',
      deal_url: params.deal_url || 'https://www.mountescrow.com/login', // default link
  };

  try {
    await emailjs.send(
      emailjsConfig.serviceId,
      emailjsConfig.templateId,
      templateParams,
      emailjsConfig.userId,
    );
    console.log(`Email successfully sent to ${params.to_email}`);
  } catch (error) {
    console.error('Failed to send email to', params.to_email, ':', error);
    // In a production app, you might want to log this to a more robust service.
    throw error; // Re-throw to allow caller to handle
  }
}

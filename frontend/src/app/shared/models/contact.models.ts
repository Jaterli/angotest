export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

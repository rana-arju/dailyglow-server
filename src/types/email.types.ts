export interface EmailBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'columns';
  content?: string;
  src?: string;
  alt?: string;
  link?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  padding?: string;
  margin?: string;
  width?: string;
  height?: number;
  borderRadius?: number;
  columns?: EmailBlock[][];
}

export interface EmailTemplate {
  blocks: EmailBlock[];
  settings?: {
    backgroundColor?: string;
    contentWidth?: number;
    fontFamily?: string;
  };
}

export interface EmailRenderContext {
  campaignId: string;
  contactId: string;
  trackingToken: string;
  contact: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  campaign: {
    subject: string;
    previewText?: string;
    fromName: string;
    fromEmail: string;
  };
  unsubscribeUrl: string;
  trackingPixelUrl: string;
}

export interface EmailHeaders {
  'List-Unsubscribe': string;
  'List-Unsubscribe-Post': string;
  'X-Campaign-ID': string;
  'X-Tracking-Token': string;
}

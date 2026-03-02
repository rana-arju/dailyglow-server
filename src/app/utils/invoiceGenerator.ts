/**
 * Generate a unique invoice number for shipments
 * Format: INV-YYYYMMDD-RANDOM
 * Example: INV-20250302-A1B2C3
 */
export const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random alphanumeric string (6 characters)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `INV-${year}${month}${day}-${random}`;
};

/**
 * Validate invoice format
 */
export const isValidInvoice = (invoice: string): boolean => {
  // Allow alphanumeric, hyphens, and underscores
  const regex = /^[a-zA-Z0-9_-]+$/;
  return regex.test(invoice) && invoice.length <= 50;
};

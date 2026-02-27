/**
 * Generate a unique order ID in the format: ORD-XXXXXX
 * Example: ORD-A3B7C9, ORD-X5Y2Z8
 */
export function generateOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let orderId = 'ORD-';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    orderId += chars[randomIndex];
  }
  
  return orderId;
}

/**
 * Generate a unique order ID with timestamp to ensure uniqueness
 * Example: ORD-A3B7C9D2E4
 */
export function generateUniqueOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  let orderId = 'ORD-';
  
  // Add 6 random characters
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    orderId += chars[randomIndex];
  }
  
  // Add timestamp-based suffix for uniqueness
  orderId += timestamp;
  
  return orderId;
}

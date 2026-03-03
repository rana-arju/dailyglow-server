export const normalizePhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  let normalized = phoneNumber.replace(/\D/g, '');

  // If it starts with 880, remove it and add 0 prefix
  if (normalized.startsWith('880')) {
    normalized = '0' + normalized.substring(3);
  }
  
  // Ensure it starts with 0 for BD numbers
  if (!normalized.startsWith('0') && normalized.length === 10) {
    normalized = '0' + normalized;
  }

  return normalized;
};

export const generateRandomPassword = (length: number = 8): string => {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
};

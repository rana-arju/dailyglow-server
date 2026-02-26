/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param id - The string to validate
 * @returns boolean - true if valid ObjectId format
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validates ObjectId and throws error if invalid
 * @param id - The string to validate
 * @param fieldName - Name of the field for error message
 * @throws Error if invalid
 */
export const validateObjectId = (id: string, fieldName: string = 'ID'): void => {
  if (!isValidObjectId(id)) {
    throw new Error(
      `Invalid ${fieldName} format. Must be a valid MongoDB ObjectId (24 hex characters).`
    );
  }
};

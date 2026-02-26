import prisma from '../../lib/prisma';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';
import fs from 'fs';
import { parse } from 'csv-parse';
import { ContactFolderService } from '../ContactFolder/ContactFolder.service';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeHeader = (header: string): string => {
  const normalized = header.toLowerCase().trim().replace(/\s+/g, '');
  const emailVariants = ['email', 'emailaddress', 'e-mail', 'mail', 'emailid'];
  if (emailVariants.includes(normalized)) return 'email';
  const firstNameVariants = ['firstname', 'fname', 'first', 'givenname'];
  if (firstNameVariants.includes(normalized)) return 'firstName';
  const lastNameVariants = ['lastname', 'lname', 'last', 'surname', 'familyname'];
  if (lastNameVariants.includes(normalized)) return 'lastName';
  return normalized;
};

const validateEmail = (email: string): string | null => {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !EMAIL_REGEX.test(trimmed)) return null;
  return trimmed;
};

const parseCSVForPreview = async (filePath: string) => {
  return new Promise<any>((resolve, reject) => {
    const results: any[] = [];
    const emailSet = new Set<string>();
    const duplicatesInCSV = new Set<string>();
    let totalRows = 0;
    let validEmails = 0;
    let invalidEmails = 0;

    fs.createReadStream(filePath)
      .pipe(parse({ columns: (headers) => headers.map(normalizeHeader), skip_empty_lines: true, trim: true, bom: true }))
      .on('data', (row) => {
        totalRows++;
        if (!row.email || row.email === '' || row.email.toLowerCase() === 'sl') return;
        const email = validateEmail(row.email);
        if (!email) {
          invalidEmails++;
          results.push({ email: row.email || '', firstName: row.firstName || '', lastName: row.lastName || '', status: 'invalid', reason: 'Invalid email format' });
          return;
        }
        if (emailSet.has(email)) {
          duplicatesInCSV.add(email);
          results.push({ email, firstName: row.firstName || '', lastName: row.lastName || '', status: 'duplicate_csv', reason: 'Duplicate email in CSV' });
          return;
        }
        emailSet.add(email);
        validEmails++;
        results.push({ email, firstName: row.firstName || '', lastName: row.lastName || '', status: 'valid' });
      })
      .on('end', async () => {
        try {
          const validResults = results.filter((r) => r.status === 'valid');
          const emailsToCheck = validResults.map((r) => r.email);
          const existingContacts = await prisma.contact.findMany({ where: { email: { in: emailsToCheck } }, select: { email: true } });
          const existingEmailSet = new Set(existingContacts.map((c) => c.email));
          let duplicateInDB = 0;
          const finalResults = results.map((row) => {
            if (row.status === 'valid' && existingEmailSet.has(row.email)) {
              duplicateInDB++;
              return { ...row, status: 'duplicate_db', reason: 'Email already exists in database' };
            }
            return row;
          });
          resolve({ totalRows, validEmails: validEmails - duplicateInDB, invalidEmails, duplicateInCSV: duplicatesInCSV.size, duplicateInDB, previewData: finalResults });
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
};

const importContactsFromPreview = async (folderId: string | undefined, folderName: string | undefined, previewData: Array<{ email: string; firstName?: string; lastName?: string }>) => {
  const startTime = Date.now();
  let targetFolderId: string;
  if (folderId) {
    const folder = await prisma.contactFolder.findUnique({ where: { id: folderId } });
    if (!folder) throw new ApiError(httpStatus.NOT_FOUND, 'Folder not found');
    targetFolderId = folderId;
  } else if (folderName) {
    const folder = await ContactFolderService.findOrCreateFolder(folderName);
    targetFolderId = folder.id;
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Either folderId or folderName is required');
  }
  const validContacts = previewData.filter((contact) => validateEmail(contact.email) !== null);
  let importedCount = 0;
  let skippedDuplicateDB = 0;
  const BATCH_SIZE = 1000;
  const batches = [];
  for (let i = 0; i < validContacts.length; i += BATCH_SIZE) {
    batches.push(validContacts.slice(i, i + BATCH_SIZE));
  }
  for (const batch of batches) {
    for (const contact of batch) {
      try {
        await prisma.contact.create({ data: { email: validateEmail(contact.email)!, firstName: contact.firstName?.trim() || null, lastName: contact.lastName?.trim() || null, folderId: targetFolderId } });
        importedCount++;
      } catch (err: any) {
        if (err.code === 'P2002' || err.code === 11000) {
          skippedDuplicateDB++;
        } else {
          console.error('Error creating contact:', err);
          skippedDuplicateDB++;
        }
      }
    }
  }
  return { importedCount, skippedDuplicateDB, totalProcessed: validContacts.length, processingTime: Date.now() - startTime };
};

const createContact = async (data: { email: string; firstName?: string; lastName?: string; folderId: string }) => {
  const folder = await prisma.contactFolder.findUnique({ where: { id: data.folderId } });
  if (!folder) throw new ApiError(httpStatus.NOT_FOUND, 'Folder not found');
  const existingContact = await prisma.contact.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (existingContact) throw new ApiError(httpStatus.CONFLICT, 'Contact with this email already exists');
  return await prisma.contact.create({ data: { email: data.email.toLowerCase().trim(), firstName: data.firstName?.trim() || null, lastName: data.lastName?.trim() || null, folderId: data.folderId }, include: { folder: true } });
};

const getAllContacts = async (filters: { searchTerm?: string; email?: string; status?: string; folderId?: string }, options: { limit?: number; page?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
  const { searchTerm, email, status, folderId } = filters;
  const { limit = 10, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  
  // Ensure limit and page are numbers
  const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
  const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
  const skip = (pageNum - 1) * limitNum;
  
  const where: any = {};
  if (searchTerm) where.OR = [{ email: { contains: searchTerm, mode: 'insensitive' } }, { firstName: { contains: searchTerm, mode: 'insensitive' } }, { lastName: { contains: searchTerm, mode: 'insensitive' } }];
  if (email) where.email = { contains: email, mode: 'insensitive' };
  if (status) where.status = status;
  if (folderId) where.folderId = folderId;
  const [contacts, total] = await Promise.all([prisma.contact.findMany({ where, skip, take: limitNum, orderBy: { [sortBy]: sortOrder }, include: { folder: { select: { id: true, name: true } } } }), prisma.contact.count({ where })]);
  return { data: contacts, meta: { total, page: pageNum, limit: limitNum, totalPage: Math.ceil(total / limitNum) } };
};

const updateContact = async (contactId: string, data: { email?: string; firstName?: string; lastName?: string; folderId?: string; status?: string }) => {
  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) throw new ApiError(httpStatus.NOT_FOUND, 'Contact not found');
  if (data.email && data.email !== contact.email) {
    const existingContact = await prisma.contact.findFirst({ where: { email: data.email.toLowerCase().trim(), id: { not: contactId } } });
    if (existingContact) throw new ApiError(httpStatus.CONFLICT, 'Contact with this email already exists');
  }
  return await prisma.contact.update({ where: { id: contactId }, data: { ...(data.email && { email: data.email.toLowerCase().trim() }), ...(data.firstName !== undefined && { firstName: data.firstName?.trim() || null }), ...(data.lastName !== undefined && { lastName: data.lastName?.trim() || null }), ...(data.folderId && { folderId: data.folderId }), ...(data.status && { status: data.status as any }) }, include: { folder: true } });
};

const deleteContact = async (contactId: string) => {
  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) throw new ApiError(httpStatus.NOT_FOUND, 'Contact not found');
  await prisma.contact.delete({ where: { id: contactId } });
  return { message: 'Contact deleted successfully' };
};

const deleteMultipleContacts = async (contactIds: string[]) => {
  const result = await prisma.contact.deleteMany({ where: { id: { in: contactIds } } });
  return { deletedCount: result.count, message: `${result.count} contact(s) deleted successfully` };
};

export const ContactServices = { parseCSVForPreview, importContactsFromPreview, createContact, getAllContacts, updateContact, deleteContact, deleteMultipleContacts };

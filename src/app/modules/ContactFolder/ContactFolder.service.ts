import prisma from '../../lib/prisma';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';

const createContactFolder = async (name: string) => {
  const existingFolder = await prisma.contactFolder.findUnique({ where: { name: name.trim() } });
  if (existingFolder) throw new ApiError(httpStatus.CONFLICT, 'Folder with this name already exists');
  return await prisma.contactFolder.create({ data: { name: name.trim() } });
};

const getAllFolders = async () => {
  return await prisma.contactFolder.findMany({
    include: { _count: { select: { contacts: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getFolderById = async (folderId: string) => {
  const folder = await prisma.contactFolder.findUnique({
    where: { id: folderId },
    include: { _count: { select: { contacts: true } } },
  });
  if (!folder) throw new ApiError(httpStatus.NOT_FOUND, 'Folder not found');
  return folder;
};

const updateFolder = async (folderId: string, name: string) => {
  const folder = await prisma.contactFolder.findUnique({ where: { id: folderId } });
  if (!folder) throw new ApiError(httpStatus.NOT_FOUND, 'Folder not found');
  const existingFolder = await prisma.contactFolder.findFirst({
    where: { name: name.trim(), id: { not: folderId } },
  });
  if (existingFolder) throw new ApiError(httpStatus.CONFLICT, 'Folder with this name already exists');
  return await prisma.contactFolder.update({ where: { id: folderId }, data: { name: name.trim() } });
};

const deleteFolder = async (folderId: string) => {
  const folder = await prisma.contactFolder.findUnique({
    where: { id: folderId },
    include: { _count: { select: { contacts: true } } },
  });
  if (!folder) throw new ApiError(httpStatus.NOT_FOUND, 'Folder not found');
  if (folder._count.contacts > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete folder with contacts. Please move or delete contacts first.');
  }
  await prisma.contactFolder.delete({ where: { id: folderId } });
  return { message: 'Folder deleted successfully' };
};

const findOrCreateFolder = async (folderName: string) => {
  const trimmedName = folderName.trim();
  let folder = await prisma.contactFolder.findUnique({ where: { name: trimmedName } });
  if (!folder) {
    folder = await prisma.contactFolder.create({ data: { name: trimmedName } });
  }
  return folder;
};

export const ContactFolderService = {
  createContactFolder,
  getAllFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  findOrCreateFolder,
};

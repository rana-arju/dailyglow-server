import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { CustomerService } from './customer.service';

const getAllCustomers = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, search, dateFilter } = req.query;

  const filters = {
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    dateFilter: dateFilter as 'today' | 'week' | 'month' | '3months' | '6months' | 'year',
  };

  const result = await CustomerService.getAllCustomers(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customers retrieved successfully',
    data: result.data,
    meta: result.meta,
    stats: result.stats,
  });
});

const getCustomerById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CustomerService.getCustomerById(id);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Customer not found',
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customer retrieved successfully',
    data: result,
  });
});

export const CustomerController = {
  getAllCustomers,
  getCustomerById,
};

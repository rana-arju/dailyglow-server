import { Response } from 'express';

type TMeta = {
  limit: number;
  page: number;
  total: number;
  totalPage: number;
};

type TResponse<T> = {
  statusCode: number;
  success?: boolean;
  message?: string;
  meta?: TMeta;
  stats?: any;
  data: T;
};

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  res.status(data?.statusCode).json({
    success: data?.success || data?.statusCode < 400 ? true : false,
    statusCode: data?.statusCode,
    message: data.message,
    meta: data.meta,
    stats: data.stats,
    data: data.data,
  });
};

export default sendResponse;

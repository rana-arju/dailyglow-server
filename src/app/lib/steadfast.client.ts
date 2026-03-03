import axios, { AxiosInstance, AxiosError } from 'axios';
import config from '../../config';

interface SteadfastConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

interface CreateOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  alternative_phone?: string;
  recipient_email?: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
  total_lot?: number;
  delivery_type?: 0 | 1;
}

interface BulkOrderItem extends CreateOrderPayload {}

interface CreateOrderResponse {
  status: number;
  message: string;
  consignment: {
    consignment_id: number;
    invoice: string;
    tracking_code: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    status: string;
    note?: string;
    created_at: string;
    updated_at: string;
  };
}

interface BulkOrderResponse {
  invoice: string;
  recipient_name: string;
  recipient_address: string;
  recipient_phone: string;
  cod_amount: string;
  note: string | null;
  consignment_id: number | null;
  tracking_code: string | null;
  status: 'success' | 'error';
}

interface StatusResponse {
  status: number;
  delivery_status: string;
}

interface BalanceResponse {
  status: number;
  current_balance: number;
}

interface CreateReturnRequestPayload {
  consignment_id?: number;
  invoice?: string;
  tracking_code?: string;
  reason?: string;
}

interface ReturnRequestResponse {
  id: number;
  user_id: number;
  consignment_id: number;
  reason: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

class SteadfastClient {
  private client: AxiosInstance;
  private config: SteadfastConfig;
  private mockMode: boolean;

  constructor() {
    this.config = {
      apiKey: config.steadfast.apiKey || '',
      secretKey: config.steadfast.secretKey || '',
      baseUrl: config.steadfast.baseUrl || 'https://portal.packzy.com/api/v1',
    };

    // Enable mock mode if STEADFAST_MOCK_MODE is true
    // Works in any environment (development, production, etc.)
    this.mockMode = process.env.STEADFAST_MOCK_MODE === 'true';

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Api-Key': this.config.apiKey,
        'Secret-Key': this.config.secretKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    if (this.mockMode) {
      console.log('⚠️  STEADFAST MOCK MODE ENABLED - Using fake responses');
      console.log('   To use real API, set STEADFAST_MOCK_MODE=false in .env');
    } else {
      console.log('✅ STEADFAST LIVE MODE - Using real API');
    }
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data || {};
      throw {
        message: axiosError.message,
        status: axiosError.response?.status,
        data: errorData,
      };
    }
    throw error;
  }

  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    // Mock response for development
    if (this.mockMode) {
      console.log('📦 MOCK: Creating order', payload.invoice);
      return {
        status: 200,
        message: 'Order created successfully (MOCK)',
        consignment: {
          consignment_id: Math.floor(Math.random() * 1000000),
          invoice: payload.invoice,
          tracking_code: `MOCK-${Date.now()}`,
          recipient_name: payload.recipient_name,
          recipient_phone: payload.recipient_phone,
          recipient_address: payload.recipient_address,
          cod_amount: payload.cod_amount,
          status: 'in_review',
          note: payload.note,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    }

    try {
      const response = await this.client.post<CreateOrderResponse>(
        '/create_order',
        payload
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async bulkCreateOrders(orders: BulkOrderItem[]): Promise<BulkOrderResponse[]> {
    try {
      const response = await this.client.post<BulkOrderResponse[]>(
        '/create_order/bulk-order',
        { data: JSON.stringify(orders) }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getStatusByConsignmentId(consignmentId: number): Promise<StatusResponse> {
    try {
      const response = await this.client.get<StatusResponse>(
        `/status_by_cid/${consignmentId}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getStatusByInvoice(invoice: string): Promise<StatusResponse> {
    try {
      const response = await this.client.get<StatusResponse>(
        `/status_by_invoice/${invoice}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getStatusByTrackingCode(trackingCode: string): Promise<StatusResponse> {
    try {
      const response = await this.client.get<StatusResponse>(
        `/status_by_trackingcode/${trackingCode}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getBalance(): Promise<BalanceResponse> {


    try {
      const response = await this.client.get<BalanceResponse>('/get_balance');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createReturnRequest(
    payload: CreateReturnRequestPayload
  ): Promise<ReturnRequestResponse> {
    try {
      const response = await this.client.post<ReturnRequestResponse>(
        '/create_return_request',
        payload
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getReturnRequest(id: number): Promise<ReturnRequestResponse> {
    try {
      const response = await this.client.get<ReturnRequestResponse>(
        `/get_return_request/${id}`
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getReturnRequests(): Promise<ReturnRequestResponse[]> {
    try {
      const response = await this.client.get<ReturnRequestResponse[]>(
        '/get_return_requests'
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getPayments(): Promise<any> {
    try {
      const response = await this.client.get('/payments');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getPaymentById(paymentId: number): Promise<any> {
    try {
      const response = await this.client.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getPoliceStations(): Promise<any> {
    try {
      const response = await this.client.get('/police_stations');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export default new SteadfastClient();

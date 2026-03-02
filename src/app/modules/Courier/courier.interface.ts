// API payload (snake_case from frontend)
export interface ICreateShipmentPayload {
  orderId: string;
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

export interface IShipmentReviewData {
  orderId: string;
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

export interface IWebhookDeliveryStatus {
  notification_type: 'delivery_status';
  consignment_id: number;
  invoice: string;
  cod_amount: number;
  status: string;
  delivery_charge: number;
  tracking_message: string;
  updated_at: string;
}

export interface IWebhookTrackingUpdate {
  notification_type: 'tracking_update';
  consignment_id: number;
  invoice: string;
  tracking_message: string;
  updated_at: string;
}

export type IWebhookPayload = IWebhookDeliveryStatus | IWebhookTrackingUpdate;

export interface IAssignDeliveryMan {
  shipmentId: string;
  assignedToName: string;
  assignedToPhone: string;
  assignedToHub?: string;
  internalNote?: string;
}

export interface IWithdrawalRequest {
  amount: number;
  note?: string;
}

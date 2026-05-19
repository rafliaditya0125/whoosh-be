/**
 * Ticket domain types
 */

export interface Ticket {
  ticket_id: string;
  booking_id: string;
  qr_data?: string;
  qr_code_url?: string;
  qr_generated_at?: string;
  qr_expires_at?: string;
  status: 'valid' | 'used' | 'expired' | 'cancelled';
}

export interface TicketValidation {
  validation_id: string;
  ticket_id: string;
  station_id: string;
  validator_id?: string;
  validated_at: string;
  validation_result: 'success' | 'failed';
  failure_reason?: string;
}

export interface ValidateQRRequest {
  qr_data: string;
  station_id: string;
  validator_id?: string;
}

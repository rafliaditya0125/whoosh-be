import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import { TicketRepository } from './repository';
import { UserErrorHelper, UserErrorCode, ServerErrorHelper } from '../../shared/error';

const SECRET_KEY = process.env.JWT_SECRET || 'supersecret';
const ENCRYPTION_KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);
const IV_LENGTH = 16;

export class TicketServiceImpl {
  constructor(private ticketRepository: TicketRepository) {}

  async getTicketQR(ticketId: string): Promise<any> {
    const ticket = await this.ticketRepository.getBookingByTicketId(ticketId);
    if (!ticket) {
      throw UserErrorHelper.notFound('Ticket', ticketId);
    }

    const qrData = {
      ticket_id: ticket.ticket_id,
      booking_code: ticket.booking_code,
      passenger_name: ticket.full_name,
      seat_number: ticket.seat_number,
      departure_time: ticket.departure_time,
    };

    try {
      const signature = jwt.sign(qrData, SECRET_KEY, { expiresIn: '24h' });
      const encryptedData = this.encrypt(JSON.stringify({ ...qrData, signature }));

      return {
        ticket_id: ticketId,
        qr_data: `ENC:${encryptedData}`,
        status: ticket.status,
      };
    } catch {
      throw ServerErrorHelper.internalError('generate QR code', {
        operation: 'generate_qr',
        ticket_id: ticketId,
      });
    }
  }

  async validateTicket(qrData: string, stationId: string, validatorId?: string): Promise<any> {
    if (!qrData.startsWith('ENC:')) {
      throw UserErrorHelper.invalidQRCode('Format QR code salah. QR code harus diawali dengan "ENC:"');
    }
    
    let decrypted: any;
    try {
      decrypted = JSON.parse(this.decrypt(qrData.substring(4)));
    } catch {
      throw UserErrorHelper.invalidQRCode('QR code tidak dapat di-decrypt. Pastikan QR code tidak rusak');
    }

    const { ticket_id, signature } = decrypted;

    try {
      jwt.verify(signature, SECRET_KEY);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw UserErrorHelper.invalidQRCode('QR code sudah expired. Silakan generate QR code baru');
      }
      throw UserErrorHelper.invalidQRCode('Signature QR code tidak valid');
    }

    const ticket = await this.ticketRepository.getBookingByTicketId(ticket_id);
    if (!ticket) {
      throw UserErrorHelper.notFound('Ticket', ticket_id);
    }

    if (ticket.status === 'used') {
      throw UserErrorHelper.ticketAlreadyUsed();
    }

    if (ticket.status !== 'valid') {
      throw UserErrorHelper.businessRule(
        `Tiket tidak dapat digunakan: Status tiket adalah "${ticket.status}". Hanya tiket dengan status "valid" yang dapat digunakan`,
        UserErrorCode.INVALID_STATE_TRANSITION
      );
    }

    // Check if ticket is expired (departure time has passed)
    const departureTime = new Date(ticket.departure_time);
    const now = new Date();
    if (now > departureTime) {
      throw UserErrorHelper.ticketExpired();
    }

    try {
      await this.ticketRepository.update(ticket_id, { status: 'used' });
      await this.ticketRepository.createValidation({
        ticket_id,
        station_id: String(stationId),
        validator_id: validatorId,
        validation_result: 'success',
      });

      return ticket;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw ServerErrorHelper.databaseError('validasi tiket', {
          operation: 'validate_ticket',
          ticket_id,
        });
      }
      throw error;
    }
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}

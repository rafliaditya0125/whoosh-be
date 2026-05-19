import { Knex } from 'knex';

import { db } from '../../shared/db';
import {
  UserListQuery,
  UserUpdateRequest,
  BookingListQuery,
  RefundListQuery,
  RefundUpdateRequest,
  PaginatedResponse,
} from './adminTypes';

/**
 * Admin repository interface
 */
export interface AdminRepository {
  // User management
  getUsers(query: UserListQuery): Promise<PaginatedResponse<any>>;
  getUserById(userId: string): Promise<any>;
  updateUser(userId: string, data: UserUpdateRequest): Promise<any>;
  updateUserStatus(userId: string, isActive: boolean): Promise<any>;

  // Booking management
  getBookings(query: BookingListQuery): Promise<PaginatedResponse<any>>;

  // Refund management
  getRefunds(query: RefundListQuery): Promise<PaginatedResponse<any>>;
  updateRefund(refundId: string, data: RefundUpdateRequest): Promise<any>;
}

/**
 * Admin repository implementation
 */
export class AdminRepositoryImpl implements AdminRepository {
  private db: Knex;

  constructor() {
    this.db = db;
  }

  /**
   * Get users with pagination and filters
   */
  async getUsers(query: UserListQuery): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let queryBuilder = this.db('users');

    // Apply filters
    if (query.search) {
      queryBuilder = queryBuilder.where((builder) => {
        builder
          .where('full_name', 'like', `%${query.search}%`)
          .orWhere('email', 'like', `%${query.search}%`)
          .orWhere('phone', 'like', `%${query.search}%`);
      });
    }

    if (query.role) {
      queryBuilder = queryBuilder.where('role', query.role);
    }

    if (query.is_active !== undefined) {
      queryBuilder = queryBuilder.where('is_active', query.is_active);
    }

    const [items, countResult] = await Promise.all([
      queryBuilder
        .clone()
        .select('user_id', 'full_name', 'email', 'phone', 'role', 'is_active', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      queryBuilder.clone().count('* as count').first(),
    ]);

    const total = (countResult as any)?.count || 0;

    return {
      items: items.map((user: any) => ({
        user_id: user.user_id.toString(),
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: Boolean(user.is_active),
        created_at: user.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any> {
    const user = await this.db('users')
      .where('user_id', userId)
      .select('user_id', 'full_name', 'email', 'phone', 'role', 'is_active', 'created_at')
      .first();

    if (!user) {
      return null;
    }

    return {
      user_id: user.user_id.toString(),
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_active: Boolean(user.is_active),
      created_at: user.created_at,
    };
  }

  /**
   * Update user data
   */
  async updateUser(userId: string, data: UserUpdateRequest): Promise<any> {
    const updateData: any = {};

    if (data.full_name) updateData.full_name = data.full_name;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.role) updateData.role = data.role;

    await this.db('users').where('user_id', userId).update(updateData);

    return this.getUserById(userId);
  }

  /**
   * Update user status (block/unblock)
   */
  async updateUserStatus(userId: string, isActive: boolean): Promise<any> {
    await this.db('users').where('user_id', userId).update({ is_active: isActive });

    return this.getUserById(userId);
  }

  /**
   * Get bookings with pagination and filters
   */
  async getBookings(query: BookingListQuery): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let queryBuilder = this.db('bookings as b')
      .join('users as u', 'b.user_id', 'u.user_id')
      .join('schedules as s', 'b.schedule_id', 's.schedule_id')
      .join('trains as t', 's.train_id', 't.train_id')
      .join('stations as dep', 's.departure_station', 'dep.station_id')
      .join('stations as arr', 's.arrival_station', 'arr.station_id');

    // Apply filters
    if (query.status) {
      queryBuilder = queryBuilder.where('b.status', query.status);
    }

    if (query.date_from && query.date_to) {
      queryBuilder = queryBuilder.whereBetween('b.created_at', [query.date_from, query.date_to]);
    }

    if (query.search) {
      queryBuilder = queryBuilder.where((builder) => {
        builder
          .where('b.booking_code', 'like', `%${query.search}%`)
          .orWhere('u.full_name', 'like', `%${query.search}%`);
      });
    }

    const [items, countResult] = await Promise.all([
      queryBuilder
        .clone()
        .select(
          'b.booking_id',
          'b.booking_code',
          'b.status',
          'b.total_price',
          'b.created_at',
          'u.full_name as user_name',
          'u.email as user_email',
          't.train_name',
          'dep.station_name as departure_station',
          'arr.station_name as arrival_station',
          's.departure_time'
        )
        .orderBy('b.created_at', 'desc')
        .limit(limit)
        .offset(offset),
      queryBuilder.clone().count('* as count').first(),
    ]);

    const total = (countResult as any)?.count || 0;

    return {
      items: items.map((booking: any) => ({
        booking_id: booking.booking_id.toString(),
        booking_code: booking.booking_code,
        status: booking.status,
        total_price: parseFloat(booking.total_price),
        created_at: booking.created_at,
        user_name: booking.user_name,
        user_email: booking.user_email,
        train_name: booking.train_name,
        departure_station: booking.departure_station,
        arrival_station: booking.arrival_station,
        departure_time: booking.departure_time,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get refunds with pagination and filters
   */
  async getRefunds(query: RefundListQuery): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let queryBuilder = this.db('refunds as r')
      .join('bookings as b', 'r.booking_id', 'b.booking_id')
      .join('users as u', 'b.user_id', 'u.user_id');

    // Apply filters
    if (query.status) {
      queryBuilder = queryBuilder.where('r.status', query.status);
    }

    const [items, countResult] = await Promise.all([
      queryBuilder
        .clone()
        .select(
          'r.refund_id',
          'r.booking_id',
          'r.refund_amount',
          'r.cancellation_fee',
          'r.original_amount',
          'r.status',
          'r.reason',
          'r.estimated_refund_date',
          'r.created_at',
          'b.booking_code',
          'u.full_name as user_name',
          'u.email as user_email'
        )
        .orderBy('r.created_at', 'desc')
        .limit(limit)
        .offset(offset),
      queryBuilder.clone().count('* as count').first(),
    ]);

    const total = (countResult as any)?.count || 0;

    return {
      items: items.map((refund: any) => ({
        refund_id: refund.refund_id.toString(),
        booking_id: refund.booking_id.toString(),
        booking_code: refund.booking_code,
        refund_amount: parseFloat(refund.refund_amount),
        cancellation_fee: parseFloat(refund.cancellation_fee),
        original_amount: parseFloat(refund.original_amount),
        status: refund.status,
        reason: refund.reason,
        estimated_refund_date: refund.estimated_refund_date,
        created_at: refund.created_at,
        user_name: refund.user_name,
        user_email: refund.user_email,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update refund status (approve/reject)
   */
  async updateRefund(refundId: string, data: RefundUpdateRequest): Promise<any> {
    const updateData: any = {
      status: data.status,
    };

    if (data.notes) {
      updateData.admin_notes = data.notes;
    }

    if (data.status === 'approved') {
      updateData.status = 'processed';
    }

    await this.db('refunds').where('refund_id', refundId).update(updateData);

    const refund = await this.db('refunds')
      .where('refund_id', refundId)
      .select('*')
      .first();

    return {
      refund_id: refund.refund_id.toString(),
      booking_id: refund.booking_id.toString(),
      refund_amount: parseFloat(refund.refund_amount),
      cancellation_fee: parseFloat(refund.cancellation_fee),
      original_amount: parseFloat(refund.original_amount),
      status: refund.status,
      estimated_refund_date: refund.estimated_refund_date,
    };
  }
}

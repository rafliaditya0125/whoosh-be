import { Knex } from 'knex';

import { db } from '../../shared/db';
import {
  DashboardSummary,
  SalesReportItem,
  SalesReportQuery,
  TransactionListItem,
  TransactionQuery,
  PaginatedResponse,
} from './managerTypes';

/**
 * Manager repository interface
 */
export interface ManagerRepository {
  getDashboardSummary(): Promise<DashboardSummary>;
  getSalesReport(query: SalesReportQuery): Promise<PaginatedResponse<SalesReportItem>>;
  getTransactions(query: TransactionQuery): Promise<PaginatedResponse<TransactionListItem>>;
}

/**
 * Manager repository implementation
 */
export class ManagerRepositoryImpl implements ManagerRepository {
  private db: Knex;

  constructor() {
    this.db = db;
  }

  /**
   * Get dashboard summary with revenue, tickets sold, and top routes
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Revenue calculations
    const revenueToday = await this.getRevenue(todayStart, now);
    const revenueWeek = await this.getRevenue(weekStart, now);
    const revenueMonth = await this.getRevenue(monthStart, now);

    // Tickets sold calculations
    const ticketsToday = await this.getTicketsSold(todayStart, now);
    const ticketsWeek = await this.getTicketsSold(weekStart, now);
    const ticketsMonth = await this.getTicketsSold(monthStart, now);

    // Average occupancy
    const occupancy = await this.getAverageOccupancy();

    // Top routes
    const topRoutes = await this.getTopRoutes(monthStart, now);

    return {
      revenue: {
        today: revenueToday,
        this_week: revenueWeek,
        this_month: revenueMonth,
      },
      tickets_sold: {
        today: ticketsToday,
        this_week: ticketsWeek,
        this_month: ticketsMonth,
      },
      average_occupancy: occupancy,
      top_routes: topRoutes,
    };
  }

  /**
   * Get sales report with pagination
   */
  async getSalesReport(query: SalesReportQuery): Promise<PaginatedResponse<SalesReportItem>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let queryBuilder = this.db('bookings as b')
      .join('booking_passengers as bp', 'b.booking_id', 'bp.booking_id')
      .join('schedules as s', 'b.schedule_id', 's.schedule_id')
      .join('trains as t', 's.train_id', 't.train_id')
      .join('stations as dep', 's.departure_station', 'dep.station_id')
      .join('stations as arr', 's.arrival_station', 'arr.station_id')
      .join('seats as seat', 'bp.seat_id', 'seat.seat_id')
      .whereBetween('b.created_at', [query.date_from, query.date_to])
      .where('b.status', 'paid');

    if (query.route) {
      const [depId, arrId] = query.route.split('-');
      queryBuilder = queryBuilder
        .where('s.departure_station', depId)
        .where('s.arrival_station', arrId);
    }

    if (query.train_id) {
      queryBuilder = queryBuilder.where('s.train_id', query.train_id);
    }

    const [items, countResult] = await Promise.all([
      queryBuilder
        .clone()
        .select(
          this.db.raw('DATE(b.created_at) as date'),
          this.db.raw("CONCAT(dep.station_name, ' → ', arr.station_name) as route"),
          't.train_name',
          'seat.class',
          this.db.raw('COUNT(bp.passenger_id) as tickets_sold'),
          this.db.raw('SUM(b.total_price) as revenue')
        )
        .groupBy('date', 'route', 't.train_name', 'seat.class')
        .orderBy('date', 'desc')
        .limit(limit)
        .offset(offset),
      queryBuilder.clone().count('* as count').first(),
    ]);

    const total = (countResult as any)?.count || 0;

    // Calculate occupancy rate for each item
    const itemsWithOccupancy = await Promise.all(
      items.map(async (item: any) => {
        const totalSeats = await this.db('seats')
          .join('trains', 'seats.train_id', 'trains.train_id')
          .where('trains.train_name', item.train_name)
          .where('seats.class', item.class)
          .count('* as count')
          .first();

        const occupancyRate =
          totalSeats && (totalSeats as any).count > 0
            ? (item.tickets_sold / (totalSeats as any).count) * 100
            : 0;

        return {
          date: item.date,
          route: item.route,
          train_name: item.train_name,
          class: item.class,
          tickets_sold: parseInt(item.tickets_sold),
          revenue: parseFloat(item.revenue),
          occupancy_rate: Math.round(occupancyRate * 10) / 10,
        };
      })
    );

    return {
      items: itemsWithOccupancy,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get transactions with pagination
   */
  async getTransactions(query: TransactionQuery): Promise<PaginatedResponse<TransactionListItem>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let queryBuilder = this.db('payments as p')
      .join('bookings as b', 'p.booking_id', 'b.booking_id')
      .join('users as u', 'b.user_id', 'u.user_id');

    if (query.status) {
      queryBuilder = queryBuilder.where('p.status', query.status);
    }

    if (query.date_from && query.date_to) {
      queryBuilder = queryBuilder.whereBetween('p.created_at', [query.date_from, query.date_to]);
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
          'p.payment_id',
          'b.booking_code',
          'u.full_name as user_name',
          'u.email as user_email',
          'p.amount',
          'p.payment_method',
          'p.status',
          'p.created_at'
        )
        .orderBy('p.created_at', 'desc')
        .limit(limit)
        .offset(offset),
      queryBuilder.clone().count('* as count').first(),
    ]);

    const total = (countResult as any)?.count || 0;

    return {
      items: items.map((item: any) => ({
        payment_id: item.payment_id.toString(),
        booking_code: item.booking_code,
        user_name: item.user_name,
        user_email: item.user_email,
        amount: parseFloat(item.amount),
        payment_method: item.payment_method,
        status: item.status,
        created_at: item.created_at,
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
   * Helper: Get revenue for date range
   */
  private async getRevenue(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.db('payments')
      .whereBetween('created_at', [startDate, endDate])
      .where('status', 'success')
      .sum('amount as total')
      .first();

    return parseFloat((result as any)?.total || 0);
  }

  /**
   * Helper: Get tickets sold for date range
   */
  private async getTicketsSold(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.db('booking_passengers as bp')
      .join('bookings as b', 'bp.booking_id', 'b.booking_id')
      .whereBetween('b.created_at', [startDate, endDate])
      .where('b.status', 'paid')
      .count('* as count')
      .first();

    return parseInt((result as any)?.count || 0);
  }

  /**
   * Helper: Get average occupancy rate
   */
  private async getAverageOccupancy(): Promise<number> {
    const result = await this.db.raw(`
      SELECT 
        AVG(occupancy_rate) as avg_occupancy
      FROM (
        SELECT 
          s.schedule_id,
          COUNT(bp.passenger_id) * 100.0 / t.total_seats as occupancy_rate
        FROM schedules s
        JOIN trains t ON s.train_id = t.train_id
        LEFT JOIN bookings b ON s.schedule_id = b.schedule_id AND b.status = 'paid'
        LEFT JOIN booking_passengers bp ON b.booking_id = bp.booking_id
        WHERE s.departure_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY s.schedule_id, t.total_seats
      ) as schedule_occupancy
    `);

    return parseFloat(result[0]?.[0]?.avg_occupancy || 0);
  }

  /**
   * Helper: Get top routes by revenue
   */
  private async getTopRoutes(startDate: Date, endDate: Date): Promise<any[]> {
    const routes = await this.db('bookings as b')
      .join('schedules as s', 'b.schedule_id', 's.schedule_id')
      .join('stations as dep', 's.departure_station', 'dep.station_id')
      .join('stations as arr', 's.arrival_station', 'arr.station_id')
      .join('booking_passengers as bp', 'b.booking_id', 'bp.booking_id')
      .whereBetween('b.created_at', [startDate, endDate])
      .where('b.status', 'paid')
      .select(
        'dep.station_name as departure_station',
        'arr.station_name as arrival_station',
        this.db.raw('COUNT(bp.passenger_id) as tickets_sold'),
        this.db.raw('SUM(b.total_price) as revenue')
      )
      .groupBy('dep.station_name', 'arr.station_name')
      .orderBy('revenue', 'desc')
      .limit(5);

    return routes.map((route: any) => ({
      departure_station: route.departure_station,
      arrival_station: route.arrival_station,
      tickets_sold: parseInt(route.tickets_sold),
      revenue: parseFloat(route.revenue),
    }));
  }
}

import {
  ManagerRepository,
  ManagerRepositoryImpl,
} from './managerRepository';
import {
  DashboardSummary,
  SalesReportItem,
  SalesReportQuery,
  TransactionListItem,
  TransactionQuery,
  PaginatedResponse,
} from './managerTypes';

/**
 * Manager service interface
 */
export interface ManagerService {
  getDashboardSummary(): Promise<DashboardSummary>;
  getSalesReport(query: SalesReportQuery): Promise<PaginatedResponse<SalesReportItem>>;
  getTransactions(query: TransactionQuery): Promise<PaginatedResponse<TransactionListItem>>;
  exportSalesReport(query: SalesReportQuery, format: 'csv' | 'xlsx'): Promise<Buffer | string>;
}

/**
 * Manager service implementation
 */
export class ManagerServiceImpl implements ManagerService {
  constructor(private repository: ManagerRepository = new ManagerRepositoryImpl()) {}

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.repository.getDashboardSummary();
  }

  /**
   * Get sales report with pagination
   */
  async getSalesReport(query: SalesReportQuery): Promise<PaginatedResponse<SalesReportItem>> {
    // Validate date range
    const dateFrom = new Date(query.date_from);
    const dateTo = new Date(query.date_to);

    if (dateFrom > dateTo) {
      throw new Error('date_from must be before date_to');
    }

    return this.repository.getSalesReport(query);
  }

  /**
   * Get transactions with pagination
   */
  async getTransactions(query: TransactionQuery): Promise<PaginatedResponse<TransactionListItem>> {
    return this.repository.getTransactions(query);
  }

  /**
   * Export sales report as CSV or XLSX
   */
  async exportSalesReport(query: SalesReportQuery, format: 'csv' | 'xlsx'): Promise<Buffer | string> {
    // Get all data without pagination
    const fullQuery = { ...query, page: 1, limit: 10000 };
    const report = await this.repository.getSalesReport(fullQuery);

    if (format === 'csv') {
      return this.generateCSV(report.items);
    } else {
      // For XLSX, we'll need to add a library like 'xlsx'
      // For now, return CSV format
      return this.generateCSV(report.items);
    }
  }

  /**
   * Generate CSV from sales report items
   */
  private generateCSV(items: SalesReportItem[]): string {
    const headers = ['Date', 'Route', 'Train Name', 'Class', 'Tickets Sold', 'Revenue', 'Occupancy Rate'];
    const rows = items.map((item) => [
      item.date,
      item.route,
      item.train_name,
      item.class,
      item.tickets_sold.toString(),
      item.revenue.toString(),
      `${item.occupancy_rate}%`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csvContent;
  }
}

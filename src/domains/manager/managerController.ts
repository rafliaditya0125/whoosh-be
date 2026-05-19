import { Response } from 'express';

import { UserRequest } from '../../shared/types';
import { ManagerService, ManagerServiceImpl } from './managerService';
import { SalesReportQuery, TransactionQuery } from './managerTypes';

/**
 * Manager controller interface
 */
export interface ManagerController {
  getDashboard(request: UserRequest, response: Response): Promise<void>;
  getSalesReport(request: UserRequest, response: Response): Promise<void>;
  exportSalesReport(request: UserRequest, response: Response): Promise<void>;
  getTransactions(request: UserRequest, response: Response): Promise<void>;
}

/**
 * Manager controller implementation
 */
export class ManagerControllerImpl implements ManagerController {
  constructor(private service: ManagerService = new ManagerServiceImpl()) {}

  /**
   * GET /api/manager/dashboard
   * Get sales dashboard summary
   */
  getDashboard = async (request: UserRequest, response: Response): Promise<void> => {
    try {
      const summary = await this.service.getDashboardSummary();
      response.status(200).json(summary);
    } catch (error) {
      response.status(500).json({
        error: 'Terjadi kesalahan saat mengambil dashboard summary',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      });
    }
  };

  /**
   * GET /api/manager/reports/sales
   * Get detailed sales report with pagination
   */
  getSalesReport = async (request: UserRequest, response: Response): Promise<void> => {
    try {
      const query: SalesReportQuery = {
        date_from: request.query.date_from as string,
        date_to: request.query.date_to as string,
        route: request.query.route as string | undefined,
        train_id: request.query.train_id as string | undefined,
        page: request.query.page ? parseInt(request.query.page as string) : 1,
        limit: request.query.limit ? parseInt(request.query.limit as string) : 20,
      };

      // Validate required fields
      if (!query.date_from || !query.date_to) {
        response.status(400).json({
          error: 'date_from dan date_to wajib diisi',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        });
        return;
      }

      const report = await this.service.getSalesReport(query);
      response.status(200).json(report);
    } catch (error: any) {
      response.status(500).json({
        error: error.message || 'Terjadi kesalahan saat mengambil sales report',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      });
    }
  };

  /**
   * GET /api/manager/reports/export
   * Export sales report as CSV or XLSX
   */
  exportSalesReport = async (request: UserRequest, response: Response): Promise<void> => {
    try {
      const query: SalesReportQuery = {
        date_from: request.query.date_from as string,
        date_to: request.query.date_to as string,
        route: request.query.route as string | undefined,
        train_id: request.query.train_id as string | undefined,
      };

      const format = (request.query.format as 'csv' | 'xlsx') || 'csv';

      // Validate required fields
      if (!query.date_from || !query.date_to) {
        response.status(400).json({
          error: 'date_from dan date_to wajib diisi',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        });
        return;
      }

      const fileContent = await this.service.exportSalesReport(query, format);

      // Set headers for file download
      const filename = `sales-report-${query.date_from}-${query.date_to}.${format}`;
      response.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      response.status(200).send(fileContent);
    } catch (error: any) {
      response.status(500).json({
        error: error.message || 'Terjadi kesalahan saat export sales report',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      });
    }
  };

  /**
   * GET /api/manager/transactions
   * Monitor all payment transactions
   */
  getTransactions = async (request: UserRequest, response: Response): Promise<void> => {
    try {
      const query: TransactionQuery = {
        status: request.query.status as 'pending' | 'success' | 'failed' | 'expired' | undefined,
        date_from: request.query.date_from as string | undefined,
        date_to: request.query.date_to as string | undefined,
        search: request.query.search as string | undefined,
        page: request.query.page ? parseInt(request.query.page as string) : 1,
        limit: request.query.limit ? parseInt(request.query.limit as string) : 20,
      };

      const transactions = await this.service.getTransactions(query);
      response.status(200).json(transactions);
    } catch (error: any) {
      response.status(500).json({
        error: error.message || 'Terjadi kesalahan saat mengambil transactions',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      });
    }
  };
}

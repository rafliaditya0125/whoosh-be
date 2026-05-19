import { ScheduleRepository } from './scheduleRepository';
import { Schedule, CreateSchedule } from './scheduleTypes';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * Schedule service interface
 */
export interface ScheduleService {
  findAll(params?: { departure?: string; arrival?: string; date?: string }): Promise<Schedule[]>;
  findById(id: string): Promise<Schedule | null>;
  create(data: CreateSchedule): Promise<string>;
  update(id: string, data: Partial<Schedule>): Promise<void>;
  updateStatus(id: string, status: 'active' | 'inactive'): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Schedule service implementation
 */
export class ScheduleServiceImpl implements ScheduleService {
  constructor(private scheduleRepository: ScheduleRepository) {}

  async findAll(params?: { departure?: string; arrival?: string; date?: string }): Promise<Schedule[]> {
    return this.scheduleRepository.findAll(params);
  }

  async findById(id: string): Promise<Schedule | null> {
    return this.scheduleRepository.findById(id);
  }

  async create(data: CreateSchedule): Promise<string> {
    const [schedule_id] = await this.scheduleRepository.create(data);
    return schedule_id;
  }

  async update(id: string, data: Partial<Schedule>): Promise<void> {
    const existing = await this.scheduleRepository.findById(id);
    if (!existing) {
      throw new AppError('Schedule not found', 404, ErrorCode.NOT_FOUND);
    }
    await this.scheduleRepository.update(id, data);
  }

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<void> {
    const existing = await this.scheduleRepository.findById(id);
    if (!existing) {
      throw new AppError('Schedule not found', 404, ErrorCode.NOT_FOUND);
    }
    await this.scheduleRepository.update(id, { status });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.scheduleRepository.findById(id);
    if (!existing) {
      throw new AppError('Schedule not found', 404, ErrorCode.NOT_FOUND);
    }
    await this.scheduleRepository.delete(id);
  }
}

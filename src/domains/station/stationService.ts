import { StationRepository } from './stationRepository';
import { Station, CreateStation } from './stationTypes';
import { AppError, ErrorCode } from '../../shared/error';

/**
 * Station service interface
 */
export interface StationService {
  findAll(): Promise<Station[]>;
  findById(id: string): Promise<Station | null>;
  create(data: CreateStation): Promise<string>;
  update(id: string, data: Partial<Station>): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Station service implementation
 */
export class StationServiceImpl implements StationService {
  constructor(private stationRepository: StationRepository) {}

  async findAll(): Promise<Station[]> {
    return this.stationRepository.findAll();
  }

  async findById(id: string): Promise<Station | null> {
    return this.stationRepository.findById(id);
  }

  async create(data: CreateStation): Promise<string> {
    const [station_id] = await this.stationRepository.create(data);
    return station_id;
  }

  async update(id: string, data: Partial<Station>): Promise<void> {
    const existing = await this.stationRepository.findById(id);
    if (!existing) {
      throw new AppError('Station not found', 404, ErrorCode.NOT_FOUND);
    }
    await this.stationRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.stationRepository.findById(id);
    if (!existing) {
      throw new AppError('Station not found', 404, ErrorCode.NOT_FOUND);
    }
    await this.stationRepository.delete(id);
  }
}

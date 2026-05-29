import { Controller, Get, Logger } from '@nestjs/common';
import { BatchService } from './batch.service';
import { Cron, Timeout } from '@nestjs/schedule';
import { BATCH_ROLLBACK, BATCH_TOP_AGENTS, BATCH_TOP_SALONS } from './lib/config';

@Controller()
export class BatchController {
  private logger: Logger = new Logger('BatchController');

  constructor(private readonly batchService: BatchService) { }

  @Timeout(1000)
  handleTimeout() {
    this.logger.debug('BATCH SERVER READY');
  }

  // Har kuni soat 01:00:00 da — rank larni 0 ga qaytaradi
  @Cron('00 00 01 * * *', { name: 'BATCH_ROLLBACK' })
  public async batchRollback() {
    try {
      this.logger['context'] = BATCH_ROLLBACK;
      this.logger.debug('EXECUTED!');
      await this.batchService.batchRollback();
    } catch (err) {
      this.logger.error(err);
    }
  }

  // Har kuni soat 01:00:20 da — top salonlarni hisoblaydi
  @Cron('20 00 01 * * *', { name: 'BATCH_TOP_SALONS' })
  public async batchTopSalons() {
    try {
      this.logger['context'] = BATCH_TOP_SALONS;
      this.logger.debug('EXECUTED!');
      await this.batchService.batchTopSalons();
    } catch (err) {
      this.logger.error(err);
    }
  }

  // Har kuni soat 01:00:40 da — top agentlarni hisoblaydi
  @Cron('40 00 01 * * *', { name: 'BATCH_TOP_AGENTS' })
  public async batchTopAgents() {
    try {
      this.logger['context'] = BATCH_TOP_AGENTS;
      this.logger.debug('EXECUTED!');
      await this.batchService.batchTopAgents();
    } catch (err) {
      this.logger.error(err);
    }
  }

  @Get()
  getHello(): string {
    return this.batchService.getHello();
  }
}
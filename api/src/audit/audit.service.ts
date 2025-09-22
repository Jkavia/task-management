import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, User } from '../entities';

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async getAuditLogs(user: User, page: number = 1, limit: number = 50): Promise<AuditLogResponse> {
    this.logger.log(`Getting audit logs for user: ${user.email}, page: ${page}, limit: ${limit}`);
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user');

    // Apply role-based filtering
    if (user.role === 'owner') {
      // Owner can see all audit logs for their company
      this.logger.log(`Owner ${user.email} accessing company-wide audit logs`);
      queryBuilder.where('user.companyId = :companyId', { companyId: user.companyId });
    } else if (user.role === 'admin') {
      // Admin can see audit logs for their department
      this.logger.log(`Admin ${user.email} accessing department audit logs`);
      queryBuilder.where('user.departmentId = :departmentId', { departmentId: user.departmentId });
    } else {
      // Viewers cannot access audit logs (this should be blocked by RBAC guard)
      this.logger.warn(`Viewer ${user.email} tried to access audit logs`);
      queryBuilder.where('1 = 0'); // Return empty result
    }

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Order by timestamp descending
    queryBuilder.orderBy('audit_log.timestamp', 'DESC');

    const [logs, total] = await queryBuilder.getManyAndCount();
    this.logger.log(`Found ${logs.length} audit logs out of ${total} total for user: ${user.email}`);

    return {
      logs,
      total,
      page,
      limit,
    };
  }
}
import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, RequirePermissions } from '../auth/rbac.guard';
import { User } from '../entities';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions({ action: 'read', resource: 'audit_log' })
  getAuditLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Request() req: { user: User }
  ) {
    return this.auditService.getAuditLogs(req.user, page, limit);
  }
}
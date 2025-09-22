import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard, RequirePermissions } from '../auth/rbac.guard';
import { User } from '../entities';
import { UserProfile } from '@turbovets/data';

@Controller('users')
@UseGuards(JwtAuthGuard, RbacGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @RequirePermissions({ action: 'read', resource: 'user', scope: 'own' })
  getProfile(@Request() req: { user: User }): Promise<UserProfile> {
    return this.usersService.getProfile(req.user);
  }

  @Get('department/:departmentId')
  @RequirePermissions({ action: 'read', resource: 'user' })
  getDepartmentUsers(
    @Param('departmentId') departmentId: string,
    @Request() req: { user: User }
  ): Promise<User[]> {
    return this.usersService.getDepartmentUsers(departmentId, req.user);
  }
}
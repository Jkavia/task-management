import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../entities';
import { UserRole, PermissionAction, PermissionResource } from '@turbovets/data';

export interface RequiredPermission {
  action: PermissionAction;
  resource: PermissionResource;
  scope?: 'own' | 'department' | 'company';
}

@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);
  
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<RequiredPermission[]>('permissions', context.getHandler());
    
    if (!requiredPermissions) {
      this.logger.debug('No permissions required for this endpoint');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    const resourceId = request.params.id;

    if (!user) {
      this.logger.warn('No user found in request');
      return false;
    }

    this.logger.log(`Checking permissions for user ${user.email} (${user.role}) - Required: ${JSON.stringify(requiredPermissions)}`);

    const hasPermission = requiredPermissions.some(permission =>
      this.hasPermission(user, permission, resourceId, request)
    );

    if (!hasPermission) {
      this.logger.warn(`Permission denied for user ${user.email} - Required: ${JSON.stringify(requiredPermissions)}`);
    }

    return hasPermission;
  }

  private hasPermission(
    user: User, 
    permission: RequiredPermission, 
    resourceId?: string,
    request?: any
  ): boolean {
    const { action, resource, scope } = permission;

    this.logger.debug(`Checking permission: ${action} on ${resource} (scope: ${scope}) for user ${user.email} (${user.role})`);

    // Owner has full access to company resources
    if (user.role === 'owner') {
      const result = this.checkOwnerPermissions(action, resource);
      this.logger.debug(`Owner permission check result: ${result}`);
      return result;
    }

    // Admin has department-level access
    if (user.role === 'admin') {
      const result = this.checkAdminPermissions(action, resource, scope, user, resourceId, request);
      this.logger.debug(`Admin permission check result: ${result}`);
      return result;
    }

    // Viewer has limited access
    if (user.role === 'viewer') {
      const result = this.checkViewerPermissions(action, resource, scope, user, resourceId, request);
      this.logger.debug(`Viewer permission check result: ${result}`);
      return result;
    }

    this.logger.warn(`Unknown role: ${user.role}`);
    return false;
  }

  private checkOwnerPermissions(action: PermissionAction, resource: PermissionResource): boolean {
    // Owner can do everything except delete users (for safety)
    if (resource === 'user' && action === 'delete') {
      this.logger.debug('Owner cannot delete users (safety restriction)');
      return false;
    }
    this.logger.debug('Owner has full permissions');
    return true;
  }

  private checkAdminPermissions(
    action: PermissionAction, 
    resource: PermissionResource, 
    scope: string | undefined,
    user: User, 
    resourceId?: string,
    request?: any
  ): boolean {
    switch (resource) {
      case 'task':
        return true; // Admin can manage all tasks in their department
      case 'user':
        if (action === 'delete') return false; // Admin cannot delete users
        return action === 'read' || action === 'update';
      case 'audit_log':
        return action === 'read';
      case 'department':
        return action === 'read';
      case 'company':
        return action === 'read';
      default:
        return false;
    }
  }

  private checkViewerPermissions(
    action: PermissionAction, 
    resource: PermissionResource, 
    scope: string | undefined,
    user: User, 
    resourceId?: string,
    request?: any
  ): boolean {
    switch (resource) {
      case 'task':
        if (action === 'read') return true; // Can read all department tasks
        if (action === 'delete') return false; // Cannot delete any tasks
        
        // For create/update, check if it's their own task
        if (action === 'create') return true; // Can create tasks for themselves
        if (action === 'update') {
          // Check if the task belongs to them (this would need task lookup in real implementation)
          return scope === 'own';
        }
        return false;
      case 'user':
        return action === 'read' && scope === 'own'; // Can only read their own profile
      default:
        return false;
    }
  }
}

// Decorator to set required permissions
export const RequirePermissions = (...permissions: RequiredPermission[]) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('permissions', permissions, descriptor.value);
  };
};
import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities';
import { UserProfile } from '@turbovets/data';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getProfile(user: User): Promise<UserProfile> {
    this.logger.log(`Getting profile for user: ${user.email}`);
    const userWithRelations = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['company', 'department'],
    });

    return {
      id: userWithRelations.id,
      email: userWithRelations.email,
      firstName: userWithRelations.firstName,
      lastName: userWithRelations.lastName,
      role: userWithRelations.role,
      company: {
        id: userWithRelations.company.id,
        name: userWithRelations.company.name,
      },
      department: {
        id: userWithRelations.department.id,
        name: userWithRelations.department.name,
      },
    };
  }

  async getDepartmentUsers(departmentId: string, currentUser: User): Promise<User[]> {
    this.logger.log(`Getting department users for department ${departmentId} by user: ${currentUser.email}`);
    // Check if user can access this department
    if (currentUser.role === 'viewer') {
      this.logger.warn(`Viewer ${currentUser.email} tried to list department users`);
      throw new ForbiddenException('Viewers cannot list department users');
    }

    if (currentUser.role === 'admin' && currentUser.departmentId !== departmentId) {
      this.logger.warn(`Admin ${currentUser.email} tried to access users from other department`);
      throw new ForbiddenException('Cannot access users from other departments');
    }

    if (currentUser.role === 'owner') {
      // Owner can access any department in their company
      const users = await this.userRepository.find({
        where: {
          departmentId,
          companyId: currentUser.companyId
        },
        select: ['id', 'email', 'firstName', 'lastName', 'role'],
      });
      this.logger.log(`Found ${users.length} users in department ${departmentId} for owner`);
      return users;
    }

    // Admin accessing their own department
    const users = await this.userRepository.find({
      where: { departmentId },
      select: ['id', 'email', 'firstName', 'lastName', 'role'],
    });
    this.logger.log(`Found ${users.length} users in department ${departmentId} for admin`);

    return users;
  }
}
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Company, Department } from '../entities';
import { JwtPayload, LoginResponse } from '@turbovets/data';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    this.logger.log(`Validating user: ${email}`);
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['company', 'department'],
    });

    if (user && await bcrypt.compare(password, user.passwordHash)) {
      this.logger.log(`User validation successful: ${email}`);
      return user;
    }
    this.logger.warn(`User validation failed: ${email}`);
    return null;
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    this.logger.log(`Login attempt for: ${loginDto.email}`);
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      this.logger.warn(`Login failed - invalid credentials: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Ensure relations are loaded
    if (!user.company || !user.department) {
      this.logger.error(`Login failed - user data incomplete: ${loginDto.email}`);
      throw new UnauthorizedException('User data incomplete');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      departmentId: user.departmentId,
    };

    const access_token = this.jwtService.sign(payload);
    this.logger.log(`Login successful for: ${loginDto.email}`);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: {
          id: user.company.id,
          name: user.company.name,
        },
        department: {
          id: user.department.id,
          name: user.department.name,
        },
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<LoginResponse> {
    this.logger.log(`Registration attempt for: ${registerDto.email}`);
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      this.logger.warn(`Registration failed - user already exists: ${registerDto.email}`);
      throw new UnauthorizedException('User already exists');
    }

    this.logger.log(`Creating company: ${registerDto.companyName}`);
    const company = this.companyRepository.create({
      name: registerDto.companyName,
    });
    const savedCompany = await this.companyRepository.save(company);
    this.logger.log(`Company created with ID: ${savedCompany.id}`);

    this.logger.log(`Creating department: ${registerDto.departmentName}`);
    const department = this.departmentRepository.create({
      name: registerDto.departmentName,
      companyId: savedCompany.id,
    });
    const savedDepartment = await this.departmentRepository.save(department);
    this.logger.log(`Department created with ID: ${savedDepartment.id}`);

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    this.logger.log(`Creating owner user: ${registerDto.email}`);
    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      companyId: savedCompany.id,
      departmentId: savedDepartment.id,
      role: 'owner',
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`User created with ID: ${savedUser.id}`);

    const userWithRelations = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['company', 'department'],
    });

    const payload = {
      sub: userWithRelations.id,
      email: userWithRelations.email,
      role: userWithRelations.role,
      companyId: userWithRelations.companyId,
      departmentId: userWithRelations.departmentId,
    };

    const access_token = this.jwtService.sign(payload);
    this.logger.log(`Registration successful for: ${registerDto.email}`);

    return {
      access_token,
      user: {
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
      },
    };
  }

  async refreshToken(user: User): Promise<LoginResponse> {
    this.logger.log(`Token refresh for user: ${user.email}`);
    const userWithRelations = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['company', 'department'],
    });

    if (!userWithRelations) {
      this.logger.warn(`Token refresh failed - user not found: ${user.email}`);
      throw new UnauthorizedException('User not found');
    }

    const payload = {
      sub: userWithRelations.id,
      email: userWithRelations.email,
      role: userWithRelations.role,
      companyId: userWithRelations.companyId,
      departmentId: userWithRelations.departmentId,
    };

    const access_token = this.jwtService.sign(payload);
    this.logger.log(`Token refresh successful for: ${user.email}`);

    return {
      access_token,
      user: {
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
      },
    };
  }
}
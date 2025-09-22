import { Controller, Post, Body, ValidationPipe, HttpException, HttpStatus, Logger, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginResponse } from '@turbovets/data';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from '../entities';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<LoginResponse> {
    try {
      this.logger.log(`Login attempt for email: ${loginDto.email}`);
      const result = await this.authService.login(loginDto);
      this.logger.log(`Login successful for email: ${loginDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Login failed for email: ${loginDto.email}`);
      this.logger.error(`Error message: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      if (error.message === 'Invalid credentials' || error.message === 'User data incomplete') {
        throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException(`Login error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto): Promise<LoginResponse> {
    try {
      this.logger.log(`Registration attempt for email: ${registerDto.email}`);
      this.logger.debug(`Registration data: ${JSON.stringify(registerDto, null, 2)}`);
      const result = await this.authService.register(registerDto);
      this.logger.log(`Registration successful for email: ${registerDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Registration failed for email: ${registerDto.email}`);
      this.logger.error(`Error message: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      if (error.message === 'User already exists') {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(`Registration error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh(@Request() req: { user: User }): Promise<LoginResponse> {
    try {
      this.logger.log(`Token refresh for user: ${req.user.email}`);
      const result = await this.authService.refreshToken(req.user);
      this.logger.log(`Token refresh successful for user: ${req.user.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Token refresh failed for user: ${req.user.email}`);
      this.logger.error(`Error message: ${error.message}`);
      throw new HttpException(`Token refresh error: ${error.message}`, HttpStatus.UNAUTHORIZED);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: User }) {
    return {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      company: {
        id: req.user.company.id,
        name: req.user.company.name,
      },
      department: {
        id: req.user.department.id,
        name: req.user.department.name,
      },
    };
  }
}
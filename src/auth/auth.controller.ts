import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  HttpCode,
  Request,
  Query,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LocalGuard } from './password/local.guard';
import { UserEntity } from '../users/entities/user.entity';
import { PasswordLoginDto } from './dto/password-login.dto';
import { PasswordService } from './password/password.service';
import { UserService } from '../users/users.service';
import { MagicLoginDto } from './dto/magic-login.dto';
import { MagicLoginService } from './magic/magic.service';
import { PasswordRecoveryDto } from './dto/password-recovery.dto';
import { PasswordUpdateDto } from './dto/password-update.dto';
import { ZodResponseInterceptor } from 'src/common/interceptors/zod-response.interceptor';
import {
  LoginResponseDto,
  LoginResponseSchema,
} from './dto/response-password-login.dto';
import {
  ResponsePasswordRecoveryDto,
  ResponsePasswordRecoverySchema,
} from './dto/response-recovery-password.dto';
import {
  ResponsePasswordUpdateDto,
  ResponsePasswordUpdateSchema,
} from './dto/response-password-update.dto';
import {
  ResponseGenerateMagicLinkDto,
  ResponseGenerateMagicLinkSchema,
} from './dto/response-generate-magic-link.dto';
import {
  ResponseVerifyMagicLinkDto,
  ResponseVerifyMagicLinkSchema,
} from './dto/response-verify-magic-link.dto';
import {
  ResponseProfileDto,
  ResponseProfileSchema,
} from './dto/response-profile.dto';

import { Public } from 'src/common/decorators/public-endpoint.decorator';
import {
  CheckIfAlreadExistsDto,
  ResponseCheckExistsDto,
} from './dto/check-if-already-exists.dto';

@ApiTags('Authentication')
@Controller('auths')
export class AuthController {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly jwtService: UserService,
    private readonly magicLoginService: MagicLoginService,
  ) {}

  @Public()
  @Post('login/password')
  @UseGuards(LocalGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with password' })
  @ApiBody({ type: PasswordLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UseInterceptors(new ZodResponseInterceptor(LoginResponseSchema))
  async passwordLogin(@Req() req): Promise<LoginResponseDto> {
    return this.passwordService.login(req);
  }

  @Public()
  @Post('password/recovery')
  @ApiOperation({ summary: 'Request password recovery' })
  @ApiBody({ type: PasswordRecoveryDto })
  @ApiResponse({
    status: 200,
    description: 'Email with recovery code sent successfully',
    type: ResponsePasswordRecoveryDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  @UseInterceptors(new ZodResponseInterceptor(ResponsePasswordRecoverySchema))
  async recoverPassword(
    @Body() body: PasswordRecoveryDto,
  ): Promise<ResponsePasswordRecoveryDto> {
    return this.passwordService.recoveryPassword(body.email);
  }

  @Public()
  @Post('password/update')
  @ApiOperation({ summary: 'Update password using recovery token' })
  @ApiBody({ type: PasswordUpdateDto })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully',
    type: ResponsePasswordUpdateDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired recovery token',
  })
  @UseInterceptors(new ZodResponseInterceptor(ResponsePasswordUpdateSchema))
  async updatePassword(
    @Body() body: PasswordUpdateDto,
  ): Promise<ResponsePasswordUpdateDto> {
    return this.passwordService.updatePassword(
      body.email,
      body.token,
      body.newPassword,
    );
  }

  @Public()
  @Post('login/magic')
  @ApiOperation({ summary: 'Request Magic Login Link' })
  @ApiBody({ type: MagicLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Magic link sent',
    type: ResponseGenerateMagicLinkDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  @UseInterceptors(new ZodResponseInterceptor(ResponseGenerateMagicLinkSchema))
  async requestMagicLink(
    @Body() body: MagicLoginDto,
  ): Promise<ResponseGenerateMagicLinkDto> {
    return this.magicLoginService.generateMagicLink(body);
  }

  @Public()
  @Get('magic/verify')
  @ApiOperation({ summary: 'Verify Magic Login Token' })
  @ApiQuery({ name: 'token', type: String, required: true })
  @ApiResponse({
    status: 200,
    description: 'User authenticated',
    type: ResponseVerifyMagicLinkDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @UseInterceptors(new ZodResponseInterceptor(ResponseVerifyMagicLinkSchema))
  async verifyMagicToken(
    @Query('token') token: string,
    @Request() req,
  ): Promise<ResponseVerifyMagicLinkDto> {
    if (!token) throw new BadRequestException('Token is required');
    return this.magicLoginService.verifyMagicToken({
      token,
      req,
    });
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: ResponseProfileDto,
  })
  @UseInterceptors(new ZodResponseInterceptor(ResponseProfileSchema))
  getProfile(@Request() req: { user: UserEntity }) {
    const userId = req.user.id;

    return this.jwtService.findOne({ id: userId });
  }

  @Public()
  @Get('check-already-exists')
  @ApiOperation({ summary: 'Check if a phone or email already exists' })
  @ApiResponse({
    status: 200,
    description: 'Phone or email already exists',
    type: ResponseCheckExistsDto,
  })
  @ApiQuery({
    name: 'phone',
    required: false,
    type: String,
    description: 'Phone number',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Email address',
  })
  async checkIfAlreadyExistPhoneOrEmail(
    @Query() query: CheckIfAlreadExistsDto,
  ) {
    return this.jwtService.checkIfEmailOrPhoneExists(query);
  }
}

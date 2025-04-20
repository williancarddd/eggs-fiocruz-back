import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../users/users.service';
import { randomBytes } from 'crypto';
import { MagicLoginDto, MagicLoginSchema } from '../dto/magic-login.dto';
import { Request } from 'express';
import { ResponseGenerateMagicLinkDto } from '../dto/response-generate-magic-link.dto';
import { ResponsePasswordUpdateSchema } from '../dto/response-password-update.dto';
import { ResponseVerifyMagicLinkDto } from '../dto/response-verify-magic-link.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRegisterLoginHistoryService } from '../../users/user-login-history.service';
import { NotificationType } from 'src/notification/dto/create-notification.dto';

@Injectable()
export class MagicLoginService {
  private magicTokens = new Map<string, string>();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly eventEmitterNotification: EventEmitter2,
    private readonly userRegisterLoginHistoryService: UserRegisterLoginHistoryService,
  ) {}

  async generateMagicLink({
    email,
    callbackUrl,
  }: MagicLoginDto): Promise<ResponseGenerateMagicLinkDto> {
    const parsed = MagicLoginSchema.parse({ email, callbackUrl });

    const user = await this.userService.findOne({ email: parsed.email });
    if (!user) throw new BadRequestException('User not found');

    try {
      const token = randomBytes(32).toString('hex');
      this.magicTokens.set(token, parsed.email);

      const url = new URL(parsed.callbackUrl);
      url.searchParams.append('token', token);

      this.eventEmitterNotification.emit('notification.created', {
        subject: 'Password Recovery',
        type: NotificationType.EMAIL,
        recipientEmail: [user.email],
        template: {
          id: 'magic-login',
          variables: {
            url: url.toString(),
          },
        },
      });

      return ResponsePasswordUpdateSchema.parse({});
    } catch (error) {
      this.magicTokens.delete(parsed.email);
      throw new InternalServerErrorException(
        'Error sending magic link',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  async verifyMagicToken({
    token,
    req,
  }: {
    token: string;
    req: Request;
  }): Promise<ResponseVerifyMagicLinkDto> {
    const email = this.magicTokens.get(token);

    if (!email) throw new UnauthorizedException('Invalid or expired token');

    const user = await this.userService.findOne({ email });

    if (!user) throw new UnauthorizedException('User not found');

    this.magicTokens.delete(token); // Invalidate the token after use

    const jwtPayload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
    };

    this.userRegisterLoginHistoryService.create({
      userId: user.id,
      ipAddress: req.ip!,
      userAgent: req.headers['user-agent']!,
      url: req.url,
      strategy: 'magic-link',
    });

    const access_token = this.jwtService.sign(jwtPayload);

    return { access_token, token_type: 'Bearer' };
  }
}

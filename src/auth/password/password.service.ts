import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { comparePasswords } from 'src/utils/crypto';
import { PasswordRecoverySchema } from '../dto/password-recovery.dto';
import { PasswordUpdateSchema } from '../dto/password-update.dto';
import { LoginResponseDto } from '../dto/response-password-login.dto';
import {
  ResponsePasswordRecoveryDto,
  ResponsePasswordRecoverySchema,
} from '../dto/response-recovery-password.dto';
import { ResponsePasswordUpdateDto } from '../dto/response-password-update.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRegisterLoginHistoryService } from '../../users/user-login-history.service';
import { NotificationType } from 'src/notification/dto/create-notification.dto';
import { randomNumberWithSixDigits } from 'src/utils/random-number';
import { expirationFutureDate } from 'src/utils/expiration-future-date';
import { UserService } from 'src/users/users.service';
import { UserEntity } from 'src/users/entities/user.entity';

@Injectable()
export class PasswordService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly userRegisterLoginHistoryService: UserRegisterLoginHistoryService,
  ) {}

  /**
   * Validates a user's credentials.
   * @param email - User email
   * @param password - User password
   * @returns A user response with id, email, and companyId.
   * @throws UnauthorizedException if the user is not found or password is invalid.
   */
  async validateUser(email: string, password: string) {
    const user = await this.userService.findOne({ email });
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = comparePasswords(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid password');

    return {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
    };
  }

  /**
   * Initiates the password recovery process by generating a recovery token,
   * sending it via email, and saving the token to the user.
   * @param email - User email for recovery
   * @returns A success message if the email is sent.
   * @throws UnauthorizedException if the user is not found.
   * @throws InternalServerErrorException if there is an error sending the email.
   */
  async recoveryPassword(email: string): Promise<ResponsePasswordRecoveryDto> {
    PasswordRecoverySchema.parse({ email });

    const user = await this.userService.findOne({ email });

    if (!user) throw new UnauthorizedException('User not found');

    try {
      const expirationDate = expirationFutureDate(10);

      const randomNumber = randomNumberWithSixDigits().toString();

      this.eventEmitter.emit('notification.created', {
        subject: 'Password Recovery',
        type: NotificationType.EMAIL,
        recipientEmail: [user.email],
        template: {
          id: 'password-reset',
          variables: {
            resetToken: randomNumber,
          },
        },
      });

      await this.userService.updateRecoveryPasswordToken({
        token: randomNumber,
        userId: user.id,
        recoveryPasswordTokenExpiresAt: expirationDate,
      });

      return ResponsePasswordRecoverySchema.parse({});
    } catch (error) {
      throw new InternalServerErrorException('Error sending email');
    }
  }

  /**
   * Updates the user's password after validating the recovery token.
   * @param email - User email
   * @param token - Recovery token provided by the user
   * @param newPassword - The new password to be set
   * @returns A success message if the password is updated.
   * @throws UnauthorizedException if the user is not found.
   * @throws BadRequestException if the recovery token is invalid.
   * @throws InternalServerErrorException if there is an error updating the password.
   */
  async updatePassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<ResponsePasswordUpdateDto> {
    PasswordUpdateSchema.parse({ email, token, newPassword });

    const user = await this.userService.findOne({ email });

    if (!user) throw new UnauthorizedException('User not found');

    // Validate recovery token
    if (user.recoveryPasswordToken !== token) {
      throw new BadRequestException('Invalid recovery token');
    }

    if (user.recoveryPasswordTokenExpiresAt! < new Date()) {
      throw new BadRequestException('Recovery token has expired');
    }

    const updatedUser = await this.userService.changePassword({
      userId: user.id,
      password: newPassword,
    });

    if (!updatedUser)
      throw new InternalServerErrorException('Error updating password');

    await this.userService.updateRecoveryPasswordToken({
      token: null,
      userId: user.id,
      recoveryPasswordTokenExpiresAt: null,
    });

    return {
      message: 'Password updated successfully',
    };
  }

  /**
   * Performs the login operation, registers the login history, and returns an access token.
   * @param req - Express request object containing the authenticated user.
   * @returns An object containing the JWT access token.
   */
  async login(req: Request): Promise<LoginResponseDto> {
    const user = req.user as unknown as UserEntity;

    const payload = {
      sub: user.id,
      email: user.email,
    };

    await this.userRegisterLoginHistoryService.create({
      userId: user.id,
      ipAddress: req.ip!,
      userAgent: req.headers['user-agent']!,
      url: req.url,
      strategy: 'password',
    });

    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
    };
  }
}

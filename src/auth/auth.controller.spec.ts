import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PasswordService } from './password/password.service';
import { UserService } from '../users/users.service';
import { MagicLoginService } from './magic/magic.service';
import { Role } from '@prisma/client';

const mockUser = {
  id: 'cm7897put000337ygqblfrkli',
  email: 'test@example.com',
  companyId: 'cm7897put000337ygqblfrkli',
  password: 'hashedpassword',
  addressId: 'cm7897put000337ygqblfrkli',
  role: Role.ADMIN,
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthController', () => {
  let authController: AuthController;
  let passwordService: PasswordService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: PasswordService,
          useValue: {
            login: jest.fn().mockResolvedValue({ access_token: 'token' }),
            recoveryPassword: jest.fn().mockResolvedValue({
              message: 'Email with recovery code sent successfully',
            }),
            updatePassword: jest.fn().mockResolvedValue({
              message: 'Password updated successfully',
            }),
          },
        },
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
          },
        },
        {
          provide: MagicLoginService,
          useValue: {
            someMethod: jest.fn().mockResolvedValue(null), // Replace with actual methods if necessary
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    passwordService = module.get<PasswordService>(PasswordService);
    userService = module.get<UserService>(UserService);
  });

  describe('passwordLogin', () => {
    it('should return an access token on successful login', async () => {
      const req = { user: mockUser };

      const result = await authController.passwordLogin(req);
      expect(result).toEqual({ access_token: 'token' });
      expect(passwordService.login).toHaveBeenCalledWith(req);
    });
  });

  describe('getProfile', () => {
    it('should return the user profile', async () => {
      const req = { user: mockUser };
      const result = await authController.getProfile(req);
      expect(result).toEqual(mockUser);
      expect(userService.findOne).toHaveBeenCalledWith({ id: mockUser.id });
    });
  });

  describe('recoverPassword', () => {
    it('should send a recovery email successfully', async () => {
      const body = { email: mockUser.email };
      const result = await authController.recoverPassword(body);
      expect(result).toEqual({
        message: 'Email with recovery code sent successfully',
      });
      expect(passwordService.recoveryPassword).toHaveBeenCalledWith(
        mockUser.email,
      );
    });
  });

  describe('updatePassword', () => {
    it('should update the password if a valid recovery token is provided', async () => {
      const dto = {
        email: mockUser.email,
        token: '123456',
        newPassword: 'newPassword',
      };
      const result = await authController.updatePassword(dto);
      expect(result).toEqual({
        message: 'Password updated successfully',
      });
      expect(passwordService.updatePassword).toHaveBeenCalledWith(
        dto.email,
        dto.token,
        dto.newPassword,
      );
    });

    it('should throw an error if the updatePassword service throws an error', async () => {
      const dto = {
        email: mockUser.email,
        token: 'wrongtoken',
        newPassword: 'newPassword',
      };
      (passwordService.updatePassword as jest.Mock).mockRejectedValueOnce(
        new BadRequestException('Invalid recovery token'),
      );
      await expect(authController.updatePassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

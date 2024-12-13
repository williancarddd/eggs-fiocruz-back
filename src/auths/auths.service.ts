import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { comparePassoword } from 'src/utils/crypto';
import { User } from '@prisma/client';

/*
  The AuthService class is a service that provides methods to validate a user and login.
  The validateUser method receives an email and a password and calls the findByEmail method from the UsersService class to find a user by email.
  The comparePasswords function is called to compare the password received as a parameter with the password of the user found.
  If the user is found and the passwords match, the method returns the user object without the password property.
  If the user is not found or the passwords do not match, the method returns null.
  The login method receives a user object and generates a JWT token with the user email and id as payload.
*/

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const compare = comparePassoword(password, user.password);
    if (!compare) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: User) {
    const payload: Partial<User & { sub: string }> = {
      email: user?.email,
      sub: user?.id,
      name: user?.name,
      type: user?.type,
    };

    const response = {
      accessToken: this.jwtService.sign(payload),
      ...payload,
    };

    await this.usersService.registerHistoryLogin(user.id, new Date());


    return response;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../users/users.service';
import { ENV } from 'src/common/constants/constants';

@Injectable()
export class MagicLoginStrategy extends PassportStrategy(Strategy, 'magic') {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: ENV.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findOne({ email: payload.email });
    if (!user) throw new UnauthorizedException('User not found');

    return { id: user.id, email: user.email, companyId: user.companyId };
  }
}

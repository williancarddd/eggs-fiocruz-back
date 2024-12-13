import {
  Controller,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public-endpoint.decorator';
import { LocalAuthGuard } from './guards/local-auth.guards';
import { AuthService } from './auths.service';
import { AuthRequest } from './auth/interfaces/auth-request.interface';
import { AuthLoginDto, AuthResponseDto } from './dto/create-login.dto';

@ApiTags('auths')
@Controller('auths')
export class AuthsController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @UseGuards(LocalAuthGuard)
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Log in with email  and password', operationId: 'login' })
  @ApiBody({ type: AuthLoginDto, description: 'User credentials for login' })
  @ApiResponse({
    status: 200,
    description:
      'Login successful. Returns a JWT access token and user information.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Invalid cpf, cnpj  or password.',
  })
  async login(@Request() req: AuthRequest) {
    return this.authService.login(req.user);
  }
}

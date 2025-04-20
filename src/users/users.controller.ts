import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './users.service';
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response.decorator';
import {
  ResponsePaginatedUsersDto,
  ResponsePaginatedUsersSchema,
} from './dto/response-paginated-users.dto';
import { ZodResponseInterceptor } from 'src/common/interceptors/zod-response.interceptor';
import { ResponseUserDto, ResponseUserSchema } from './dto/response-user.dto';
import { Public } from 'src/common/decorators/public-endpoint.decorator';
import { CreateUserDto } from './dto/create-owner.dto';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List all users with dynamic filters' })
  @ApiPaginatedResponse(ResponseUserDto)
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: ResponsePaginatedUsersDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter by name',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filter by email',
  })
  @UseInterceptors(new ZodResponseInterceptor(ResponsePaginatedUsersSchema))
  async findAll(@Query() query: any) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User identifier' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: ResponseUserDto,
  })
  @UseInterceptors(new ZodResponseInterceptor(ResponseUserSchema))
  async findOne(@Param('id') id: string) {
    return this.userService.findOne({ id });
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: ResponseUserDto,
  })
  @UseInterceptors(new ZodResponseInterceptor(ResponseUserSchema))
  async registerOwner(@Body() createUser: CreateUserDto) {
    return this.userService.create(createUser);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiParam({ name: 'id', description: 'User identifier' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: ResponseUserDto,
  })
  @UseInterceptors(new ZodResponseInterceptor(ResponseUserSchema))
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User identifier' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}

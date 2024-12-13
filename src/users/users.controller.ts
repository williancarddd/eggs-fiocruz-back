import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBody, ApiOperation, ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public-endpoint.decorator';
import { ApiPaginatedResponse } from 'src/common/decorators/api-paginated-response.decorator';
import { UserDto } from './entities/user.entity';

@Controller('fiocruz/users')
@ApiTags('Users') // Agrupa os endpoints na seção 'Users' no Swagger
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @ApiOperation({
    summary: 'Create a new user', // Breve descrição da funcionalidade
    operationId: 'createUser', // ID único para referência no Swagger
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully created.', // Mensagem de resposta bem-sucedida
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data.', // Mensagem de erro para entrada inválida
  })
  @Post()
  @Public()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({
    summary: 'List all users',
    operationId: 'findAllUsers',
  })
  @ApiPaginatedResponse(UserDto) // Resposta paginada personalizada
  @ApiResponse({
    status: 200,
    description: 'List of all users.',
    type: [UserDto],
  })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({
    summary: 'Find a user by ID',
    operationId: 'findUserById',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the user to be retrieved.',
    type: String,
    example: '12345',
  })
  @ApiResponse({
    status: 200,
    description: 'User found.',
    type: UserDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update a user by ID',
    operationId: 'updateUser',
  })
  @ApiBody({
    description: 'Data to update the user.',
    type: UpdateUserDto,
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the user to be updated.',
    type: String,
    example: '12345',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully updated.',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({
    summary: 'Delete a user by ID',
    operationId: 'deleteUser',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the user to be deleted.',
    type: String,
    example: '12345',
  })
  @ApiResponse({
    status: 200,
    type: UserDto,
    description: 'User successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found.',
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

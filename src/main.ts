import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { PrismaExceptionFilters } from './common/exception-filters/prisma.exception-filters';
import { ENV } from './common/constants/constants';
import { ZodFilter } from './common/exception-filters/zod-exception.filter';
import { patchNestJsSwagger } from 'nestjs-zod';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new ZodFilter());
  app.useGlobalFilters(new PrismaExceptionFilters());
  patchNestJsSwagger();
  const config = new DocumentBuilder()
    .setTitle('Documentation of API Fiocruz')
    .setDescription(
      'It API was   developed  to provide data  FIOCRUZ AIEGGSCOUNTER.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addSecurityRequirements('JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  app.useGlobalPipes(new ValidationPipe());
  SwaggerModule.setup('getting-started', app, document, {
    customSiteTitle: 'API Fiocruz AI EGGS',
    jsonDocumentUrl: 'swagger/json',
  });
  await app.listen(Number(ENV.PORT_APP));
}
bootstrap();

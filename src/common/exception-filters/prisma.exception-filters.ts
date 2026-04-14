import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilters implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception.code == 'P2025') {
      return response.status(404).json({
        statusCode: 404,
        meta: exception.meta,
        message: `An operation failed because it depends on one or more records that were required but not found ${exception.name}.`,
      });
    }

    if (exception.code == 'P2003') {
      return response.status(404).json({
        statusCode: 404,
        meta: exception.meta,
        message: `${exception.meta!.target} not found.`,
      });
    }

    if (exception.code == 'P2002') {
      return response.status(409).json({
        statusCode: 409,
        meta: exception.meta,
        message: `${exception.meta!.target} already exists.`,
      });
    }

    return response.status(500).json({
      statusCode: 500,
      message: 'Internal server error in database.',
      meta: exception.meta,
    });
  }
}

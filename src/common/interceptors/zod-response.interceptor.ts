import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { z } from 'zod';

@Injectable()
export class ZodResponseInterceptor implements NestInterceptor {
  private readonly log = new Logger(ZodResponseInterceptor.name);

  constructor(private readonly schema: z.ZodType<any>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (data === null || data === undefined) {
          this.log.error('Response data is null or undefined');
          throw new InternalServerErrorException(
            'Response data is null or undefined',
          );
        }

        try {
          return this.schema.parse(data);
        } catch (err) {
          this.log.error(`Validation failed: ${(err as Error).message}`);
          throw new InternalServerErrorException('Internal Server Error');
        }
      }),
    );
  }
}

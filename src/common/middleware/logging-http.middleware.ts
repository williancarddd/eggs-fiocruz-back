import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerHttpMiddleware implements NestMiddleware {
  private readonly Logger = new Logger(LoggerHttpMiddleware.name);

  constructor() {
    this.Logger.log('LoggerMiddleware initialized');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;
    const reqTime = Date.now();

    res.on('finish', () => {
      const resTime = Date.now() - reqTime;
      const user = req.user;
      const userIdentification = user ? `${user.id}` : '';

      this.Logger.log(
        `method/${method}  url${originalUrl} statusCode/${statusCode} ip/${ip} userId/${userIdentification} - ${resTime}ms`,
      );
    });
    next();
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { toPaginationInfo } from 'src/utils';

// normalises ?page & ?pageSize on every request.
// Authentication itself is enforced by JwtAuthGuard / JwtStrategy.
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.query) {
      const { page, pageSize } = toPaginationInfo(req.query);
      req.query['page'] = page as any;
      req.query['pageSize'] = pageSize as any;
    }
    next();
  }
}

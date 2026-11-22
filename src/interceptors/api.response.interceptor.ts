import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// Services return ApiResponseDto ({ code, data, message }); this sets the HTTP
// status from `code` so controllers can simply `return` the service result.
@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      tap((body) => {
        if (typeof body?.code === 'number') {
          response.status(body.code);
        }
      }),
    );
  }
}

import { ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ApiResponseInterceptor } from './api.response.interceptor';

describe('ApiResponseInterceptor', () => {
  const run = async (body: any) => {
    const status = jest.fn();
    const ctx = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ExecutionContext;
    const out = await lastValueFrom(
      new ApiResponseInterceptor().intercept(ctx, { handle: () => of(body) }),
    );
    return { out, status };
  };

  it('sets the HTTP status from the response code', async () => {
    const { out, status } = await run({ code: 404, message: 'nope' });
    expect(status).toHaveBeenCalledWith(404);
    expect(out.message).toBe('nope');
  });

  it('leaves bodies without a code alone', async () => {
    const { status } = await run({ ok: true });
    expect(status).not.toHaveBeenCalled();
  });
});

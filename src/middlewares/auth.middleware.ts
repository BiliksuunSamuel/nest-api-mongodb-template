import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';
import { UserRepository } from 'src/repositories/user.repository';
import { toPaginationInfo } from 'src/utils';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    const query = req.query;
    if (query) {
      const paginationInfo = toPaginationInfo(query);
      req.query['page'] = paginationInfo.page as any;
      req.query['pageSize'] = paginationInfo.pageSize as any;
      this.logger.log('request query details', req.query);
    }
    if (token) {
      try {
        const decondedToken =
          await this.jwtService.verifyAsync<UserJwtDetails>(token);
        this.logger.debug('Decoded Token', decondedToken);
        const user = await this.userRepository.getById(decondedToken.id);
        if (!user) {
          return res.status(401).send({ message: 'Unauthorized' });
        }
        if (!user.tokenIds.includes(decondedToken.tokenId)) {
          return res.status(401).send({ message: 'Unauthorized' });
        }
      } catch (error) {
        this.logger.error('Error in AuthMiddleware', error);
      }
    }
    next();
  }
}

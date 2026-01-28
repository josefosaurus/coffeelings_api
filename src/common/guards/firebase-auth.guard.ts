import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    // Development mode bypass
    if (process.env.ENABLE_DEV_AUTH === 'true' && process.env.NODE_ENV === 'development') {
      if (token === 'dev-token-123' || token.startsWith('dev-')) {
        this.logger.warn('⚠️  Using development authentication bypass');
        // Extract user ID from token or use default
        const userId = token.replace('dev-', '') || 'test-user-123';
        request.userId = userId === 'token-123' ? 'test-user-123' : userId;
        return true;
      }
    }

    try {
      const decodedToken = await this.firebaseService.verifyIdToken(token);
      request.userId = decodedToken.uid;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

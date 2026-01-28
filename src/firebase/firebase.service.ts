import { Injectable, OnModuleInit, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App;
  private isDevMode = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('firebase.projectId');
    const privateKey = this.configService.get<string>('firebase.privateKey');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const enableDevAuth = this.configService.get<string>('enableDevAuth');
    const nodeEnv = this.configService.get<string>('nodeEnv');

    if (!projectId || !privateKey || !clientEmail) {
      throw new Error(
        'Firebase credentials not properly configured. Please check environment variables.',
      );
    }

    // Check if we're in development mode with dev auth enabled, or in test mode
    this.isDevMode = (enableDevAuth === 'true' && nodeEnv === 'development') || nodeEnv === 'test';

    if (this.isDevMode && (projectId === 'coffeelings-dev' || nodeEnv === 'test')) {
      if (nodeEnv === 'development') {
        this.logger.warn('🚧 Running in DEVELOPMENT mode with mocked Firebase');
        this.logger.warn('⚠️  Use "Bearer dev-token-123" for authentication in Postman');
      } else if (nodeEnv === 'test') {
        this.logger.log('Running in TEST mode with mocked Firebase');
      }
      // Don't try to initialize Firebase with mock credentials
      return;
    }

    try {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });
    } catch (error) {
      if (this.isDevMode) {
        this.logger.warn('Firebase initialization failed (expected in dev mode with mock credentials)');
      } else {
        throw error;
      }
    }
  }

  getFirestore(): admin.firestore.Firestore {
    if (this.isDevMode) {
      this.logger.warn('Firestore called in dev mode - using in-memory mock');
      // In dev mode, Firestore won't work with mock credentials
      // The roasts service should handle this gracefully
    }
    return admin.firestore();
  }

  async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await admin.auth().verifyIdToken(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

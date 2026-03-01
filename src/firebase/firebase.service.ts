import { Injectable, OnModuleInit, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

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

    if (this.isDevMode && (process.env.MOCK_STORAGE !== 'false' || nodeEnv === 'test')) {
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
        this.logger.error(`Firebase initialization failed: ${error.message}`);
      } else {
        throw error;
      }
    }
  }

  getFirestore(): admin.firestore.Firestore {
    const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
    return getFirestore(this.firebaseApp, databaseId);
  }

  async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await admin.auth().verifyIdToken(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

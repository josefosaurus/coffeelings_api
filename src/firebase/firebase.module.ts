import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { MockStorageService } from './mock-storage.service';

@Module({
  providers: [FirebaseService, MockStorageService],
  exports: [FirebaseService, MockStorageService],
})
export class FirebaseModule {}

import { Module } from '@nestjs/common';
import { RoastsController } from './roasts.controller';
import { RoastsService } from './roasts.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [RoastsController],
  providers: [RoastsService],
})
export class RoastsModule {}

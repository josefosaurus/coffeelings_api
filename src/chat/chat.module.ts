import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { RoastsModule } from '../roasts/roasts.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule, RoastsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}

import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [FirebaseModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}

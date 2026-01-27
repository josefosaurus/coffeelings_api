import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoastsService } from './roasts.service';
import { CreateRoastDto } from './dto/create-roast.dto';
import { UpdateRoastDto } from './dto/update-roast.dto';
import { QueryCalendarDto } from './dto/query-calendar.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { UserId } from '../common/decorators/user-id.decorator';

@Controller('calendar')
@UseGuards(FirebaseAuthGuard)
export class RoastsController {
  constructor(private readonly roastsService: RoastsService) {}

  @Get()
  async getCalendar(
    @UserId() userId: string,
    @Query() query: QueryCalendarDto,
  ) {
    return this.roastsService.getCalendar(userId, query.year, query.month);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRoast(
    @UserId() userId: string,
    @Body() createDto: CreateRoastDto,
  ) {
    return this.roastsService.createRoast(userId, createDto);
  }

  @Patch(':id')
  async updateRoast(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateRoastDto,
  ) {
    return this.roastsService.updateRoast(userId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRoast(@UserId() userId: string, @Param('id') id: string) {
    await this.roastsService.deleteRoast(userId, id);
  }
}

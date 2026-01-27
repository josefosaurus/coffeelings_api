import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateRoastDto } from './dto/create-roast.dto';
import { UpdateRoastDto } from './dto/update-roast.dto';
import { DailyRoast, CalendarResponse } from './entities/roast.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoastsService {
  constructor(private readonly firebaseService: FirebaseService) {}

  private getFirestore() {
    return this.firebaseService.getFirestore();
  }

  private computeYearMonth(timestamp: number): { year: string; month: string } {
    const dateObj = new Date(timestamp);
    const year = dateObj.getFullYear().toString();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    return { year, month };
  }

  async getCalendar(
    userId: string,
    year: string,
    month: string,
  ): Promise<CalendarResponse> {
    const db = this.getFirestore();
    const roastsRef = db
      .collection('users')
      .doc(userId)
      .collection('roasts');

    const snapshot = await roastsRef
      .where('year', '==', year)
      .where('month', '==', month)
      .get();

    const roasts = snapshot.docs.map((doc) => {
      const data = doc.data() as DailyRoast;
      return {
        id: data.id,
        roast: data.roast,
        message: data.message,
        date: data.date,
      };
    });

    return {
      [year]: {
        [month]: roasts,
      },
    };
  }

  async createRoast(
    userId: string,
    createDto: CreateRoastDto,
  ): Promise<Omit<DailyRoast, 'userId' | 'year' | 'month' | 'createdAt' | 'updatedAt'>> {
    const db = this.getFirestore();
    const id = uuidv4();
    const now = Date.now();
    const { year, month } = this.computeYearMonth(createDto.date);

    const roastData: DailyRoast = {
      id,
      roast: createDto.roast,
      message: createDto.message,
      date: createDto.date,
      userId,
      year,
      month,
      createdAt: now,
      updatedAt: now,
    };

    await db
      .collection('users')
      .doc(userId)
      .collection('roasts')
      .doc(id)
      .set(roastData);

    return {
      id: roastData.id,
      roast: roastData.roast,
      message: roastData.message,
      date: roastData.date,
    };
  }

  async updateRoast(
    userId: string,
    roastId: string,
    updateDto: UpdateRoastDto,
  ): Promise<Omit<DailyRoast, 'userId' | 'year' | 'month' | 'createdAt' | 'updatedAt'>> {
    const db = this.getFirestore();
    const roastRef = db
      .collection('users')
      .doc(userId)
      .collection('roasts')
      .doc(roastId);

    const doc = await roastRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Roast not found');
    }

    const existingRoast = doc.data() as DailyRoast;

    if (existingRoast.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this roast');
    }

    const now = Date.now();
    const updatedData: Partial<DailyRoast> = {
      ...updateDto,
      updatedAt: now,
    };

    // If date is being updated, recalculate year and month
    if (updateDto.date !== undefined) {
      const { year, month } = this.computeYearMonth(updateDto.date);
      updatedData.year = year;
      updatedData.month = month;
    }

    await roastRef.update(updatedData);

    const updatedDoc = await roastRef.get();
    const updatedRoast = updatedDoc.data() as DailyRoast;

    return {
      id: updatedRoast.id,
      roast: updatedRoast.roast,
      message: updatedRoast.message,
      date: updatedRoast.date,
    };
  }

  async deleteRoast(userId: string, roastId: string): Promise<void> {
    const db = this.getFirestore();
    const roastRef = db
      .collection('users')
      .doc(userId)
      .collection('roasts')
      .doc(roastId);

    const doc = await roastRef.get();

    if (!doc.exists) {
      throw new NotFoundException('Roast not found');
    }

    const existingRoast = doc.data() as DailyRoast;

    if (existingRoast.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this roast');
    }

    await roastRef.delete();
  }
}

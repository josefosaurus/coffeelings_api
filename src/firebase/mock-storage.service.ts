import { Injectable, Logger } from '@nestjs/common';
import { DailyRoast } from '../roasts/entities/roast.entity';

/**
 * In-memory storage for development/testing
 * Mimics Firestore structure: users/{userId}/roasts/{roastId}
 */
@Injectable()
export class MockStorageService {
  private readonly logger = new Logger(MockStorageService.name);
  private storage: Map<string, Map<string, DailyRoast>> = new Map();

  constructor() {
    this.logger.warn('🗄️  Using in-memory mock storage (development mode)');
    this.logger.warn('⚠️  Data will be lost on server restart');
  }

  /**
   * Get all roasts for a user filtered by year and month
   */
  async getRoasts(userId: string, year: string, month: string): Promise<DailyRoast[]> {
    const userRoasts = this.storage.get(userId);
    if (!userRoasts) {
      return [];
    }

    const filtered = Array.from(userRoasts.values()).filter(
      (roast) => roast.year === year && roast.month === month,
    );

    this.logger.debug(`Retrieved ${filtered.length} roasts for user ${userId} (${year}-${month})`);
    return filtered;
  }

  /**
   * Get a single roast by ID
   */
  async getRoast(userId: string, roastId: string): Promise<DailyRoast | null> {
    const userRoasts = this.storage.get(userId);
    if (!userRoasts) {
      return null;
    }

    return userRoasts.get(roastId) || null;
  }

  /**
   * Create a new roast
   */
  async createRoast(userId: string, roast: DailyRoast): Promise<void> {
    if (!this.storage.has(userId)) {
      this.storage.set(userId, new Map());
    }

    const userRoasts = this.storage.get(userId)!;
    userRoasts.set(roast.id, roast);

    this.logger.debug(`Created roast ${roast.id} for user ${userId}`);
  }

  /**
   * Update an existing roast
   */
  async updateRoast(userId: string, roastId: string, updates: Partial<DailyRoast>): Promise<DailyRoast | null> {
    const userRoasts = this.storage.get(userId);
    if (!userRoasts) {
      return null;
    }

    const existingRoast = userRoasts.get(roastId);
    if (!existingRoast) {
      return null;
    }

    const updatedRoast = { ...existingRoast, ...updates };
    userRoasts.set(roastId, updatedRoast);

    this.logger.debug(`Updated roast ${roastId} for user ${userId}`);
    return updatedRoast;
  }

  /**
   * Delete a roast
   */
  async deleteRoast(userId: string, roastId: string): Promise<boolean> {
    const userRoasts = this.storage.get(userId);
    if (!userRoasts) {
      return false;
    }

    const deleted = userRoasts.delete(roastId);
    this.logger.debug(`Deleted roast ${roastId} for user ${userId}: ${deleted}`);
    return deleted;
  }

  /**
   * Get all roasts (for debugging)
   */
  getAllRoasts(): Map<string, Map<string, DailyRoast>> {
    return this.storage;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.storage.clear();
    this.logger.debug('Cleared all mock storage');
  }
}

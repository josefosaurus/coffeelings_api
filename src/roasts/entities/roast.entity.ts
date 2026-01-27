export enum RoastType {
  EXCITED = 'excited',
  OK = 'ok',
  TIRED = 'tired',
  SAD = 'sad',
  ANGRY = 'angry',
}

export interface DailyRoast {
  id: string;
  roast: RoastType;
  message?: string;
  date: number; // Unix timestamp in milliseconds
  userId: string;
  year: string; // Computed from date for indexing
  month: string; // Computed from date for indexing (zero-padded)
  createdAt: number;
  updatedAt: number;
}

export interface CalendarResponse {
  [year: string]: {
    [month: string]: Omit<DailyRoast, 'userId' | 'year' | 'month' | 'createdAt' | 'updatedAt'>[];
  };
}

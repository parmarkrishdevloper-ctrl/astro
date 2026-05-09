import mongoose, { Schema, Document } from 'mongoose';

export type RemedyKind =
  | 'yantra' | 'gemstone' | 'mantra' | 'fasting' | 'donation' | 'ritual' | 'other';
export type RemedyStatus = 'planned' | 'active' | 'paused' | 'completed' | 'abandoned';

export interface IRemedyLog {
  chartId?: string;
  planet?: string;
  kind: RemedyKind;
  title: string;
  details?: string;
  startedAt?: string;
  endsAt?: string;
  recurrence?: {
    weekdayNum?: number;
    timeOfDay?: string;
    countPerSession?: number;
  };
  progress?: {
    sessionsCompleted: number;
    totalCount?: number;
    targetCount?: number;
    lastSessionAt?: string;
  };
  status: RemedyStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRemedyLogDoc extends IRemedyLog, Document {}

const RemedyLogSchema = new Schema<IRemedyLogDoc>({
  chartId: { type: String, index: true },
  planet: { type: String, index: true },
  kind: { type: String, required: true, index: true },
  title: { type: String, required: true },
  details: String,
  startedAt: String,
  endsAt: String,
  recurrence: {
    weekdayNum: Number,
    timeOfDay: String,
    countPerSession: Number,
  },
  progress: {
    sessionsCompleted: { type: Number, default: 0 },
    totalCount: Number,
    targetCount: Number,
    lastSessionAt: String,
  },
  status: { type: String, required: true, default: 'planned', index: true },
  notes: String,
}, { timestamps: true });

export const RemedyLog = mongoose.model<IRemedyLogDoc>('RemedyLog', RemedyLogSchema);

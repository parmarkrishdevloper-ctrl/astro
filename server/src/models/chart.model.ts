import mongoose, { Schema, Document } from 'mongoose';

export type RelationshipTag =
  | 'self' | 'spouse' | 'parent' | 'child' | 'sibling' | 'family'
  | 'friend' | 'colleague' | 'client' | 'celebrity' | 'other';

export interface ILifeEvent {
  _id?: any;
  date: string;
  category: string;
  title: string;
  notes?: string;
  snapshot?: {
    maha?: string;
    antar?: string;
    pratyantar?: string;
    transitSummary?: string;
  };
  createdAt: Date;
}

export interface IPrediction {
  _id?: any;
  forDate?: string;
  forDateEnd?: string;
  category: string;
  text: string;
  outcome?: 'hit' | 'miss' | 'partial' | 'pending';
  outcomeNotes?: string;
  createdAt: Date;
  outcomeAt?: Date;
}

export interface INote {
  _id?: any;
  scope: 'chart' | 'planet' | 'house';
  target?: string;
  markdown: string;
  updatedAt: Date;
}

export interface IVoiceMemo {
  _id?: any;
  blobDataUrl: string;
  mimeType: string;
  durationSec?: number;
  transcript?: string;
  scope: 'chart' | 'planet' | 'house';
  target?: string;
  createdAt: Date;
}

export interface IChart {
  label: string;
  relationship: RelationshipTag;
  datetime: string;
  tzOffsetHours?: number;
  lat: number;
  lng: number;
  placeName?: string;
  avatarDataUrl?: string;
  lifeEvents: ILifeEvent[];
  predictions: IPrediction[];
  notes: INote[];
  voiceMemos: IVoiceMemo[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IChartDoc extends IChart, Document {}

const LifeEventSchema = new Schema({
  date: { type: String, required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  notes: String,
  snapshot: {
    maha: String,
    antar: String,
    pratyantar: String,
    transitSummary: String,
  },
  createdAt: { type: Date, default: Date.now },
});

const PredictionSchema = new Schema({
  forDate: String,
  forDateEnd: String,
  category: { type: String, required: true },
  text: { type: String, required: true },
  outcome: { type: String, enum: ['hit', 'miss', 'partial', 'pending'] },
  outcomeNotes: String,
  createdAt: { type: Date, default: Date.now },
  outcomeAt: Date,
});

const NoteSchema = new Schema({
  scope: { type: String, enum: ['chart', 'planet', 'house'], required: true },
  target: String,
  markdown: { type: String, required: true },
}, { timestamps: true });

const VoiceMemoSchema = new Schema({
  blobDataUrl: { type: String, required: true },
  mimeType: { type: String, required: true },
  durationSec: Number,
  transcript: String,
  scope: { type: String, enum: ['chart', 'planet', 'house'], required: true },
  target: String,
  createdAt: { type: Date, default: Date.now },
});

const ChartSchema = new Schema<IChartDoc>({
  label: { type: String, required: true, index: true },
  relationship: { type: String, index: true, default: 'other' },
  datetime: { type: String, required: true },
  tzOffsetHours: Number,
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  placeName: String,
  avatarDataUrl: String,
  lifeEvents: [LifeEventSchema],
  predictions: [PredictionSchema],
  notes: [NoteSchema],
  voiceMemos: [VoiceMemoSchema],
}, { timestamps: true });

export const Chart = mongoose.model<IChartDoc>('Chart', ChartSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedView {
  name: string;
  route: string;
  kind: string;
  snapshot: any;
  tags: string[];
  pinned: boolean;
  chartId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISavedViewDoc extends ISavedView, Document {}

const SavedViewSchema = new Schema<ISavedViewDoc>({
  name: { type: String, required: true, index: true },
  route: { type: String, required: true, index: true },
  kind: { type: String, default: 'generic' },
  snapshot: { type: Schema.Types.Mixed, default: {} },
  tags: { type: [String], default: [] },
  pinned: { type: Boolean, default: false, index: true },
  chartId: { type: String, index: true },
}, { timestamps: true });

export const SavedView = mongoose.model<ISavedViewDoc>('SavedView', SavedViewSchema);

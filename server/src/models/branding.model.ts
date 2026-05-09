import mongoose, { Schema, Document } from 'mongoose';

export interface IBranding {
  companyName: string;
  tagline?: string;
  logoDataUrl?: string;
  primaryColor: string;
  accentColor: string;
  contact: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  footerText?: string;
  updatedAt: Date;
}

export interface IBrandingDoc extends IBranding, Document {}

const BrandingSchema = new Schema<IBrandingDoc>({
  companyName: { type: String, default: 'Astrologer Hemraj Laddha' },
  tagline: { type: String, default: 'Authentic Vedic Astrology' },
  logoDataUrl: String,
  primaryColor: { type: String, default: '#7c2d12' },
  accentColor: { type: String, default: '#b45309' },
  contact: {
    phone: String,
    email: String,
    website: String,
    address: String,
  },
  footerText: { 
    type: String, 
    default: 'For entertainment & guidance only — astrological inferences are not a substitute for professional advice.' 
  },
}, { timestamps: true });

export const BrandingModel = mongoose.model<IBrandingDoc>('Branding', BrandingSchema);

const DEFAULT_BRANDING: Partial<IBranding> = {
  companyName: 'Astrologer Hemraj Laddha',
  tagline: 'Authentic Vedic Astrology',
  primaryColor: '#7c2d12',
  accentColor: '#b45309',
  contact: {},
  footerText: 'For entertainment & guidance only — astrological inferences are not a substitute for professional advice.',
};

export async function getBranding(): Promise<Partial<IBranding>> {
  let branding = await BrandingModel.findOne();
  if (!branding) {
    branding = await BrandingModel.create(DEFAULT_BRANDING);
  }
  return branding.toObject();
}

export async function setBranding(patch: Partial<IBranding>): Promise<Partial<IBranding>> {
  let branding = await BrandingModel.findOne();
  if (!branding) {
    branding = new BrandingModel(DEFAULT_BRANDING);
  }
  Object.assign(branding, patch);
  await branding.save();
  return branding.toObject();
}

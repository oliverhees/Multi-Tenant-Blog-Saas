import mongoose, { Schema, Document } from 'mongoose';

export interface ISite extends Document {
  id: string;
  name: string;
  description: string;
  subdirectory: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
  userId?: string;
}

const SiteSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, required: true },
  description: { type: String, required: true },
  subdirectory: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  imageUrl: { type: String },
  userId: { type: String, ref: 'User' },
}, {
  timestamps: true
});

export default mongoose.models.Site || mongoose.model<ISite>('Site', SiteSchema);
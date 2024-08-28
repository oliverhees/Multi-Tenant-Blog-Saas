import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  id: string;
  title: string;
  articleContent: any; // Using 'any' for JSON content
  smallDescription: string;
  image: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  siteId?: string;
}

const PostSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
  title: { type: String, required: true },
  articleContent: { type: Schema.Types.Mixed, required: true },
  smallDescription: { type: String, required: true },
  image: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  userId: { type: String, ref: 'User' },
  siteId: { type: String, ref: 'Site' },
}, {
  timestamps: true
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
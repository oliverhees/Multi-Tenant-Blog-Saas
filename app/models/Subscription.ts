import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  stripeSubscriptionId: string;
  interval: string;
  status: string;
  planId: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

const SubscriptionSchema: Schema = new Schema({
  stripeSubscriptionId: { type: String, required: true, unique: true },
  interval: { type: String, required: true },
  status: { type: String, required: true },
  planId: { type: String, required: true },
  currentPeriodStart: { type: Number, required: true },
  currentPeriodEnd: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  userId: { type: String, ref: 'User', unique: true },
}, {
  timestamps: true
});

export default mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompletionRecord {
  date: string;
  completedAt: Date;
  completedBy: mongoose.Types.ObjectId;
}

export interface IChore extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number;
  daysOfWeek?: number[]; // Array for multiple days per week
  dayOfMonth?: number;
  startDate?: Date; // When the chore schedule starts (for non-daily)
  isCompleted: boolean;
  lastCompleted?: Date;
  completionHistory: ICompletionRecord[];
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  points: number;
  position: number;
  createdAt: Date;
}

const CompletionRecordSchema = new Schema<ICompletionRecord>({
  date: { type: String, required: true },
  completedAt: { type: Date, default: Date.now },
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const ChoreSchema = new Schema<IChore>({
  title: { type: String, required: true },
  description: { type: String },
  frequency: { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly'], required: true },
  dayOfWeek: { type: Number, min: 0, max: 6 },
  daysOfWeek: { type: [Number], default: undefined },
  dayOfMonth: { type: Number, min: 1, max: 31 },
  startDate: { type: Date },
  isCompleted: { type: Boolean, default: false },
  lastCompleted: { type: Date },
  completionHistory: { type: [CompletionRecordSchema], default: [] },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  points: { type: Number, required: true },
  position: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Index for efficient team queries
ChoreSchema.index({ teamId: 1 });
ChoreSchema.index({ userId: 1 });

const Chore: Model<IChore> = mongoose.models.Chore || mongoose.model<IChore>('Chore', ChoreSchema);

export default Chore;

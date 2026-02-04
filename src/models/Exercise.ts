import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExercise extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  sets: number;
  reps: number;
  duration?: number; // in seconds for timed exercises
  notes?: string;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    name: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    sets: { type: Number, required: true, default: 1 },
    reps: { type: Number, required: true, default: 1 },
    duration: { type: Number }, // optional, for timed exercises
    notes: { type: String },
    completedAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ExerciseSchema.index({ userId: 1, completedAt: -1 });
ExerciseSchema.index({ teamId: 1, completedAt: -1 });

const Exercise: Model<IExercise> =
  mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);

export default Exercise;

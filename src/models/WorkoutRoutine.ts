import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoutineExercise {
  name: string;
  sets: number;
  reps: number;
  restTime?: number; // in seconds
  notes?: string;
}

export interface IWorkoutRoutine extends Document {
  name: string;
  description?: string;
  category: string; // e.g., 'Upper Body', 'Lower Body', 'Full Body', 'Cardio', 'Core'
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  exercises: IRoutineExercise[];
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  isTemplate: boolean; // true for predefined templates
  lastUsed?: Date;
  timesUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoutineExerciseSchema = new Schema<IRoutineExercise>({
  name: { type: String, required: true },
  sets: { type: Number, required: true, default: 3 },
  reps: { type: Number, required: true, default: 10 },
  restTime: { type: Number },
  notes: { type: String },
});

const WorkoutRoutineSchema = new Schema<IWorkoutRoutine>(
  {
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    difficulty: { 
      type: String, 
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate' 
    },
    exercises: [RoutineExerciseSchema],
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    isTemplate: { type: Boolean, default: false },
    lastUsed: { type: Date },
    timesUsed: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
WorkoutRoutineSchema.index({ userId: 1, category: 1 });
WorkoutRoutineSchema.index({ isTemplate: 1 });

const WorkoutRoutine: Model<IWorkoutRoutine> =
  mongoose.models.WorkoutRoutine || mongoose.model<IWorkoutRoutine>('WorkoutRoutine', WorkoutRoutineSchema);

export default WorkoutRoutine;

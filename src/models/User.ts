import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt: Date;
}

export interface IUserStats {
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  badges: IBadge[];
  weeklyPoints: number;
  monthlyPoints: number;
  lastCompletedDate?: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  teamId: mongoose.Types.ObjectId;
  stats: IUserStats;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const BadgeSchema = new Schema<IBadge>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], required: true },
  earnedAt: { type: Date, default: Date.now },
}, { _id: false });

const UserStatsSchema = new Schema<IUserStats>({
  totalPoints: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  totalCompleted: { type: Number, default: 0 },
  badges: { type: [BadgeSchema], default: [] },
  weeklyPoints: { type: Number, default: 0 },
  monthlyPoints: { type: Number, default: 0 },
  lastCompletedDate: { type: Date },
}, { _id: false });

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  stats: { type: UserStatsSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

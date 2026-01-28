import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeam extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  inviteCode: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  inviteCode: { type: String, unique: true, uppercase: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

// Generate unique invite code before validation
TeamSchema.pre('validate', function() {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});

const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;

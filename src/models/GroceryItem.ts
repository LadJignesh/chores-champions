import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGroceryItem extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  quantity?: string;
  category?: string;
  isPurchased: boolean;
  addedBy: mongoose.Types.ObjectId;
  purchasedBy?: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroceryItemSchema = new Schema<IGroceryItem>({
  name: { type: String, required: true },
  quantity: { type: String },
  category: { type: String },
  isPurchased: { type: Boolean, default: false },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  purchasedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
}, {
  timestamps: true,
});

const GroceryItem: Model<IGroceryItem> = mongoose.models.GroceryItem || mongoose.model<IGroceryItem>('GroceryItem', GroceryItemSchema);

export default GroceryItem;

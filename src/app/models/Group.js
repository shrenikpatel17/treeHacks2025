import mongoose, { Document, model, Model, Schema } from "mongoose";

const GroupSchema = new Schema(
  {
    name: {
      type: String, 
      required: true,
    },
    projects: {
      type: Array,
      default: [],
    },
    members: {
      type: Array,
      default: [],
    },
    discussion: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

export const Group = mongoose.models.Group || model("Group", GroupSchema);

export default Group;
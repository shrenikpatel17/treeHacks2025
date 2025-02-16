import mongoose, { Document, model, Model, Schema } from "mongoose";

const GroupSchema = new Schema(
  {
    name: {
      type: String, 
      required: true,
    },
    connectionCoordinate: {
      type: String, 
      // required: true,
    },
    substationCoordinate: {
      type: String, 
      required: true,
    },
    completionDate: {
      type: String, 
      // required: true,
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
    capacityLeft: {
      type: Number,
      default: 0,
    },
    isPotential: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Group = mongoose.models.Group || model("Group", GroupSchema);

export default Group;
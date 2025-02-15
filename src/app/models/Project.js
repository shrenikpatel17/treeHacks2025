import mongoose, { Document, model, Model, Schema } from "mongoose";

const ProjectSchema = new Schema(
  {
    name: {
      type: String, 
      required: true,
    },
    groups: {
      type: Array,
      default: [],
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export const Project = mongoose.models.Project || model("Project", ProjectSchema);

export default Project;
import mongoose, { Document, model, Model, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    firstName: {
      type: String, 
      required: true,
      minlength: 2, 
      maxlength: 50, 
    },
    lastName: {
      type: String, 
      required: true,
      minlength: 2, 
      maxlength: 50, 
    },
    email: {
      type: String, 
      required: true,
      maxlength: 50, 
      unique: true,
    },
    password: {
      type: String, 
      required: true,
      minlength: 5, 
    },
    projects: {
      type: Array, 
      default: [],
    },
    groups: {
      type: Array,
      default: [],
    }
  },
  { timestamps: true }
);

export const User = mongoose.models.User || model("User", UserSchema);

export default User;
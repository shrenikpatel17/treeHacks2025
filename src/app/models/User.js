import mongoose, { Document, model, Model, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    firstName: {
      type: String, // Added type specification
      required: true,
      minlength: 2, // Changed `min` to `minlength`
      maxlength: 50, // Changed `max` to `maxlength`
    },
    lastName: {
      type: String, // Added type specification
      required: true,
      minlength: 2, // Changed `min` to `minlength`
      maxlength: 50, // Changed `max` to `maxlength`
    },
    email: {
      type: String, // Added type specification
      required: true,
      maxlength: 50, // Changed `max` to `maxlength`
      unique: true,
    },
    password: {
      type: String, // Added type specification
      required: true,
      minlength: 5, // Changed `min` to `minlength`
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || model("User", UserSchema);

export default User;
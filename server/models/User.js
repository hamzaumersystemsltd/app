import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    lastName:  { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    age:       { type: Number, required: true, min: 13, max: 120 },
    gender:    { type: String, required: true, enum: ["male", "female"] },
    password:  { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ["admin", "user"], default: "user" }
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
export default User;
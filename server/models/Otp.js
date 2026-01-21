import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  codeHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // auto-delete after 5 minutes
  attempts: { type: Number, default: 0 }, // throttle wrong attempts
});

export default mongoose.model("Otp", OtpSchema);
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    select: false, // Don't return OTP by default for security
  },
  attempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // TTL index: 300 seconds (5 minutes) expiration
  },
});

// Index for faster queries on email
otpSchema.index({ email: 1 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;

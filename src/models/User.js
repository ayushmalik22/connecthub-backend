import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const RESERVED_USERNAMES = ['admin', 'support', 'connecthub', 'official', 'system', 'moderator'];

// Helper function to normalize Gmail email (remove dots before @)
const normalizeGmailEmail = (email) => {
  if (!email || !email.includes('@gmail.com')) return email.toLowerCase();
  const [localPart, domain] = email.toLowerCase().split('@');
  return `${localPart.replace(/\./g, '')}@${domain}`;
};

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    trim: true,
    validate: {
      validator: function(v) {
        // Regex validation: 3-20 characters, alphanumeric and underscores only
        const regex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!regex.test(v)) return false;
        // Block reserved names
        if (RESERVED_USERNAMES.includes(v.toLowerCase())) return false;
        return true;
      },
      message: 'Username must be 3-20 characters (letters, numbers, underscores) and cannot be a reserved name'
    },
  },
  usernameLower: {
    type: String,
    unique: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  emailNormalized: {
    type: String,
    unique: true,
    select: false, // Hidden field
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    select: false, // Don't return password by default
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
  },
  avatarUrl: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: 'MERN Stack Developer',
  },
  profile: {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
  },
}, { timestamps: true });

// Pre-save hook to hash password and set usernameLower/emailNormalized
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Set usernameLower if username is modified
  if (this.isModified('username')) {
    this.usernameLower = this.username.toLowerCase();
  }

  // Set emailNormalized if email is modified
  if (this.isModified('email')) {
    this.emailNormalized = normalizeGmailEmail(this.email);
  }

  next();
});

const User = mongoose.model('User', userSchema);

export default User;
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        // Password is required only if googleId is not present
        return !this.googleId;
      },
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    picture: {
      type: String, // Google profile picture URL or uploaded avatar
    },
    role: {
      type: String,
      enum: ["Student", "Teacher", "Moderator", "Admin"],
      default: "Student",
      required: true,
    },
    status: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshTokens: [
      {
        token: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
      },
    ],
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.refreshTokens;
        return ret;
      },
    },
  }
);

// Performance Indexes
UserSchema.index({ email: 1 }, { unique: true }); // Fast email lookups (login)
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true }); // Fast Google OAuth lookups
UserSchema.index({ role: 1 }); // Filter by role
UserSchema.index({ status: 1, lastSeen: -1 }); // Online user queries
UserSchema.index({ createdAt: -1 }); // Recent user queries
UserSchema.index({ passwordResetToken: 1 }); // Password reset lookups
UserSchema.index({ emailVerificationToken: 1 }); // Email verification lookups

module.exports = mongoose.model("User", UserSchema);

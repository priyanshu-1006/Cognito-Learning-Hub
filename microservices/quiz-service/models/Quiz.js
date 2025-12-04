/**
 * Quiz Model with Optimized Indexes
 * Addresses: Missing indexes issue from optimization analysis
 */

const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["multiple-choice", "true-false", "descriptive", "fill-in-blank"],
      default: "multiple-choice",
    },
    options: {
      type: [String],
      validate: {
        validator: function (arr) {
          // Options required for multiple-choice, optional for others
          return this.type !== "multiple-choice" || (arr && arr.length >= 2);
        },
        message: "Multiple choice questions must have at least 2 options",
      },
    },
    correct_answer: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
    },
    points: {
      type: Number,
      default: 1,
      min: 1,
    },
    timeLimit: {
      type: Number,
      default: 30,
      min: 5,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Expert"],
      default: "Medium",
    },
    tags: [String],
    imageUrl: String,
  },
  {
    // Transform to camelCase for API responses
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Convert correct_answer to correctAnswer for consistency
        if (ret.correct_answer !== undefined) {
          ret.correctAnswer = ret.correct_answer;
          delete ret.correct_answer;
        }
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        // Convert correct_answer to correctAnswer for consistency
        if (ret.correct_answer !== undefined) {
          ret.correctAnswer = ret.correct_answer;
          delete ret.correct_answer;
        }
        return ret;
      },
    },
  }
);

const QuizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    questions: {
      type: [QuestionSchema],
      validate: {
        validator: function (arr) {
          return arr && arr.length > 0;
        },
        message: "Quiz must have at least one question",
      },
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Expert", "Mixed"],
      default: "Medium",
    },
    category: {
      type: String,
      default: "General",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    estimatedTime: {
      type: Number, // in minutes
      default: 0,
    },
    // Gamification settings
    gameSettings: {
      enableHints: {
        type: Boolean,
        default: false,
      },
      enableTimeBonuses: {
        type: Boolean,
        default: true,
      },
      enableStreakBonuses: {
        type: Boolean,
        default: true,
      },
      showLeaderboard: {
        type: Boolean,
        default: true,
      },
    },
    // AI Generation metadata
    generationMetadata: {
      method: {
        type: String,
        enum: ["manual", "ai-topic", "ai-file", "ai-enhanced"],
      },
      prompt: String,
      model: String,
      wasAdaptive: Boolean,
      sourceFile: String,
      generatedAt: Date,
      generationTime: Number, // milliseconds
    },
    // Statistics (denormalized for performance)
    stats: {
      timesTaken: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      averageTime: {
        type: Number,
        default: 0,
      },
      lastTaken: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        // Add timesTaken at root level for backwards compatibility
        ret.timesTaken = doc.stats?.timesTaken || 0;
        return ret;
      },
    },
  }
);

// ==========================================
// PERFORMANCE INDEXES (Critical Optimization)
// ==========================================

// 1. User's quiz listing (most frequent query)
QuizSchema.index({ createdBy: 1, createdAt: -1 });

// 2. Public quiz discovery
QuizSchema.index({ isPublic: 1, category: 1, difficulty: 1 });

// 3. Difficulty filtering
QuizSchema.index({ difficulty: 1, stats: { timesTaken: -1 } });

// 4. Text search on title and description
QuizSchema.index({ title: "text", description: "text", tags: "text" });

// 5. Popular quizzes
QuizSchema.index({ "stats.timesTaken": -1, isPublic: 1 });

// 6. Recent quizzes
QuizSchema.index({ createdAt: -1, isPublic: 1 });

// 7. Category + difficulty compound index
QuizSchema.index({ category: 1, difficulty: 1, "stats.timesTaken": -1 });

// ==========================================
// VIRTUAL FIELDS
// ==========================================

QuizSchema.virtual("questionCount").get(function () {
  return this.questions.length;
});

QuizSchema.virtual("averageQuestionPoints").get(function () {
  if (!this.questions.length) return 0;
  const total = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  return (total / this.questions.length).toFixed(1);
});

QuizSchema.virtual("timesTaken").get(function () {
  return this.stats?.timesTaken || 0;
});

// ==========================================
// METHODS
// ==========================================

/**
 * Calculate total points for the quiz
 */
QuizSchema.methods.calculateTotalPoints = function () {
  this.totalPoints = this.questions.reduce(
    (sum, q) => sum + (q.points || 1),
    0
  );
  return this.totalPoints;
};

/**
 * Calculate estimated time to complete
 */
QuizSchema.methods.calculateEstimatedTime = function () {
  const totalSeconds = this.questions.reduce(
    (sum, q) => sum + (q.timeLimit || 30),
    0
  );
  this.estimatedTime = Math.ceil(totalSeconds / 60); // Convert to minutes
  return this.estimatedTime;
};

/**
 * Update quiz statistics after a quiz is taken
 */
QuizSchema.methods.updateStats = async function (score, timeTaken) {
  const currentCount = this.stats.timesTaken || 0;
  const currentAvgScore = this.stats.averageScore || 0;
  const currentAvgTime = this.stats.averageTime || 0;

  // Incremental average calculation (no need to query all results)
  this.stats.timesTaken = currentCount + 1;
  this.stats.averageScore =
    (currentAvgScore * currentCount + score) / this.stats.timesTaken;
  this.stats.averageTime =
    (currentAvgTime * currentCount + timeTaken) / this.stats.timesTaken;
  this.stats.lastTaken = new Date();

  return this.save();
};

/**
 * Get quiz for display (without correct answers)
 */
QuizSchema.methods.getStudentVersion = function () {
  const quizObj = this.toObject();
  quizObj.questions = quizObj.questions.map((q) => ({
    question: q.question,
    type: q.type,
    options: q.options,
    points: q.points,
    timeLimit: q.timeLimit,
    difficulty: q.difficulty,
    imageUrl: q.imageUrl,
    // Exclude correct_answer and explanation
  }));
  return quizObj;
};

// ==========================================
// PRE-SAVE HOOKS
// ==========================================

QuizSchema.pre("save", function (next) {
  // Auto-calculate totals
  if (this.isModified("questions")) {
    this.calculateTotalPoints();
    this.calculateEstimatedTime();
  }
  next();
});

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Search quizzes with optimization
 */
QuizSchema.statics.searchQuizzes = async function ({
  search,
  difficulty,
  category,
  createdBy,
  isPublic,
  page = 1,
  limit = 20,
  sortBy = "createdAt",
  sortOrder = -1,
}) {
  const query = {};

  if (search) {
    query.$text = { $search: search };
  }

  if (difficulty && difficulty !== "Mixed") {
    query.difficulty = difficulty;
  }

  if (category) {
    query.category = category;
  }

  if (createdBy) {
    query.createdBy = createdBy;
  }

  if (isPublic !== undefined) {
    query.isPublic = isPublic;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Use lean() for read-only queries (optimization)
  const [quizzes, total] = await Promise.all([
    this.find(query)
      .populate("createdBy", "name email picture")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(query),
  ]);

  return {
    quizzes,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Get popular quizzes (optimized with index)
 */
QuizSchema.statics.getPopularQuizzes = async function (limit = 10) {
  return this.find({ isPublic: true })
    .sort({ "stats.timesTaken": -1 })
    .limit(limit)
    .populate("createdBy", "name picture")
    .lean();
};

/**
 * Get recent quizzes (optimized with index)
 */
QuizSchema.statics.getRecentQuizzes = async function (limit = 10) {
  return this.find({ isPublic: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("createdBy", "name picture")
    .lean();
};

module.exports = mongoose.model("Quiz", QuizSchema);

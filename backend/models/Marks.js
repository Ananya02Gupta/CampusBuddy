
const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true
    },
    courseId: {
      type: String,
      required: true,
      trim: true
    },
    examName: {
      type: String,
      required: true,
      trim: true
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { timestamps: true }
);

// Ek student ke ek exam ke duplicate records rokna.
marksSchema.index(
  { studentId: 1, courseId: 1, examName: 1 },
  { unique: true }
);

// Marks total marks se zyada nahi hone chahiye.
marksSchema.pre("validate", function () {
  if (this.marksObtained > this.totalMarks) {
    this.invalidate(
      "marksObtained",
      "Marks obtained cannot exceed total marks"
    );
  }
});

module.exports = mongoose.model("Marks", marksSchema);


const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    courseId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    courseName: {
      type: String,
      required: true,
      trim: true
    },
    teacherId: {
      type: String,
      required: true,
      trim: true
    },
    totalClasses: {
      type: Number,
      default: 20,
      min: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);

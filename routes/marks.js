
const express = require("express");
const router = express.Router();

const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/auth");

const Student = require("../models/Student");
const Course = require("../models/Course");
const Marks = require("../models/Marks");
const Attendance = require("../models/Attendance");

// Add marks: teachers only, for their assigned courses
router.post(
  "/add",
  authenticateToken,
  authorizeRoles("teacher"),
  async (req, res) => {
    try {
      const {
        studentId,
        courseId,
        examName,
        marksObtained,
        totalMarks
      } = req.body;

      if (
        !studentId ||
        !courseId ||
        !examName ||
        marksObtained === undefined ||
        totalMarks === undefined
      ) {
        return res.status(400).json({
          message: "All fields are required"
        });
      }

      if (
        typeof marksObtained !== "number" ||
        typeof totalMarks !== "number" ||
        !Number.isFinite(marksObtained) ||
        !Number.isFinite(totalMarks) ||
        totalMarks <= 0 ||
        marksObtained < 0 ||
        marksObtained > totalMarks
      ) {
        return res.status(400).json({
          message: "Marks must be between 0 and totalMarks"
        });
      }

      const student = await Student.findOne({
        studentId,
        role: "student"
      });

      if (!student) {
        return res.status(404).json({
          message: "Student not found"
        });
      }

      const course = await Course.findOne({ courseId });

      if (!course) {
        return res.status(404).json({
          message: "Course not found"
        });
      }

      if (course.teacherId !== req.user.studentId) {
        return res.status(403).json({
          message: "You can add marks only for your assigned courses"
        });
      }

      const record = await Marks.create({
        studentId,
        courseId,
        examName: examName.trim(),
        marksObtained,
        totalMarks
      });

      return res.status(201).json({
        message: "Marks added successfully",
        marks: record
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "Marks already exist for this student, course and exam"
        });
      }

      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: error.message
        });
      }

      console.error("Add marks error:", error.message);
      return res.status(500).json({
        message: "Failed to add marks"
      });
    }
  }
);

// Get a student's report card: student can view only their own
router.get(
  "/report/:studentId",
  authenticateToken,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const { studentId } = req.params;

      if (req.user.studentId !== studentId) {
        return res.status(403).json({
          message: "You can only view your own report card"
        });
      }

      const student = await Student.findOne({
        studentId,
        role: "student"
      });

      if (!student) {
        return res.status(404).json({
          message: "Student not found"
        });
      }

      const courses = await Course.find();
      const report = [];

      for (const course of courses) {
        const attendanceRecords = await Attendance.find({
          studentId,
          courseId: course.courseId
        });

        const totalClasses = attendanceRecords.length;

        const presentClasses = attendanceRecords.filter(
          record => record.status === "present"
        ).length;

        const attendancePercentage = totalClasses
          ? Number(((presentClasses / totalClasses) * 100).toFixed(2))
          : 0;

        const examMarks = await Marks.find({
          studentId,
          courseId: course.courseId
        }).sort({ examName: 1 });

        report.push({
          courseId: course.courseId,
          courseName: course.courseName,
          attendance: {
            totalClasses,
            presentClasses,
            absentClasses: totalClasses - presentClasses,
            percentage: attendancePercentage
          },
          exams: examMarks.map(exam => ({
            examName: exam.examName,
            marksObtained: exam.marksObtained,
            totalMarks: exam.totalMarks,
            percentage: Number(
              ((exam.marksObtained / exam.totalMarks) * 100).toFixed(2)
            )
          }))
        });
      }

      return res.json({
        studentId: student.studentId,
        studentName: student.name,
        courses: report
      });
    } catch (error) {
      console.error("Report card error:", error.message);
      return res.status(500).json({
        message: "Failed to generate report card"
      });
    }
  }
);

module.exports = router;

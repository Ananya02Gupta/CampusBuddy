
const express = require("express");
const router = express.Router();

const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/auth");

const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Course = require("../models/Course");

// Get attendance percentage
router.get(
  "/percentage/:studentId/:courseId",
  authenticateToken,
  async (req, res) => {
    try {
      const { studentId, courseId } = req.params;

      const student = await Student.findOne({
        studentId,
        role: "student"
      });

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const course = await Course.findOne({ courseId });

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Students can view only their own attendance.
      if (
        req.user.role === "student" &&
        req.user.studentId !== studentId
      ) {
        return res.status(403).json({
          message: "You can only view your own attendance"
        });
      }

      // Teachers can view attendance only for their assigned courses.
      if (
        req.user.role === "teacher" &&
        course.teacherId !== req.user.studentId
      ) {
        return res.status(403).json({
          message: "This course is not assigned to you"
        });
      }

      if (!["student", "teacher"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const records = await Attendance.find({ studentId, courseId });
      const totalClasses = records.length;

      const presentClasses = records.filter(
        record => record.status === "present"
      ).length;

      const percentage = totalClasses === 0
        ? 0
        : Number(((presentClasses / totalClasses) * 100).toFixed(2));

      const target = 75;

      const classesNeeded = percentage >= target
        ? 0
        : Math.max(
            0,
            Math.ceil(
              (target * totalClasses - 100 * presentClasses) /
              (100 - target)
            )
          );

      return res.json({
        studentId,
        studentName: student.name,
        courseId,
        courseName: course.courseName,
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        attendancePercentage: percentage,
        below75Percent: percentage < target,
        additionalConsecutiveClassesNeededFor75Percent: classesNeeded
      });
    } catch (error) {
      console.error("Attendance percentage error:", error.message);
      return res.status(500).json({
        message: "Failed to calculate attendance"
      });
    }
  }
);

// List students with attendance below 75%
// Teachers can see only their assigned courses.
router.get(
  "/shortage",
  authenticateToken,
  authorizeRoles("teacher"),
  async (req, res) => {
    try {
      const target = 75;

      const students = await Student.find({ role: "student" });
      const courses = await Course.find({
        teacherId: req.user.studentId
      });

      const shortageList = [];

      for (const student of students) {
        for (const course of courses) {
          const records = await Attendance.find({
            studentId: student.studentId,
            courseId: course.courseId
          });

          const totalClasses = records.length;
          if (totalClasses === 0) continue;

          const presentClasses = records.filter(
            record => record.status === "present"
          ).length;

          const percentage = Number(
            ((presentClasses / totalClasses) * 100).toFixed(2)
          );

          if (percentage < target) {
            const classesNeeded = Math.ceil(
              (target * totalClasses - 100 * presentClasses) /
              (100 - target)
            );

            shortageList.push({
              studentId: student.studentId,
              studentName: student.name,
              courseId: course.courseId,
              courseName: course.courseName,
              totalClasses,
              presentClasses,
              absentClasses: totalClasses - presentClasses,
              attendancePercentage: percentage,
              additionalClassesNeededFor75Percent: Math.max(
                0,
                classesNeeded
              )
            });
          }
        }
      }

      return res.json({
        targetAttendance: target,
        shortageCount: shortageList.length,
        students: shortageList
      });
    } catch (error) {
      console.error("Shortage list error:", error.message);
      return res.status(500).json({
        message: "Failed to fetch shortage students"
      });
    }
  }
);

// Mark attendance: teachers only, and only for their assigned courses.
router.post(
  "/mark",
  authenticateToken,
  authorizeRoles("teacher"),
  async (req, res) => {
    try {
      const { studentId, courseId, date, status } = req.body;

      if (!studentId || !courseId || !date || !status) {
        return res.status(400).json({
          message: "studentId, courseId, date and status are required"
        });
      }

      if (!["present", "absent"].includes(status)) {
        return res.status(400).json({
          message: "Status must be present or absent"
        });
      }

      const student = await Student.findOne({
        studentId,
        role: "student"
      });

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const course = await Course.findOne({ courseId });

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      if (course.teacherId !== req.user.studentId) {
        return res.status(403).json({
          message: "You can mark attendance only for your assigned courses"
        });
      }

      const attendanceDate = new Date(date);

      if (Number.isNaN(attendanceDate.getTime())) {
        return res.status(400).json({ message: "Invalid date" });
      }

      attendanceDate.setUTCHours(0, 0, 0, 0);

      const record = await Attendance.create({
        studentId,
        courseId,
        date: attendanceDate,
        status
      });

      return res.status(201).json({
        message: "Attendance marked successfully",
        attendance: record
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "Attendance already exists for this student, course and date"
        });
      }

      console.error("Mark attendance error:", error.message);
      return res.status(500).json({
        message: "Failed to mark attendance"
      });
    }
  }
);

module.exports = router;


import { useEffect, useState } from "react";

const API = "http://localhost:5000";

function useStudentReport() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("campusbuddy_token");
    const savedUser = localStorage.getItem("campusbuddy_user");

    if (!token || !savedUser) {
      setError("Please log in again to view your academic records.");
      setLoading(false);
      return;
    }

    let studentId;

    try {
      studentId = JSON.parse(savedUser).studentId;
    } catch {
      setError("Unable to read your student account. Please log in again.");
      setLoading(false);
      return;
    }

    if (!studentId) {
      setError("Student ID is missing. Please log in again.");
      setLoading(false);
      return;
    }

    async function loadReport() {
      try {
        const response = await fetch(
          `${API}/api/marks/report/${encodeURIComponent(studentId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load your academic report.");
        }

        setReport(data);
      } catch (err) {
        setError(
          err.message === "Failed to fetch"
            ? "Cannot connect to the backend. Please check that it is running."
            : err.message
        );
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, []);

  return { report, error, loading };
}

function PageHeading({ eyebrow, title, description }) {
  return (
    <div className="student-page-heading">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

function LoadingState() {
  return <div className="student-state">Loading your academic records...</div>;
}

function ErrorState({ message }) {
  return (
    <div className="student-state student-error">
      <strong>Unable to load records</strong>
      <p>{message}</p>
    </div>
  );
}

export function DashboardPage() {
  const { report, error, loading } = useStudentReport();

  return (
    <section className="student-page">
      <PageHeading
        eyebrow="YOUR OVERVIEW"
        title="Dashboard"
        description="A quick look at your attendance and academic progress."
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="student-summary-grid">
            <article className="student-summary-card">
              <span>Student</span>
              <strong>{report.studentName}</strong>
              <small>Your academic account</small>
            </article>
            <article className="student-summary-card">
              <span>Subjects</span>
              <strong>{report.courses.length}</strong>
              <small>Courses in your report</small>
            </article>
            <article className="student-summary-card">
              <span>Exam records</span>
              <strong>
                {report.courses.reduce(
                  (total, course) => total + course.exams.length,
                  0
                )}
              </strong>
              <small>Recorded assessments</small>
            </article>
          </div>

          <h2 className="student-section-title">Your subjects</h2>
          <div className="student-course-grid">
            {report.courses.map((course) => (
              <article className="student-course-card" key={course.courseId}>
                <h3>{course.courseName}</h3>
                <p>
                  Attendance: <strong>{course.attendance.percentage}%</strong>
                </p>
                <p>{course.exams.length} recorded assessments</p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export function AttendancePage() {
  const { report, error, loading } = useStudentReport();

  return (
    <section className="student-page">
      <PageHeading
        eyebrow="CLASS TRACKER"
        title="My Attendance"
        description="Check your recorded attendance for each subject."
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="student-table-wrap">
          <table className="student-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Total classes</th>
                <th>Attendance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.courses.map((course) => (
                <tr key={course.courseId}>
                  <td>{course.courseName}</td>
                  <td>{course.attendance.presentClasses}</td>
                  <td>{course.attendance.absentClasses}</td>
                  <td>{course.attendance.totalClasses}</td>
                  <td>
                    <strong>{course.attendance.percentage}%</strong>
                    <div className="attendance-track">
                      <div
                        className="attendance-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            course.attendance.percentage
                          )}%`,
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <span
                      className={
                        course.attendance.percentage >= 75
                          ? "student-status status-good"
                          : "student-status status-low"
                      }
                    >
                      {course.attendance.percentage >= 75
                        ? "On track"
                        : "Below 75%"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.courses.length === 0 && (
            <p className="student-empty">No course records were found.</p>
          )}
        </div>
      )}
    </section>
  );
}

export function MarksPage() {
  const { report, error, loading } = useStudentReport();

  return (
    <section className="student-page">
      <PageHeading
        eyebrow="ACADEMIC PERFORMANCE"
        title="My Marks"
        description="Review your recorded exams and assessment percentages."
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="student-course-grid">
          {report.courses.map((course) => (
            <article className="student-course-card marks-card" key={course.courseId}>
              <h3>{course.courseName}</h3>

              {course.exams.length === 0 ? (
                <p>No marks have been recorded for this subject yet.</p>
              ) : (
                <div className="student-exam-list">
                  {course.exams.map((exam, index) => (
                    <div className="student-exam-row" key={`${exam.examName}-${index}`}>
                      <div>
                        <strong>{exam.examName}</strong>
                        <small>
                          {exam.marksObtained} / {exam.totalMarks} marks
                        </small>
                      </div>
                      <span>{exam.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
          {report.courses.length === 0 && (
            <p className="student-empty">No course records were found.</p>
          )}
        </div>
      )}
    </section>
  );
}

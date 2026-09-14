import { Routes, Route } from "react-router-dom";

// Public Routes
import Home from "../pages/Home/Home";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import ForgotPassword from "../pages/Auth/ForgotPassword";

// Student Routes
import StudentDashboard from "../pages/StudentDashboard/StudentDashboard";
import StudentProfile from "../pages/StudentProfile/StudentProfile";
import FindTutors from "../pages/FindTutors/FindTutors";
import TutorProfile from "../pages/TutorProfile/TutorProfile";
import Booking from "../pages/Booking/Booking";
import PaymentConfirmation from "../pages/PaymentConfirmation/PaymentConfirmation";
import MyBookings from "../pages/MyBookings/MyBookings";
import LiveClass from "../pages/LiveClass/LiveClass";

// Learning Routes
import Courses from "../pages/Courses/Courses";
import CourseDetails from "../pages/CourseDetails/CourseDetails";
import VideoLesson from "../pages/VideoLesson/VideoLesson";

// Review Route
import Reviews from "../pages/Reviews/Reviews";

// Tutor Routes
import TutorDashboard from "../pages/TutorDashboard/TutorDashboard";
import TutorProfileManagement from "../pages/TutorProfileManagement/TutorProfileManagement";
import TutorAvailability from "../pages/TutorAvailability/TutorAvailability";
import TutorBookings from "../pages/TutorBookings/TutorBookings";
import UploadCourse from "../pages/UploadCourse/UploadCourse";
import TutorCourses from "../pages/TutorCourses/TutorCourses";

// Admin Routes
import AdminDashboard from "../pages/Admin/AdminDashboard";
import UserManagement from "../pages/Admin/UserManagement";
import StudentVerification from "../pages/Admin/StudentVerification";
import TutorVerification from "../pages/Admin/TutorVerification";
import CourseManagement from "../pages/Admin/CourseManagement";
import BookingManagement from "../pages/Admin/BookingManagement";
import ReviewManagement from "../pages/Admin/ReviewManagement";

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={<StudentDashboard />} />
      <Route path="/student/profile" element={<StudentProfile />} />
      <Route path="/student/bookings" element={<MyBookings />} />

      {/* Tutor Browsing */}
      <Route path="/tutors" element={<FindTutors />} />
      <Route path="/tutors/:tutorId" element={<TutorProfile />} />

      {/* Booking Flow */}
      <Route path="/booking/:tutorId" element={<Booking />} />
      <Route path="/payment-confirmation/:bookingId" element={<PaymentConfirmation />} />

      {/* Live Class */}
      <Route path="/live-class/:bookingId" element={<LiveClass />} />

      {/* Learning Routes */}
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:courseId" element={<CourseDetails />} />
      <Route path="/courses/:courseId/lessons/:lessonId" element={<VideoLesson />} />

      {/* Review Route */}
      <Route path="/reviews/:bookingId" element={<Reviews />} />

      {/* Tutor Routes */}
      <Route path="/tutor/dashboard" element={<TutorDashboard />} />
      <Route path="/tutor/profile" element={<TutorProfileManagement />} />
      <Route path="/tutor/availability" element={<TutorAvailability />} />
      <Route path="/tutor/bookings" element={<TutorBookings />} />
      <Route path="/tutor/courses/upload" element={<UploadCourse />} />
      <Route path="/tutor/courses" element={<TutorCourses />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<UserManagement />} />
      <Route path="/admin/students/verification" element={<StudentVerification />} />
      <Route path="/admin/tutors/verification" element={<TutorVerification />} />
      <Route path="/admin/courses" element={<CourseManagement />} />
      <Route path="/admin/bookings" element={<BookingManagement />} />
      <Route path="/admin/reviews" element={<ReviewManagement />} />
    </Routes>
  );
}

export default AppRoutes;

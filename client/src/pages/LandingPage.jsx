import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUserMd,
  FaCalendarCheck,
  FaHeartbeat,
  FaClinicMedical,
  FaArrowRight,
  FaPhoneAlt,
  FaShieldAlt,
  FaStar,
  FaMapMarkerAlt,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaStethoscope,
  FaTimes,
} from "react-icons/fa";

export default function LandingPage() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [doctorError, setDoctorError] = useState("");
  const [hospitalError, setHospitalError] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const doctorDetailsRef = useRef(null);
  const hospitalDetailsRef = useRef(null);

  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [showAllHospitals, setShowAllHospitals] = useState(false);

  const DOCTOR_LIMIT = 3;
  const HOSPITAL_LIMIT = 3;

  const testimonials = [
    {
      name: "Sivapriya",
      role: "Patient",
      text: "This platform made it easy for my family to find a specialist doctor without traveling far. The process was simple and very helpful.",
    },
    {
      name: "Kajan",
      role: "Village User",
      text: "Booking appointments became much easier. The design is clear, and we can quickly connect with the right doctor.",
    },
    {
      name: "Dr. Nirmala",
      role: "Specialist Doctor",
      text: "Care Line 360 improves access to healthcare for rural communities and helps doctors connect with patients more efficiently.",
    },
  ];

  const isLoggedIn = () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    return !!token;
  };

  useEffect(() => {
    fetchDoctors();
    fetchHospitals();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      setDoctorError("");

      const res = await axios.get("http://localhost:5000/api/doctor/public");

      const doctorData = res.data?.doctors || res.data?.data || res.data || [];
      setDoctors(Array.isArray(doctorData) ? doctorData : []);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      setDoctorError("Failed to load doctors");
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      setLoadingHospitals(true);
      setHospitalError("");

      const res = await axios.get("http://localhost:5000/api/hospitals");

      const hospitalData = res.data?.data || res.data || [];
      setHospitals(Array.isArray(hospitalData) ? hospitalData : []);
    } catch (error) {
      console.error("Failed to fetch hospitals:", error);
      setHospitalError("Failed to load hospitals");
    } finally {
      setLoadingHospitals(false);
    }
  };

  const handleBookDoctor = (doctor) => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    navigate("/appointments/book", {
      state: {
        type: "doctor",
        doctor,
      },
    });
  };

  const handleBookHospital = (hospital) => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    navigate("/appointments/book", {
      state: {
        type: "hospital",
        hospital,
      },
    });
  };

  const handleViewDoctorDetails = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleViewHospitalDetails = (hospital) => {
    setSelectedHospital(hospital);
  };

  const visibleDoctors = showAllDoctors
    ? doctors
    : doctors.slice(0, DOCTOR_LIMIT);

  const visibleHospitals = showAllHospitals
    ? hospitals
    : hospitals.slice(0, HOSPITAL_LIMIT);

  const getMapEmbedUrl = (lat, lng) => {
    if (!lat || !lng) return "";
    return `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  };

  return (
    <div className="min-h-screen bg-[#edf4f4] overflow-x-hidden text-[15px]">
      <div className="absolute top-0 left-0 w-full h-[420px] bg-gradient-to-r from-[#dff6f6] via-[#eff8f8] to-[#d9f1f2] blur-3xl opacity-70 -z-10" />

      <section className="w-full mx-auto bg-white/80 backdrop-blur-xl border border-white/60  relative">
        <div className="absolute top-[-60px] right-[-40px] w-[220px] h-[220px] rounded-full bg-[#178d95]/10 blur-2xl" />
        <div className="absolute bottom-[-80px] left-[-60px] w-[260px] h-[260px] rounded-full bg-[#178d95]/10 blur-2xl" />

        <header className="flex items-center justify-between px-6 md:px-12 py-4 mt-6 rounded-lg max-w-[1500px] mx-auto relative z-10 bg-white/70 border border-[#edf1f3]">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#0f172a]">
              Care Line 360
            </h1>
            <p className="text-[11px] md:text-xs text-[#178d95] font-medium tracking-[0.14em] uppercase mt-1">
              Smart Rural Healthcare Access
            </p>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-[13px] font-medium text-[#334155]">
            <a href="#home" className="hover:text-[#178d95] transition">
              Home
            </a>
            <a href="#services" className="hover:text-[#178d95] transition">
              Services
            </a>
            <Link to="/about" className="hover:text-[#178d95] transition">
              About Us
            </Link>
            <a href="#contact" className="hover:text-[#178d95] transition">
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden md:inline-flex px-4 py-2 rounded-full border border-[#178d95]/30 text-[#178d95] text-sm font-medium hover:bg-[#178d95]/5 transition hover:shadow-sm hover:-translate-y-1 duration-300"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#178d95] text-white text-sm font-medium hover:bg-[#126f76] transition hover:shadow-sm hover:-translate-y-1 duration-300"
            >
              Register
            </Link>

            <button className="w-10 h-10 rounded-full bg-white border border-[#dbe4e6] flex items-center justify-center lg:hidden">
              <div className="space-y-[4px]">
                <span className="block w-5 h-[2px] bg-[#334155]" />
                <span className="block w-5 h-[2px] bg-[#334155]" />
                <span className="block w-5 h-[2px] bg-[#334155]" />
              </div>
            </button>
          </div>
        </header>

        <main
          id="home"
          className="grid lg:grid-cols-2 gap-10 px-6 md:px-12 pt-8 md:pt-10 pb-14 items-center relative z-10 max-w-[1500px] mx-auto"
        >
          <div className="max-w-[580px]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#178d95]/10 text-[#178d95] text-xs font-semibold mb-5">
              <FaShieldAlt className="text-[11px]" />
              Trusted Digital Healthcare Platform
            </div>

            <h2 className="text-[34px] sm:text-[44px] lg:text-[56px] leading-[0.98] font-bold tracking-tight text-[#0f172a]">
              Bringing
              <span className="block text-[#178d95]">Specialist Care</span>
              <span className="block text-[#94a3b8]">Closer to Villages</span>
            </h2>

            <p className="mt-5 text-[#5b6b7b] text-sm md:text-base leading-7 max-w-[540px]">
              Care Line 360 helps rural communities easily connect with
              specialist doctors, book appointments, access medical records,
              and receive timely healthcare support through one modern digital
              platform.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#178d95] text-white text-sm font-medium hover:bg-[#126f76] transition hover:shadow-sm hover:-translate-y-1 duration-300"
              >
                Get Started
                <FaArrowRight className="text-xs" />
              </Link>

              <Link
                to="/doctors"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#d7dee5] bg-white text-[#0f172a] text-sm font-medium hover:bg-[#f8fafc] transition hover:shadow-sm hover:-translate-y-1 duration-300"
              >
                Find Doctors
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <span className="px-3.5 py-2 rounded-full bg-[#f4f7f8] text-[#4b5563] text-xs font-medium hover:shadow-md transition hover:-translate-y-1 duration-300">
                100+ Verified Specialists
              </span>
              <span className="px-3.5 py-2 rounded-full bg-[#f4f7f8] text-[#4b5563] text-xs font-medium hover:shadow-md transition hover:-translate-y-1 duration-300">
                24/7 Access Support
              </span>
              <span className="px-3.5 py-2 rounded-full bg-[#f4f7f8] text-[#4b5563] text-xs font-medium hover:shadow-md transition hover:-translate-y-1 duration-300">
                Rural Friendly Platform
              </span>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 max-w-[520px]">
              <div className="bg-[#f8f9fa] border border-[#e5e7eb] rounded-2xl p-4 hover:shadow-md transition hover:-translate-y-1 duration-300">
                <h3 className="text-xl md:text-2xl font-semibold text-[#178d95]">
                  100+
                </h3>
                <p className="text-xs text-[#6b7280] mt-1 leading-5">
                  Specialist Doctors
                </p>
              </div>

              <div className="bg-[#f8f9fa] border border-[#e5e7eb] rounded-2xl p-4 hover:shadow-md transition hover:-translate-y-1 duration-300">
                <h3 className="text-xl md:text-2xl font-semibold text-[#178d95]">
                  5K+
                </h3>
                <p className="text-xs text-[#6b7280] mt-1 leading-5">
                  Patients Helped
                </p>
              </div>

              <div className="bg-[#f8f9fa] border border-[#e5e7eb] rounded-2xl p-4 hover:shadow-md transition hover:-translate-y-1 duration-300">
                <h3 className="text-xl md:text-2xl font-semibold text-[#178d95]">
                  24/7
                </h3>
                <p className="text-xs text-[#6b7280] mt-1 leading-5">
                  Care Accessibility
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[28px] bg-gradient-to-br from-[#178d95]/15 to-[#178d95]/5 blur-sm" />

            <div className="relative rounded-[28px] overflow-hidden border border-[#eef2f4] bg-white">
              <img
                src="/hero-doctor.jpg"
                alt="Rural patients connecting with specialist doctors"
                className="w-full h-[500px] object-cover"
              />
            </div>

            <div className="absolute top-5 left-5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#e5e7eb] px-4 py-3 w-[210px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#178d95]/10 flex items-center justify-center text-[#178d95]">
                  <FaUserMd className="text-sm" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0f172a]">
                    Specialist Access
                  </p>
                  <p className="text-[11px] text-[#6b7280]">
                    Connect with verified doctors
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#e5e7eb] px-4 py-3 w-[220px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#178d95]/10 flex items-center justify-center text-[#178d95]">
                  <FaCalendarCheck className="text-sm" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0f172a]">
                    Easy Appointments
                  </p>
                  <p className="text-[11px] text-[#6b7280]">
                    Faster booking for rural patients
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute top-1/2 -right-3 md:-right-6 -translate-y-1/2 bg-[#178d95] text-white rounded-[24px] px-5 py-4 w-[190px]">
              <p className="text-xs font-medium opacity-90 leading-5">
                Healthcare that reaches beyond cities
              </p>
              <div className="mt-3 flex items-center gap-2">
                <FaPhoneAlt className="text-xs" />
                <span className="text-xs font-semibold">Online Consult</span>
              </div>
            </div>
          </div>
        </main>

        <section
          id="services"
          className="px-6 md:px-12 pb-10 md:pb-12 pt-2 relative z-10 max-w-[1500px] mx-auto"
        >
          <div className="mb-8 mt-12 flex flex-col items-center text-center gap-3">
            <p className="text-[#178d95] text-xs font-semibold uppercase tracking-[0.16em] mb-2">
              Core Services
            </p>
            <h3 className="text-2xl md:text-3xl font-semibold text-[#0f172a]">
              Everything needed for better digital care
            </h3>
            <p className="text-[#6b7280] max-w-[520px] mt-3 text-sm leading-6">
              Designed to help village patients discover specialists, schedule
              consultations, and manage their healthcare journey with ease.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaCalendarCheck />
              </div>
              <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
                Easy Appointments
              </h4>
              <p className="text-[#6b7280] leading-6 text-sm">
                Book and manage appointments with top doctors in just a few
                clicks.
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaHeartbeat />
              </div>
              <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
                Medical Records
              </h4>
              <p className="text-[#6b7280] leading-6 text-sm">
                Securely store and access your medical history anytime,
                anywhere.
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaPhoneAlt />
              </div>
              <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
                Telemedicine
              </h4>
              <p className="text-[#6b7280] leading-6 text-sm">
                Connect with healthcare professionals through online
                consultations.
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaClinicMedical />
              </div>
              <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
                E-Prescriptions
              </h4>
              <p className="text-[#6b7280] leading-6 text-sm">
                Receive digital prescriptions and continue your treatment with
                ease.
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaUserMd />
              </div>
              <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
                Health Monitoring
              </h4>
              <p className="text-[#6b7280] leading-6 text-sm">
                Track your health journey and stay connected with the right care
                support.
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#178d95]/10 flex items-center justify-center text-[#178d95] text-lg mb-4">
                <FaShieldAlt />
              </div>
              <h4 className="text-lg font-semibold text-[#0f172a] mb-2">
                Data Security
              </h4>
              <p className="text-[#6b7280] leading-6 text-sm">
                Your health data is encrypted and managed with better security
                standards.
              </p>
            </div>
          </div>
        </section>

        <section
          id="how"
          className="px-6 md:px-12 pb-12 md:pb-14 relative z-10 max-w-[1500px] mx-auto"
        >
          <div className="grid lg:grid-rows-2 gap-8 items-center lg:mb-12 mt-12">
            <div className="flex flex-col items-center text-center">
              <p className="text-[#178d95] text-xs font-semibold uppercase tracking-[0.16em]">
                How It Works
              </p>
              <h3 className="text-2xl md:text-3xl font-semibold text-[#0f172a] mt-2 mb-4">
                Simple steps to access specialist care
              </h3>
              <p className="text-[#6b7280] leading-7 max-w-[540px] text-sm">
                The platform is designed to be simple and easy for anyone to
                use, even for first-time digital healthcare users in rural
                communities.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex gap-4 bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
                <div className="w-10 h-10 rounded-full bg-[#178d95] text-white flex items-center justify-center font-semibold text-sm shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-[#0f172a] text-base">
                    Create Your Account
                  </h4>
                  <p className="text-sm text-[#6b7280] mt-1 leading-6">
                    Register securely and set up your patient profile with basic
                    details.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
                <div className="w-10 h-10 rounded-full bg-[#178d95] text-white flex items-center justify-center font-semibold text-sm shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-[#0f172a] text-base">
                    Search Specialist Doctors
                  </h4>
                  <p className="text-sm text-[#6b7280] mt-1 leading-6">
                    Find the right doctor based on specialty and available
                    consultation time.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300">
                <div className="w-10 h-10 rounded-full bg-[#178d95] text-white flex items-center justify-center font-semibold text-sm shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-[#0f172a] text-base">
                    Book and Receive Care
                  </h4>
                  <p className="text-sm text-[#6b7280] mt-1 leading-6">
                    Confirm your appointment and continue your healthcare
                    journey with easier access and follow-up.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="doctors" className="px-6 md:px-12 pb-12 max-w-[1500px] mx-auto">
          <div className="mb-8 flex flex-col items-center text-center">
            <p className="text-[#178d95] text-xs font-semibold uppercase tracking-[0.16em]">
              Doctors
            </p>
            <h3 className="text-2xl md:text-3xl font-semibold text-[#0f172a] mt-2">
              Meet Specialist Doctors
            </h3>
          </div>

          {loadingDoctors ? (
            <p className="text-center text-[#6b7280]">Loading doctors...</p>
          ) : doctorError ? (
            <p className="text-center text-red-500">{doctorError}</p>
          ) : doctors.length === 0 ? (
            <p className="text-center text-[#6b7280]">No doctors found.</p>
          ) : (
            <>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleDoctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={doctor.avatarUrl || "/default-doctor.png"}
                        alt={doctor.fullName}
                        className="w-16 h-16 rounded-full object-cover border"
                      />
                      <div>
                        <h4 className="text-lg font-semibold text-[#0f172a]">
                          {doctor.fullName}
                        </h4>
                        <p className="text-sm text-[#178d95]">
                          {doctor.specialization || "General"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-[#6b7280]">
                      <p className="flex items-center gap-2">
                        <FaStethoscope className="text-[#178d95]" />
                        {doctor.qualifications || "Qualification not added"}
                      </p>
                      <p>Experience: {doctor.experience || 0} years</p>
                      <p>Fee: Rs. {doctor.consultationFee || 0}</p>
                      <p>Rating: {doctor.rating || 0} / 5</p>
                      <p className="line-clamp-2">
                        {doctor.bio || "No bio available"}
                      </p>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => handleViewDoctorDetails(doctor)}
                        className="px-4 py-2 rounded-full border border-[#178d95] text-[#178d95] text-sm font-medium hover:bg-[#178d95]/5"
                      >
                        View Details
                      </button>

                      <button
                        onClick={() => handleBookDoctor(doctor)}
                        className="px-4 py-2 rounded-full bg-[#178d95] text-white text-sm font-medium hover:bg-[#126f76]"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {doctors.length > DOCTOR_LIMIT && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setShowAllDoctors((prev) => !prev)}
                    className="px-6 py-3 rounded-full border border-[#178d95] text-[#178d95] text-sm font-medium hover:bg-[#178d95]/5 transition"
                  >
                    {showAllDoctors ? "Show Less Doctors" : "See All Doctors"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section id="hospitals" className="px-6 md:px-12 pb-12 max-w-[1500px] mx-auto">
          <div className="mb-8 flex flex-col items-center text-center">
            <p className="text-[#178d95] text-xs font-semibold uppercase tracking-[0.16em]">
              Hospitals
            </p>
            <h3 className="text-2xl md:text-3xl font-semibold text-[#0f172a] mt-2">
              Nearby Hospitals and Care Centers
            </h3>
          </div>

          {loadingHospitals ? (
            <p className="text-center text-[#6b7280]">Loading hospitals...</p>
          ) : hospitalError ? (
            <p className="text-center text-red-500">{hospitalError}</p>
          ) : hospitals.length === 0 ? (
            <p className="text-center text-[#6b7280]">No hospitals found.</p>
          ) : (
            <>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleHospitals.map((hospital) => (
                  <div
                    key={hospital._id}
                    className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-md transition"
                  >
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-[#0f172a]">
                        {hospital.name}
                      </h4>
                      <p className="text-sm text-[#178d95]">Active Hospital</p>
                    </div>

                    <div className="space-y-2 text-sm text-[#6b7280]">
                      <p className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-[#178d95]" />
                        {hospital.address || "Address not available"}
                      </p>
                      <p className="flex items-center gap-2">
                        <FaPhoneAlt className="text-[#178d95]" />
                        {hospital.contact || "Contact not available"}
                      </p>
                      <p>
                        Location:{" "}
                        {hospital.lat && hospital.lng
                          ? `${hospital.lat}, ${hospital.lng}`
                          : "Location not available"}
                      </p>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => handleViewHospitalDetails(hospital)}
                        className="px-4 py-2 rounded-full border border-[#178d95] text-[#178d95] text-sm font-medium hover:bg-[#178d95]/5"
                      >
                        View Details
                      </button>

                      <button
                        onClick={() => handleBookHospital(hospital)}
                        className="px-4 py-2 rounded-full bg-[#178d95] text-white text-sm font-medium hover:bg-[#126f76]"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {hospitals.length > HOSPITAL_LIMIT && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setShowAllHospitals((prev) => !prev)}
                    className="px-6 py-3 rounded-full border border-[#178d95] text-[#178d95] text-sm font-medium hover:bg-[#178d95]/5 transition"
                  >
                    {showAllHospitals ? "Show Less Hospitals" : "See All Hospitals"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section
          id="testimonials"
          className="px-6 md:px-12 pb-10 md:pb-12 relative z-10 max-w-[1500px] mx-auto"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <p className="text-[#178d95] text-xs font-semibold uppercase tracking-[0.16em]">
              Testimonials
            </p>
            <h3 className="text-2xl md:text-3xl font-semibold text-[#0f172a] mt-2">
              What people say about Care Line 360
            </h3>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {testimonials.map((item, index) => (
              <div
                key={index}
                className="bg-[#f8f9fa] rounded-2xl p-5 border border-[#e5e7eb] hover:shadow-sm transition hover:-translate-y-1 duration-300"
              >
                <div className="flex gap-1 text-[#f59e0b] mb-4 text-sm">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>
                <p className="text-[#6b7280] leading-6 text-sm mb-5">
                  {item.text}
                </p>
                <div>
                  <h4 className="text-base font-semibold text-[#0f172a]">
                    {item.name}
                  </h4>
                  <p className="text-sm text-[#178d95]">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 md:px-12 pb-10 md:pb-12 relative z-10 max-w-[1500px] mx-auto">
          <div className="rounded-[26px] bg-gradient-to-r from-[#178d95] to-[#126f76] p-7 md:p-9 text-white">
            <div className="grid lg:grid-cols-2 gap-6 items-center">
              <div>
                <p className="uppercase tracking-[0.16em] text-xs font-semibold text-white/80">
                  Need Immediate Support
                </p>
                <h3 className="text-2xl md:text-3xl font-semibold mt-2">
                  Access healthcare support anytime, anywhere
                </h3>
                <p className="mt-4 text-white/85 leading-7 max-w-[560px] text-sm">
                  Connect patients from rural communities with the right
                  healthcare guidance faster through a reliable and easy-to-use
                  digital platform.
                </p>
              </div>

              <div className="flex flex-wrap lg:justify-end gap-3">
                <Link
                  to="/doctors"
                  className="px-6 py-3 rounded-full bg-white text-[#178d95] text-sm font-medium hover:bg-[#f8fafc] transition hover:shadow-sm hover:-translate-y-1 duration-300"
                >
                  Find a Doctor
                </Link>

                <Link
                  to="/register"
                  className="px-6 py-3 rounded-full border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition hover:shadow-sm hover:-translate-y-1 duration-300"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer
          id="contact"
          className="px-6 md:px-12 py-10 border-t border-[#e2e8f0] bg-white/40 relative z-10"
        >
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-[1500px] mx-auto">
            <div>
              <h3 className="text-xl font-semibold text-[#0f172a]">
                Care Line 360
              </h3>
              <p className="text-[#6b7280] leading-6 mt-4 max-w-[320px] text-sm">
                A smart healthcare platform helping rural patients connect with
                specialist doctors and access digital care more easily.
              </p>
            </div>

            <div>
              <h4 className="text-base font-semibold text-[#0f172a] mb-4">
                Quick Links
              </h4>
              <div className="flex flex-col gap-3 text-[#6b7280] text-sm">
                <a href="#home" className="hover:text-[#178d95] transition hover:-translate-y-1 duration-300">
                  Home
                </a>
                <a href="#services" className="hover:text-[#178d95] transition hover:-translate-y-1 duration-300">
                  Services
                </a>
                <a href="#how" className="hover:text-[#178d95] transition hover:-translate-y-1 duration-300">
                  How It Works
                </a>
                <a
                  href="#testimonials"
                  className="hover:text-[#178d95] transition hover:-translate-y-1 duration-300"
                >
                  Testimonials
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-base font-semibold text-[#0f172a] mb-4">
                Contact
              </h4>
              <div className="flex flex-col gap-3 text-[#6b7280] text-sm">
                <div className="flex items-center gap-3 hover:-translate-y-1 duration-300">
                  <FaPhoneAlt className="text-[#178d95]" />
                  <span>+94 77 123 4567</span>
                </div>
                <div className="flex items-center gap-3 hover:-translate-y-1 duration-300">
                  <FaEnvelope className="text-[#178d95]" />
                  <span>careline360@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 hover:-translate-y-1 duration-300">
                  <FaMapMarkerAlt className="text-[#178d95]" />
                  <span>Jaffna, Sri Lanka</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-base font-semibold text-[#0f172a] mb-4">
                Follow Us
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href="/"
                  className="w-10 h-10 rounded-full bg-[#178d95]/10 text-[#178d95] flex items-center justify-center hover:bg-[#178d95] hover:text-white transition hover:-translate-y-1 duration-300"
                >
                  <FaFacebookF className="text-sm" />
                </a>
                <a
                  href="/"
                  className="w-10 h-10 rounded-full bg-[#178d95]/10 text-[#178d95] flex items-center justify-center hover:bg-[#178d95] hover:text-white transition hover:-translate-y-1 duration-300"
                >
                  <FaInstagram className="text-sm" />
                </a>
                <a
                  href="/"
                  className="w-10 h-10 rounded-full bg-[#178d95]/10 text-[#178d95] flex items-center justify-center hover:bg-[#178d95] hover:text-white transition hover:-translate-y-1 duration-300"
                >
                  <FaLinkedinIn className="text-sm" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#e2e8f0] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#6b7280] max-w-[1500px] mx-auto">
            <p>© 2026 Care Line 360. All rights reserved.</p>
            <p>Designed for accessible digital healthcare.</p>
          </div>
        </footer>

        {selectedDoctor && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
            onClick={() => setSelectedDoctor(null)}
          />
          
        <div
          className="absolute left-1/2 z-50 w-full max-w-3xl px-4 mt-14"
          style={{
            top: `${window.scrollY + window.innerHeight / 2}px`,
            transform: "translate(-50%, -50%)",
          }}
        >            
          <div className="relative w-full max-w-3xl rounded-[28px] border border-white/30 bg-white/95 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-[fadeIn_.25s_ease]">
              
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-[#178d95]/15 via-[#178d95]/8 to-transparent" />

              <button
                onClick={() => setSelectedDoctor(null)}
                className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/90 border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition"
              >
                <FaTimes />
              </button>

              <div className="relative p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="shrink-0">
                    <img
                      src={selectedDoctor.avatarUrl || "/default-doctor.png"}
                      alt={selectedDoctor.fullName}
                      className="w-28 h-28 md:w-36 md:h-36 rounded-3xl object-cover border-4 border-white shadow-md"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-[#0f172a]">
                          {selectedDoctor.fullName}
                        </h3>
                        <p className="text-[#178d95] mt-2 text-base md:text-lg font-medium">
                          {selectedDoctor.specialization || "General"}
                        </p>
                      </div>

                      <div className="mr-8 px-4 py-2 rounded-full bg-[#178d95]/10 text-[#178d95] text-sm font-semibold">
                        Rating: {selectedDoctor.rating || 0} / 5
                      </div>
                    </div>

                    <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                        <p className="text-slate-500 text-xs mb-1">Qualifications</p>
                        <p className="text-slate-800 font-medium">
                          {selectedDoctor.qualifications || "Not available"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                        <p className="text-slate-500 text-xs mb-1">Experience</p>
                        <p className="text-slate-800 font-medium">
                          {selectedDoctor.experience || 0} years
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                        <p className="text-slate-500 text-xs mb-1">Consultation Fee</p>
                        <p className="text-slate-800 font-medium">
                          Rs. {selectedDoctor.consultationFee || 0}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                        <p className="text-slate-500 text-xs mb-1">Phone</p>
                        <p className="text-slate-800 font-medium">
                          {selectedDoctor.phone || "Not available"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 sm:col-span-2">
                        <p className="text-slate-500 text-xs mb-1">License Number</p>
                        <p className="text-slate-800 font-medium">
                          {selectedDoctor.licenseNumber || "Not available"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl bg-[#f8fafc] border border-slate-200 p-5">
                      <p className="font-semibold text-[#0f172a] mb-2">About Doctor</p>
                      <p className="text-sm text-slate-600 leading-7">
                        {selectedDoctor.bio || "No biography available."}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => handleBookDoctor(selectedDoctor)}
                        className="px-6 py-3 rounded-full bg-[#178d95] text-white text-sm font-medium hover:bg-[#126f76] transition"
                      >
                        Book Now
                      </button>

                      <button
                        onClick={() => setSelectedDoctor(null)}
                        className="px-6 py-3 rounded-full border border-[#178d95] text-[#178d95] text-sm font-medium hover:bg-[#178d95]/5 transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </>
        )}

        {selectedHospital && (
          <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
            onClick={() => setSelectedDoctor(null)}
          />
         
          <div
          className="absolute left-1/2 z-50 w-full max-w-3xl px-4 mt-10"
          style={{
            top: `${window.scrollY + window.innerHeight / 2}px`,
            transform: "translate(-50%, -50%)",
          }}
        > 
            <div className="relative w-full max-w-4xl rounded-[28px] border border-white/30 bg-white/95 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-[fadeIn_.25s_ease]">
              
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-[#178d95]/15 via-[#178d95]/8 to-transparent" />

              <button
                onClick={() => setSelectedHospital(null)}
                className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/90 border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition"
              >
                <FaTimes />
              </button>

              <div className="relative p-6 md:p-8">
                <div className="mb-6">
                  <h3 className="text-2xl md:text-3xl font-bold text-[#0f172a]">
                    {selectedHospital.name}
                  </h3>
                  <p className="text-[#178d95] mt-2 font-medium text-base">
                    Hospital Details
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-slate-500 text-xs mb-1">Address</p>
                      <p className="text-slate-800 font-medium">
                        {selectedHospital.address || "Not available"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-slate-500 text-xs mb-1">Contact</p>
                      <p className="text-slate-800 font-medium">
                        {selectedHospital.contact || "Not available"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                        <p className="text-slate-500 text-xs mb-1">Latitude</p>
                        <p className="text-slate-800 font-medium">
                          {selectedHospital.lat || "Not available"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                        <p className="text-slate-500 text-xs mb-1">Longitude</p>
                        <p className="text-slate-800 font-medium">
                          {selectedHospital.lng || "Not available"}
                        </p>
                      </div>
                    </div>

                    {selectedHospital.lat && selectedHospital.lng && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedHospital.lat},${selectedHospital.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-[#178d95] font-medium hover:underline"
                      >
                        Open in Google Maps
                      </a>
                    )}

                    <div className="pt-2 flex flex-wrap gap-3">
                      <button
                        onClick={() => handleBookHospital(selectedHospital)}
                        className="px-6 py-3 rounded-full bg-[#178d95] text-white text-sm font-medium hover:bg-[#126f76] transition"
                      >
                        Book Now
                      </button>

                      <button
                        onClick={() => setSelectedHospital(null)}
                        className="px-6 py-3 rounded-full border border-[#178d95] text-[#178d95] text-sm font-medium hover:bg-[#178d95]/5 transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="rounded-3xl overflow-hidden border border-slate-200 min-h-[320px] bg-slate-50 shadow-sm">
                    {selectedHospital.lat && selectedHospital.lng ? (
                      <iframe
                        title="Hospital Location Map"
                        src={getMapEmbedUrl(selectedHospital.lat, selectedHospital.lng)}
                        width="100%"
                        height="100%"
                        className="w-full min-h-[320px]"
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <div className="h-full min-h-[320px] flex items-center justify-center text-sm text-slate-500 p-6 text-center">
                        Location map not available for this hospital.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </>
        )}
      </section>
    </div>
  );
}
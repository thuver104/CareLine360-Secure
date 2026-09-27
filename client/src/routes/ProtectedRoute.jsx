import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getDoctorProfile } from "../api/doctorApi";

export default function ProtectedRoute({
  allowedRoles = [],
}) {
  const location = useLocation();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const role = user?.role;

  const [profileChecked, setProfileChecked] =
    useState(false);

  const [needsSetup, setNeedsSetup] =
    useState(false);

  const checkedRef = useRef(false);

  useEffect(() => {
    /*
     * IMPORTANT:
     * Do not make authentication decisions while
     * AuthContext is still restoring the user
     * from localStorage.
     */
    if (authLoading) {
      return;
    }

    /*
     * Not authenticated.
     */
    if (!user) {
      checkedRef.current = false;
      setProfileChecked(false);
      setNeedsSetup(false);
      return;
    }

    /*
     * Patients/admins/responders do not need
     * doctor-profile validation.
     */
    if (role !== "doctor") {
      checkedRef.current = false;
      setNeedsSetup(false);
      setProfileChecked(true);
      return;
    }

    /*
     * The doctor is currently on the profile
     * setup page.
     */
    if (
      location.pathname === "/doctor/setup"
    ) {
      setNeedsSetup(false);

      /*
       * Reset this so that when the doctor
       * leaves setup, the newly created profile
       * is checked once again.
       */
      checkedRef.current = false;

      setProfileChecked(true);
      return;
    }

    /*
     * Avoid unnecessary duplicate profile checks.
     */
    if (checkedRef.current) {
      return;
    }

    checkedRef.current = true;
    setProfileChecked(false);

    getDoctorProfile()
      .then(() => {
        setNeedsSetup(false);
      })
      .catch((error) => {
        /*
         * Redirect only when the backend
         * definitively says that the profile
         * does not exist.
         */
        if (
          error?.response?.status === 404
        ) {
          setNeedsSetup(true);
        } else {
          setNeedsSetup(false);
        }
      })
      .finally(() => {
        setProfileChecked(true);
      });
  }, [
    authLoading,
    user?.id,
    role,
    location.pathname,
  ]);

  /*
   * FIX:
   * Previously ProtectedRoute checked user
   * before AuthContext had completed restoring
   * authentication after a browser reload.
   *
   * Wait first.
   */
  if (authLoading) {
    return <LoadingScreen />;
  }

  /*
   * Only redirect after authentication
   * restoration has completed.
   */
  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
        }}
        replace
      />
    );
  }

  /*
   * Role authorization.
   */
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(role)
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /*
   * Doctor profile check.
   */
  if (
    role === "doctor" &&
    !profileChecked
  ) {
    return <LoadingScreen />;
  }

  /*
   * Doctor has not completed setup.
   */
  if (
    role === "doctor" &&
    needsSetup &&
    location.pathname !== "/doctor/setup"
  ) {
    return (
      <Navigate
        to="/doctor/setup"
        replace
      />
    );
  }

  return <Outlet />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
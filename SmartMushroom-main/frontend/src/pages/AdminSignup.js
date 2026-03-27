import React, { useEffect } from "react";

// Admin signup page removed — redirecting to unified Sign up
export default function AdminSignup() {
  useEffect(() => {
    window.location.href = "/signup";
  }, []);
  return null;
}

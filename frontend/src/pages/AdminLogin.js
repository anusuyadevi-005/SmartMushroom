import React, { useEffect } from "react";

// Admin login page removed — redirecting to unified Sign in
export default function AdminLogin() {
  useEffect(() => {
    window.location.href = "/login";
  }, []);
  return null;
}



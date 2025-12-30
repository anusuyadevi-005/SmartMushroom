import React from "react";

function Login() {
  const googleLogin = () => {
    window.location.href = "http://localhost:5000/login/google";
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Welcome to AgroSense</h2>
      <p>Smart Oyster Mushroom Management</p>

      <button
        onClick={googleLogin}
        style={{
          padding: "12px 20px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Continue with Google
      </button>
    </div>
  );
}

export default Login;

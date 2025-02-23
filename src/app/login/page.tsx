"use client";

import supabaseClient from "../../lib/supabaseClient";

export default function LoginPage() {
  const handleLogin = async () => {
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({ provider: "google" });
      if (error) {
        console.error("Login error:", error);
      }
    } catch (err) {
      console.error("Unexpected error during sign in:", err);
    }
  };

  return (
    <div>
      <button onClick={handleLogin}>Sign In</button>
    </div>
  );
} 
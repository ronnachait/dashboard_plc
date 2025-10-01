"use client";

import LoginForm from "@/components/LoginForm";
import { Suspense } from "react";

export default function LoginPageWrapper() {
  return (
    <Suspense
      fallback={<p className="text-center mt-10">⏳ Loading login...</p>}
    >
      <LoginForm />
    </Suspense>
  );
}

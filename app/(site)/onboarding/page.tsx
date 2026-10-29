"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/profiles");
  }, [router]);
  return (
    <div className="page-container">
      <p style={{ textAlign: "center", padding: "3rem" }}>正在跳转到档案中心…</p>
    </div>
  );
}

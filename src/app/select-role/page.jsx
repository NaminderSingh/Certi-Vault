"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SelectRolePage() {
  const [role, setRole] = useState("student");
  const { data: session } = useSession();
  const router = useRouter();

  const handleSubmit = async () => {
    const res = await fetch("/api/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    console.log(res);
    if (res.ok) {
      router.replace(`/dashboard/${role}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Select Your Role</h1>

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="border px-3 py-2 rounded"
      >
        <option value="student">Student</option>
        <option value="institution">Institution</option>
        <option value="verifier">employer</option>
      </select>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded w-60"
      >
        Continue
      </button>
    </div>
  );
}

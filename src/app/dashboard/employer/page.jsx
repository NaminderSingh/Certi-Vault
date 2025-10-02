"use client";

import { useSession } from "next-auth/react";

export default function EmployerDashboard() {
  const { data: session } = useSession();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">🔍 employer Dashboard</h1>
      <p className="mt-2">Welcome, {session?.user?.name}!</p>
      <p className="text-gray-600">Role: {session?.user?.role}</p>

      <div className="mt-4">
        <p className="text-lg">Here you can:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Search and view student certificates</li>
          <li>Check digital signatures</li>
          <li>Confirm authenticity of documents</li>
        </ul>
      </div>
    </div>
  );
}

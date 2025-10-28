import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import SharedCertificate from "@/models/SharedCertificate";
import User from "@/models/user";

export async function PATCH(req) {
  await connectDB();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const employer = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!employer || employer.role !== "employer") {
      return new Response(
        JSON.stringify({ error: "Only employers can mark certificates as reviewed" }),
        { status: 403 }
      );
    }

    const { sharedId } = await req.json();

    if (!sharedId) {
      return new Response(
        JSON.stringify({ error: "Shared certificate ID is required" }),
        { status: 400 }
      );
    }

    // Find and update the shared certificate
    const sharedCert = await SharedCertificate.findOne({
      _id: sharedId,
      employer: employer._id
    });

    if (!sharedCert) {
      return new Response(
        JSON.stringify({ error: "Shared certificate not found" }),
        { status: 404 }
      );
    }

    sharedCert.isReviewed = true;
    sharedCert.reviewedAt = new Date();
    await sharedCert.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Certificate marked as reviewed",
        sharedCertificate: sharedCert
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error marking certificate as reviewed:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
// ```

// ---

// ## Summary of Files Created:

// 1. **`app/api/certifictes/shared-certificates/route.js`** - API to get all shared certificates grouped by students
// 2. **`app/api/certifictes/student-certificates/[studentId]/route.js`** - API to get certificates from a specific student
// 3. **`app/dashboard/employer/shared/page.js`** - Frontend page showing list of students who shared certificates
// 4. **`app/dashboard/employer/students/[studentId]/page.js`** - Frontend page showing all certificates from one student
// 5. **`app/api/certifictes/mark-reviewed/route.js`** - API to mark a certificate as reviewed when employer views it

// ## File Structure:
// ```
// app/
// ├── api/
// │   └── certifictes/
// │       ├── shared-certificates/
// │       │   └── route.js
// │       ├── student-certificates/
// │       │   └── [studentId]/
// │       │       └── route.js
// │       └── mark-reviewed/
// │           └── route.js
// └── dashboard/
//     └── employer/
//         ├── shared/
//         │   └── page.js
//         └── students/
//             └── [studentId]/
//                 └── page.js
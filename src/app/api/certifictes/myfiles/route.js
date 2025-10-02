import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Certificate from "@/models/certificate";
import User from "@/models/user";

export async function GET(req) {
  await connectDB();

  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    // Fetch user ID from User schema
    const dbUser = await User.findOne({ email: userEmail });
    if (!dbUser) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }

    const userId = dbUser._id;

    // Fetch certificates for logged-in user
    const certificates = await Certificate.find(
      { student: userId },
      {
        title: 1,
        description: 1,
        ipfsCid: 1,
        verifiedBy: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    ).lean();

    return new Response(
      JSON.stringify({ certificates }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching certificates:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch certificates" }),
      { status: 500 }
    );
  }
}

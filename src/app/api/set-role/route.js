import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import User from "@/models/user";
import connectDB from "@/lib/db";

export async function POST(req) {
  const { role } = await req.json();
  console.log("📩 Request to set role:", role);

  const session = await getServerSession(authOptions);
  console.log("🔍 Session:", session);

  if (!session || !session.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectDB();

  // update using email instead of id
  await User.findOneAndUpdate(
    { email: session.user.email },
    { role },
    { new: true }
  );

  return new Response("Role updated", { status: 200 });
}

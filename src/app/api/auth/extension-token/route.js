import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import jwt from "jsonwebtoken";
import User from "@/models/user";
import connectDB from "@/lib/db";

export async function POST(req) {
  await connectDB();
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }), 
        { status: 401 }
      );
    }
    
    const { email } = await req.json();
    
    if (session.user.email !== email) {
      return new Response(
        JSON.stringify({ error: "Email mismatch" }), 
        { status: 403 }
      );
    }
    
    // Get user from database
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }), 
        { status: 404 }
      );
    }
    
    // Generate JWT token (valid for 30 days)
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '30d' }
    );
    
    return new Response(
      JSON.stringify({ token }), 
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Token generation error:', error);
    return new Response(
      JSON.stringify({ error: "Failed to generate token" }), 
      { status: 500 }
    );
  }
}
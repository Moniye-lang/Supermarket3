import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing");
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    let googleId, email, name;

    // Verify ID Token via Google API
    try {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
      if (!verifyRes.ok) throw new Error("Not a valid ID token");
      const payload = await verifyRes.json() as any;
      
      // Allow minor mismatch or verify client ID if defined
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      if (googleClientId && payload.aud !== googleClientId) {
        throw new Error("Audience mismatch");
      }
      
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
    } catch (idTokenError: any) {
      console.warn("ID Token verification failed, trying fallback as Access Token. Error:", idTokenError.message || idTokenError);
      // Fallback: Verify as Access Token
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!userInfoRes.ok) throw new Error(`Google userinfo returned status ${userInfoRes.status}`);
        const userInfo = await userInfoRes.json() as any;
        googleId = userInfo.sub;
        email = userInfo.email;
        name = userInfo.name;
      } catch (accessTokenError: any) {
        console.error("Google Access Token verification failed:", accessTokenError.message || accessTokenError);
        return NextResponse.json({ error: "Invalid Google Token" }, { status: 400 });
      }
    }

    let user = await User.findOne({ email });

    if (user) {
      // Link Google ID if not present
      if (!user.googleId) {
        user.googleId = googleId;
        user.isVerified = true; // Trust Google verified emails
        await user.save();
      }
    } else {
      // Create new user from Google
      user = new User({
        name,
        email,
        googleId,
        isVerified: true,
        passwordHash: "GOOGLE_AUTH_NO_PASSWORD", // Placeholder
      });
      await user.save();
    }

    const tokenJwt = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    return NextResponse.json({
      success: true,
      message: "Google login successful",
      token: tokenJwt,
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (err: any) {
    console.error("Google Login Error:", err);
    return NextResponse.json({ error: "Google authentication failed" }, { status: 400 });
  }
}

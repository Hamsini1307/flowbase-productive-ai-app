import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ASSEMBLYAI_API_KEY environment variable is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.assemblyai.com/v2/realtime/token", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expires_in: 300 }), // Token valid for 5 minutes
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 404 || errText.toLowerCase().includes("not found")) {
        // Fallback: Test if the API key itself is valid for standard requests (e.g. free/trial accounts)
        try {
          const testRes = await fetch("https://api.assemblyai.com/v2/transcript?limit=1", {
            method: "GET",
            headers: {
              "Authorization": apiKey,
            },
          });
          if (testRes.ok) {
            // Key is valid, but token generation is unsupported. Return key directly as fallback.
            return NextResponse.json({ token: apiKey });
          }
        } catch (e) {
          console.error("AssemblyAI API key validation fallback check failed:", e);
        }

        return NextResponse.json(
          { error: "AssemblyAI API key is invalid or unauthorized. Please verify that your ASSEMBLYAI_API_KEY in the .env file matches a valid key from your AssemblyAI Dashboard." },
          { status: 401 }
        );
      }
      throw new Error(`AssemblyAI token generation failed: ${errText}`);
    }

    const data = await response.json();
    return NextResponse.json({ token: data.token });
  } catch (error: any) {
    console.error("AssemblyAI token route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate temporary AssemblyAI token" },
      { status: 500 }
    );
  }
}

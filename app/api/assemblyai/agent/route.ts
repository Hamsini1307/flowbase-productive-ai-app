import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, userSettings } from "@/db";

export async function GET() {
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

    const systemPrompt = `You are a friendly workspace voice assistant named Flowbase AI.
You help the user manage their tasks, calendar, notes, and boards.
Be extremely brief, conversational, and direct.

Always call the appropriate tool when the user requests an action:
- To schedule or add a reminder/event on the calendar, call "create_calendar_event".
- To add a task, call "create_kanban_task".
- To create a note, call "create_note".
- To create a board, call "create_kanban_board".

If a required parameter (like a title or date) is missing, ask the user for it directly in a short, natural sentence.
Confirm actions once successfully executed.`;

    // 1. Fetch user settings
    let [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, activeUserId));

    if (settings && settings.assemblyaiAgentId) {
      try {
        await fetch(`https://agents.assemblyai.com/v1/agents/${settings.assemblyaiAgentId}`, {
          method: "PATCH",
          headers: {
            "Authorization": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            system_prompt: systemPrompt,
            greeting: "Hello, how can I help you?",
          })
        });
      } catch (e) {
        console.warn("Failed to patch voice agent configs, continuing:", e);
      }

      // Fetch token for connection
      const token = await generateToken(apiKey);
      return NextResponse.json({ 
        agentId: settings.assemblyaiAgentId, 
        token 
      });
    }

    // 2. Create voice agent dynamically if it doesn't exist

    const res = await fetch("https://agents.assemblyai.com/v1/agents", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Workspace Assistant",
        system_prompt: systemPrompt,
        greeting: "Hello, how can I help you?",
        voice: { voice_id: "ivy" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AssemblyAI voice agent creation failed: ${errText}`);
    }

    const data = await res.json();
    const agentId = data.id;

    // 3. Save agentId to user settings in database
    if (settings) {
      await db
        .update(userSettings)
        .set({ assemblyaiAgentId: agentId, updatedAt: new Date() })
        .where(eq(userSettings.userId, activeUserId));
    }

    const token = await generateToken(apiKey);

    return NextResponse.json({ agentId, token });
  } catch (error: any) {
    console.error("AssemblyAI agent route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize AssemblyAI agent" },
      { status: 500 }
    );
  }
}

async function generateToken(apiKey: string): Promise<string> {
  const response = await fetch("https://api.assemblyai.com/v2/realtime/token", {
    method: "POST",
    headers: {
      "Authorization": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expires_in: 300 }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 404 || errText.toLowerCase().includes("not found")) {
      // Fallback: Return api key directly as token if token endpoint is unauthorized/unsupported
      return apiKey;
    }
    throw new Error(`AssemblyAI token generation failed: ${errText}`);
  }

  const data = await response.json();
  return data.token;
}

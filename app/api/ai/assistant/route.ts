import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { 
  db, 
  kanbanTasks, 
  kanbanBoards, 
  notes, 
  whiteboards, 
  aiApps, 
  userSettings 
} from "@/db";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const activeUserId = userId || "guest-user";

    const { messages, confirmed, action } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    const userMessage = messages[messages.length - 1]?.content || "";

    // ----------------------------------------------------
    // CASE A: IF USER CONFIRMED THE DRAFTED ACTION
    // ----------------------------------------------------
    if (confirmed && action && action.type) {
      const { type, params } = action;
      let reply = "I have successfully executed that action.";

      switch (type) {
        case "create_kanban_task": {
          const boardId = params.boardId || "default-board";
          const newId = `task-${Math.random().toString(36).substring(2, 9)}`;
          await db.insert(kanbanTasks).values({
            id: newId,
            userId: activeUserId,
            boardId,
            columnId: "todo",
            title: params.title || "New Task",
            description: params.description || "",
            dueDate: params.dueDate || new Date().toISOString().split('T')[0],
            priority: params.priority || "Medium",
            label: "Task",
            labelColor: "#6257f6"
          });
          reply = `I have successfully created the task "${params.title}" on your Kanban board.`;
          break;
        }

        case "create_kanban_board": {
          const newId = `board-${Math.random().toString(36).substring(2, 9)}`;
          await db.insert(kanbanBoards).values({
            id: newId,
            userId: activeUserId,
            name: params.name || "New Board",
            color: params.color || "#6257f6",
            columns: [
              { id: "todo", title: "To Do" },
              { id: "progress", title: "In Progress" },
              { id: "done", title: "Done" }
            ]
          });
          reply = `I have successfully created the Kanban board "${params.name}".`;
          break;
        }

        case "create_calendar_event": {
          const newId = `cal-${Math.random().toString(36).substring(2, 9)}`;
          await db.insert(kanbanTasks).values({
            id: newId,
            userId: activeUserId,
            boardId: null,
            columnId: null,
            title: params.title || "Calendar Event",
            dueDate: params.date || new Date().toISOString().split('T')[0],
            time: params.time || "12:00",
            category: params.category || "Meeting",
            taskType: params.taskType || "Task",
            syncCalendar: true
          });
          reply = `I have scheduled the event "${params.title}" on your calendar for ${params.date} at ${params.time || '12:00'}.`;
          break;
        }

        case "create_note": {
          const newId = `note-${Math.random().toString(36).substring(2, 9)}`;
          await db.insert(notes).values({
            id: newId,
            userId: activeUserId,
            title: params.title || "New Note",
            content: params.content || "",
            icon: params.icon || "📝",
            color: params.color || "#ff6b4a"
          });
          reply = `I have successfully created the note "${params.title}".`;
          break;
        }

        case "create_whiteboard": {
          const newId = `wb-${Math.random().toString(36).substring(2, 9)}`;
          await db.insert(whiteboards).values({
            id: newId,
            userId: activeUserId,
            name: params.name || "AI Idea Map",
            elements: [],
            appState: { scrollX: 0, scrollY: 0, zoom: 1 },
            color: "#6257f6"
          });
          reply = `I have successfully created the whiteboard canvas "${params.name}".`;
          break;
        }

        case "generate_ai_app": {
          const newId = `app-${Math.random().toString(36).substring(2, 9)}`;
          const mockLayout = {
            appName: params.prompt || "AI Workspace App",
            description: `Generated for: ${params.prompt}`,
            icon: "Sparkles",
            color: "#00a88f",
            layout: "single-page",
            sections: [
              {
                title: "Metrics Summary",
                type: "stats",
                stats: [{ label: "Efficiency", value: "98%" }]
              }
            ]
          };

          await db.insert(aiApps).values({
            id: newId,
            userId: activeUserId,
            name: mockLayout.appName,
            description: mockLayout.description,
            icon: mockLayout.icon,
            color: mockLayout.color,
            layout: mockLayout.layout,
            data: mockLayout,
            inSidebar: true
          });
          reply = `I have successfully generated your custom habit tracker workspace: "${mockLayout.appName}".`;
          break;
        }

        case "update_settings": {
          await db.update(userSettings)
            .set({
              theme: params.theme || "light",
              defaultCalendarView: params.defaultCalendarView || "Month",
              defaultTaskPriority: params.defaultTaskPriority || "Medium",
              updatedAt: new Date()
            })
            .where(eq(userSettings.userId, activeUserId));
          reply = "I have successfully updated your display and preference settings.";
          break;
        }
      }

      return NextResponse.json({
        reply,
        action: null,
        success: true
      });
    }

    // ----------------------------------------------------
    // CASE B: ANALYZE PROMPT WITH GEMINI (NO WRITES YET)
    // ----------------------------------------------------
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        reply: "I'd love to help, but the GEMINI_API_KEY environment variable is not configured." 
      });
    }

    // Prefetch user details
    const userNotes = await db.select().from(notes).where(eq(notes.userId, activeUserId)).limit(10);
    const userBoards = await db.select().from(kanbanBoards).where(eq(kanbanBoards.userId, activeUserId)).limit(10);

    const contextStr = `
Existing Kanban Boards:
${userBoards.map(b => `- "${b.name}" (ID: ${b.id})`).join("\n")}

Existing Notes:
${userNotes.map(n => `- "${n.title}" (ID: ${n.id})`).join("\n")}
`;

    const systemPrompt = `You are a central AI Command Center assistant for a productivity application.
The user can talk to you to perform actions across the workspace.
Your task is to analyze the user's message: "${userMessage}".
Also consider the conversation history: ${JSON.stringify(messages.slice(-5))}.

Current User Context:
${contextStr}

Today's date is: ${new Date().toISOString().split('T')[0]} (${new Date().toLocaleDateString(undefined, { weekday: 'long' })}).

You support the following actions:
1. "create_kanban_task": { title: string, description: string, dueDate: string (YYYY-MM-DD), priority: "Low" | "Medium" | "High", boardId: string (optional) }
2. "create_kanban_board": { name: string, color: string (hex) }
3. "create_calendar_event": { title: string, date: string (YYYY-MM-DD), time: string (HH:MM), category: string, taskType: "Task" | "Reminder" }
4. "create_note": { title: string, content: string, icon: string, color: string }
5. "summarize_or_refine_note": { noteIdOrTitle: string, operation: "summarize" | "refine" }
6. "create_whiteboard": { name: string, description_prompt: string }
7. "generate_ai_app": { prompt: string }
8. "update_settings": { theme: "light" | "cozy", defaultCalendarView: "Month" | "Week" | "Day", defaultTaskPriority: "Low" | "Medium" | "High" }

CLARIFICATION FLOW RULES:
- If the user's intent matches an action (e.g. "add a meeting", "create a task"), but crucial information is missing (such as the meeting date/time, task title, etc.), do NOT execute the action. Instead, set "action": null, and write a helpful "reply" asking for the missing details (e.g. "Missing title and scheduledDate for the calendar item.").
- If the user request is complete, populate the "action" block.
- For "summarize_or_refine_note", match the noteIdOrTitle with existing notes. If not found, ask them which note they want to refine.

You must return a valid JSON object matching this schema:
{
  "reply": "Friendly response text explaining what you did or asking follow-up questions.",
  "action": {
    "type": "create_kanban_task" | "create_kanban_board" | "create_calendar_event" | "create_note" | "summarize_or_refine_note" | "create_whiteboard" | "generate_ai_app" | "update_settings" | null,
    "params": { ... } // key-value parameters matching the action schema above, or null
  }
}
Generate ONLY the JSON string. Do not wrap in markdown blocks.`;

    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-2.5-flash"
    ];

    let result: any = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      let attempts = 0;
      const maxAttempts = 2;
      let delayMs = 1500;

      while (attempts < maxAttempts) {
        try {
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            })
          });

          // Handle rate limiting
          if (geminiRes.status === 429) {
            attempts++;
            if (attempts >= maxAttempts) {
              throw new Error(`Rate limit exceeded (status 429) on model ${modelName}.`);
            }
            console.warn(`Gemini returned 429. Retrying in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs *= 2;
            continue;
          }

          // Handle model not found (404) - fall back immediately to next model in chain
          if (geminiRes.status === 404) {
            throw new Error(`Model ${modelName} not found (404).`);
          }

          if (!geminiRes.ok) {
            throw new Error(`Gemini API returned status ${geminiRes.status}`);
          }

          const geminiData = await geminiRes.json();
          const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!responseText) {
            throw new Error("Empty response from Gemini API");
          }

          result = JSON.parse(responseText.trim());
          break; // Success! Break out of the attempt loop.
        } catch (err: any) {
          lastError = err;
          // If model is unsupported, break this loop to try the next model immediately
          if (err.message.includes("404")) {
            break;
          }
          if (attempts >= maxAttempts - 1) {
            break;
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2;
        }
      }

      if (result) {
        break; // Successfully got response from a model!
      }
    }

    if (!result) {
      console.error("All Gemini API model attempts failed:", lastError);
      let friendlyReply = `I encountered a temporary connection issue with the AI service: ${lastError?.message || lastError}. Please try again in a moment.`;
      
      if (String(lastError?.message || "").includes("429") || String(lastError || "").includes("429")) {
        friendlyReply = "⚠️ Your Google Gemini API Key has exceeded its daily free rate limit (quota exceeded). To restore full AI Assistant functionality, please generate a fresh free API Key from Google AI Studio (https://aistudio.google.com) and update the GEMINI_API_KEY value inside your .env file, or try again later once the quota resets.";
      }

      return NextResponse.json({
        reply: friendlyReply,
        action: null
      });
    }

    // If the action is "summarize_or_refine_note", we can execute the Gemini operation directly
    if (result.action && result.action.type === "summarize_or_refine_note") {
      const { params } = result.action;
      const targetStr = (params.noteIdOrTitle || "").toLowerCase();
      const targetNote = userNotes.find(n => 
        n.id === targetStr || n.title.toLowerCase().includes(targetStr)
      );

      if (targetNote) {
        const operation = params.operation || "summarize";
        const notePrompt = `Execute "${operation}" operation on the following note:
Title: "${targetNote.title}"
Content: "${targetNote.content}"

Provide the output. Keep it concise.`;

        const refineUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const refineRes = await fetch(refineUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: notePrompt }] }]
          })
        });

        if (refineRes.ok) {
          const refineData = await refineRes.json();
          const output = refineData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          
          if (operation === "refine" && output) {
            await db.update(notes)
              .set({ content: output, updatedAt: new Date() })
              .where(and(eq(notes.id, targetNote.id), eq(notes.userId, activeUserId)));
            result.reply = `I have refined the note "${targetNote.title}" content for you. Details:\n\n${output}`;
          } else {
            result.reply = `Here is the summary of note "${targetNote.title}":\n\n${output}`;
          }
        }
        result.action = null; // Mark completed
      } else {
        result.reply = `I couldn't find a note matching "${params.noteIdOrTitle}". Which note would you like me to summarize or refine?`;
        result.action = null;
      }
    }

    // Set pendingConfirmation to true if we have a draft action to create/update
    if (result.action && result.action.type) {
      result.pendingConfirmation = true;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Assistant route error:", error);
    return NextResponse.json({ 
      reply: "Sorry, I encountered an error while compiling your command." 
    }, { status: 500 });
  }
}

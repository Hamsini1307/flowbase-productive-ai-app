import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback Mock Template Builder if API key is not configured
    if (!apiKey || apiKey.startsWith("AQ.placeholder") || apiKey === "placeholder") {
      console.warn("Using fallback mock template builder (no Gemini API Key configured)");
      const mockResult = generateMockApp(prompt);
      return NextResponse.json(mockResult);
    }

    const systemPrompt = `You are a professional full-stack layout generator. Create a structured single-page mini-app template based on the user's prompt: "${prompt}".
Generate appropriate layout elements, sections, mock tables, charts, statistics, checklists, lists, forms, and colors.
Return a valid JSON object matching the requested schema. Ensure the theme color is a pleasant hex color.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                appName: { type: "STRING" },
                description: { type: "STRING" },
                icon: { type: "STRING" },
                color: { type: "STRING" },
                layout: { type: "STRING" },
                sections: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      type: { type: "STRING", enum: ["stats", "list", "table", "form", "checklist", "chart"] },
                      description: { type: "STRING" },
                      stats: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            label: { type: "STRING" },
                            value: { type: "STRING" },
                            change: { type: "STRING" }
                          },
                          required: ["label", "value"]
                        }
                      },
                      items: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            id: { type: "STRING" },
                            text: { type: "STRING" },
                            checked: { type: "BOOLEAN" }
                          },
                          required: ["id", "text"]
                        }
                      },
                      headers: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                      },
                      rows: {
                        type: "ARRAY",
                        items: {
                          type: "ARRAY",
                          items: { type: "STRING" }
                        }
                      },
                      fields: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            label: { type: "STRING" },
                            type: { type: "STRING", enum: ["text", "number", "date"] },
                            placeholder: { type: "STRING" }
                          },
                          required: ["label", "type"]
                        }
                      },
                      actions: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            label: { type: "STRING" },
                            variant: { type: "STRING", enum: ["primary", "secondary"] }
                          },
                          required: ["label"]
                        }
                      },
                      chartType: { type: "STRING", enum: ["bar", "line", "pie"] }
                    },
                    required: ["title", "type"]
                  }
                }
              },
              required: ["appName", "description", "icon", "color", "layout", "sections"]
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error details:", errorText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error("Empty response from Gemini API");
    }

    const appJson = JSON.parse(generatedText.trim());
    return NextResponse.json(appJson);
  } catch (error) {
    console.error("AI Template generator error:", error);
    return NextResponse.json({ error: "Failed to generate AI template" }, { status: 500 });
  }
}

// Fallback dynamic generator helper
function generateMockApp(prompt: string) {
  const p = prompt.toLowerCase();
  
  if (p.includes("budget") || p.includes("finance") || p.includes("money")) {
    return {
      appName: "Budget Tracker",
      description: "Track monthly expenses, income sources, and savings progress.",
      icon: "DollarSign",
      color: "#00a88f",
      layout: "single-page",
      sections: [
        {
          title: "Financial Summary",
          type: "stats",
          description: "Key indicators for the current monthly cycle.",
          stats: [
            { label: "Total Income", value: "$4,800.00", change: "+12% vs last month" },
            { label: "Total Expenses", value: "$2,150.00", change: "-8% vs target limit" },
            { label: "Net Savings", value: "$2,650.00", change: "+24% streak active" }
          ]
        },
        {
          title: "Monthly Transactions Log",
          type: "table",
          description: "Recent spending entries.",
          headers: ["Date", "Description", "Category", "Amount"],
          rows: [
            ["2026-07-10", "Whole Foods Market", "Groceries", "-$124.50"],
            ["2026-07-09", "Stripe Payout", "Freelance", "+$850.00"],
            ["2026-07-08", "Netflix Subscription", "Entertainment", "-$15.49"],
            ["2026-07-05", "Exxon Fuel", "Automotive", "-$45.00"]
          ]
        },
        {
          title: "Log New Transaction",
          type: "form",
          description: "Record a payment or deposit.",
          fields: [
            { label: "Description Name", type: "text", placeholder: "e.g. Coffee shop" },
            { label: "Amount ($)", type: "number", placeholder: "e.g. 5.50" },
            { label: "Payment Date", type: "date", placeholder: "" }
          ],
          actions: [
            { label: "Add Transaction", variant: "primary" }
          ]
        }
      ]
    };
  }

  if (p.includes("habit") || p.includes("streak") || p.includes("routine")) {
    return {
      appName: "Habit Tracker",
      description: "Track habits, streaks, and weekly routine progress.",
      icon: "Flame",
      color: "#ff6b4a",
      layout: "single-page",
      sections: [
        {
          title: "Consistency Streaks",
          type: "stats",
          description: "Current metrics on active routines.",
          stats: [
            { label: "Read 15 Pages", value: "8 Days", change: "Personal record!" },
            { label: "Workout split", value: "3 Days", change: "Next target tomorrow" },
            { label: "Hydrate (3L)", value: "14 Days", change: "Perfect month" }
          ]
        },
        {
          title: "Daily Focus Checklist",
          type: "checklist",
          description: "Mark off items as you complete them.",
          items: [
            { id: "h1", text: "Read 15 Pages of your book", checked: true },
            { id: "h2", text: "Complete 45 min workout routine", checked: false },
            { id: "h3", text: "No screen time 30 mins before sleep", checked: true },
            { id: "h4", text: "Hydrate 3 Liters of Water", checked: false }
          ]
        }
      ]
    };
  }

  // Default Study Planner fallback
  return {
    appName: "Study Planner",
    description: "Structure exams schedule, reading topics, and homework tasks.",
    icon: "BookOpen",
    color: "#7c5dfa",
    layout: "single-page",
    sections: [
      {
        title: "Study Performance",
        type: "stats",
        description: "Study hours completed this week.",
        stats: [
          { label: "Hours Studied", value: "18.5 hrs", change: "+4.2 hrs vs target" },
          { label: "Topics Mastered", value: "6 of 9", change: "Next exam in 4 days" }
        ]
      },
      {
        title: "Upcoming Exam Dates",
        type: "table",
        description: "Deadlines and schedules.",
        headers: ["Course Subject", "Exam Topic", "Date", "Priority"],
        rows: [
          ["Advanced Mathematics", "Integrals & Derivatives", "2026-07-15", "High"],
          ["Organic Chemistry", "Polymers & Proteins", "2026-07-20", "Medium"],
          ["Modern History", "Post-War Decolonization", "2026-07-28", "Low"]
        ]
      },
      {
        title: "Revision Checklist",
        type: "checklist",
        description: "Keep track of chapters to review.",
        items: [
          { id: "s1", text: "Review chapter 4 math problems", checked: false },
          { id: "s2", text: "Chemistry laboratory practice", checked: true },
          { id: "s3", text: "Outline history essay questions draft", checked: false }
        ]
      }
    ]
  };
}

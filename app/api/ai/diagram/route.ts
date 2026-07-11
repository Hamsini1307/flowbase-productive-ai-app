import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, type } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // If no API key is configured, generate a mock fallback diagram based on the prompt
    if (!apiKey || apiKey.startsWith("AQ.placeholder") || apiKey === "placeholder") {
      console.warn("Using fallback mock diagram generator (no Gemini API Key configured)");
      const mockResult = generateMockDiagram(prompt, type || "flowchart");
      return NextResponse.json(mockResult);
    }

    const systemPrompt = `You are an expert diagram generator. Create a structured '${type || "flowchart"}' diagram matching the user's description: "${prompt}".
Lay out the nodes in a clean, readable layout (e.g., flow from top-to-bottom or left-to-right, separate nodes by 150-250px so they do not overlap, decisions should branch out).
For rectangles, use 160 width and 60 height.
For diamonds, use 120 width and 80 height.
For ellipses, use 120 width and 60 height.
Return a valid JSON object matching the requested schema.`;

    try {
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
                  nodes: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        id: { type: "STRING" },
                        type: { type: "STRING", enum: ["rectangle", "diamond", "ellipse"] },
                        text: { type: "STRING" },
                        x: { type: "INTEGER" },
                        y: { type: "INTEGER" },
                        width: { type: "INTEGER" },
                        height: { type: "INTEGER" }
                      },
                      required: ["id", "type", "text", "x", "y"]
                    }
                  },
                  edges: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        from: { type: "STRING" },
                        to: { type: "STRING" },
                        text: { type: "STRING" }
                      },
                      required: ["from", "to"]
                    }
                  }
                },
                required: ["nodes", "edges"]
              }
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const rawResult = await response.json();
      const contentText = rawResult?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!contentText) {
        throw new Error("Empty response from Gemini model");
      }

      const diagramData = JSON.parse(contentText);
      return NextResponse.json(diagramData);
    } catch (apiError) {
      console.error("Gemini diagram API error, falling back:", apiError);
      return NextResponse.json(generateMockDiagram(prompt, type || "flowchart"));
    }
  } catch (error) {
    console.error("AI Diagram error:", error);
    return NextResponse.json({ error: "Failed to generate AI diagram" }, { status: 500 });
  }
}

// Fallback Mock Diagram Generator for offline/unconfigured environments
function generateMockDiagram(prompt: string, type: string) {
  const normalizedType = type.toLowerCase();
  
  if (normalizedType === "mindmap") {
    return {
      nodes: [
        { id: "n0", type: "ellipse", text: prompt.substring(0, 20), x: 400, y: 300, width: 140, height: 70 },
        { id: "n1", type: "rectangle", text: "Key Idea 1", x: 200, y: 180, width: 140, height: 60 },
        { id: "n2", type: "rectangle", text: "Key Idea 2", x: 600, y: 180, width: 140, height: 60 },
        { id: "n3", type: "rectangle", text: "Resources", x: 200, y: 420, width: 140, height: 60 },
        { id: "n4", type: "rectangle", text: "Timeline", x: 600, y: 420, width: 140, height: 60 }
      ],
      edges: [
        { from: "n0", to: "n1", text: "Branch" },
        { from: "n0", to: "n2", text: "Branch" },
        { from: "n0", to: "n3", text: "Support" },
        { from: "n0", to: "n4", text: "Plan" }
      ]
    };
  }

  // Default flowcharts
  return {
    nodes: [
      { id: "n0", type: "ellipse", text: "Start: " + prompt.substring(0, 20), x: 300, y: 100, width: 160, height: 60 },
      { id: "n1", type: "rectangle", text: "Analyze Prompt Details", x: 300, y: 220, width: 160, height: 60 },
      { id: "n2", type: "diamond", text: "Is Complex?", x: 320, y: 340, width: 120, height: 80 },
      { id: "n3", type: "rectangle", text: "Run Simple Flow", x: 150, y: 480, width: 160, height: 60 },
      { id: "n4", type: "rectangle", text: "Run Advanced Flow", x: 450, y: 480, width: 160, height: 60 },
      { id: "n5", type: "ellipse", text: "Complete Process", x: 300, y: 620, width: 160, height: 60 }
    ],
    edges: [
      { from: "n0", to: "n1" },
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3", text: "No" },
      { from: "n2", to: "n4", text: "Yes" },
      { from: "n3", to: "n5" },
      { from: "n4", to: "n5" }
    ]
  };
}

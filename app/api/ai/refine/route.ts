import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text, option, tone } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    let refinedText = text;

    switch (option) {
      case "grammar":
        refinedText = refineGrammar(text);
        break;
      case "rephrase":
        refinedText = rephraseText(text);
        break;
      case "shorter":
        refinedText = makeShorter(text);
        break;
      case "longer":
        refinedText = makeLonger(text);
        break;
      case "simplify":
        refinedText = simplifyLanguage(text);
        break;
      case "tone":
        refinedText = changeTone(text, tone);
        break;
      default:
        break;
    }

    // Add a small artificial delay (e.g. 700ms) to simulate AI processing time!
    await new Promise((resolve) => setTimeout(resolve, 700));

    return NextResponse.json({ text: refinedText });
  } catch (error) {
    console.error("AI Refine error:", error);
    return NextResponse.json({ error: "Failed to refine text" }, { status: 500 });
  }
}

function refineGrammar(t: string): string {
  let s = t.trim();
  if (s.length > 0) {
    s = s.charAt(0).toUpperCase() + s.slice(1);
    if (!/[.!?]$/.test(s)) {
      s += ".";
    }
  }
  return s.replace(/\s+/g, " ").replace(/\s*,\s*/g, ", ").replace(/\s*\.\s*/g, ". ");
}

function rephraseText(t: string): string {
  const phrases = [
    { from: "i want to", to: "I intend to" },
    { from: "need to", to: "it is necessary to" },
    { from: "help me", to: "assist me in" },
    { from: "make it", to: "develop a" },
  ];
  let s = t;
  phrases.forEach(({ from, to }) => {
    s = s.replace(new RegExp(from, "gi"), to);
  });
  if (s === t) {
    return `In other words, we can state: ${t.trim()}`;
  }
  return s;
}

function makeShorter(t: string): string {
  const sentences = t.split(/[.!?]/).filter(Boolean);
  if (sentences.length > 1) {
    return sentences[0].trim() + ".";
  }
  return t.length > 40 ? t.substring(0, 40) + "..." : t;
}

function makeLonger(t: string): string {
  return `${t.trim()} Additionally, we will need to carefully monitor the key results and integrate stakeholder feedback as we progress. This is vital to achieving our milestones.`;
}

function simplifyLanguage(t: string): string {
  const simplifications = [
    { complex: "utilize", simple: "use" },
    { complex: "facilitate", simple: "help" },
    { complex: "subsequent", simple: "next" },
    { complex: "terminate", simple: "end" },
  ];
  let s = t;
  simplifications.forEach(({ complex, simple }) => {
    s = s.replace(new RegExp(complex, "gi"), simple);
  });
  return s;
}

function changeTone(t: string, tone?: string): string {
  const selectedTone = tone || "professional";
  if (selectedTone === "professional") {
    return `Dear team, I am writing to outline the following: ${t.trim()}. Let's coordinate to align our efforts accordingly.`;
  } else if (selectedTone === "casual") {
    return `Hey guys, just wanted to share: ${t.trim()}. Let's get it done!`;
  } else if (selectedTone === "witty" || selectedTone === "creative") {
    return `Behold the master plan: ${t.trim()}. Let the magic happen! ✨`;
  }
  return t;
}

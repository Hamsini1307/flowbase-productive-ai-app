import * as React from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

const SUGGESTIONS = [
  { text: "Create a task for tomorrow", icon: Icons.FileText },
  { text: "Add meeting reminder on calendar", icon: Icons.Calendar },
  { text: "Summarize my notes", icon: Icons.PenTool },
  { text: "Create a Kanban board", icon: Icons.Trello },
  { text: "Plan my week", icon: Icons.Compass },
  { text: "Generate a habit tracker template", icon: Icons.CheckSquare }
];

const RATE = 24000;

export function AiAssistantPage({
  sharedMessages,
  onMessagesChange,
  refreshTasks,
  boards = [],
  tasks = []
}: {
  sharedMessages?: Message[];
  onMessagesChange?: React.Dispatch<React.SetStateAction<Message[]>>;
  refreshTasks?: () => Promise<void>;
  boards?: any[];
  tasks?: any[];
} = {}) {
  const [localMessages, setLocalMessages] = React.useState<Message[]>([]);
  const messages = sharedMessages !== undefined ? sharedMessages : localMessages;
  const setMessages = onMessagesChange !== undefined ? onMessagesChange : setLocalMessages;
  
  const [inputVal, setInputVal] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<any | null>(null);
  const [notesCount, setNotesCount] = React.useState(0);
  
  // Voice Agent State
  const [voiceActive, setVoiceActive] = React.useState(false);
  const [voiceStatus, setVoiceStatus] = React.useState("Disconnected");
  const [agentTranscript, setAgentTranscript] = React.useState("");
  const [userTranscript, setUserTranscript] = React.useState("");

  // Refs for audio playback and socket
  const wsRef = React.useRef<WebSocket | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const playheadRef = React.useRef<number>(0);
  const audioSourcesRef = React.useRef<Set<AudioBufferSourceNode>>(new Set());
  const chatEndRef = React.useRef<HTMLDivElement | null>(null);

  // Fetch actual notes count from DB
  React.useEffect(() => {
    async function fetchNotesCount() {
      try {
        const res = await fetch("/api/notes");
        if (res.ok) {
          const data = await res.json();
          setNotesCount(data.notes?.length || 0);
        }
      } catch (e) {
        console.error(e);
      }
    }
    void fetchNotesCount();
  }, [messages]);

  // Auto scroll to bottom
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentTranscript, userTranscript, pendingAction]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `msg-${Math.random().toString(36).substring(2, 9)}`,
      sender: "user",
      content: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);
    setPendingAction(null);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.content
          }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        const aiMsg: Message = {
          id: `msg-${Math.random().toString(36).substring(2, 9)}`,
          sender: "ai",
          content: data.reply || "I have completed that action for you.",
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Capture draft action requiring confirmation
        if (data.pendingConfirmation && data.action) {
          setPendingAction(data.action);
        }
      } else {
        throw new Error("Assistant response failed");
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err`,
          sender: "ai",
          content: "Sorry, I encountered an error while compiling your command.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    setLoading(true);
    const actionToConfirm = pendingAction;
    setPendingAction(null);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          confirmed: true,
          action: actionToConfirm
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Math.random().toString(36).substring(2, 9)}`,
            sender: "ai",
            content: data.reply || "Action confirmed and executed successfully.",
            timestamp: new Date()
          }
        ]);
        if (refreshTasks) {
          void refreshTasks();
        }
      } else {
        throw new Error("Failed to execute confirmed action");
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: "ai",
          content: "Sorry, there was an issue executing that action on the server.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAction = () => {
    setPendingAction(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-cancel-${Date.now()}`,
        sender: "ai",
        content: "Action cancelled. Let me know if you want to try something else!",
        timestamp: new Date()
      }
    ]);
  };

  const handleClearChat = () => {
    setMessages([]);
    setPendingAction(null);
    stopVoiceSession();
  };

  const executeVoiceAction = async (toolCallId: string, name: string, params: any, ws: WebSocket) => {
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          confirmed: true,
          action: {
            type: name,
            params
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `voice-tool-${Date.now()}`,
            sender: "ai",
            content: `[Voice Action Executed] ${data.reply}`,
            timestamp: new Date()
          }
        ]);

        if (refreshTasks) {
          void refreshTasks();
        }

        ws.send(JSON.stringify({
          type: "tool.result",
          tool_call_id: toolCallId,
          result: JSON.stringify({ success: true, message: data.reply })
        }));
      } else {
        throw new Error("Failed to execute voice tool write");
      }
    } catch (err: any) {
      console.error("Voice tool execution failed:", err);
      ws.send(JSON.stringify({
        type: "tool.result",
        tool_call_id: toolCallId,
        result: JSON.stringify({ success: false, error: err.message || "Failed to execute" })
      }));
    }
  };

  // Helper to stop voice recording/agent
  const stopVoiceSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    audioSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {}
    });
    audioSourcesRef.current.clear();

    setVoiceActive(false);
    setVoiceStatus("Disconnected");
    setAgentTranscript("");
    setUserTranscript("");
  };

  // Play audio buffer chunk from base64 string
  const playAudioChunk = (ctx: AudioContext, b64: string) => {
    try {
      const raw = atob(b64);
      const pcm = new Int16Array(raw.length / 2);
      for (let i = 0; i < pcm.length; i++) {
        pcm[i] = raw.charCodeAt(2 * i) | (raw.charCodeAt(2 * i + 1) << 8);
      }

      const buf = ctx.createBuffer(1, pcm.length, RATE);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < pcm.length; i++) {
        ch[i] = pcm[i] / 32768;
      }

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);

      const at = Math.max(ctx.currentTime, playheadRef.current);
      src.start(at);
      playheadRef.current = at + buf.duration;

      audioSourcesRef.current.add(src);
      src.onended = () => {
        audioSourcesRef.current.delete(src);
      };
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  const flushAudioSources = (ctx: AudioContext) => {
    audioSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {}
    });
    audioSourcesRef.current.clear();
    playheadRef.current = ctx.currentTime;
  };

  // Start Voice Session
  const startVoiceSession = async () => {
    try {
      setVoiceActive(true);
      setVoiceStatus("Connecting...");

      // 1. Get Agent configs and token securely
      const agentRes = await fetch("/api/assemblyai/agent");
      if (!agentRes.ok) {
        throw new Error("Failed to fetch Voice Agent auth");
      }
      const { agentId, token } = await agentRes.json();

      // 2. Access microphone stream first
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      mediaStreamRef.current = stream;

      // 3. Initialize browser AudioContext and verify execution context is resumed
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: RATE });
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      // Create PCM capture worklet processor blob
      const capBlob = `class P extends AudioWorkletProcessor{process(i){const c=i[0][0];
        if(c){const b=new Int16Array(c.length);for(let n=0;n<c.length;n++)
        b[n]=Math.max(-1,Math.min(1,c[n]))*32767;this.port.postMessage(b.buffer,[b.buffer]);}
        return true;}}registerProcessor("cap",P);`;
      
      await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([capBlob], { type: "text/javascript" })));
      
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      const node = new AudioWorkletNode(ctx, "cap");
      ctx.createMediaStreamSource(stream).connect(node);

      // 3. Connect WebSocket to AssemblyAI agent
      const url = new URL("wss://agents.assemblyai.com/v1/ws");
      url.searchParams.set("token", token);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      let ready = false;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: "session.update",
          session: {
            agent_id: agentId,
            tools: [
              {
                name: "create_kanban_task",
                description: "Create a new task on the Kanban board. Parameters: title (string, required), priority (string, 'Low' | 'Medium' | 'High'), dueDate (string, YYYY-MM-DD).",
                parameters: {
                  type: "object",
                  properties: {
                    title: { "type": "string", "description": "The title of the task" },
                    priority: { "type": "string", "enum": ["Low", "Medium", "High"] },
                    dueDate: { "type": "string", "format": "date" }
                  },
                  required: ["title"]
                }
              },
              {
                name: "create_kanban_board",
                description: "Create a new Kanban board. Parameters: name (string, required), color (string, hex color code).",
                parameters: {
                  type: "object",
                  properties: {
                    name: { "type": "string" },
                    color: { "type": "string" }
                  },
                  required: ["name"]
                }
              },
              {
                name: "create_calendar_event",
                description: "Schedule a new event on the calendar. Parameters: title (string, required), date (string, YYYY-MM-DD), time (string, HH:MM).",
                parameters: {
                  type: "object",
                  properties: {
                    title: { "type": "string" },
                    date: { "type": "string" },
                    time: { "type": "string" }
                  },
                  required: ["title", "date"]
                }
              },
              {
                name: "create_note",
                description: "Create a new text note. Parameters: title (string, required), content (string, required).",
                parameters: {
                  type: "object",
                  properties: {
                    title: { "type": "string" },
                    content: { "type": "string" }
                  },
                  required: ["title"]
                }
              }
            ]
          }
        }));
      };

      node.port.onmessage = (e) => {
        if (!ready || ws.readyState !== 1) return;
        const b = new Uint8Array(e.data);
        let s = "";
        for (let i = 0; i < b.length; i++) {
          s += String.fromCharCode(b[i]);
        }
        ws.send(JSON.stringify({ type: "input.audio", audio: btoa(s) }));
      };

      ws.onmessage = ({ data }) => {
        const m = JSON.parse(data);
        if (m.type === "session.ready") {
          ready = true;
          playheadRef.current = ctx.currentTime;
          setVoiceStatus("Listening... start talking!");
        } else if (m.type === "input.speech.started") {
          flushAudioSources(ctx);
          setUserTranscript("");
        } else if (m.type === "reply.audio") {
          playAudioChunk(ctx, m.data);
        } else if (m.type === "transcript.user") {
          setUserTranscript(m.text);
        } else if (m.type === "transcript.agent") {
          setAgentTranscript(m.text);
        } else if (m.type === "tool.call") {
          const { tool_call_id, function: func } = m;
          const { name, arguments: args } = func;
          let parsedArgs = {};
          try {
            parsedArgs = typeof args === "string" ? JSON.parse(args) : args;
          } catch (e) {
            console.error("Failed to parse tool arguments:", e);
          }
          void executeVoiceAction(tool_call_id, name, parsedArgs, ws);
        } else if (m.type === "reply.completed") {
          if (m.text) {
            setMessages((prev) => [
              ...prev,
              {
                id: `voice-agent-${Date.now()}`,
                sender: "ai",
                content: m.text,
                timestamp: new Date(),
                isVoice: true
              }
            ]);
            setAgentTranscript("");
          }
        } else if (m.type === "error" || m.type === "session.error") {
          setVoiceStatus(`Error: ${m.message || "Connection issue"}`);
          setTimeout(stopVoiceSession, 3000);
        }
      };

      ws.onclose = () => {
        stopVoiceSession();
      };
    } catch (err: any) {
      console.error("Voice Agent connection error:", err);
      setVoiceStatus(`Failed to access Mic: ${err.message}`);
      setVoiceActive(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage(inputVal);
    }
  };

  React.useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, []);

  const boardsCount = boards.length;
  const calendarCount = tasks.filter((t: any) => t.dueDate || t.syncCalendar).length;

  return (
    <div className="flex flex-col h-[calc(100vh-4.1rem)] bg-[#faf8f5] font-sans overflow-hidden">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#e6e2db] bg-[#faf8f5]">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-[#f0ede6] flex items-center justify-center text-[#ff6b4a] border border-[#e1ded7]">
            <Icons.Bot className="size-4.5" />
          </div>
          <div>
            <h1 className="text-xs font-black text-gray-900 uppercase tracking-wider">AI Assistant</h1>
            <p className="text-[10px] text-gray-400 font-bold">Central Command Workspace Agent</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {voiceActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 animate-pulse">
              <span className="size-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Live Voice Agent</span>
            </div>
          )}

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e1ded7] bg-white text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm select-none"
            >
              <Icons.Plus className="size-3.5 text-[#ff6b4a]" />
              <span>New Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Main viewport */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 [scrollbar-width:thin]">
        {messages.length === 0 && !voiceActive ? (
          /* Empty Cozy State matches YouTube Screenshot exactly */
          <div className="max-w-3xl mx-auto pt-6 pb-12 space-y-8 text-center">
            
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Chat, plan, and act across your workspace.
              </h2>

              {/* Bot icon styled exactly like screenshot */}
              <div className="size-14 rounded-2xl bg-[#ff6b4a] flex items-center justify-center text-white shadow-sm mx-auto animate-scaleUp">
                <Icons.Bot className="size-7" />
              </div>

              <h3 className="text-base font-bold text-gray-900 mt-2">AI Assistant</h3>
              
              <p className="text-xs text-gray-500 max-w-lg mx-auto font-semibold leading-relaxed">
                Ask questions, plan your day, and prepare actions for your tasks, calendar, notes, whiteboards, and generated apps.
              </p>
            </div>

            {/* Grid of suggestion cards */}
            <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3 max-w-3xl mx-auto mt-6">
              {SUGGESTIONS.map((sug, sIdx) => {
                const IconComponent = sug.icon;
                return (
                  <div
                    key={sIdx}
                    onClick={() => handleSendMessage(sug.text)}
                    className="group flex items-center gap-3.5 rounded-xl border border-[#e1ded7] p-3.5 bg-white hover:border-[#ff6b4a] hover:shadow-sm transition cursor-pointer text-left"
                  >
                    <div className="size-8 rounded-lg bg-[#fff0ed] flex items-center justify-center text-[#ff6b4a] border border-[#ffe0db] shrink-0">
                      <IconComponent className="size-4" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-800 leading-snug group-hover:text-[#ff6b4a] transition">
                      {sug.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Real-Time Count Indicators styled exactly like screenshot */}
            <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400 font-bold max-w-xl mx-auto pt-4">
              <span>{boardsCount} boards</span>
              <span className="w-8 h-px bg-gray-200" />
              <span>{notesCount} notes</span>
              <span className="w-8 h-px bg-gray-200" />
              <span>{calendarCount} calendar items</span>
            </div>
          </div>
        ) : (
          /* Chat Feed */
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-start gap-3",
                  m.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                {m.sender === "ai" && (
                  <div className="size-8 rounded-full bg-[#f0ede6] flex items-center justify-center text-[#ff6b4a] border border-[#e1ded7] shrink-0">
                    <Icons.Bot className="size-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-xl rounded-2xl px-4 py-3 text-xs leading-relaxed font-semibold shadow-sm border",
                    m.sender === "user"
                      ? "bg-[#00a88f] border-[#00a88f]/10 text-white rounded-tr-none"
                      : "bg-white border-[#e1ded7] text-gray-800 rounded-tl-none text-left"
                  )}
                >
                  {m.content}
                  {m.isVoice && (
                    <span className="flex items-center gap-1 mt-1 text-[9px] opacity-75 font-bold uppercase tracking-wider">
                      <Icons.Mic className="size-3" /> Voice Response
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Live Interactive Action Confirmation Card */}
            {pendingAction && (
              <div className="flex flex-col border border-[#ff6b4a]/30 rounded-2xl p-5 bg-[#fff8f7] max-w-xl mx-auto space-y-4 shadow-sm animate-scaleUp text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-[#ff6b4a]">
                  <Icons.Sparkles className="size-4" />
                  <span>Draft Action Ready</span>
                </div>
                
                <div className="space-y-2.5 text-xs font-semibold text-gray-700 bg-white border border-[#e1ded7] p-4 rounded-xl">
                  <p className="font-black text-gray-900 border-b border-gray-100 pb-1.5 uppercase tracking-wide text-[10px]">
                    Action: {pendingAction.type.replace(/_/g, " ")}
                  </p>
                  {Object.entries(pendingAction.params || {}).map(([key, val]) => (
                    <div key={key} className="flex justify-between gap-4">
                      <span className="text-gray-400 capitalize">{key}:</span>
                      <span className="text-gray-800 text-right">{String(val)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2.5 justify-end">
                  <button
                    onClick={handleCancelAction}
                    className="h-8 px-4 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:text-gray-850 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    disabled={loading}
                    className="h-8 px-4 rounded-lg bg-[#ff6b4a] text-white text-xs font-bold hover:bg-[#ef5d3d] shadow transition flex items-center gap-1.5"
                  >
                    {loading && <Icons.Loader2 className="size-3 animate-spin" />}
                    Confirm Action
                  </button>
                </div>
              </div>
            )}

            {/* Voice stream active UI */}
            {voiceActive && (
              <div className="flex flex-col items-center justify-center p-8 bg-white border border-dashed border-[#e1ded7] rounded-2xl max-w-xl mx-auto space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1 justify-center items-center h-8">
                    <div className="w-1 bg-[#ff6b4a] h-3 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-1 bg-[#ff6b4a] h-6 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <div className="w-1 bg-[#ff6b4a] h-4 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                    <div className="w-1 bg-[#ff6b4a] h-7 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                    <div className="w-1 bg-[#ff6b4a] h-3 rounded-full animate-bounce" style={{ animationDelay: "0.5s" }} />
                  </div>
                  <span className="text-xs font-black text-gray-700">{voiceStatus}</span>
                </div>

                {userTranscript && (
                  <p className="text-xs font-bold text-gray-500 italic max-w-md text-center">
                    User: "{userTranscript}"
                  </p>
                )}

                {agentTranscript && (
                  <div className="flex items-start gap-2 bg-[#faf8f5] border border-[#e1ded7] p-3 rounded-xl shadow-sm text-left max-w-md w-full">
                    <Icons.Volume2 className="size-4 text-[#ff6b4a] shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                      {agentTranscript}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Typing Loader */}
            {loading && (
              <div className="flex items-start gap-3 justify-start max-w-3xl mx-auto">
                <div className="size-8 rounded-full bg-[#f0ede6] flex items-center justify-center text-[#ff6b4a] border border-[#e1ded7] shrink-0">
                  <Icons.Bot className="size-4" />
                </div>
                <div className="bg-white border border-[#e1ded7] rounded-2xl rounded-tl-none px-4 py-3.5 flex items-center gap-1.5 shadow-sm">
                  <div className="size-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                  <div className="size-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <div className="size-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Floating Input Panel at bottom matches YouTube Screenshot exactly */}
      <footer className="p-4 bg-transparent max-w-3xl w-full mx-auto space-y-2">
        <div className="bg-white border border-[#e6e2db] rounded-xl p-3 shadow-md focus-within:border-[#ff6b4a] transition-all">
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={voiceActive ? "Voice session active... speak into your microphone" : "Ask Flowbase AI to plan, summarize, or prepare an action..."}
            rows={1}
            disabled={voiceActive}
            className="w-full bg-transparent max-h-32 min-h-[44px] text-xs font-semibold text-gray-800 py-1.5 px-0.5 outline-none resize-none disabled:opacity-50 leading-relaxed font-sans"
          />

          <div className="flex items-center justify-between border-t border-[#f0ede6] pt-2.5 mt-1.5">
            {/* Warning caution text on the left */}
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold select-none">
              <Icons.AlertTriangle className="size-3 text-[#ff6b4a]" />
              <span>Actions require confirmation before saving.</span>
            </div>

            {/* Talk and Send Buttons on the right */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={voiceActive ? stopVoiceSession : startVoiceSession}
                className={cn(
                  "h-8 px-3 flex items-center justify-center gap-1.5 rounded-lg border text-xs font-bold transition select-none shadow-sm",
                  voiceActive
                    ? "bg-red-500 border-red-500 text-white hover:bg-red-650"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                )}
                title={voiceActive ? "Stop Voice Agent" : "Start Voice Agent Session"}
              >
                <Icons.Mic className={cn("size-3.5", voiceActive && "animate-pulse")} />
                <span>{voiceActive ? "Stop" : "Talk"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendMessage(inputVal)}
                disabled={loading || !inputVal.trim() || voiceActive}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#ff6b4a] text-white hover:bg-[#ef5d3d] transition disabled:opacity-50 shadow-sm shrink-0"
              >
                <Icons.SendHorizontal className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Enter sends note below the box */}
        <p className="text-[10px] text-gray-400 font-semibold text-center select-none">
          Enter sends. Shift+Enter adds a new line.
        </p>
      </footer>
    </div>
  );
}

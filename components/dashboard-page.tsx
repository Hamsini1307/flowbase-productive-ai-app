import * as React from "react";
import * as Icons from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

interface DashboardPageProps {
  boards: any[];
  tasks: any[];
  setActivePage: (page: string) => void;
  setActiveBoardId?: (id: string) => void;
  refreshTasks?: () => Promise<void>;
  refreshData?: () => Promise<void>;
  sharedMessages?: Message[];
}

export function DashboardPage({
  boards = [],
  tasks = [],
  setActivePage,
  setActiveBoardId,
  refreshTasks,
  refreshData,
  sharedMessages = []
}: DashboardPageProps) {
  const { user } = useUser();
  const [notes, setNotes] = React.useState<any[]>([]);
  const [whiteboards, setWhiteboards] = React.useState<any[]>([]);
  const [aiApps, setAiApps] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Format active user name
   const { user: currentUser } = useUser();
 const userName = currentUser?.firstName || "there";

  // Helper to format today's key (YYYY-MM-DD)
  const todayKey = React.useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Fetch Notes, Whiteboards, and AI Apps in parallel on mount
  const loadDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [notesRes, whiteboardsRes, appsRes] = await Promise.all([
        fetch("/api/notes"),
        fetch("/api/whiteboards"),
        fetch("/api/ai-apps")
      ]);

      if (!notesRes.ok || !whiteboardsRes.ok || !appsRes.ok) {
        throw new Error("Failed to load workspace data");
      }

      const [notesData, whiteboardsData, appsData] = await Promise.all([
        notesRes.json(),
        whiteboardsRes.json(),
        appsRes.json()
      ]);

      setNotes(notesData.notes || []);
      setWhiteboards(whiteboardsData.whiteboards || []);
      setAiApps(appsData.apps || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  // Check if a task is completed based on its column name or board metadata
  const isTaskCompleted = React.useCallback((task: any) => {
    if (!task.boardId || !task.columnId) return false;
    const parentBoard = boards.find(b => b.id === task.boardId);
    if (!parentBoard || !parentBoard.columns) return false;
    const taskColumn = parentBoard.columns.find((c: any) => c.id === task.columnId);
    if (!taskColumn) return false;
    
    const colTitle = (taskColumn.title || "").toLowerCase();
    const isDoneCol = colTitle.includes("done") || colTitle.includes("completed") || colTitle.includes("finished");
    
    // Fallback: If it's the last column in the board, treat as completed
    const lastCol = parentBoard.columns[parentBoard.columns.length - 1];
    return isDoneCol || lastCol?.id === task.columnId;
  }, [boards]);

  // Task Statistics Calculation
  const totalTasks = tasks.length;
  const completedTasks = React.useMemo(() => tasks.filter(t => isTaskCompleted(t)).length, [tasks, isTaskCompleted]);
  const pendingTasks = totalTasks - completedTasks;
  
  const overdueTasks = React.useMemo(() => {
    return tasks.filter(t => t.dueDate && t.dueDate < todayKey && !isTaskCompleted(t)).length;
  }, [tasks, todayKey, isTaskCompleted]);

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Upcoming Calendar items
  const upcomingEvents = React.useMemo(() => {
    return tasks
      .filter(t => t.dueDate && t.dueDate >= todayKey)
      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
      .slice(0, 5);
  }, [tasks, todayKey]);

  // Active workspace calculation
  const activeWorkspaceInfo = React.useMemo(() => {
    const counts = [
      { name: "Calendar", count: upcomingEvents.length },
      { name: "Kanban Boards", count: boards.length },
      { name: "Notes", count: notes.length },
      { name: "Whiteboards", count: whiteboards.length }
    ];
    counts.sort((a, b) => b.count - a.count);
    return counts[0];
  }, [boards, notes, whiteboards, upcomingEvents]);

  // Combined Recent Activity Feed from Database items
  const recentActivities = React.useMemo(() => {
    const items: Array<{ id: string; type: string; title: string; action: string; time: Date }> = [];
    
    notes.forEach(n => {
      items.push({
        id: n.id,
        type: "note",
        title: n.title,
        action: `Updated note`,
        time: new Date(n.updatedAt || n.createdAt || Date.now())
      });
    });

    whiteboards.forEach(w => {
      items.push({
        id: w.id,
        type: "whiteboard",
        title: w.name,
        action: `Updated whiteboard`,
        time: new Date(w.updatedAt || w.createdAt || Date.now())
      });
    });

    tasks.forEach(t => {
      items.push({
        id: t.id,
        type: "task",
        title: t.title,
        action: `Created calendar task`,
        time: new Date(t.createdAt || Date.now())
      });
    });

    aiApps.forEach(app => {
      items.push({
        id: app.id,
        type: "app",
        title: app.name,
        action: `Generated AI template`,
        time: new Date(app.createdAt || Date.now())
      });
    });

    if (sharedMessages.length > 0) {
      items.push({
        id: "ai-assistant-actions",
        type: "ai",
        title: `${sharedMessages.length} AI actions`,
        action: `AI assistant activity`,
        time: sharedMessages[sharedMessages.length - 1].timestamp
      });
    }

    return items.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 6);
  }, [notes, whiteboards, tasks, aiApps, sharedMessages]);

  // Dynamic Recent Pages (left column at bottom)
  const recentPages = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      type: "board" | "note" | "whiteboard" | "app";
      badge: string;
      color: string;
      subtext: string;
      time: Date;
    }> = [];

    boards.forEach(b => {
      const boardTasks = tasks.filter(t => t.boardId === b.id);
      list.push({
        id: b.id,
        title: b.name,
        type: "board",
        badge: "Kanban board",
        color: "#ffd166",
        subtext: `${boardTasks.length} task${boardTasks.length !== 1 ? "s" : ""}`,
        time: new Date(b.createdAt || Date.now())
      });
    });

    notes.forEach(n => {
      const cleanText = n.content.replace(/<[^>]*>/g, " ").trim();
      const words = cleanText.split(/\s+/).filter((w: string) => w.length > 0);
      list.push({
        id: n.id,
        title: n.title,
        type: "note",
        badge: "Note",
        color: "#55c7f5",
        subtext: `${words.length} word${words.length !== 1 ? "s" : ""}`,
        time: new Date(n.updatedAt || n.createdAt || Date.now())
      });
    });

    whiteboards.forEach(w => {
      list.push({
        id: w.id,
        title: w.name,
        type: "whiteboard",
        badge: "Whiteboard",
        color: "#ff8ab3",
        subtext: "Visual workspace",
        time: new Date(w.updatedAt || w.createdAt || Date.now())
      });
    });

    aiApps.forEach(app => {
      list.push({
        id: app.id,
        title: app.name,
        type: "app",
        badge: "AI template",
        color: "#ff6b4a",
        subtext: app.description || "Daily habit tracking",
        time: new Date(app.createdAt || Date.now())
      });
    });

    return list.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 7);
  }, [boards, notes, whiteboards, aiApps, tasks]);

  // Page click navigation helper
  const handlePageClick = (page: typeof recentPages[number]) => {
    if (page.type === "board") {
      if (setActiveBoardId) {
        setActiveBoardId(page.id);
      }
      setActivePage("Task / Kanban");
    } else if (page.type === "note") {
      setActivePage("Notes");
    } else if (page.type === "whiteboard") {
      setActivePage("Whiteboard");
    } else if (page.type === "app") {
      setActivePage("AI Template Builder");
    }
  };

  // Dynamic AI Insights list matching visual design and number box values
  const aiInsightsList = React.useMemo(() => {
    const todayReminders = tasks.filter(t => t.dueDate === todayKey).length;
    const highPriorityPending = tasks.find(t => t.priority === "High" && !isTaskCompleted(t));

    return [
      `You have ${overdueTasks} overdue task${overdueTasks !== 1 ? "s" : ""}.`,
      `Your most active workspace is ${activeWorkspaceInfo.name}.`,
      `You completed ${progressPercentage}% of tracked tasks.`,
      todayReminders > 0 
        ? `You have ${todayReminders} reminders scheduled for today.`
        : "No reminders scheduled for today.",
      overdueTasks > 0
        ? "Suggested focus: finish overdue work before adding new tasks."
        : highPriorityPending
        ? `Suggested focus: finish high-priority task "${highPriorityPending.title}".`
        : "Suggested focus: map out your upcoming targets inside Calendar."
    ];
  }, [overdueTasks, activeWorkspaceInfo, progressPercentage, tasks, todayKey, isTaskCompleted]);

  // Quick Action triggers
  const handleQuickCreateNote = async () => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Note",
          content: "",
          icon: "📝",
          color: "#ff6b4a"
        })
      });
      if (res.ok) {
        setActivePage("Notes");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickCreateWhiteboard = async () => {
    try {
      const res = await fetch("/api/whiteboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Untitled Canvas",
          elements: [],
          appState: {},
          color: "#00a88f"
        })
      });
      if (res.ok) {
        setActivePage("Whiteboard");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Updated just now";
    if (diffMins < 60) return `Updated ${diffMins}m ago`;
    if (diffHours < 24) return `Updated ${diffHours}h ago`;
    
    return `Updated ${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Icons.Loader2 className="size-8 text-[#ff6b4a] animate-spin" />
        <p className="text-xs font-semibold text-gray-500">Loading your workspace metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-4">
        <Icons.AlertCircle className="size-10 text-red-500" />
        <h3 className="text-sm font-bold text-gray-800">Failed to Load Dashboard</h3>
        <p className="text-xs text-gray-500 max-w-sm">{error}</p>
        <button
          onClick={() => void loadDashboardData()}
          className="h-8 px-4 rounded-lg bg-[#ff6b4a] text-white text-xs font-bold hover:bg-[#ef5d3d]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#faf8f5] overflow-y-auto h-[calc(100vh-4.1rem)] [scrollbar-width:thin] text-left">
      
      {/* Header bar matches YouTube screenshot exactly */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6e2db] pb-4">
        <div>
          <span className="text-[10px] font-black text-[#ff6b4a] uppercase tracking-wider flex items-center gap-1">
            <Icons.LayoutDashboard className="size-3" />
            <span>Dashboard</span>
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-1 tracking-tight">
            Welcome back, {userName}.
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            A live overview of your tasks, schedule, notes, whiteboards, and AI-powered work.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePage("Calendar")}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[#e1ded7] bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm select-none"
          >
            <Icons.Calendar className="size-4 text-gray-400" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setActivePage("Task / Kanban")}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#ff6b4a] hover:bg-[#ef5d3d] text-white text-xs font-bold transition shadow-sm select-none"
          >
            <Icons.Plus className="size-4" />
            <span>New task</span>
          </button>
        </div>
      </div>

      {/* Feature active cards grid matches screenshot 1 & 2 exactly */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* Calendar Card */}
        <div
          onClick={() => setActivePage("Calendar")}
          className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm hover:border-[#00a88f] transition cursor-pointer flex flex-col justify-between h-[130px]"
        >
          <div className="flex justify-between items-start">
            <div className="size-8 rounded-lg bg-[#e8f6ef] flex items-center justify-center text-[#00a88f] border border-[#d2edd6]">
              <Icons.Calendar className="size-4.5" />
            </div>
            <span className="text-[8px] font-black bg-[#e8f6ef] text-[#00a88f] px-2 py-0.5 rounded-md uppercase">Active</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400">Calendar</span>
            <h3 className="text-sm font-black text-gray-900 mt-0.5">{upcomingEvents.length} upcoming items</h3>
            <p className="text-[9px] font-bold text-gray-400 mt-0.5">{tasks.filter(t => t.status === "draft").length} drafts saved</p>
          </div>
        </div>

        {/* Kanban / Tasks Card */}
        <div
          onClick={() => setActivePage("Task / Kanban")}
          className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm hover:border-[#ffd166] transition cursor-pointer flex flex-col justify-between h-[130px]"
        >
          <div className="flex justify-between items-start">
            <div className="size-8 rounded-lg bg-[#fff9eb] flex items-center justify-center text-[#ffd166] border border-[#ffeecf]">
              <Icons.Trello className="size-4.5" />
            </div>
            <span className="text-[8px] font-black bg-[#fff9eb] text-[#f6c75b] px-2 py-0.5 rounded-md uppercase">Active</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400">Kanban / Tasks</span>
            <h3 className="text-sm font-black text-gray-900 mt-0.5">{totalTasks} tasks</h3>
            <p className="text-[9px] font-bold text-gray-400 mt-0.5">{completedTasks} completed across {boards.length} boards</p>
          </div>
        </div>

        {/* Notes Card */}
        <div
          onClick={() => setActivePage("Notes")}
          className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm hover:border-[#55c7f5] transition cursor-pointer flex flex-col justify-between h-[130px]"
        >
          <div className="flex justify-between items-start">
            <div className="size-8 rounded-lg bg-[#eefaff] flex items-center justify-center text-[#55c7f5] border border-[#d6f4ff]">
              <Icons.FileText className="size-4.5" />
            </div>
            <span className="text-[8px] font-black bg-[#eefaff] text-[#55c7f5] px-2 py-0.5 rounded-md uppercase">Active</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400">Notes</span>
            <h3 className="text-sm font-black text-gray-900 mt-0.5">{notes.length} note{notes.length !== 1 && "s"}</h3>
            <p className="text-[9px] font-bold text-gray-400 mt-0.5">{notes.filter(n => n.isPinned).length} pinned notes ready</p>
          </div>
        </div>

        {/* Whiteboard Card */}
        <div
          onClick={() => setActivePage("Whiteboard")}
          className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm hover:border-[#ff8ab3] transition cursor-pointer flex flex-col justify-between h-[130px]"
        >
          <div className="flex justify-between items-start">
            <div className="size-8 rounded-lg bg-[#fff0f5] flex items-center justify-center text-[#ff8ab3] border border-[#ffe0eb]">
              <Icons.Palette className="size-4.5" />
            </div>
            <span className="text-[8px] font-black bg-[#fff0f5] text-[#ff8ab3] px-2 py-0.5 rounded-md uppercase">Active</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400">Whiteboard</span>
            <h3 className="text-sm font-black text-gray-900 mt-0.5">{whiteboards.length} board{whiteboards.length !== 1 && "s"}</h3>
            <p className="text-[9px] font-bold text-gray-400 mt-0.5">Latest: {whiteboards[0]?.name || "None"}</p>
          </div>
        </div>

        {/* AI Assistant Card */}
        <div
          onClick={() => setActivePage("AI Assistant")}
          className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm hover:border-[#7c5dfa] transition cursor-pointer flex flex-col justify-between h-[130px]"
        >
          <div className="flex justify-between items-start">
            <div className="size-8 rounded-lg bg-[#f5f2ff] flex items-center justify-center text-[#7c5dfa] border border-[#e8e2ff]">
              <Icons.Sparkles className="size-4.5" />
            </div>
            <span className="text-[8px] font-black bg-[#f5f2ff] text-[#7c5dfa] px-2 py-0.5 rounded-md uppercase">Active</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400">AI Assistant</span>
            <h3 className="text-sm font-black text-gray-900 mt-0.5">{sharedMessages.length} actions</h3>
            <p className="text-[9px] font-bold text-gray-400 mt-0.5">Today</p>
          </div>
        </div>

        {/* AI Template Builder Card */}
        <div
          onClick={() => setActivePage("AI Template Builder")}
          className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm hover:border-[#ff6b4a] transition cursor-pointer flex flex-col justify-between h-[130px]"
        >
          <div className="flex justify-between items-start">
            <div className="size-8 rounded-lg bg-[#fff0ed] flex items-center justify-center text-[#ff6b4a] border border-[#ffe0db]">
              <Icons.Wand2 className="size-4.5" />
            </div>
            <span className="text-[8px] font-black bg-[#fff0ed] text-[#ff6b4a] px-2 py-0.5 rounded-md uppercase">Active</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400">AI Template Builder</span>
            <h3 className="text-sm font-black text-gray-900 mt-0.5">{aiApps.length} template{aiApps.length !== 1 && "s"}</h3>
            <p className="text-[9px] font-bold text-gray-400 mt-0.5">{aiApps.filter(app => app.inSidebar).length} sidebar apps pinned</p>
          </div>
        </div>

      </div>

      {/* Quick Access and Task Summary Row */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Quick Access panel (takes 2 columns) */}
        <div className="md:col-span-2 rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1 pb-3.5 border-b border-gray-100">
            <Icons.ArrowRight className="size-3.5 text-[#ff6b4a]" />
            <span>Quick access</span>
          </h2>
          
          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
            
            {/* Create Task Button */}
            <div
              onClick={() => setActivePage("Task / Kanban")}
              className="flex items-center gap-3 rounded-xl border border-l-[4px] border-[#e1ded7] border-l-[#ffd166] p-3.5 bg-white hover:border-[#ffd166] transition cursor-pointer"
            >
              <div className="size-8 rounded-lg bg-[#fff9eb] flex items-center justify-center text-[#ffd166] border border-[#ffeecf] shrink-0">
                <Icons.Plus className="size-4" />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[11px] font-black text-gray-800">Create Task</h4>
                <p className="text-[9px] text-gray-400 font-semibold truncate mt-0.5">Open your Kanban workspace.</p>
              </div>
            </div>

            {/* Add Calendar Event Button */}
            <div
              onClick={() => setActivePage("Calendar")}
              className="flex items-center gap-3 rounded-xl border border-l-[4px] border-[#e1ded7] border-l-[#00a88f] p-3.5 bg-white hover:border-[#00a88f] transition cursor-pointer"
            >
              <div className="size-8 rounded-lg bg-[#e8f6ef] flex items-center justify-center text-[#00a88f] border border-[#d2edd6] shrink-0">
                <Icons.Calendar className="size-4" />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[11px] font-black text-gray-800">Add Calendar Event</h4>
                <p className="text-[9px] text-gray-400 font-semibold truncate mt-0.5">Schedule a task or reminder.</p>
              </div>
            </div>

            {/* Create Note Button */}
            <div
              onClick={handleQuickCreateNote}
              className="flex items-center gap-3 rounded-xl border border-l-[4px] border-[#e1ded7] border-l-[#55c7f5] p-3.5 bg-white hover:border-[#55c7f5] transition cursor-pointer"
            >
              <div className="size-8 rounded-lg bg-[#eefaff] flex items-center justify-center text-[#55c7f5] border border-[#d6f4ff] shrink-0">
                <Icons.PenTool className="size-4" />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[11px] font-black text-gray-800">Create Note</h4>
                <p className="text-[9px] text-gray-400 font-semibold truncate mt-0.5">Capture a fresh thought.</p>
              </div>
            </div>

            {/* Open Whiteboard Button */}
            <div
              onClick={handleQuickCreateWhiteboard}
              className="flex items-center gap-3 rounded-xl border border-l-[4px] border-[#e1ded7] border-l-[#ff8ab3] p-3.5 bg-white hover:border-[#ff8ab3] transition cursor-pointer"
            >
              <div className="size-8 rounded-lg bg-[#fff0f5] flex items-center justify-center text-[#ff8ab3] border border-[#ffe0eb] shrink-0">
                <Icons.Palette className="size-4" />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[11px] font-black text-gray-800">Open Whiteboard</h4>
                <p className="text-[9px] text-gray-400 font-semibold truncate mt-0.5">Sketch ideas visually.</p>
              </div>
            </div>

            {/* Ask AI Assistant Button */}
            <div
              onClick={() => setActivePage("AI Assistant")}
              className="flex items-center gap-3 rounded-xl border border-l-[4px] border-[#e1ded7] border-l-[#7c5dfa] p-3.5 bg-white hover:border-[#7c5dfa] transition cursor-pointer"
            >
              <div className="size-8 rounded-lg bg-[#f5f2ff] flex items-center justify-center text-[#7c5dfa] border border-[#e8e2ff] shrink-0">
                <Icons.Sparkles className="size-4" />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[11px] font-black text-gray-800">Ask AI Assistant</h4>
                <p className="text-[9px] text-gray-400 font-semibold truncate mt-0.5">Plan or act across the app.</p>
              </div>
            </div>

            {/* Generate AI Template Button */}
            <div
              onClick={() => setActivePage("AI Template Builder")}
              className="flex items-center gap-3 rounded-xl border border-l-[4px] border-[#e1ded7] border-l-[#ff6b4a] p-3.5 bg-white hover:border-[#ff6b4a] transition cursor-pointer"
            >
              <div className="size-8 rounded-lg bg-[#fff0ed] flex items-center justify-center text-[#ff6b4a] border border-[#ffe0db] shrink-0">
                <Icons.Wand2 className="size-4" />
              </div>
              <div className="min-w-0 text-left">
                <h4 className="text-[11px] font-black text-gray-800">Generate AI Template</h4>
                <p className="text-[9px] text-gray-400 font-semibold truncate mt-0.5">Build a mini productivity app.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Task Summary panel */}
        <div className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pb-3.5 border-b border-gray-100">
              <Icons.CheckSquare className="size-4 text-[#ff6b4a]" />
              <span>Task summary</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3.5 py-4">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-left">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Total</span>
              <span className="text-lg font-black text-gray-800 mt-1 block">{totalTasks}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-left">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Completed</span>
              <span className="text-lg font-black text-[#00a88f] mt-1 block">{completedTasks}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-left">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Pending</span>
              <span className="text-lg font-black text-[#7c5dfa] mt-1 block">{pendingTasks}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-left">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Overdue</span>
              <span className="text-lg font-black text-red-500 mt-1 block">{overdueTasks}</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-gray-50 pt-3">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
              <span className="text-gray-400">Progress</span>
              <span className="text-[#00a88f]">{progressPercentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-150">
              <div
                className="h-full bg-gradient-to-r from-[#00a88f] to-[#80d77b] rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Upcoming calendar agenda and Activity timeline row */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Upcoming agenda items */}
        <div className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm flex flex-col justify-between text-left">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
            <Icons.Calendar className="size-4 text-[#ff6b4a]" />
            <span>Upcoming calendar</span>
          </h3>
          
          <div className="space-y-2.5 mt-4 flex-1">
            {upcomingEvents.length === 0 ? (
              <p className="text-xs font-semibold text-gray-400 py-6 text-center">No upcoming agenda scheduled.</p>
            ) : (
              upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setActivePage("Calendar")}
                  className="flex justify-between items-center p-3 border border-gray-100 hover:border-gray-300 rounded-xl bg-[#faf8f5]/40 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="size-2 rounded-full bg-[#00a88f] shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold text-gray-800 block">{evt.title}</span>
                      <span className="text-[9px] font-bold text-gray-400 mt-0.5 block">{evt.dueDate}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-black bg-gray-50 border border-gray-150 px-2 py-0.5 rounded text-gray-400 uppercase tracking-wider select-none shrink-0">
                    {evt.taskType || "Task"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Timeline activity log */}
        <div className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm text-left">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
            <Icons.Activity className="size-4 text-[#ff6b4a]" />
            <span>Recent activity</span>
          </h3>

          <div className="relative border-l border-[#e6e2db] pl-4 mt-4 space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-xs font-semibold text-gray-400 py-6 pl-2 text-left">No activity logs recorded yet.</p>
            ) : (
              recentActivities.map((act, idx) => (
                <div key={idx} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[21px] top-1 size-2 rounded-full border-2 border-white ring-2 ring-white",
                      act.type === "note" ? "bg-[#ff8ab3]" : 
                      act.type === "whiteboard" ? "bg-[#00a88f]" :
                      act.type === "task" ? "bg-[#ffd166]" :
                      act.type === "app" ? "bg-[#ff6b4a]" : "bg-[#7c5dfa]"
                    )}
                  />
                  <div className="text-xs">
                    <span className="font-bold text-gray-800 block">{act.title}</span>
                    <span className="text-[9px] font-semibold text-gray-400 block mt-0.5">
                      {act.action} • {act.time.toLocaleDateString()} {act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Bottom Fold Grid: Recent Pages & AI Insights (matches the final screenshot exactly) */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Recent Pages (takes 2 columns) */}
        <div className="md:col-span-2 rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-gray-100">
            <Icons.FileText className="size-3.5 text-[#ff6b4a]" />
            <span>Recent pages</span>
          </h2>

          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 mt-4">
            {recentPages.map((page, idx) => (
              <div
                key={idx}
                onClick={() => handlePageClick(page)}
                className="flex flex-col justify-between p-4 bg-white border border-l-[4px] border-[#e1ded7] hover:border-gray-400 transition rounded-xl cursor-pointer shadow-sm text-left h-[100px]"
                style={{ borderLeftColor: page.color }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-black text-gray-800 truncate max-w-[150px]">{page.title}</span>
                  <span
                    className={cn(
                      "text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider select-none shrink-0",
                      page.type === "board" ? "bg-[#fff9eb] text-[#f6c75b]" :
                      page.type === "note" ? "bg-[#eefaff] text-[#55c7f5]" :
                      page.type === "whiteboard" ? "bg-[#fff0f5] text-[#ff8ab3]" : "bg-[#fff0ed] text-[#ff6b4a]"
                    )}
                  >
                    {page.badge}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 font-bold truncate">{page.subtext}</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-1">{formatRelativeTime(page.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights List (takes 1 column) */}
        <div className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-gray-100">
              <Icons.Sparkles className="size-3.5 text-[#ff6b4a]" />
              <span>AI insights</span>
            </h2>
          </div>

          <div className="space-y-3 mt-4 flex-1">
            {aiInsightsList.map((insight, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-[#e6e2db] rounded-xl shadow-sm text-left">
                <span className="size-6 flex items-center justify-center rounded bg-[#f5f2ff] text-xs font-black text-[#7c5dfa] shrink-0 select-none">
                  {idx + 1}
                </span>
                <span className="text-[10px] font-bold text-gray-600 leading-normal">
                  {insight}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

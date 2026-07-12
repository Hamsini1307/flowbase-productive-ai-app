"use client";

import * as React from "react";
import {
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LibraryBig,
  MessageSquareText,
  Palette,
  Plus,
  Search,
  Settings,
  Sparkles,
  StickyNote,
  Trello,
  Wand2,
} from "lucide-react";

import { CalendarPage } from "@/components/calendar-page";
import { KanbanPage } from "@/components/kanban-page";
import { KanbanSkeleton, CalendarSkeleton } from "@/components/loading-skeletons";
import { NotesPage } from "@/components/notes-page";
import { WhiteboardPage } from "@/components/whiteboard-page";
import { SpacesPage } from "@/components/spaces-page";
import { AiTemplateBuilderPage } from "@/components/ai-template-builder-page";
import { RenderDynamicApp } from "@/components/render-dynamic-app";
import SettingsPage from "@/components/settings-page";
import { AiAssistantPage } from "@/components/ai-assistant-page";
import { DashboardPage } from "@/components/dashboard-page";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

const menuGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", icon: LayoutDashboard },
      { label: "AI Assistant", icon: Bot },
      { label: "Notes", icon: StickyNote },
      { label: "Pages / Spaces", icon: LibraryBig },
    ],
  },
  {
    label: "Plan",
    items: [
      { label: "Calendar", icon: CalendarDays },
      { label: "Task / Kanban", icon: Trello },
    ],
  },
  {
    label: "Create",
    items: [
      { label: "Whiteboard", icon: Palette },
      { label: "AI Template Builder", icon: Wand2 },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", icon: Settings }],
  },
];

const workspaceCards = [
  { title: "Launch Plan", detail: "12 tasks", color: "bg-[#ff6b4a]" },
  { title: "Research Notes", detail: "34 pages", color: "bg-[#00a88f]" },
  { title: "Product Board", detail: "8 canvases", color: "bg-[#6257f6]" },
];

const kanban = [
  { label: "Ideas", count: 6, color: "bg-[#ffd166]" },
  { label: "In Progress", count: 4, color: "bg-[#55c7f5]" },
  { label: "Review", count: 3, color: "bg-[#ff8ab3]" },
];

export function DashboardShell() {
  const userName = "Hamsini";
  const [collapsed, setCollapsed] = React.useState(false);
  const [activePage, setActivePage] = React.useState("Dashboard");

  // Shared states lifted for sync, duplicate prevention, and zero-latency tab switching
  const [boards, setBoards] = React.useState<any[]>([]);
  const [activeBoardId, setActiveBoardId] = React.useState<string>("");
  const [boardsLoading, setBoardsLoading] = React.useState(true);
  
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = React.useState(true);

  const [sidebarApps, setSidebarApps] = React.useState<any[]>([]);
  const [assistantMessages, setAssistantMessages] = React.useState<any[]>([]);

  const refreshSidebarApps = React.useCallback(async () => {
    try {
      const res = await fetch("/api/ai-apps");
      if (res.ok) {
        const data = await res.json();
        const userApps = data.apps || [];
        setSidebarApps(userApps.filter((app: any) => app.inSidebar));
      }
    } catch (err) {
      console.error("Failed to fetch sidebar apps:", err);
    }
  }, []);

  React.useEffect(() => {
    void refreshSidebarApps();
  }, [refreshSidebarApps]);

  // Track activeBoardId in a ref to avoid re-triggering the prefetch callback when the first board loads
  const activeBoardIdRef = React.useRef(activeBoardId);

  React.useEffect(() => {
    activeBoardIdRef.current = activeBoardId;
  }, [activeBoardId]);

  const refreshData = React.useCallback(async () => {
    try {
      // Parallel loading of boards and tasks
      const [boardsRes, tasksRes] = await Promise.all([
        fetch("/api/kanban-boards"),
        fetch("/api/tasks"),
      ]);

      const [boardsData, tasksData] = await Promise.all([
        boardsRes.json(),
        tasksRes.json(),
      ]);

      if (boardsData.boards) {
        setBoards(boardsData.boards);
        if (boardsData.boards.length > 0 && !activeBoardIdRef.current) {
          setActiveBoardId(boardsData.boards[0].id);
        }
      }
      
      if (tasksData.tasks) {
        setTasks(tasksData.tasks);
      }
    } catch (err) {
      console.error("Failed to prefetch boards and tasks:", err);
    } finally {
      setBoardsLoading(false);
      setTasksLoading(false);
    }
  }, []);

  const refreshTasks = React.useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error("Failed to refresh tasks:", err);
    }
  }, []);

  React.useEffect(() => {
    if (activePage === "Calendar" || activePage === "Task / Kanban" || activePage === "Dashboard") {
      void refreshData();
    }
  }, [activePage, refreshData]);

  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const collapseOnNarrowScreen = () => {
      if (query.matches) setCollapsed(true);
    };

    collapseOnNarrowScreen();
    query.addEventListener("change", collapseOnNarrowScreen);
    return () => query.removeEventListener("change", collapseOnNarrowScreen);
  }, []);

  const compact = collapsed;
  const isDashboard = activePage === "Dashboard";

  return (
    <div className="min-h-screen bg-[#f1faf6] text-[#17201e]">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "sticky top-0 flex h-screen shrink-0 flex-col border-r border-[#d6e7df] bg-[#fbfff8] px-2.5 py-3 shadow-[8px_0_28px_rgba(28,71,63,0.08)] transition-[width] duration-300",
            compact ? "w-[68px]" : "w-[228px]"
          )}
        >
          <div className="flex h-10 items-center gap-2 rounded-md px-1.5">
            <div className="grid size-7 shrink-0 place-items-center rounded-md bg-[#17201e] text-[#f7fff9]">
              <Sparkles className="size-3.5" aria-hidden="true" />
            </div>
            <div className={cn("min-w-0", compact && "sr-only")}>
              <p className="truncate text-[13px] font-semibold leading-4">Flowbase</p>
              <p className="truncate text-[10px] leading-4 text-[#66756f]">Visual workspace</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="mt-2 flex h-7 w-full items-center justify-center rounded-md border border-[#d6e7df] bg-white/80 text-[#66756f] transition hover:border-[#acd8cb] hover:bg-[#f3fff9]"
            aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            title={compact ? "Expand sidebar" : "Collapse sidebar"}
          >
            {compact ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
          </button>

          <nav className="mt-4 flex-1 space-y-3 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Main navigation">
            {menuGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p
                  className={cn(
                    "px-1.5 text-[9px] font-semibold uppercase leading-4 tracking-[0.12em] text-[#7a8a84]",
                    compact && "sr-only"
                  )}
                >
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const isActive = activePage === item.label;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      title={compact ? item.label : undefined}
                      onClick={() => setActivePage(item.label)}
                      className={cn(
                        "group flex h-8 w-full items-center gap-2 rounded-md px-1.5 text-left text-[11px] font-medium text-[#55645f] transition hover:bg-[#e8f6ef] hover:text-[#17201e]",
                        isActive && "bg-[#17201e] text-[#f7fff9] shadow-sm hover:bg-[#17201e] hover:text-[#f7fff9]",
                        compact && "justify-center px-0"
                      )}
                    >
                      <item.icon className="size-3.5 shrink-0" aria-hidden="true" />
                      <span className={cn("truncate", compact && "sr-only")}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Dynamic AI Generated Apps inside Sidebar */}
            {sidebarApps.length > 0 && (
              <div className="space-y-1 pt-3 border-t border-[#d6e7df]/60 animate-fadeIn">
                <p
                  className={cn(
                    "px-1.5 text-[9px] font-semibold uppercase leading-4 tracking-[0.12em] text-[#7a8a84]",
                    compact && "sr-only"
                  )}
                >
                  Apps
                </p>
                {sidebarApps.map((app) => {
                  const isActive = activePage === `app-${app.id}`;
                  const IconComponent = (LucideIcons as any)[app.icon] || LucideIcons.HelpCircle;

                  return (
                    <button
                      key={app.id}
                      type="button"
                      title={compact ? app.name : undefined}
                      onClick={() => setActivePage(`app-${app.id}`)}
                      className={cn(
                        "group flex h-8 w-full items-center gap-2 rounded-md px-1.5 text-left text-[11px] font-medium text-[#55645f] transition hover:bg-[#e8f6ef] hover:text-[#17201e]",
                        isActive && "bg-[#17201e] text-[#f7fff9] shadow-sm hover:bg-[#17201e] hover:text-[#f7fff9]",
                        compact && "justify-center px-0"
                      )}
                    >
                      <IconComponent
                        className="size-3.5 shrink-0"
                        style={{ color: isActive ? "#f7fff9" : app.color }}
                        aria-hidden="true"
                      />
                      <span className={cn("truncate", compact && "sr-only")}>{app.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </nav>

          <div className="border-t border-[#d6e7df] pt-3">
            <button
              type="button"
              title={compact ? "New page" : undefined}
              className={cn(
                "flex h-8 w-full items-center gap-2 rounded-md bg-[#ff6b4a] px-1.5 text-[11px] font-semibold text-white transition hover:bg-[#ef5d3d]",
                compact && "justify-center px-0"
              )}
            >
              <Plus className="size-3.5 shrink-0" aria-hidden="true" />
              <span className={cn("truncate", compact && "sr-only")}>New page</span>
            </button>
            <div className={cn("mt-2 rounded-md bg-[#e8f6ef] p-2.5", compact && "grid place-items-center p-2")}>
              <div className="grid size-7 place-items-center rounded-md bg-[#00a88f] text-white">
                <MessageSquareText className="size-3.5" aria-hidden="true" />
              </div>
              <div className={cn("mt-2", compact && "sr-only")}>
                <p className="text-[11px] font-semibold text-[#17201e]">Team sync</p>
                <p className="mt-0.5 text-[10px] leading-4 text-[#66756f]">4 updates waiting</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden">
          {!isDashboard && (
            <header className="flex min-h-16 items-center justify-between border-b border-[#d6e7df] bg-[#f8fff9]/85 px-5 backdrop-blur">
              <div>
                <p className="text-xs font-medium text-[#66756f]">{isDashboard ? "Dashboard" : "Plan"}</p>
                <h1 className="text-xl font-semibold text-[#17201e]">
                  {isDashboard ? `Good afternoon, ${userName}` : activePage}
                </h1>
              </div>
              <div className="hidden h-10 min-w-[260px] items-center gap-2 rounded-md border border-[#d6e7df] bg-white px-3 text-sm text-[#66756f] md:flex">
                <Search className="size-4" aria-hidden="true" />
                <span>Search pages, boards, notes</span>
              </div>
            </header>
          )}

          {activePage === "Calendar" ? (
            <CalendarPage
              sharedTasks={tasks}
              sharedTasksLoading={tasksLoading}
              onTasksChange={setTasks}
              refreshTasks={refreshTasks}
            />
          ) : activePage === "Task / Kanban" ? (
            <KanbanPage
              sharedBoards={boards}
              sharedBoardsLoading={boardsLoading}
              activeBoardId={activeBoardId}
              setActiveBoardId={setActiveBoardId}
              onBoardsChange={setBoards}
              sharedTasks={tasks}
              sharedTasksLoading={tasksLoading}
              onTasksChange={setTasks}
            />
          ) : activePage === "AI Assistant" ? (
            <AiAssistantPage
              sharedMessages={assistantMessages}
              onMessagesChange={setAssistantMessages}
              refreshTasks={refreshTasks}
              boards={boards}
              tasks={tasks}
            />
          ) : activePage === "Notes" ? (
            <NotesPage />
          ) : activePage === "Whiteboard" ? (
            <WhiteboardPage />
          ) : activePage === "Pages / Spaces" ? (
            <SpacesPage />
          ) : activePage === "AI Template Builder" ? (
            <AiTemplateBuilderPage onSidebarChange={refreshSidebarApps} />
          ) : activePage === "Settings" ? (
            <SettingsPage />
          ) : activePage.startsWith("app-") ? (
            <RenderDynamicApp
              appId={activePage.replace("app-", "")}
              onSidebarChange={refreshSidebarApps}
            />
          ) : (
            <DashboardPage
              boards={boards}
              tasks={tasks}
              setActivePage={setActivePage}
              setActiveBoardId={setActiveBoardId}
              refreshTasks={refreshTasks}
              refreshData={refreshData}
              sharedMessages={assistantMessages}
            />
          )}
        </main>
      </div>
    </div>
  );
}




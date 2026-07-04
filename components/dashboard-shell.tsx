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
import { cn } from "@/lib/utils";

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
  const [collapsed, setCollapsed] = React.useState(false);
  const [activePage, setActivePage] = React.useState("Dashboard");

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

          <nav className="mt-4 flex-1 space-y-3 overflow-y-auto pr-0.5" aria-label="Main navigation">
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
          <header className="flex min-h-16 items-center justify-between border-b border-[#d6e7df] bg-[#f8fff9]/85 px-5 backdrop-blur">
            <div>
              <p className="text-xs font-medium text-[#66756f]">{isDashboard ? "Dashboard" : "Plan"}</p>
              <h1 className="text-xl font-semibold text-[#17201e]">
                {isDashboard ? "Good afternoon, Hamsini" : activePage}
              </h1>
            </div>
            <div className="hidden h-10 min-w-[260px] items-center gap-2 rounded-md border border-[#d6e7df] bg-white px-3 text-sm text-[#66756f] md:flex">
              <Search className="size-4" aria-hidden="true" />
              <span>Search pages, boards, notes</span>
            </div>
          </header>

          {activePage === "Calendar" ? (
            <CalendarPage />
          ) : activePage === "Task / Kanban" ? (
            <KanbanPage />
          ) : (
            <div className="grid gap-5 p-5 lg:grid-cols-[1.25fr_0.75fr]">
              <section className="rounded-lg border border-[#d6e7df] bg-[#fbfff8] p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#66756f]">Today</p>
                    <h2 className="mt-1 text-2xl font-semibold text-[#17201e]">Build your visual operating system</h2>
                  </div>
                  <button className="inline-flex h-9 items-center gap-2 rounded-md bg-[#17201e] px-3 text-sm font-medium text-white transition hover:bg-[#24312e]">
                    <Sparkles className="size-4" aria-hidden="true" />
                    Ask AI
                  </button>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {workspaceCards.map((card) => (
                    <article key={card.title} className="rounded-md border border-[#d6e7df] bg-white p-4">
                      <div className={cn("mb-4 h-1.5 w-10 rounded-full", card.color)} />
                      <h3 className="text-sm font-semibold text-[#17201e]">{card.title}</h3>
                      <p className="mt-1 text-xs text-[#66756f]">{card.detail}</p>
                    </article>
                  ))}
                </div>

                <div className="mt-5 rounded-lg border border-[#c9ded5] bg-[#eef8f3] p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Whiteboard snapshot</h3>
                    <span className="text-xs text-[#66756f]">Live canvas</span>
                  </div>
                  <div className="mt-4 grid min-h-[220px] grid-cols-8 grid-rows-5 gap-2 rounded-md bg-[linear-gradient(#d9eae2_1px,transparent_1px),linear-gradient(90deg,#d9eae2_1px,transparent_1px)] bg-[size:24px_24px] p-4">
                    <div className="col-span-3 row-span-2 rounded-md bg-[#ffd166] p-3 text-xs font-medium shadow-sm">Roadmap themes</div>
                    <div className="col-start-5 col-span-3 row-start-2 rounded-md bg-[#55c7f5] p-3 text-xs font-medium shadow-sm">User journeys</div>
                    <div className="col-start-2 col-span-2 row-start-4 rounded-md bg-[#ff8ab3] p-3 text-xs font-medium shadow-sm">AI prompts</div>
                    <div className="col-start-6 col-span-2 row-start-4 rounded-md bg-[#80d77b] p-3 text-xs font-medium shadow-sm">Templates</div>
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                <div className="rounded-lg border border-[#d6e7df] bg-[#fbfff8] p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-[#17201e]">Kanban pulse</h2>
                  <div className="mt-4 space-y-3">
                    {kanban.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-md border border-[#d6e7df] bg-white p-3">
                        <div className="flex items-center gap-3">
                          <span className={cn("size-3 rounded-full", item.color)} />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <span className="text-xs text-[#66756f]">{item.count} cards</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-[#d6e7df] bg-[#17201e] p-5 text-[#f7fff9] shadow-sm">
                  <FileText className="size-5 text-[#ffd166]" aria-hidden="true" />
                  <h2 className="mt-4 text-base font-semibold">AI template builder</h2>
                  <p className="mt-2 text-sm leading-6 text-[#dcece5]">
                    Turn messy briefs into reusable pages, boards, and note systems without leaving your workspace.
                  </p>
                  <button className="mt-4 h-9 rounded-md bg-[#ffd166] px-3 text-sm font-semibold text-[#17201e] transition hover:bg-[#f6c75b]">
                    Start template
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}




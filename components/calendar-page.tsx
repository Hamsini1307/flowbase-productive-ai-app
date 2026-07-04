"use client";

import * as React from "react";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GripVertical,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

type CalendarView = "month" | "week";
type TaskCategory = "Work" | "Personal" | "Focus" | "Meeting" | "Reminder";
type TaskStatus = "scheduled" | "draft";
type TaskType = "Task" | "Reminder";

type CalendarTask = {
  id: string;
  title: string;
  category: TaskCategory;
  taskType: TaskType;
  color: string;
  date?: string;
  time: string;
  notes: string;
  status: TaskStatus;
};

type TaskForm = {
  title: string;
  category: TaskCategory;
  taskType: TaskType;
  date: string;
  time: string;
  notes: string;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const categories: Array<{ name: TaskCategory; color: string; chip: string }> = [
  { name: "Work", color: "#6257f6", chip: "bg-[#6257f6]" },
  { name: "Personal", color: "#ff8ab3", chip: "bg-[#ff8ab3]" },
  { name: "Focus", color: "#00a88f", chip: "bg-[#00a88f]" },
  { name: "Meeting", color: "#55c7f5", chip: "bg-[#55c7f5]" },
  { name: "Reminder", color: "#ff6b4a", chip: "bg-[#ff6b4a]" },
];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function addMonths(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + amount, 1);
  return nextDate;
}

function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

function getMonthDays(anchor: Date) {
  const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(firstDay);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function getWeekDays(anchor: Date) {
  const gridStart = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(gridStart, index));
}

function getCategory(categoryName: TaskCategory) {
  return categories.find((category) => category.name === categoryName) ?? categories[0];
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

function formatDateLabel(dateKey?: string) {
  if (!dateKey) return "Draft";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(year, month - 1, day));
}

function emptyTaskForm(date = ""): TaskForm {
  return { title: "", category: "Work", taskType: "Task", date, time: "09:00", notes: "" };
}

function createInitialTasks(today: Date): CalendarTask[] {
  const todayKey = toDateKey(today);
  const tomorrowKey = toDateKey(addDays(today, 1));

  return [
    {
      id: "task-1",
      title: "Weekly planning sync",
      category: "Meeting",
      taskType: "Task",
      color: getCategory("Meeting").color,
      date: todayKey,
      time: "10:00",
      notes: "Review launch priorities.",
      status: "scheduled",
    },
    {
      id: "task-2",
      title: "Template QA pass",
      category: "Work",
      taskType: "Task",
      color: getCategory("Work").color,
      date: tomorrowKey,
      time: "14:30",
      notes: "Check builder edge cases.",
      status: "scheduled",
    },
    {
      id: "task-3",
      title: "Moodboard cleanup",
      category: "Personal",
      taskType: "Task",
      color: getCategory("Personal").color,
      time: "",
      notes: "Save references before scheduling.",
      status: "draft",
    },
    {
      id: "task-4",
      title: "Send reminder summary",
      category: "Reminder",
      taskType: "Reminder",
      color: getCategory("Reminder").color,
      time: "09:00",
      notes: "Draft first, schedule after team review.",
      status: "draft",
    },
  ];
}

export function CalendarPage() {
  const today = React.useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);
  const [calendarView, setCalendarView] = React.useState<CalendarView>("month");
  const [anchorDate, setAnchorDate] = React.useState(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [tasks, setTasks] = React.useState<CalendarTask[]>(() => createInitialTasks(today));
  const [draggingTaskId, setDraggingTaskId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<TaskForm>(() => emptyTaskForm(todayKey));

  const visibleDays = calendarView === "month" ? getMonthDays(anchorDate) : getWeekDays(anchorDate);
  const scheduledTasks = tasks.filter((task) => task.status === "scheduled" && task.date);
  const draftTasks = tasks.filter((task) => task.status === "draft");
  const calendarTitle = calendarView === "month" ? formatMonth(anchorDate) : `${formatMonth(visibleDays[0])} week`;

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTaskId(null);
    setForm(emptyTaskForm(todayKey));
  };

  const openTaskDialog = (dateKey = "") => {
    setEditingTaskId(null);
    setForm(emptyTaskForm(dateKey));
    setDialogOpen(true);
  };

  const openEditDialog = (task: CalendarTask) => {
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      category: task.category,
      taskType: task.taskType,
      date: task.date ?? "",
      time: task.time || "09:00",
      notes: task.notes,
    });
    setDialogOpen(true);
  };

  const saveTask = (status: TaskStatus) => {
    if (!form.title.trim()) return;

    const category = getCategory(form.category);
    const date = status === "scheduled" ? form.date || todayKey : undefined;

    setTasks((currentTasks) => [
      ...currentTasks,
      {
        id: `task-${crypto.randomUUID()}`,
        title: form.title.trim(),
        category: form.category,
        taskType: form.taskType,
        color: category.color,
        date,
        time: form.time,
        notes: form.notes.trim(),
        status,
      },
    ]);
    closeDialog();
  };

  const updateTask = (status?: TaskStatus) => {
    if (!editingTaskId || !form.title.trim()) return;

    const category = getCategory(form.category);
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== editingTaskId) return task;

        const nextStatus = status ?? task.status;
        return {
          ...task,
          title: form.title.trim(),
          category: form.category,
          taskType: form.taskType,
          color: category.color,
          date: nextStatus === "scheduled" ? form.date || todayKey : undefined,
          time: form.time,
          notes: form.notes.trim(),
          status: nextStatus,
        };
      })
    );
    closeDialog();
  };

  const deleteTask = () => {
    if (!editingTaskId) return;

    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== editingTaskId));
    closeDialog();
  };

  const moveTaskToDate = (taskId: string, dateKey: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, date: dateKey, status: "scheduled" } : task))
    );
  };

  const navigateCalendar = (direction: -1 | 1) => {
    setAnchorDate((currentDate) =>
      calendarView === "month" ? addMonths(currentDate, direction) : addDays(currentDate, direction * 7)
    );
  };

  const taskCard = (task: CalendarTask, compact = false) => (
    <div
      key={task.id}
      draggable
      onClick={(event) => {
        event.stopPropagation();
        openEditDialog(task);
      }}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/task-id", task.id);
        setDraggingTaskId(task.id);
      }}
      onDragEnd={() => setDraggingTaskId(null)}
      className={cn(
        "cursor-grab rounded-md border border-[#d6e7df] bg-[#fbfff8] px-2 py-1.5 text-[11px] shadow-sm active:cursor-grabbing",
        compact ? "min-w-0" : "p-3"
      )}
      style={{ borderLeft: `3px solid ${task.color}` }}
    >
      <div className="flex min-w-0 items-start gap-1.5">
        {!compact && <GripVertical className="mt-0.5 size-3.5 shrink-0 text-[#9aa8a2]" aria-hidden="true" />}
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-[#17201e]">{task.title}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#66756f]">
            <Clock3 className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{task.time || "Anytime"}</span>
            <span className="truncate">- {task.taskType}</span>
            {!compact && <span className="truncate">- {formatDateLabel(task.date)}</span>}
          </div>
          {!compact && task.notes && <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#66756f]">{task.notes}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid min-h-[calc(100vh-4rem)] gap-4 overflow-hidden p-4 xl:grid-cols-[minmax(0,1fr)_292px]">
      <section className="min-w-0 overflow-hidden rounded-lg border border-[#d6e7df] bg-[#fbfff8] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d6e7df] p-4">
          <div>
            <p className="text-xs font-medium text-[#66756f]">Calendar</p>
            <h2 className="text-xl font-semibold text-[#17201e]">{calendarTitle}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-[#d6e7df] bg-white p-1">
              {(["month", "week"] as CalendarView[]).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setCalendarView(view)}
                  className={cn(
                    "h-8 rounded px-3 text-xs font-semibold capitalize text-[#66756f] transition hover:bg-[#e8f6ef]",
                    calendarView === view && "bg-[#17201e] text-white hover:bg-[#17201e]"
                  )}
                >
                  {view}
                </button>
              ))}
            </div>

            <div className="flex items-center rounded-md border border-[#d6e7df] bg-white">
              <button
                type="button"
                onClick={() => navigateCalendar(-1)}
                className="grid size-9 place-items-center text-[#66756f] transition hover:bg-[#e8f6ef]"
                aria-label="Previous calendar period"
                title="Previous"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setAnchorDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()))}
                className="h-9 border-x border-[#d6e7df] px-3 text-xs font-semibold text-[#17201e] transition hover:bg-[#e8f6ef]"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => navigateCalendar(1)}
                className="grid size-9 place-items-center text-[#66756f] transition hover:bg-[#e8f6ef]"
                aria-label="Next calendar period"
                title="Next"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => openTaskDialog(todayKey)}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#ff6b4a] px-3 text-sm font-semibold text-white transition hover:bg-[#ef5d3d]"
            >
              <Plus className="size-4" aria-hidden="true" />
              New task
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-7 border-b border-[#d6e7df] bg-[#f4fbf7]">
              {weekdays.map((day) => (
                <div key={day} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#66756f]">
                  {day}
                </div>
              ))}
            </div>

            <div className={cn("grid grid-cols-7", calendarView === "week" ? "min-h-[560px]" : "min-h-[680px]")}>
              {visibleDays.map((day) => {
                const dateKey = toDateKey(day);
                const isCurrentMonth = day.getMonth() === anchorDate.getMonth();
                const isToday = dateKey === todayKey;
                const dayTasks = scheduledTasks.filter((task) => task.date === dateKey);
                const visibleTaskLimit = calendarView === "week" ? 8 : 3;

                return (
                  <div
                    key={dateKey}
                    role="button"
                    tabIndex={0}
                    onClick={() => openTaskDialog(dateKey)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") openTaskDialog(dateKey);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const taskId = event.dataTransfer.getData("text/task-id") || draggingTaskId;
                      if (taskId) moveTaskToDate(taskId, dateKey);
                      setDraggingTaskId(null);
                    }}
                    className={cn(
                      "group min-h-[112px] min-w-0 border-b border-r border-[#d6e7df] bg-white p-2 text-left transition hover:bg-[#f7fffb] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#00a88f]",
                      !isCurrentMonth && calendarView === "month" && "bg-[#f7fbf8] text-[#9aa8a2]",
                      calendarView === "week" && "min-h-[560px]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "grid size-7 place-items-center rounded-full text-xs font-semibold text-[#66756f]",
                          isToday && "bg-[#17201e] text-white"
                        )}
                      >
                        {day.getDate()}
                      </span>
                      <Plus className="size-3.5 text-[#9aa8a2] opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                    </div>

                    <div className="mt-2 space-y-1.5">
                      {dayTasks.slice(0, visibleTaskLimit).map((task) => taskCard(task, true))}
                      {dayTasks.length > visibleTaskLimit && (
                        <p className="text-[10px] font-medium text-[#66756f]">+{dayTasks.length - visibleTaskLimit} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <aside className="min-w-0 rounded-lg border border-[#d6e7df] bg-[#fbfff8] p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#66756f]">Unscheduled</p>
            <h2 className="text-base font-semibold text-[#17201e]">Draft Task Panel</h2>
          </div>
          <button
            type="button"
            onClick={() => openTaskDialog("")}
            className="grid size-9 place-items-center rounded-md bg-[#17201e] text-white transition hover:bg-[#24312e]"
            aria-label="Add draft task"
            title="Add draft task"
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 rounded-md border border-dashed border-[#c9ded5] bg-[#eef8f3] p-3 text-xs leading-5 text-[#66756f]">
          Drag drafts onto a date to schedule them, or create a task now and save it here for later.
        </div>

        <div className="mt-4 space-y-3">
          {draftTasks.length > 0 ? (
            draftTasks.map((task) => taskCard(task))
          ) : (
            <div className="rounded-md border border-[#d6e7df] bg-white p-4 text-sm text-[#66756f]">No drafts waiting.</div>
          )}
        </div>

        <div className="mt-5 border-t border-[#d6e7df] pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7a8a84]">Categories</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <div key={category.name} className="flex min-w-0 items-center gap-2 rounded-md border border-[#d6e7df] bg-white px-2 py-2">
                <span className={cn("size-2.5 shrink-0 rounded-full", category.chip)} />
                <span className="truncate text-xs font-medium text-[#17201e]">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#17201e]/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-lg border border-[#d6e7df] bg-[#fbfff8] shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-[#d6e7df] p-4">
              <div>
                <p className="text-xs font-medium text-[#66756f]">{editingTaskId ? "Edit" : "Create"}</p>
                <h2 className="text-lg font-semibold text-[#17201e]">
                  {editingTaskId ? "Edit task or reminder" : "New task or reminder"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="grid size-8 place-items-center rounded-md text-[#66756f] transition hover:bg-[#e8f6ef]"
                aria-label="Close task dialog"
                title="Close"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <label className="block">
                <span className="text-xs font-semibold text-[#66756f]">Task title</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-[#d6e7df] bg-white px-3 text-sm text-[#17201e] outline-none transition focus:border-[#00a88f] focus:ring-2 focus:ring-[#00a88f]/20"
                  placeholder="Add task name"
                  autoFocus
                />
              </label>

              <div>
                <p className="text-xs font-semibold text-[#66756f]">Category</p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, category: category.name }))}
                      className={cn(
                        "flex h-9 items-center justify-center gap-2 rounded-md border border-[#d6e7df] bg-white px-2 text-xs font-semibold text-[#66756f] transition hover:bg-[#e8f6ef]",
                        form.category === category.name && "border-[#17201e] text-[#17201e] shadow-sm"
                      )}
                    >
                      <span className={cn("size-2.5 rounded-full", category.chip)} />
                      <span className="truncate">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-[#66756f]">Date</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-md border border-[#d6e7df] bg-white px-3 text-sm text-[#17201e] outline-none transition focus:border-[#00a88f] focus:ring-2 focus:ring-[#00a88f]/20"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-[#66756f]">Time</span>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-md border border-[#d6e7df] bg-white px-3 text-sm text-[#17201e] outline-none transition focus:border-[#00a88f] focus:ring-2 focus:ring-[#00a88f]/20"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-[#66756f]">Description</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="mt-1 min-h-24 w-full resize-none rounded-md border border-[#d6e7df] bg-white px-3 py-2 text-sm text-[#17201e] outline-none transition focus:border-[#00a88f] focus:ring-2 focus:ring-[#00a88f]/20"
                  placeholder="Reminder details, links, or context"
                />
              </label>
            </div>

            <div className="flex flex-wrap justify-between gap-2 border-t border-[#d6e7df] p-4">
              {editingTaskId ? (
                <button
                  type="button"
                  onClick={deleteTask}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-[#ffd0c6] bg-white px-3 text-sm font-semibold text-[#c4442b] transition hover:bg-[#fff1ee]"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </button>
              ) : (
                <span />
              )}

              <div className="flex flex-wrap justify-end gap-2">
                {editingTaskId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => updateTask("draft")}
                      disabled={!form.title.trim()}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d6e7df] bg-white px-3 text-sm font-semibold text-[#17201e] transition hover:bg-[#e8f6ef] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save className="size-4" aria-hidden="true" />
                      Move to draft
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTask("scheduled")}
                      disabled={!form.title.trim()}
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-[#ff6b4a] px-3 text-sm font-semibold text-white transition hover:bg-[#ef5d3d] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save className="size-4" aria-hidden="true" />
                      Update task
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => saveTask("draft")}
                      disabled={!form.title.trim()}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d6e7df] bg-white px-3 text-sm font-semibold text-[#17201e] transition hover:bg-[#e8f6ef] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save className="size-4" aria-hidden="true" />
                      Save draft
                    </button>
                    <button
                      type="button"
                      onClick={() => saveTask("scheduled")}
                      disabled={!form.title.trim()}
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-[#ff6b4a] px-3 text-sm font-semibold text-white transition hover:bg-[#ef5d3d] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Add to calendar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
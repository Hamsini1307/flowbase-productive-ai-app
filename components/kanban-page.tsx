"use client";

import * as React from "react";
import {
  CalendarDays,
  Check,
  Edit3,
  GripVertical,
  Link2,
  MoreHorizontal,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Priority = "Low" | "Medium" | "High";

type KanbanTask = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  label: string;
  labelColor: string;
  syncCalendar: boolean;
  syncNotes: boolean;
};

type KanbanColumn = {
  id: string;
  title: string;
  tasks: KanbanTask[];
};

type KanbanBoard = {
  id: string;
  name: string;
  color: string;
  columns: KanbanColumn[];
};

type BoardForm = {
  name: string;
  color: string;
};

type TaskForm = {
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  label: string;
  labelColor: string;
  syncCalendar: boolean;
  syncNotes: boolean;
};

const boardColors = ["#ff6b4a", "#00a88f", "#6257f6", "#ffd166", "#ff8ab3", "#55c7f5"];
const labelColors = ["#6257f6", "#00a88f", "#ff6b4a", "#ff8ab3", "#55c7f5", "#80d77b"];
const priorities: Priority[] = ["Low", "Medium", "High"];

const priorityStyles: Record<Priority, string> = {
  Low: "border-[#c9ded5] bg-[#eef8f3] text-[#557069]",
  Medium: "border-[#f2d98c] bg-[#fff7dc] text-[#8b6722]",
  High: "border-[#ffd0c6] bg-[#fff1ee] text-[#c4442b]",
};

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function todayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDefaultColumns(): KanbanColumn[] {
  return [
    { id: makeId("column"), title: "Todo", tasks: [] },
    { id: makeId("column"), title: "In Progress", tasks: [] },
    { id: makeId("column"), title: "Done", tasks: [] },
  ];
}

function emptyTaskForm(date = todayKey()): TaskForm {
  return {
    title: "",
    description: "",
    dueDate: date,
    priority: "Medium",
    label: "Planning",
    labelColor: labelColors[0],
    syncCalendar: false,
    syncNotes: false,
  };
}

function formatDueDate(dateKey: string) {
  if (!dateKey) return "No due date";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(year, month - 1, day));
}

function taskCount(board: KanbanBoard) {
  return board.columns.reduce((total, column) => total + column.tasks.length, 0);
}

const initialBoards: KanbanBoard[] = [
  {
    id: "board-launch",
    name: "Launch Plan",
    color: "#ff6b4a",
    columns: [
      {
        id: "launch-todo",
        title: "Todo",
        tasks: [
          {
            id: "task-positioning",
            title: "Tighten homepage story",
            description: "Turn the rough launch notes into a clearer first-screen promise.",
            dueDate: todayKey(),
            priority: "High",
            label: "Copy",
            labelColor: "#ff6b4a",
            syncCalendar: true,
            syncNotes: true,
          },
        ],
      },
      {
        id: "launch-progress",
        title: "In Progress",
        tasks: [
          {
            id: "task-beta",
            title: "Review beta feedback",
            description: "Group the latest comments by urgency and product area.",
            dueDate: todayKey(),
            priority: "Medium",
            label: "Research",
            labelColor: "#6257f6",
            syncCalendar: false,
            syncNotes: true,
          },
        ],
      },
      {
        id: "launch-done",
        title: "Done",
        tasks: [
          {
            id: "task-checklist",
            title: "Publish QA checklist",
            description: "Shared the final checklist with the launch room.",
            dueDate: todayKey(),
            priority: "Low",
            label: "Ops",
            labelColor: "#00a88f",
            syncCalendar: false,
            syncNotes: false,
          },
        ],
      },
    ],
  },
];

export function KanbanPage() {
  const [boards, setBoards] = React.useState<KanbanBoard[]>(initialBoards);
  const [activeBoardId, setActiveBoardId] = React.useState(initialBoards[0].id);
  const [boardDialogOpen, setBoardDialogOpen] = React.useState(false);
  const [columnDialogOpen, setColumnDialogOpen] = React.useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<{ columnId: string; taskId: string } | null>(null);
  const [targetColumnId, setTargetColumnId] = React.useState("");
  const [editingColumnId, setEditingColumnId] = React.useState<string | null>(null);
  const [boardForm, setBoardForm] = React.useState<BoardForm>({ name: "", color: boardColors[0] });
  const [columnName, setColumnName] = React.useState("");
  const [taskForm, setTaskForm] = React.useState<TaskForm>(() => emptyTaskForm());
  const [draggingTaskId, setDraggingTaskId] = React.useState<string | null>(null);

  const activeBoard = boards.find((board) => board.id === activeBoardId) ?? boards[0];

  const closeBoardDialog = () => {
    setBoardDialogOpen(false);
    setBoardForm({ name: "", color: boardColors[0] });
  };

  const createBoard = () => {
    const boardName = boardForm.name.trim();
    if (!boardName) return;

    const nextBoard: KanbanBoard = {
      id: makeId("board"),
      name: boardName,
      color: boardForm.color,
      columns: createDefaultColumns(),
    };

    setBoards((currentBoards) => [...currentBoards, nextBoard]);
    setActiveBoardId(nextBoard.id);
    closeBoardDialog();
  };

  const openColumnDialog = (column?: KanbanColumn) => {
    setEditingColumnId(column?.id ?? null);
    setColumnName(column?.title ?? "");
    setColumnDialogOpen(true);
  };

  const closeColumnDialog = () => {
    setColumnDialogOpen(false);
    setEditingColumnId(null);
    setColumnName("");
  };

  const saveColumn = () => {
    const nextName = columnName.trim();
    if (!nextName) return;

    setBoards((currentBoards) =>
      currentBoards.map((board) => {
        if (board.id !== activeBoard.id) return board;

        if (editingColumnId) {
          return {
            ...board,
            columns: board.columns.map((column) => (column.id === editingColumnId ? { ...column, title: nextName } : column)),
          };
        }

        if (board.columns.length >= 5) return board;
        return { ...board, columns: [...board.columns, { id: makeId("column"), title: nextName, tasks: [] }] };
      })
    );
    closeColumnDialog();
  };

  const deleteColumn = (columnId: string) => {
    if (activeBoard.columns.length <= 1) return;

    setBoards((currentBoards) =>
      currentBoards.map((board) =>
        board.id === activeBoard.id ? { ...board, columns: board.columns.filter((column) => column.id !== columnId) } : board
      )
    );
  };

  const openTaskDialog = (columnId: string, task?: KanbanTask) => {
    setTargetColumnId(columnId);
    setEditingTask(task ? { columnId, taskId: task.id } : null);
    setTaskForm(
      task
        ? {
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority,
            label: task.label,
            labelColor: task.labelColor,
            syncCalendar: task.syncCalendar,
            syncNotes: task.syncNotes,
          }
        : emptyTaskForm()
    );
    setTaskDialogOpen(true);
  };

  const closeTaskDialog = () => {
    setTaskDialogOpen(false);
    setEditingTask(null);
    setTargetColumnId("");
    setTaskForm(emptyTaskForm());
  };

  const saveTask = () => {
    const title = taskForm.title.trim();
    if (!targetColumnId || !title) return;

    setBoards((currentBoards) =>
      currentBoards.map((board) => {
        if (board.id !== activeBoard.id) return board;

        return {
          ...board,
          columns: board.columns.map((column) => {
            if (editingTask && column.id === editingTask.columnId) {
              return {
                ...column,
                tasks: column.tasks.map((task) =>
                  task.id === editingTask.taskId
                    ? {
                        ...task,
                        title,
                        description: taskForm.description.trim(),
                        dueDate: taskForm.dueDate,
                        priority: taskForm.priority,
                        label: taskForm.label.trim() || "Task",
                        labelColor: taskForm.labelColor,
                        syncCalendar: taskForm.syncCalendar,
                        syncNotes: taskForm.syncNotes,
                      }
                    : task
                ),
              };
            }

            if (!editingTask && column.id === targetColumnId) {
              return {
                ...column,
                tasks: [
                  ...column.tasks,
                  {
                    id: makeId("task"),
                    title,
                    description: taskForm.description.trim(),
                    dueDate: taskForm.dueDate,
                    priority: taskForm.priority,
                    label: taskForm.label.trim() || "Task",
                    labelColor: taskForm.labelColor,
                    syncCalendar: taskForm.syncCalendar,
                    syncNotes: taskForm.syncNotes,
                  },
                ],
              };
            }

            return column;
          }),
        };
      })
    );
    closeTaskDialog();
  };

  const deleteTask = () => {
    if (!editingTask) return;

    setBoards((currentBoards) =>
      currentBoards.map((board) =>
        board.id === activeBoard.id
          ? {
              ...board,
              columns: board.columns.map((column) =>
                column.id === editingTask.columnId
                  ? { ...column, tasks: column.tasks.filter((task) => task.id !== editingTask.taskId) }
                  : column
              ),
            }
          : board
      )
    );
    closeTaskDialog();
  };

  const moveTask = (taskId: string, nextColumnId: string) => {
    setBoards((currentBoards) =>
      currentBoards.map((board) => {
        if (board.id !== activeBoard.id) return board;

        let movedTask: KanbanTask | null = null;
        const columnsWithoutTask = board.columns.map((column) => {
          const taskToMove = column.tasks.find((task) => task.id === taskId);
          if (!taskToMove) return column;
          movedTask = taskToMove;
          return { ...column, tasks: column.tasks.filter((task) => task.id !== taskId) };
        });

        if (!movedTask) return board;
        const taskToInsert = movedTask as KanbanTask;

        return {
          ...board,
          columns: columnsWithoutTask.map((column) =>
            column.id === nextColumnId ? { ...column, tasks: [...column.tasks, taskToInsert] } : column
          ),
        };
      })
    );
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] gap-4 overflow-hidden p-4 lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-lg border border-[#d6e7df] bg-[#fbfff8] p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#66756f]">Kanban</p>
            <h2 className="text-base font-semibold text-[#17201e]">Boards</h2>
          </div>
          <button
            type="button"
            onClick={() => setBoardDialogOpen(true)}
            className="grid size-9 place-items-center rounded-md bg-[#17201e] text-white transition hover:bg-[#24312e]"
            aria-label="Create board"
            title="Create board"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {boards.map((board) => {
            const isActive = board.id === activeBoard.id;

            return (
              <button
                key={board.id}
                type="button"
                onClick={() => setActiveBoardId(board.id)}
                className={cn(
                  "flex w-full min-w-0 items-center gap-3 rounded-md border border-[#d6e7df] bg-white p-3 text-left transition hover:bg-[#f3fff9]",
                  isActive && "border-[#17201e] bg-[#eef8f3] shadow-sm"
                )}
              >
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: board.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#17201e]">{board.name}</span>
                  <span className="mt-0.5 block text-xs text-[#66756f]">
                    {board.columns.length} columns / {taskCount(board)} tasks
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="min-w-0 overflow-hidden rounded-lg border border-[#d6e7df] bg-[#fbfff8] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d6e7df] p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="size-4 shrink-0 rounded-full" style={{ backgroundColor: activeBoard.color }} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#66756f]">Selected board</p>
              <h2 className="truncate text-xl font-semibold text-[#17201e]">{activeBoard.name}</h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openColumnDialog()}
              disabled={activeBoard.columns.length >= 5}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d6e7df] bg-white px-3 text-sm font-semibold text-[#17201e] transition hover:bg-[#e8f6ef] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Column
            </button>
            <button
              type="button"
              onClick={() => openTaskDialog(activeBoard.columns[0].id)}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#ff6b4a] px-3 text-sm font-semibold text-white transition hover:bg-[#ef5d3d]"
            >
              <Plus className="size-4" aria-hidden="true" />
              Task
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid min-h-[calc(100vh-10rem)] min-w-[700px] auto-cols-[minmax(220px,1fr)] grid-flow-col gap-4 p-4">
            {activeBoard.columns.map((column) => (
              <div
                key={column.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const taskId = event.dataTransfer.getData("text/task-id") || draggingTaskId;
                  if (taskId) moveTask(taskId, column.id);
                  setDraggingTaskId(null);
                }}
                className="flex min-h-[520px] min-w-0 flex-col rounded-lg border border-[#d6e7df] bg-[#f4fbf7]"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#d6e7df] p-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-[#17201e]">{column.title}</h3>
                    <p className="text-xs text-[#66756f]">{column.tasks.length} tasks</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openTaskDialog(column.id)}
                      className="grid size-8 place-items-center rounded-md text-[#66756f] transition hover:bg-[#e8f6ef]"
                      aria-label={`Add task to ${column.title}`}
                      title="Add task"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openColumnDialog(column)}
                      className="grid size-8 place-items-center rounded-md text-[#66756f] transition hover:bg-[#e8f6ef]"
                      aria-label={`Edit ${column.title}`}
                      title="Edit column"
                    >
                      <Edit3 className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteColumn(column.id)}
                      disabled={activeBoard.columns.length <= 1}
                      className="grid size-8 place-items-center rounded-md text-[#c4442b] transition hover:bg-[#fff1ee] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Delete ${column.title}`}
                      title="Delete column"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  {column.tasks.map((task) => (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/task-id", task.id);
                        setDraggingTaskId(task.id);
                      }}
                      onDragEnd={() => setDraggingTaskId(null)}
                      className="cursor-grab rounded-md border border-[#d6e7df] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 size-4 shrink-0 text-[#9aa8a2]" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="min-w-0 text-sm font-semibold leading-5 text-[#17201e]">{task.title}</h4>
                            <button
                              type="button"
                              onClick={() => openTaskDialog(column.id, task)}
                              className="grid size-7 shrink-0 place-items-center rounded-md text-[#66756f] transition hover:bg-[#e8f6ef]"
                              aria-label={`Edit ${task.title}`}
                              title="Edit task"
                            >
                              <MoreHorizontal className="size-4" aria-hidden="true" />
                            </button>
                          </div>

                          {task.description && <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#66756f]">{task.description}</p>}

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <span
                              className="inline-flex h-6 max-w-full items-center rounded-md px-2 text-[11px] font-semibold text-white"
                              style={{ backgroundColor: task.labelColor }}
                            >
                              <span className="truncate">{task.label}</span>
                            </span>
                            <span className={cn("inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-semibold", priorityStyles[task.priority])}>
                              {task.priority}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#66756f]">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="size-3.5" aria-hidden="true" />
                              {formatDueDate(task.dueDate)}
                            </span>
                            {task.syncCalendar && (
                              <span className="inline-flex items-center gap-1 text-[#00a88f]">
                                <Check className="size-3.5" aria-hidden="true" />
                                Calendar
                              </span>
                            )}
                            {task.syncNotes && (
                              <span className="inline-flex items-center gap-1 text-[#6257f6]">
                                <Link2 className="size-3.5" aria-hidden="true" />
                                Notes
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}

                  {column.tasks.length === 0 && (
                    <button
                      type="button"
                      onClick={() => openTaskDialog(column.id)}
                      className="grid min-h-32 w-full place-items-center rounded-md border border-dashed border-[#c9ded5] bg-white/70 p-4 text-sm font-medium text-[#66756f] transition hover:border-[#acd8cb] hover:bg-white"
                    >
                      Add a task
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {boardDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#17201e]/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[440px] rounded-lg border border-[#d6e7df] bg-[#fbfff8] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#d6e7df] p-4">
              <div>
                <p className="text-xs font-medium text-[#66756f]">Create</p>
                <h2 className="text-lg font-semibold text-[#17201e]">New Kanban board</h2>
              </div>
              <button type="button" onClick={closeBoardDialog} className="grid size-8 place-items-center rounded-md text-[#66756f] transition hover:bg-[#e8f6ef]" aria-label="Close board dialog" title="Close">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <label className="block">
                <span className="text-xs font-semibold text-[#66756f]">Board name</span>
                <input
                  value={boardForm.name}
                  onChange={(event) => setBoardForm((current) => ({ ...current, name: event.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-[#d6e7df] bg-white px-3 text-sm text-[#17201e] outline-none transition focus:border-[#00a88f] focus:ring-2 focus:ring-[#00a88f]/20"
                  placeholder="Product roadmap"
                  autoFocus
                />
              </label>

              <div>
                <p className="text-xs font-semibold text-[#66756f]">Board color</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {boardColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBoardForm((current) => ({ ...current, color }))}
                      className={cn("grid size-8 place-items-center rounded-md border border-[#d6e7df] bg-white", boardForm.color === color && "border-[#17201e]")}
                      aria-label={`Use board color ${color}`}
                      title={color}
                    >
                      <span className="size-4 rounded-full" style={{ backgroundColor: color }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-[#d6e7df] p-4">
              <button
                type="button"
                onClick={createBoard}
                disabled={!boardForm.name.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[#ff6b4a] px-3 text-sm font-semibold text-white transition hover:bg-[#ef5d3d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="size-4" aria-hidden="true" />
                Create board
              </button>
            </div>
          </div>
        </div>
      )}

      {columnDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#17201e]/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-lg border border-[#d6e7df] bg-[#fbfff8] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#d6e7df] p-4">
              <div>
                <p className="text-xs font-medium text-[#66756f]">{editingColumnId ? "Edit" : "Create"}</p>
                <h2 className="text-lg font-semibold text-[#17201e]">{editingColumnId ? "Column" : "New column"}</h2>
              </div>
              <button type="button" onClick={closeColumnDialog} className="grid size-8 place-items-center rounded-md text-[#66756f] transition hover:bg-[#e8f6ef]" aria-label="Close column dialog" title="Close">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4">
              <label className="block">
                <span className="text-xs font-semibold text-[#66756f]">Column name</span>
                <input
                  value={columnName}
                  onChange={(event) => setColumnName(event.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-[#d6e7df] bg-white px-3 text-sm text-[#17201e] outline-none transition focus:border-[#00a88f] focus:ring-2 focus:ring-[#00a88f]/20"
                  placeholder="Review"
                  autoFocus
                />
              </label>
            </div>

            <div className="flex justify-end border-t border-[#d6e7df] p-4">
              <button
                type="button"
                onClick={saveColumn}
                disabled={!columnName.trim() || (!editingColumnId && activeBoard.columns.length >= 5)}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[#ff6b4a] px-3 text-sm font-semibold text-white transition hover:bg-[#ef5d3d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="size-4" aria-hidden="true" />
                Save column
              </button>
            </div>
          </div>
        </div>
      )}

      {taskDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#17201e]/35 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-[560px] overflow-hidden rounded-lg border border-[#d6e7df] bg-[#fbfff8] shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-[#d6e7df] p-4">
              <div>
                <p className="text-xs font-medium text-[#66756f]">{editingTask ? "Edit" : "Create"}</p>
                <h2 className="text-lg font-semibold text-[#17201e]">{editingTask ? "Task card" : "New task card"}</h2>
              </div>
              <button type="button" onClick={closeTaskDialog} className="grid size-8 place-items-center rounded-md text-[#66756f] transition hover:bg-[#e8f6ef]" aria-label="Close task dialog" title="Close">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-132px)] space-y-4 overflow-y-auto p-4">
              <label className="block">
                <span className="text-xs font-semibold text-[#66756f]">Title</span>
                <input
                  value={taskForm.title}
                  onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                  className="mt-1 h-10 w-full rounded-md border border-[#d6e7df] bg-white px-3 text-sm text-[#17201e] outline-none transition focus:border-[#00a88f] focus:ring-2 focus:ring-[#00a88f]/20"
                  placeholder="Write task title"
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-[#66756f]">Description</span>
                <textarea
                  value={taskForm.description}
                  onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
                  className="mt-1 min-h-24 w-full resize-none rounded-md border border-[#d6e7df] bg-white px-3 py-2 text-sm text-[#17201e] outline-none transition focus:border-[#00a88f] focus:ring-2 focus:ring-[#00a88f]/20"
                  placeholder="Task details, links, or next steps"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-[#66756f]">Due date</span>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-md border border-[#d6e7df] bg-white px-3 text-sm text-[#17201e] outline-none transition focus:border-[#00a88f] focus:ring-2 focus:ring-[#00a88f]/20"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-[#66756f]">Label</span>
                  <input
                    value={taskForm.label}
                    onChange={(event) => setTaskForm((current) => ({ ...current, label: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-md border border-[#d6e7df] bg-white px-3 text-sm text-[#17201e] outline-none transition focus:border-[#00a88f] focus:ring-2 focus:ring-[#00a88f]/20"
                    placeholder="Design"
                  />
                </label>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#66756f]">Priority</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {priorities.map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setTaskForm((current) => ({ ...current, priority }))}
                      className={cn(
                        "h-9 rounded-md border border-[#d6e7df] bg-white px-2 text-xs font-semibold text-[#66756f] transition hover:bg-[#e8f6ef]",
                        taskForm.priority === priority && "border-[#17201e] text-[#17201e] shadow-sm"
                      )}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#66756f]">Label color</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {labelColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTaskForm((current) => ({ ...current, labelColor: color }))}
                      className={cn("grid size-8 place-items-center rounded-md border border-[#d6e7df] bg-white", taskForm.labelColor === color && "border-[#17201e]")}
                      aria-label={`Use label color ${color}`}
                      title={color}
                    >
                      <span className="size-4 rounded-full" style={{ backgroundColor: color }} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex min-w-0 items-center gap-3 rounded-md border border-[#d6e7df] bg-white p-3">
                  <input
                    type="checkbox"
                    checked={taskForm.syncCalendar}
                    onChange={(event) => setTaskForm((current) => ({ ...current, syncCalendar: event.target.checked }))}
                    className="size-4 accent-[#00a88f]"
                  />
                  <span className="min-w-0 text-sm font-medium text-[#17201e]">Sync with Calendar</span>
                </label>
                <label className="flex min-w-0 items-center gap-3 rounded-md border border-[#d6e7df] bg-white p-3">
                  <input
                    type="checkbox"
                    checked={taskForm.syncNotes}
                    onChange={(event) => setTaskForm((current) => ({ ...current, syncNotes: event.target.checked }))}
                    className="size-4 accent-[#6257f6]"
                  />
                  <span className="min-w-0 text-sm font-medium text-[#17201e]">Link with Notes</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-2 border-t border-[#d6e7df] p-4">
              {editingTask ? (
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

              <button
                type="button"
                onClick={saveTask}
                disabled={!taskForm.title.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[#ff6b4a] px-3 text-sm font-semibold text-white transition hover:bg-[#ef5d3d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingTask ? <Save className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                {editingTask ? "Update task" : "Add task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




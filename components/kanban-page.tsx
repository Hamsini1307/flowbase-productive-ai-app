"use client";

import * as React from "react";
import {
  CalendarDays,
  Check,
  CornerDownRight,
  Edit3,
  GripVertical,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Save,
  Send,
  Trash2,
  Users,
  UserPlus,
  X,
  Trello,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { KanbanSkeleton } from "./loading-skeletons";
import {
  RoomProvider,
  useOthers,
  useMyPresence,
  useThreads,
  useCreateThread,
  useCreateComment,
  useUser,
} from "@liveblocks/react";
import { useUser as useClerkUser } from "@clerk/nextjs";

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
  members?: string[];
  tags?: string[];
  boardId?: string | null;
  columnId?: string | null;
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

type KanbanComment = {
  id: number;
  taskId: string;
  parentId: number | null;
  message: string;
  author: {
    id: number | null;
    name: string;
    email: string | null;
    imageUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
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

function taskCount(board: KanbanBoard, allTasks: KanbanTask[] = []) {
  const hasTasks = board.columns.some((col) => col.tasks !== undefined);
  if (hasTasks) {
    return board.columns.reduce((total, column) => total + (column.tasks?.length || 0), 0);
  }
  return allTasks.filter((t) => t.boardId === board.id).length;
}

function formatCommentTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

export function KanbanPage({
  sharedBoards,
  sharedBoardsLoading,
  activeBoardId,
  setActiveBoardId,
  onBoardsChange,
  sharedTasks,
  sharedTasksLoading,
  onTasksChange,
}: {
  sharedBoards?: any[];
  sharedBoardsLoading?: boolean;
  activeBoardId?: string;
  setActiveBoardId?: React.Dispatch<React.SetStateAction<string>>;
  onBoardsChange?: React.Dispatch<React.SetStateAction<any[]>>;
  sharedTasks?: any[];
  sharedTasksLoading?: boolean;
  onTasksChange?: React.Dispatch<React.SetStateAction<any[]>>;
} = {}) {
  const [localBoards, setLocalBoards] = React.useState<KanbanBoard[]>([]);
  const [localActiveBoardId, setLocalActiveBoardId] = React.useState<string>("");
  const [localLoading, setLocalLoading] = React.useState(true);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [boardForm, setBoardForm] = React.useState({ name: "", color: boardColors[0] });
  const [isSeeding, setIsSeeding] = React.useState(false);

  const boards = (sharedBoards as KanbanBoard[]) ?? localBoards;
  const setBoards = (onBoardsChange as React.Dispatch<React.SetStateAction<KanbanBoard[]>>) ?? setLocalBoards;
  const activeBoardIdState = activeBoardId ?? localActiveBoardId;
  const setActiveBoardIdState = setActiveBoardId ?? setLocalActiveBoardId;
  const loading = sharedBoardsLoading ?? localLoading;

  React.useEffect(() => {
    if (sharedBoards !== undefined) return;
    async function loadBoards() {
      try {
        const res = await fetch("/api/kanban-boards");
        const data = await res.json();
        if (data.boards && data.boards.length > 0) {
          setLocalBoards(data.boards);
          setLocalActiveBoardId(data.boards[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLocalLoading(false);
      }
    }
    void loadBoards();
  }, [sharedBoards]);

  const handleCreateBoard = async () => {
    const boardName = boardForm.name.trim();
    if (!boardName) return;

    const newBoardId = makeId("board");
    const nextBoard = {
      id: newBoardId,
      name: boardName,
      color: boardForm.color,
      columns: createDefaultColumns(),
    };

    try {
      const res = await fetch("/api/kanban-boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextBoard),
      });
      if (!res.ok) throw new Error("Failed to create board");
      const data = await res.json();
      
      setBoards((current) => [...current, data.board]);
      setActiveBoardIdState(data.board.id);
      setIsCreateDialogOpen(false);
      setBoardForm({ name: "", color: boardColors[0] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadDemoData = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      const res = await fetch("/api/kanban-boards/seed", { method: "POST" });
      if (!res.ok) throw new Error("Failed to seed demo data");
      const data = await res.json();
      
      setBoards([data.board]);
      setActiveBoardIdState(data.board.id);
      if (onTasksChange) {
        onTasksChange(data.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) {
    return <KanbanSkeleton />;
  }

  if (boards.length === 0) {
    return (
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[#fbfff8] p-6 text-center">
        <div className="max-w-md rounded-lg border border-[#d6e7df] bg-white p-8 shadow-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#e8f6ef] text-[#00a88f]">
            <Trello className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-[#17201e]">Welcome!</h2>
          <p className="mt-2 text-sm text-[#66756f]">
            Create your first board or task to get started.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#ff6b4a] px-4 text-sm font-semibold text-white transition hover:bg-[#ef5d3d]"
            >
              <Plus className="size-4" />
              Create Board
            </button>
            <button
              disabled={isSeeding}
              onClick={handleLoadDemoData}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#d6e7df] bg-white px-4 text-sm font-semibold text-[#55645f] transition hover:bg-[#e8f6ef] disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              {isSeeding ? "Seeding..." : "Load Demo Data"}
            </button>
          </div>
        </div>

        {isCreateDialogOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[#17201e]/35 p-4 backdrop-blur-sm">
            <div className="w-full max-w-[440px] rounded-lg border border-[#d6e7df] bg-[#fbfff8] shadow-xl text-left">
              <div className="flex items-center justify-between border-b border-[#d6e7df] p-4">
                <div>
                  <p className="text-xs font-medium text-[#66756f]">Create</p>
                  <h2 className="text-lg font-semibold text-[#17201e]">New Kanban board</h2>
                </div>
                <button type="button" onClick={() => setIsCreateDialogOpen(false)} className="grid size-8 place-items-center rounded-md text-[#66756f] transition hover:bg-[#e8f6ef]" aria-label="Close board dialog" title="Close">
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
                  onClick={handleCreateBoard}
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
      </div>
    );
  }

  return (
    <RoomProvider id={`kanban-${activeBoardIdState}`} initialPresence={{ cursor: null, activeBoardId: activeBoardIdState }}>
      <KanbanBoardContent
        boards={boards}
        setBoards={setBoards}
        activeBoardId={activeBoardIdState}
        setActiveBoardId={setActiveBoardIdState}
        sharedTasks={sharedTasks}
        sharedTasksLoading={sharedTasksLoading}
        onTasksChange={onTasksChange}
      />
    </RoomProvider>
  );
}

function KanbanBoardContent({
  boards,
  setBoards,
  activeBoardId,
  setActiveBoardId,
  sharedTasks,
  sharedTasksLoading,
  onTasksChange,
}: {
  boards: KanbanBoard[];
  setBoards: React.Dispatch<React.SetStateAction<KanbanBoard[]>>;
  activeBoardId: string;
  setActiveBoardId: React.Dispatch<React.SetStateAction<string>>;
  sharedTasks?: any[];
  sharedTasksLoading?: boolean;
  onTasksChange?: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [boardDialogOpen, setBoardDialogOpen] = React.useState(false);
  const [columnDialogOpen, setColumnDialogOpen] = React.useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false);
  const [isSavingTask, setIsSavingTask] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<{ columnId: string; taskId: string } | null>(null);
  const [targetColumnId, setTargetColumnId] = React.useState("");
  const [editingColumnId, setEditingColumnId] = React.useState<string | null>(null);
  const [boardForm, setBoardForm] = React.useState<BoardForm>({ name: "", color: boardColors[0] });
  const [columnName, setColumnName] = React.useState("");
  const [taskForm, setTaskForm] = React.useState<TaskForm>(() => emptyTaskForm());
  const [draggingTaskId, setDraggingTaskId] = React.useState<string | null>(null);
  const [detailsTask, setDetailsTask] = React.useState<{ columnId: string; taskId: string } | null>(null);

  // Collaboration States
  const [collaborationDialogOpen, setCollaborationDialogOpen] = React.useState(false);
  const [shares, setShares] = React.useState<any[]>([]);
  const [sharesLoading, setSharesLoading] = React.useState(false);
  const [sharesError, setSharesError] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteLoading, setInviteLoading] = React.useState(false);
  const [inviteError, setInviteError] = React.useState("");

  // Liveblocks hooks
  const others = useOthers();
  const [, updateMyPresence] = useMyPresence();
  const { threads, isLoading: threadsLoading, error: threadsError } = useThreads();
  const createThread = useCreateThread();
  const [commentDraft, setCommentDraft] = React.useState("");
  const [savingComment, setSavingComment] = React.useState(false);

  // Tasks DB Sync State
  const [localTasks, setLocalTasks] = React.useState<KanbanTask[]>([]);
  const [localLoading, setLocalLoading] = React.useState(true);

  const tasks = (sharedTasks as KanbanTask[]) ?? localTasks;
  const setTasks = (onTasksChange as React.Dispatch<React.SetStateAction<KanbanTask[]>>) ?? setLocalTasks;
  const tasksLoading = sharedTasksLoading ?? localLoading;

  React.useEffect(() => {
    if (sharedTasks !== undefined) return;
    async function loadTasks() {
      try {
        const res = await fetch("/api/tasks");
        const data = await res.json();
        if (data.tasks) {
          setLocalTasks(data.tasks);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLocalLoading(false);
      }
    }
    void loadTasks();
  }, [sharedTasks]);

  const activeBoard = React.useMemo(() => {
    const board = boards.find((b) => b.id === activeBoardId) ?? boards[0];
    return {
      ...board,
      columns: board.columns.map((col) => ({
        ...col,
        tasks: tasks.filter((t) => t.boardId === board.id && t.columnId === col.id),
      })),
    };
  }, [boards, activeBoardId, tasks]);

  const selectedTask = React.useMemo(() => {
    if (!detailsTask) return null;

    return activeBoard.columns
      .find((column) => column.id === detailsTask.columnId)
      ?.tasks.find((task) => task.id === detailsTask.taskId) ?? null;
  }, [activeBoard, detailsTask]);

  // Derived comment counts from Liveblocks threads
  const calculatedCommentCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    threads?.forEach((t) => {
      const tId = t.metadata.taskId as string;
      if (tId) {
        counts[tId] = (counts[tId] || 0) + t.comments.length;
      }
    });
    return counts;
  }, [threads]);

  // Threads associated with the selected task
  const taskThreads = React.useMemo(() => {
    if (!selectedTask || !threads) return [];
    return threads.filter((t) => t.metadata.taskId === selectedTask.id);
  }, [threads, selectedTask]);

  // Load collaborators list from API
  const loadShares = React.useCallback(async (bId: string) => {
    setSharesLoading(true);
    setSharesError("");
    try {
      const response = await fetch(`/api/kanban-boards/shares?boardId=${encodeURIComponent(bId)}`);
      if (!response.ok) throw new Error("Failed to load collaborators.");
      const data = await response.json();
      setShares(data.shares);
    } catch (error: any) {
      setSharesError(error.message);
    } finally {
      setSharesLoading(false);
    }
  }, []);

  const inviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email || inviteLoading) return;

    setInviteLoading(true);
    setInviteError("");
    try {
      const response = await fetch("/api/kanban-boards/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId: activeBoard.id, email }),
      });
      if (!response.ok) throw new Error("Failed to share board.");
      const data = await response.json();
      
      setShares((current) => {
        if (current.some((s) => s.email.toLowerCase() === email)) return current;
        return [...current, data.share];
      });
      setInviteEmail("");
    } catch (error: any) {
      setInviteError(error.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const openTaskDetails = (columnId: string, taskId: string) => {
    if (draggingTaskId) return;
    setDetailsTask({ columnId, taskId });
    setCommentDraft("");
  };

  const closeTaskDetails = () => {
    setDetailsTask(null);
    setCommentDraft("");
  };

  const handlePostComment = async () => {
    const message = commentDraft.trim();
    if (!message || !selectedTask || savingComment) return;

    setSavingComment(true);
    try {
      await createThread({
        body: {
          version: 1,
          content: [{ type: "paragraph", children: [{ text: message }] }],
        },
        metadata: {
          taskId: selectedTask.id,
        },
      });
      setCommentDraft("");
    } catch (e) {
      console.error(e);
    } finally {
      setSavingComment(false);
    }
  };

  const renderLiveblocksThread = (thread: any) => {
    const rootComment = thread.comments[0];
    if (!rootComment) return null;

    const replies = thread.comments.slice(1);

    return (
      <div key={thread.id} className="rounded-lg border border-[#d6e7df] bg-white p-3 space-y-3">
        <CommentRow comment={rootComment} threadId={thread.id} isRoot={true} />
        {replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l border-[#e2ece7] pl-4">
            {replies.map((reply: any) => (
              <CommentRow key={reply.id} comment={reply} threadId={thread.id} isRoot={false} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const closeBoardDialog = () => {
    setBoardDialogOpen(false);
    setBoardForm({ name: "", color: boardColors[0] });
  };

  const createBoard = async () => {
    const boardName = boardForm.name.trim();
    if (!boardName) return;

    const newBoardId = makeId("board");
    const nextBoard = {
      id: newBoardId,
      name: boardName,
      color: boardForm.color,
      columns: createDefaultColumns(),
    };

    try {
      const res = await fetch("/api/kanban-boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextBoard),
      });
      if (!res.ok) throw new Error("Failed to create board");
      const data = await res.json();
      
      setBoards((current) => [...current, data.board]);
      setActiveBoardId(data.board.id);
      closeBoardDialog();
    } catch (err) {
      console.error(err);
    }
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

  const saveColumn = async () => {
    const nextName = columnName.trim();
    if (!nextName || !activeBoard) return;

    let updatedColumns = [...activeBoard.columns];
    if (editingColumnId) {
      updatedColumns = updatedColumns.map((col) =>
        col.id === editingColumnId ? { ...col, title: nextName } : col
      );
    } else {
      if (updatedColumns.length >= 5) return;
      updatedColumns.push({ id: makeId("column"), title: nextName, tasks: [] });
    }

    const updatedBoard = {
      ...activeBoard,
      columns: updatedColumns.map(c => ({ id: c.id, title: c.title })),
    } as any;

    try {
      const res = await fetch("/api/kanban-boards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBoard),
      });
      if (!res.ok) throw new Error("Failed to update board columns");
      const data = await res.json();

      setBoards((current) =>
        current.map((b) => (b.id === activeBoard.id ? data.board : b))
      );
      closeColumnDialog();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteColumn = async (columnId: string) => {
    if (!activeBoard || activeBoard.columns.length <= 1) return;

    const updatedColumns = activeBoard.columns
      .filter((col) => col.id !== columnId)
      .map(c => ({ id: c.id, title: c.title }));

    const updatedBoard = {
      ...activeBoard,
      columns: updatedColumns,
    } as any;

    try {
      const res = await fetch("/api/kanban-boards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBoard),
      });
      if (!res.ok) throw new Error("Failed to delete column");
      const data = await res.json();

      setBoards((current) =>
        current.map((b) => (b.id === activeBoard.id ? data.board : b))
      );
    } catch (err) {
      console.error(err);
    }
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

  const saveTask = async () => {
    const title = taskForm.title.trim();
    if (!targetColumnId || !title || !activeBoard || isSavingTask) return;

    setIsSavingTask(true);
    const taskPayload = {
      boardId: activeBoard.id,
      columnId: targetColumnId,
      title,
      description: taskForm.description.trim(),
      dueDate: taskForm.dueDate,
      priority: taskForm.priority,
      label: taskForm.label.trim() || "Task",
      labelColor: taskForm.labelColor,
      syncCalendar: taskForm.syncCalendar,
      syncNotes: taskForm.syncNotes,
      
      notes: taskForm.description.trim(),
      category: "Work",
      taskType: "Task",
      status: taskForm.syncCalendar ? "scheduled" : "draft",
    };

    try {
      if (editingTask) {
        const res = await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingTask.taskId, ...taskPayload }),
        });
        if (!res.ok) throw new Error("Failed to update task");
        const data = await res.json();

        setTasks((current) =>
          current.map((t) => (t.id === editingTask.taskId ? data.task : t))
        );
      } else {
        const newTaskId = makeId("task");
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: newTaskId, ...taskPayload }),
        });
        if (!res.ok) throw new Error("Failed to create task");
        const data = await res.json();

        setTasks((current) => [...current, data.task]);
      }
      closeTaskDialog();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingTask(false);
    }
  };

  const deleteTask = async () => {
    if (!editingTask) return;

    try {
      const res = await fetch(`/api/tasks?id=${encodeURIComponent(editingTask.taskId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");

      setTasks((current) => current.filter((t) => t.id !== editingTask.taskId));
      closeTaskDialog();
    } catch (err) {
      console.error(err);
    }
  };

  const moveTask = async (taskId: string, nextColumnId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, columnId: nextColumnId } : t))
    );

    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, columnId: nextColumnId }),
      });
      if (!res.ok) throw new Error("Failed to move task");
      const data = await res.json();

      setTasks((current) =>
        current.map((t) => (t.id === taskId ? data.task : t))
      );
    } catch (err) {
      console.error(err);
      setTasks((current) =>
        current.map((t) => (t.id === taskId ? { ...t, columnId: task.columnId } : t))
      );
    }
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
                    {board.columns.length} columns / {taskCount(board, tasks)} tasks
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

          <div className="flex flex-wrap items-center gap-3">
            {/* Active collaborators stack */}
            <ActiveCollaboratorsStack others={others} />

            {/* Collaboration settings trigger */}
            <button
              type="button"
              onClick={() => {
                setCollaborationDialogOpen(true);
                void loadShares(activeBoard.id);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d6e7df] bg-white px-3 text-xs sm:text-sm font-semibold text-[#17201e] transition hover:bg-[#e8f6ef]"
            >
              <Users className="size-4 text-[#66756f]" aria-hidden="true" />
              <span>Collaboration</span>
            </button>

            <button
              type="button"
              onClick={() => openColumnDialog()}
              disabled={activeBoard.columns.length >= 5}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d6e7df] bg-white px-3 text-xs sm:text-sm font-semibold text-[#17201e] transition hover:bg-[#e8f6ef] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Column
            </button>
            <button
              type="button"
              onClick={() => openTaskDialog(activeBoard.columns[0].id)}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#ff6b4a] px-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#ef5d3d]"
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
                      role="button"
                      tabIndex={0}
                      draggable
                      onClick={() => {
                        if (draggingTaskId) return;
                        openTaskDetails(column.id, task.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") openTaskDetails(column.id, task.id);
                      }}
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
                              onClick={(event) => {
                                event.stopPropagation();
                                openTaskDialog(column.id, task);
                              }}
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
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#eef8f3] px-1.5 py-0.5 text-[#557069]">
                              <MessageCircle className="size-3.5" aria-hidden="true" />
                              {calculatedCommentCounts[task.id] ?? 0}
                            </span>
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

      {detailsTask && selectedTask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#17201e]/35 p-4 backdrop-blur-sm" onClick={closeTaskDetails}>
          <div className="max-h-[92vh] w-full max-w-[760px] overflow-hidden rounded-lg border border-[#d6e7df] bg-[#fbfff8] shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-[#d6e7df] p-4">
              <div>
                <p className="text-xs font-medium text-[#66756f]">Task details</p>
                <h2 className="text-lg font-semibold text-[#17201e]">{selectedTask.title}</h2>
              </div>
              <button type="button" onClick={closeTaskDetails} className="grid size-8 place-items-center rounded-md text-[#66756f] transition hover:bg-[#e8f6ef]" aria-label="Close task details" title="Close">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-132px)] overflow-y-auto p-4">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="rounded-lg border border-[#d6e7df] bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-6 items-center rounded-md px-2 text-[11px] font-semibold text-white" style={{ backgroundColor: selectedTask.labelColor }}>
                        {selectedTask.label}
                      </span>
                      <span className={cn("inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-semibold", priorityStyles[selectedTask.priority])}>
                        {selectedTask.priority}
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-semibold text-[#17201e]">{selectedTask.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#66756f]">
                      {selectedTask.description || "No description provided for this task yet."}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md bg-[#f4fbf7] p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#66756f]">Due date</p>
                        <p className="mt-1 text-sm font-semibold text-[#17201e]">{formatDueDate(selectedTask.dueDate)}</p>
                      </div>
                      <div className="rounded-md bg-[#f4fbf7] p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#66756f]">Sync</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-sm text-[#17201e]">
                          {selectedTask.syncCalendar && <span className="rounded-full bg-[#eef8f3] px-2 py-0.5 text-[#00a88f]">Calendar</span>}
                          {selectedTask.syncNotes && <span className="rounded-full bg-[#eef8f3] px-2 py-0.5 text-[#6257f6]">Notes</span>}
                          {!selectedTask.syncCalendar && !selectedTask.syncNotes && <span className="text-[#66756f]">No sync enabled</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#d6e7df] bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-[#17201e]">Comments</h3>
                        <p className="text-sm text-[#66756f]">Keep context and follow-ups in one place.</p>
                      </div>
                      <span className="rounded-full bg-[#eef8f3] px-2.5 py-1 text-xs font-semibold text-[#557069]">
                        {taskThreads.length} threads
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {threadsLoading && <p className="text-sm text-[#66756f]">Loading comments…</p>}
                      {threadsError && <p className="text-sm text-[#c4442b]">Failed to load live comments.</p>}
                      {!threadsLoading && !threadsError && taskThreads.length === 0 && (
                        <p className="rounded-md border border-dashed border-[#c9ded5] bg-[#f4fbf7] p-3 text-sm text-[#66756f]">
                          No comments yet. Start the conversation below.
                        </p>
                      )}
                      {!threadsLoading && !threadsError && taskThreads.map((thread) => renderLiveblocksThread(thread))}
                    </div>

                    <div className="mt-4 rounded-lg border border-[#d6e7df] bg-[#f4fbf7] p-3">
                      <textarea
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        className="min-h-24 w-full resize-none rounded-md border border-[#d6e7df] bg-white px-3 py-2 text-sm text-[#17201e] outline-none transition focus:border-[#00a88f] focus:ring-2 focus:ring-[#00a88f]/20"
                        placeholder="Write a comment or update"
                      />
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={handlePostComment}
                          disabled={savingComment || !commentDraft.trim()}
                          className="inline-flex h-9 items-center gap-2 rounded-md bg-[#ff6b4a] px-3 text-sm font-semibold text-white transition hover:bg-[#ef5d3d] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send className="size-4" aria-hidden="true" />
                          {savingComment ? "Saving..." : "Post comment"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-[#d6e7df] bg-white p-4 shadow-sm">
                    <h3 className="text-base font-semibold text-[#17201e]">Task overview</h3>
                    <div className="mt-3 space-y-3 text-sm text-[#3f4f49]">
                      <div className="flex items-center justify-between gap-3 rounded-md bg-[#f4fbf7] px-3 py-2">
                        <span className="text-[#66756f]">Priority</span>
                        <span className="font-semibold text-[#17201e]">{selectedTask.priority}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-md bg-[#f4fbf7] px-3 py-2">
                        <span className="text-[#66756f]">Due date</span>
                        <span className="font-semibold text-[#17201e]">{formatDueDate(selectedTask.dueDate)}</span>
                      </div>
                      {selectedTask.members && selectedTask.members.length > 0 && (
                        <div className="rounded-md bg-[#f4fbf7] px-3 py-2">
                          <p className="text-[#66756f]">Assigned members</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedTask.members.map((member) => (
                              <span key={member} className="rounded-full border border-[#d6e7df] bg-white px-2.5 py-1 text-xs font-semibold text-[#17201e]">
                                {member}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(selectedTask.tags && selectedTask.tags.length > 0) || selectedTask.label ? (
                        <div className="rounded-md bg-[#f4fbf7] px-3 py-2">
                          <p className="text-[#66756f]">Labels / tags</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(selectedTask.tags && selectedTask.tags.length > 0 ? selectedTask.tags : [selectedTask.label]).map((tag) => (
                              <span key={tag} className="rounded-full border border-[#d6e7df] bg-white px-2.5 py-1 text-xs font-semibold text-[#17201e]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
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
                disabled={!taskForm.title.trim() || isSavingTask}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[#ff6b4a] px-3 text-sm font-semibold text-white transition hover:bg-[#ef5d3d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingTask ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {editingTask ? "Updating..." : "Creating Task..."}
                  </>
                ) : (
                  <>
                    {editingTask ? <Save className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                    {editingTask ? "Update task" : "Add task"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {collaborationDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#17201e]/35 p-4 backdrop-blur-sm" onClick={() => setCollaborationDialogOpen(false)}>
          <div className="w-full max-w-[480px] rounded-lg border border-[#d6e7df] bg-[#fbfff8] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#d6e7df] p-4">
              <div>
                <p className="text-xs font-medium text-[#66756f]">Settings</p>
                <h2 className="text-lg font-semibold text-[#17201e]">Board Collaboration</h2>
              </div>
              <button
                type="button"
                onClick={() => setCollaborationDialogOpen(false)}
                className="grid size-8 place-items-center rounded-md text-[#66756f] transition hover:bg-[#e8f6ef]"
                aria-label="Close dialog"
                title="Close"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Invite field */}
              <form onSubmit={inviteUser} className="space-y-2">
                <label htmlFor="invite-email" className="block text-xs font-semibold text-[#66756f]">
                  Invite collaborator by email
                </label>
                <div className="flex gap-2">
                  <input
                    id="invite-email"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-10 flex-1 rounded-md border border-[#d6e7df] bg-white px-3 text-sm text-[#17201e] outline-none transition focus:border-[#00a88f] focus:ring-2 focus:ring-[#00a88f]/20"
                    placeholder="colleague@example.com"
                  />
                  <button
                    type="submit"
                    disabled={inviteLoading || !inviteEmail.trim()}
                    className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#ff6b4a] px-4 text-sm font-semibold text-white transition hover:bg-[#ef5d3d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserPlus className="size-4" aria-hidden="true" />
                    {inviteLoading ? "Adding..." : "Invite"}
                  </button>
                </div>
                {inviteError && <p className="text-xs text-[#c4442b]">{inviteError}</p>}
              </form>

              {/* List of current shares */}
              <div>
                <h3 className="text-xs font-semibold text-[#66756f] uppercase tracking-wider mb-2">
                  People with access
                </h3>
                {sharesLoading && <p className="text-sm text-[#66756f]">Loading collaborators...</p>}
                {sharesError && <p className="text-sm text-[#c4442b]">{sharesError}</p>}
                {!sharesLoading && !sharesError && shares.length === 0 && (
                  <p className="text-sm text-[#66756f]">No collaborators registered for this board yet.</p>
                )}
                {!sharesLoading && !sharesError && (
                  <div className="divide-y divide-[#d6e7df] max-h-48 overflow-y-auto rounded-md border border-[#d6e7df] bg-white">
                    {shares.map((share) => (
                      <div key={share.id} className="flex items-center justify-between p-2.5">
                        <div className="flex items-center gap-3">
                          <div className="grid size-8 place-items-center rounded-full bg-[#eef8f3] text-xs font-semibold text-[#17201e]">
                            {share.imageUrl ? (
                              <img src={share.imageUrl} alt={share.name || share.email} className="size-8 rounded-full object-cover" />
                            ) : (
                              getInitials(share.name || share.email)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#17201e] truncate">
                              {share.name || "Guest Collaborator"}
                            </p>
                            <p className="text-[10px] text-[#66756f] truncate">{share.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] rounded-full bg-[#eef8f3] px-2 py-0.5 font-semibold text-[#557069]">
                          Collaborator
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Liveblocks custom comments rendering helper components/functions
function getCommentText(body: any): string {
  if (!body || !body.content) return "";
  return body.content
    .map((block: any) => {
      if (block.type === "paragraph" && block.children) {
        return block.children.map((child: any) => child.text || "").join("");
      }
      return "";
    })
    .join("\n");
}

function CommentRow({ comment, threadId, isRoot }: { comment: any; threadId: string; isRoot: boolean }) {
  const { user, isLoading } = useUser(comment.userId);
  const [replyDraft, setReplyDraft] = React.useState("");
  const [isReplying, setIsReplying] = React.useState(false);
  const [savingReply, setSavingReply] = React.useState(false);
  const createComment = useCreateComment();

  const name = user?.name || "Guest Collaborator";
  const avatar = user?.avatar || "";

  const handlePostReply = async () => {
    const message = replyDraft.trim();
    if (!message || savingReply) return;

    setSavingReply(true);
    try {
      await createComment({
        threadId,
        body: {
          version: 1,
          content: [{ type: "paragraph", children: [{ text: message }] }],
        },
      });
      setReplyDraft("");
      setIsReplying(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingReply(false);
    }
  };

  return (
    <div className={cn("flex items-start gap-3", !isRoot && "ml-4 border-l-2 border-l-[#c9ded5] pl-3")}>
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eef8f3] text-sm font-semibold text-[#17201e]">
        {avatar ? (
          <img src={avatar} alt={name} className="size-9 rounded-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[#17201e]">{name}</span>
          <span className="text-xs text-[#66756f]">{formatCommentTime(comment.createdAt)}</span>
        </div>
        <p className="mt-1 text-sm leading-6 text-[#3f4f49]">{getCommentText(comment.body)}</p>

        {isRoot && (
          <button
            type="button"
            onClick={() => setIsReplying((prev) => !prev)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#00a88f] transition hover:text-[#008a74]"
          >
            <CornerDownRight className="size-3.5" aria-hidden="true" />
            Reply
          </button>
        )}

        {isReplying && (
          <div className="mt-3 space-y-2 rounded-md border border-[#d6e7df] bg-[#f4fbf7] p-3">
            <textarea
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              className="min-h-20 w-full resize-none rounded-md border border-[#d6e7df] bg-white px-3 py-2 text-sm text-[#17201e] outline-none transition focus:border-[#00a88f] focus:ring-2 focus:ring-[#00a88f]/20"
              placeholder="Write a reply"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReplying(false)}
                className="inline-flex h-8 items-center rounded-md border border-[#d6e7df] bg-white px-3 text-xs font-semibold text-[#66756f] transition hover:bg-[#e8f6ef]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePostReply}
                disabled={savingReply || !replyDraft.trim()}
                className="inline-flex h-8 items-center gap-1 rounded-md bg-[#ff6b4a] px-3 text-xs font-semibold text-white transition hover:bg-[#ef5d3d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="size-3.5" aria-hidden="true" />
                Reply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveCollaboratorsStack({ others }: { others: readonly any[] }) {
  const { user: clerkUser } = useClerkUser();
  
  const currentUserName = clerkUser?.fullName || clerkUser?.primaryEmailAddress?.emailAddress || "Me";
  const currentUserAvatar = clerkUser?.imageUrl || "";

  const activeCollaborators = React.useMemo(() => {
    return others.map((o) => ({
      connectionId: o.connectionId,
      name: o.info?.name || "Guest Collaborator",
      avatar: o.info?.avatar || "",
    }));
  }, [others]);

  return (
    <div className="flex items-center -space-x-2 overflow-hidden mr-1">
      {/* Current user */}
      <div
        title={`${currentUserName} (You - Online)`}
        className="relative inline-block size-8 rounded-full ring-2 ring-white bg-[#eef8f3] text-xs font-semibold text-[#17201e]"
      >
        {currentUserAvatar ? (
          <img src={currentUserAvatar} alt={currentUserName} className="size-8 rounded-full object-cover" />
        ) : (
          <div className="grid size-8 place-items-center">{getInitials(currentUserName)}</div>
        )}
        <span className="absolute bottom-0 right-0 block size-2 rounded-full bg-[#80d77b] ring-1 ring-white" />
      </div>

      {/* Others */}
      {activeCollaborators.map((collab) => (
        <div
          key={collab.connectionId}
          title={`${collab.name} (Online)`}
          className="relative inline-block size-8 rounded-full ring-2 ring-white bg-[#fff1ee] text-xs font-semibold text-[#17201e]"
        >
          {collab.avatar ? (
            <img src={collab.avatar} alt={collab.name} className="size-8 rounded-full object-cover" />
          ) : (
            <div className="grid size-8 place-items-center">{getInitials(collab.name)}</div>
          )}
          <span className="absolute bottom-0 right-0 block size-2 rounded-full bg-[#80d77b] ring-1 ring-white" />
        </div>
      ))}
    </div>
  );
}








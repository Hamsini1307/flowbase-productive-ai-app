import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, kanbanBoards, kanbanTasks, users } from "@/db";
import { getCachedUser } from "@/lib/user-cache";

function todayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(amount: number) {
  const date = new Date();
  date.setDate(date.getDate() + amount);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST() {
  try {
    const { userId } = await auth();
    let email = "guest@example.com";
    let activeUserId = "guest-user";

    if (userId) {
      activeUserId = userId;
      const dbUser = await getCachedUser(userId);
      if (dbUser?.email) {
        email = dbUser.email.toLowerCase();
      } else {
        const clerkUser = await currentUser();
        if (clerkUser) {
          email = clerkUser.primaryEmailAddress?.emailAddress?.toLowerCase() || "guest@example.com";
        }
      }
    }

    const boardId = "board-launch-" + Math.random().toString(36).substring(2, 9);
    const todoCol = "todo-" + Math.random().toString(36).substring(2, 9);
    const progressCol = "progress-" + Math.random().toString(36).substring(2, 9);
    const doneCol = "done-" + Math.random().toString(36).substring(2, 9);

    const defaultBoard = {
      id: boardId,
      userId: activeUserId,
      name: "Launch Plan",
      color: "#ff6b4a",
      columns: [
        { id: todoCol, title: "Todo" },
        { id: progressCol, title: "In Progress" },
        { id: doneCol, title: "Done" },
      ],
    };

    // Insert board
    const [insertedBoard] = await db
      .insert(kanbanBoards)
      .values(defaultBoard)
      .returning();

    // Insert tasks
    const today = todayKey();
    const tomorrow = addDays(1);
    const seedSuffix = Math.random().toString(36).substring(2, 9);

    const defaultTasks = [
      // Kanban default tasks
      {
        id: `task-positioning-${seedSuffix}`,
        userId: activeUserId,
        boardId: boardId,
        columnId: todoCol,
        title: "Tighten homepage story",
        description: "Turn the rough launch notes into a clearer first-screen promise.",
        dueDate: today,
        priority: "High",
        label: "Copy",
        labelColor: "#ff6b4a",
        syncCalendar: true,
        syncNotes: true,
        time: "09:00",
        notes: "Turn the rough launch notes into a clearer first-screen promise.",
        status: "scheduled",
        category: "Work",
        taskType: "Task",
      },
      {
        id: `task-beta-${seedSuffix}`,
        userId: activeUserId,
        boardId: boardId,
        columnId: progressCol,
        title: "Review beta feedback",
        description: "Group the latest comments by urgency and product area.",
        dueDate: today,
        priority: "Medium",
        label: "Research",
        labelColor: "#6257f6",
        syncCalendar: false,
        syncNotes: true,
        time: "09:00",
        notes: "Group the latest comments by urgency and product area.",
        status: "scheduled",
        category: "Focus",
        taskType: "Task",
      },
      {
        id: `task-checklist-${seedSuffix}`,
        userId: activeUserId,
        boardId: boardId,
        columnId: doneCol,
        title: "Publish QA checklist",
        description: "Shared the final checklist with the launch room.",
        dueDate: today,
        priority: "Low",
        label: "Ops",
        labelColor: "#00a88f",
        syncCalendar: false,
        syncNotes: false,
        time: "09:00",
        notes: "Shared the final checklist with the launch room.",
        status: "scheduled",
        category: "Personal",
        taskType: "Task",
      },
      // Calendar default tasks
      {
        id: `task-cal-1-${seedSuffix}`,
        userId: activeUserId,
        title: "Weekly planning sync",
        category: "Meeting",
        taskType: "Task",
        date: today,
        time: "10:00",
        notes: "Review launch priorities.",
        status: "scheduled",
        dueDate: today,
        description: "Review launch priorities.",
      },
      {
        id: `task-cal-2-${seedSuffix}`,
        userId: activeUserId,
        title: "Template QA pass",
        category: "Work",
        taskType: "Task",
        date: tomorrow,
        time: "14:30",
        notes: "Check builder edge cases.",
        status: "scheduled",
        dueDate: tomorrow,
        description: "Check builder edge cases.",
      },
      {
        id: `task-cal-3-${seedSuffix}`,
        userId: activeUserId,
        title: "Moodboard cleanup",
        category: "Personal",
        taskType: "Task",
        time: "",
        notes: "Save references before scheduling.",
        status: "draft",
        description: "Save references before scheduling.",
      },
      {
        id: `task-cal-4-${seedSuffix}`,
        userId: activeUserId,
        title: "Send reminder summary",
        category: "Reminder",
        taskType: "Reminder",
        time: "09:00",
        notes: "Draft first, schedule after team review.",
        status: "draft",
        description: "Draft first, schedule after team review.",
      },
    ];

    const insertedTasks = await db
      .insert(kanbanTasks)
      .values(defaultTasks as any)
      .returning();

    return NextResponse.json({
      board: insertedBoard,
      tasks: insertedTasks,
    }, { status: 201 });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed demo data" }, { status: 500 });
  }
}

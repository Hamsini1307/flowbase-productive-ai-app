"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useAssemblyAIStreaming } from "@/hooks/use-assemblyai-streaming";
import {
  Folder,
  FileText,
  Plus,
  Search,
  Star,
  MoreVertical,
  LayoutGrid,
  List,
  ChevronDown,
  Trash2,
  Edit3,
  Check,
  ChevronRight,
  Archive,
  UserPlus,
  Move,
  Share2,
  Download,
  Copy,
  MessageSquare,
  Paperclip,
  Loader2,
  ArrowLeft,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  ListOrdered,
  FileCode,
  Mic
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Space {
  id: string;
  name: string;
  description: string;
  color: string;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SpacePage {
  id: string;
  spaceId: string;
  title: string;
  description: string;
  content: string;
  template: string;
  isFavorite: boolean;
  isArchived: boolean;
  updatedBy: string;
  commentsCount: number;
  linkedTasksCount: number;
  createdAt: string;
  updatedAt: string;
}

const spaceColors = [
  "#7c5dfa", // Soft Purple (Default)
  "#00a88f", // Teal
  "#ff6b4a", // Coral
  "#55c7f5", // Light Blue
  "#ffd166", // Yellow
  "#ff8ab3", // Pink
  "#80d77b"  // Green
];

const avatars = [
  { text: "JD", bg: "bg-purple-500" },
  { text: "AM", bg: "bg-teal-500" },
  { text: "SK", bg: "bg-coral-500" },
  { text: "TL", bg: "bg-blue-500" }
];

export function SpacesPage() {
  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [pages, setPages] = React.useState<SpacePage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"all" | "favorites" | "archived">("all");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"updated" | "name" | "pages">("updated");

  // Navigation state (Dont show spaces and pages at same time!)
  const [selectedSpaceId, setSelectedSpaceId] = React.useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = React.useState<string | null>(null);

  // Modals state
  const [newSpaceModalOpen, setNewSpaceModalOpen] = React.useState(false);
  const [newSpaceName, setNewSpaceName] = React.useState("");
  const [newSpaceDesc, setNewSpaceDesc] = React.useState("");
  const [newSpaceColor, setNewSpaceColor] = React.useState(spaceColors[0]);

  const [newPageModalOpen, setNewPageModalOpen] = React.useState(false);
  const [newPageTitle, setNewPageTitle] = React.useState("");
  const [newPageDesc, setNewPageDesc] = React.useState("");
  const [newPageTemplate, setNewPageTemplate] = React.useState("Blank Page");
  const [newPageSpaceId, setNewPageSpaceId] = React.useState("");

  // Edit states
  const [editingSpaceId, setEditingSpaceId] = React.useState<string | null>(null);
  const [editingSpaceName, setEditingSpaceName] = React.useState("");
  const [editingSpaceDesc, setEditingSpaceDesc] = React.useState("");

  const [editingPageId, setEditingPageId] = React.useState<string | null>(null);
  const [editingPageTitle, setEditingPageTitle] = React.useState("");
  const [editingPageDesc, setEditingPageDesc] = React.useState("");

  // Context menus
  const [activeSpaceMenu, setActiveSpaceMenu] = React.useState<string | null>(null);
  const [activePageMenu, setActivePageMenu] = React.useState<string | null>(null);

  // Editor and Auto-save states
  const [saving, setSaving] = React.useState(false);
  const [editorPageTitle, setEditorPageTitle] = React.useState("");
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const titleTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const triggerPageSave = (pageId: string, content: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch("/api/spaces/pages", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: pageId, content })
        });
        setPages((current) =>
          current.map((p) => (p.id === pageId ? { ...p, content } : p))
        );
      } catch (err) {
        console.error("Save content error:", err);
      } finally {
        setSaving(false);
      }
    }, 1200);
  };

  const handleManualSave = async (pageId: string) => {
    if (!editor) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    setSaving(true);
    try {
      const activeHTML = editor.getHTML();
      await fetch("/api/spaces/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pageId, content: activeHTML, title: editorPageTitle.trim() })
      });
      setPages((current) =>
        current.map((p) => (p.id === pageId ? { ...p, content: activeHTML, title: editorPageTitle.trim() } : p))
      );
    } catch (err) {
      console.error("Manual save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const triggerTitleSave = (pageId: string, title: string) => {
    if (titleTimeoutRef.current) {
      clearTimeout(titleTimeoutRef.current);
    }
    setSaving(true);
    titleTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/spaces/pages", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: pageId, title })
        });
        if (res.ok) {
          setPages((current) =>
            current.map((p) => (p.id === pageId ? { ...p, title } : p))
          );
        }
      } catch (err) {
        console.error("Save title error:", err);
      } finally {
        setSaving(false);
      }
    }, 1000);
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write the page. Use / for blocks, the mic for voice, or AI Refine on selected text.",
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      if (selectedPageId) {
        const newHTML = editor.getHTML();
        const activePage = pages.find((p) => p.id === selectedPageId);
        if (activePage && activePage.content !== newHTML) {
          triggerPageSave(selectedPageId, newHTML);
        }
      }
    },
  });

  const handleFinalTranscript = React.useCallback((text: string) => {
    if (!editor || !text.trim()) return;

    editor.chain()
      .focus()
      .insertContent(text + " ")
      .run();

    if (selectedPageId) {
      const updatedHTML = editor.getHTML();
      triggerPageSave(selectedPageId, updatedHTML);
    }
  }, [editor, selectedPageId]);

  const {
    isRecording,
    isConnecting,
    partialTranscript,
    error: streamingError,
    startRecording,
    stopRecording,
  } = useAssemblyAIStreaming({
    onFinalTranscript: handleFinalTranscript,
  });
  // Sync editor content when selected page changes
  React.useEffect(() => {
    if (editor && selectedPageId) {
      const activePage = pages.find((p) => p.id === selectedPageId);
      if (activePage) {
        const currentHTML = editor.getHTML();
        if (currentHTML !== activePage.content) {
          editor.commands.setContent(activePage.content || "<p></p>");
        }
        setEditorPageTitle(activePage.title);
      }
    }
  }, [selectedPageId, editor]);

  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    };
  }, []);

  const getWordCount = () => {
    if (!editor) return 0;
    const text = editor.getText();
    const cleanText = text.trim();
    if (!cleanText) return 0;
    return cleanText.split(/\s+/).length;
  };

  // Fetch Spaces & Pages
  const fetchAllData = React.useCallback(async () => {
    try {
      const [spacesRes, pagesRes] = await Promise.all([
        fetch("/api/spaces"),
        fetch("/api/spaces/pages")
      ]);

      if (spacesRes.ok && pagesRes.ok) {
        const spacesData = await spacesRes.json();
        const pagesData = await pagesRes.json();

        const fetchedSpaces = spacesData.spaces || [];
        const fetchedPages = pagesData.pages || [];

        // Seed default template data if completely empty (remove static dummy data requirement)
        if (fetchedSpaces.length === 0) {
          await seedDefaultSpacesAndPages();
        } else {
          setSpaces(fetchedSpaces);
          setPages(fetchedPages);
        }
      }
    } catch (error) {
      console.error("Failed to load Spaces & Pages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchAllData();
  }, [fetchAllData]);

  // Seeding helper
  const seedDefaultSpacesAndPages = async () => {
    const defaultSpaces = [
      { id: "space-1", name: "Productivity Hub", description: "Daily planning, notes, tasks, and productivity workflows.", color: "#7c5dfa" },
      { id: "space-2", name: "Work Projects", description: "Project plans, documentation, and team collaboration.", color: "#00a88f" },
      { id: "space-3", name: "Personal", description: "Personal notes, goals, and life organization.", color: "#ff6b4a" },
      { id: "space-4", name: "Learning & Growth", description: "Courses, books, and research notes.", color: "#55c7f5" },
      { id: "space-5", name: "Ideas & Research", description: "Brainstorming, references, and future ideas.", color: "#ffd166" },
      { id: "space-6", name: "Archive", description: "Old projects and completed work.", color: "#80d77b", isArchived: true }
    ];

    const defaultPages = [
      { id: "page-1", spaceId: "space-1", title: "Daily Standup", template: "Meeting Notes", description: "Standup minutes and blockers tracker.", updatedBy: "JD" },
      { id: "page-2", spaceId: "space-1", title: "Weekly Planner", template: "Task Plan", description: "Goals and work tasks for the active sprint.", updatedBy: "AM" },
      { id: "page-3", spaceId: "space-2", title: "Q2 Roadmap", template: "Project Plan", description: "Deliverables calendar and feature milestones.", updatedBy: "JD" },
      { id: "page-4", spaceId: "space-2", title: "Sprint Planning", template: "Planning", description: "Tasks backlog sizing and target velocity.", updatedBy: "AM" },
      { id: "page-5", spaceId: "space-2", title: "Project PRD", template: "PRD", description: "Core product requirements document for release.", updatedBy: "TL" },
      { id: "page-6", spaceId: "space-2", title: "Resources & Links", template: "Reference", description: "Wiki resources and repository directories.", updatedBy: "SK" },
      { id: "page-7", spaceId: "space-3", title: "Fitness Goals", template: "Blank Page", description: "Workout split and calorie logging.", updatedBy: "JD" },
      { id: "page-8", spaceId: "space-3", title: "Reading List", template: "Blank Page", description: "Books to finish this quarter.", updatedBy: "JD" }
    ];

    try {
      // Post all spaces
      for (const space of defaultSpaces) {
        await fetch("/api/spaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(space)
        });
      }

      // Post all pages
      for (const page of defaultPages) {
        await fetch("/api/spaces/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(page)
        });
      }

      // Refetch
      const [spacesRes, pagesRes] = await Promise.all([
        fetch("/api/spaces"),
        fetch("/api/spaces/pages")
      ]);
      if (spacesRes.ok && pagesRes.ok) {
        const spacesData = await spacesRes.json();
        const pagesData = await pagesRes.json();
        setSpaces(spacesData.spaces || []);
        setPages(pagesData.pages || []);
      }
    } catch (e) {
      console.error("Error seeding spaces:", e);
    }
  };

  // 1. Spaces CRUD actions
  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) return;
    const newId = `space-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newId,
          name: newSpaceName.trim(),
          description: newSpaceDesc.trim(),
          color: newSpaceColor
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSpaces((current) => [data.space, ...current]);
        setNewSpaceModalOpen(false);
        setNewSpaceName("");
        setNewSpaceDesc("");
      }
    } catch (err) {
      console.error("Create space error:", err);
    }
  };

  const handleUpdateSpace = async (id: string, updates: Partial<Space>) => {
    try {
      const res = await fetch("/api/spaces", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });

      if (res.ok) {
        const data = await res.json();
        setSpaces((current) => current.map((s) => (s.id === id ? data.space : s)));
        setEditingSpaceId(null);
      }
    } catch (err) {
      console.error("Update space error:", err);
    }
  };

  const handleDeleteSpace = async (id: string) => {
    try {
      const res = await fetch(`/api/spaces?id=${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setSpaces((current) => current.filter((s) => s.id !== id));
        setPages((current) => current.filter((p) => p.spaceId !== id));
        if (selectedSpaceId === id) {
          setSelectedSpaceId(null);
          setSelectedPageId(null);
        }
      }
    } catch (err) {
      console.error("Delete space error:", err);
    }
  };

  // 2. Pages CRUD actions
  const handleCreatePage = async () => {
    if (!newPageTitle.trim() || !newPageSpaceId) return;
    const newId = `page-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await fetch("/api/spaces/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newId,
          spaceId: newPageSpaceId,
          title: newPageTitle.trim(),
          description: newPageDesc.trim(),
          template: newPageTemplate,
          updatedBy: "JD"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPages((current) => [data.page, ...current]);
        setNewPageModalOpen(false);
        setNewPageTitle("");
        setNewPageDesc("");
        setNewPageTemplate("Blank Page");
        
        // Auto-select and open in editor
        setSelectedSpaceId(data.page.spaceId);
        setSelectedPageId(data.page.id);
      }
    } catch (err) {
      console.error("Create page error:", err);
    }
  };

  const handleUpdatePage = async (id: string, updates: Partial<SpacePage>) => {
    try {
      const res = await fetch("/api/spaces/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });

      if (res.ok) {
        const data = await res.json();
        setPages((current) => current.map((p) => (p.id === id ? data.page : p)));
        setEditingPageId(null);
      }
    } catch (err) {
      console.error("Update page error:", err);
    }
  };

  const handleDeletePage = async (id: string) => {
    try {
      const res = await fetch(`/api/spaces/pages?id=${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setPages((current) => current.filter((p) => p.id !== id));
        if (selectedPageId === id) {
          setSelectedPageId(null);
        }
      }
    } catch (err) {
      console.error("Delete page error:", err);
    }
  };

  // Close menus on click outside
  React.useEffect(() => {
    const handleOutsideClick = () => {
      setActiveSpaceMenu(null);
      setActivePageMenu(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Filter and Sort calculation for spaces
  const filteredSpaces = React.useMemo(() => {
    let result = spaces;

    // Filter by tab
    if (activeTab === "favorites") {
      result = result.filter((s) => s.isFavorite);
    } else if (activeTab === "archived") {
      result = result.filter((s) => s.isArchived);
    } else {
      result = result.filter((s) => !s.isArchived);
    }

    // Search query (search spaces by name/description, and page titles!)
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter((s) => {
        const matchesSpace =
          s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
        const matchesPages = pages.some(
          (p) => p.spaceId === s.id && p.title.toLowerCase().includes(q)
        );
        return matchesSpace || matchesPages;
      });
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "pages") {
        const aCount = pages.filter((p) => p.spaceId === a.id).length;
        const bCount = pages.filter((p) => p.spaceId === b.id).length;
        return bCount - aCount;
      } else {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }, [spaces, pages, activeTab, searchQuery, sortBy]);

  // Space active detailed breadcrumb
  const activeSpace = React.useMemo(() => {
    return spaces.find((s) => s.id === selectedSpaceId) || null;
  }, [spaces, selectedSpaceId]);

  // Space detail page filter
  const activeSpacePages = React.useMemo(() => {
    if (!selectedSpaceId) return [];
    let result = pages.filter((p) => p.spaceId === selectedSpaceId && !p.isArchived);

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }

    return result;
  }, [pages, selectedSpaceId, searchQuery]);

  // Selected preview page details
  const activePageDetail = React.useMemo(() => {
    return pages.find((p) => p.id === selectedPageId) || null;
  }, [pages, selectedPageId]);

  // Date format helper
  const formatUpdateDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const diffMins = Math.floor(diff / 60000);
    const diffHours = Math.floor(diff / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[#fbfbfd]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#7c5dfa]" />
          <p className="text-sm font-semibold text-[#666]">Loading Pages & Spaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#fbfbfd] p-6 lg:p-8 font-sans">
      {/* 1. ALL SPACES DIRECTORY (Dont show spaces and pages at same time!) */}
      {!selectedSpaceId ? (
        <div className="space-y-6">
          {/* Header Area */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#17201e] flex items-center gap-2.5">
                All Spaces
                <span className="text-sm font-medium text-purple-600 bg-[#eae6ff] px-2 py-0.5 rounded-full">
                  {spaces.filter((s) => !s.isArchived).length} spaces
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">Organize your files, plans, and wikis into spaces.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setNewPageSpaceId(spaces[0]?.id || "");
                  setNewPageModalOpen(true);
                }}
                disabled={spaces.length === 0}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d6e7df] bg-white px-4 text-sm font-semibold text-[#17201e] shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
              >
                <Plus className="size-4 text-purple-600" />
                New Page
              </button>

              <button
                onClick={() => setNewSpaceModalOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#7c5dfa] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6c4ee0]"
              >
                <Plus className="size-4" />
                New Space
              </button>
            </div>
          </div>

          {/* Filtering, Search & Layout controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-1 bg-gray-100/70 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition",
                  activeTab === "all" ? "bg-white text-[#17201e] shadow-sm" : "text-[#55645f]"
                )}
              >
                All Spaces
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition",
                  activeTab === "favorites" ? "bg-white text-[#17201e] shadow-sm" : "text-[#55645f]"
                )}
              >
                Favorites
              </button>
              <button
                onClick={() => setActiveTab("archived")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition",
                  activeTab === "archived" ? "bg-white text-[#17201e] shadow-sm" : "text-[#55645f]"
                )}
              >
                Archived
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search spaces/pages */}
              <div className="relative flex items-center rounded-md border border-gray-200 bg-white px-2.5 shadow-sm">
                <Search className="size-4 text-gray-400 shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search spaces or pages..."
                  className="h-9 w-60 bg-transparent pl-2 text-xs text-[#17201e] outline-none"
                />
              </div>

              {/* Sorting options */}
              <div className="flex items-center gap-1 text-xs border border-gray-200 rounded-md bg-white px-2 py-1.5 shadow-sm">
                <span className="text-gray-400 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-semibold text-[#17201e] outline-none cursor-pointer"
                >
                  <option value="updated">Recently Updated</option>
                  <option value="name">Name</option>
                  <option value="pages">Most Pages</option>
                </select>
              </div>

              {/* Grid / List toggle */}
              <div className="flex items-center gap-0.5 border border-gray-200 rounded-md bg-white p-0.5 shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 rounded transition",
                    viewMode === "grid" ? "bg-gray-100 text-purple-600" : "text-[#55645f]"
                  )}
                  title="Grid View"
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 rounded transition",
                    viewMode === "list" ? "bg-gray-100 text-purple-600" : "text-[#55645f]"
                  )}
                  title="List View"
                >
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Directory Content (Grid / List) */}
          {filteredSpaces.length === 0 ? (
            <div className="py-24 text-center rounded-lg border-2 border-dashed border-gray-100 bg-white">
              <Folder className="mx-auto size-12 text-gray-300 stroke-[1.5]" />
              <h3 className="mt-4 text-sm font-bold text-gray-700">No spaces found</h3>
              <p className="mt-1 text-xs text-gray-400">Try adjusting your filters or search query.</p>
              <button
                onClick={() => setNewSpaceModalOpen(true)}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-purple-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700"
              >
                Create Space
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpaces.map((space) => {
                const spacePagesList = pages.filter((p) => p.spaceId === space.id && !p.isArchived);
                return (
                  <article
                    key={space.id}
                    onClick={() => setSelectedSpaceId(space.id)}
                    className="group relative flex flex-col justify-between cursor-pointer rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-purple-200"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div
                          className="flex size-10 items-center justify-center rounded-lg text-white"
                          style={{ backgroundColor: space.color }}
                        >
                          <Folder className="size-5 fill-white/20" />
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleUpdateSpace(space.id, { isFavorite: !space.isFavorite })}
                            className="p-1 rounded-md text-gray-400 hover:text-yellow-500 transition"
                          >
                            <Star
                              className={cn(
                                "size-4",
                                space.isFavorite && "fill-yellow-500 text-yellow-500"
                              )}
                            />
                          </button>

                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveSpaceMenu(activeSpaceMenu === space.id ? null : space.id)
                              }
                              className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-[#17201e]"
                            >
                              <MoreVertical className="size-4" />
                            </button>

                            {activeSpaceMenu === space.id && (
                              <div className="absolute right-0 mt-1 w-44 rounded-md border border-gray-200 bg-white p-1 shadow-lg z-20">
                                <button
                                  onClick={() => {
                                    setEditingSpaceId(space.id);
                                    setEditingSpaceName(space.name);
                                    setEditingSpaceDesc(space.description);
                                    setActiveSpaceMenu(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit3 className="size-3.5" />
                                  Rename Space
                                </button>
                                <button
                                  onClick={() => {
                                    handleUpdateSpace(space.id, { isArchived: !space.isArchived });
                                    setActiveSpaceMenu(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  <Archive className="size-3.5" />
                                  {space.isArchived ? "Restore Space" : "Archive Space"}
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete space "${space.name}"? This deletes all nested pages.`)) {
                                      handleDeleteSpace(space.id);
                                    }
                                    setActiveSpaceMenu(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="size-3.5" />
                                  Delete Space
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <h3 className="mt-4 text-base font-bold text-gray-900 group-hover:text-purple-600 truncate">
                        {space.name}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2 h-8">
                        {space.description || "No description provided."}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                      {/* Avatars row */}
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {avatars.slice(0, 3).map((av, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "flex size-6 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white",
                              av.bg
                            )}
                          >
                            {av.text}
                          </div>
                        ))}
                      </div>

                      <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1.5">
                        <span>{spacePagesList.length} Pages</span>
                        <span>•</span>
                        <span>Updated {formatUpdateDate(space.updatedAt)}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="rounded-lg border border-gray-100 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Space</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Pages</th>
                    <th className="p-4 text-right pr-6">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSpaces.map((space) => {
                    const spacePagesList = pages.filter((p) => p.spaceId === space.id && !p.isArchived);
                    return (
                      <tr
                        key={space.id}
                        onClick={() => setSelectedSpaceId(space.id)}
                        className="group cursor-pointer hover:bg-purple-50/20 transition"
                      >
                        <td className="p-4 pl-6 flex items-center gap-3">
                          <div
                            className="flex size-7 items-center justify-center rounded-md text-white"
                            style={{ backgroundColor: space.color }}
                          >
                            <Folder className="size-4" />
                          </div>
                          <span className="text-sm font-bold text-gray-900 group-hover:text-purple-600 truncate">
                            {space.name}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-500 truncate max-w-xs">
                          {space.description || "—"}
                        </td>
                        <td className="p-4 text-xs font-semibold text-gray-700">
                          {spacePagesList.length}
                        </td>
                        <td className="p-4 text-xs text-gray-400 text-right pr-6">
                          {formatUpdateDate(space.updatedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : selectedPageId ? (
        /* 3. PAGE EDITOR VIEW */
        <div className="space-y-6 animate-fadeIn">
          {/* Breadcrumbs & Header */}
          <div className="flex flex-col gap-2">
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <button
                onClick={() => setSelectedPageId(null)}
                className="inline-flex items-center gap-1 hover:text-purple-600 transition"
              >
                <ArrowLeft className="size-3.5" />
                Back to {activeSpace?.name}
              </button>
              <ChevronRight className="size-3" />
              <span className="text-gray-900 font-semibold">Pages</span>
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-3">
                <div
                  className="flex size-10 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: activeSpace?.color || "#7c5dfa" }}
                >
                  <Folder className="size-5 fill-white/20" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#17201e]">{activeSpace?.name}</h1>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {pages.filter((p) => p.spaceId === selectedSpaceId && !p.isArchived).length} pages
                  </p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Active Page Editing Title & Metadata Header */}
          {activePageDetail && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <input
                    value={editorPageTitle}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setEditorPageTitle(newTitle);
                      triggerTitleSave(activePageDetail.id, newTitle);
                    }}
                    className="text-2xl font-bold text-gray-900 border-none bg-transparent outline-none focus:ring-0 w-full"
                    placeholder="Untitled Page"
                  />
                  <div className="text-xs text-gray-400 font-medium mt-1">
                    {activePageDetail.template} • Updated {formatUpdateDate(activePageDetail.updatedAt)} • By {activePageDetail.updatedBy}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-400 font-semibold shrink-0">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] uppercase font-bold",
                    saving ? "bg-amber-50 text-amber-700 animate-pulse" : "bg-emerald-50 text-emerald-700"
                  )}>
                    {saving ? "Saving..." : "Saved"}
                  </span>
                  <span>{getWordCount()} words</span>

                  <button
                    onClick={() => handleManualSave(activePageDetail.id)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <Check className="size-3.5" />
                    Save
                  </button>

                  <button
                    onClick={() => {
                      const mockLink = `${window.location.origin}/spaces/page/${activePageDetail.id}`;
                      navigator.clipboard.writeText(mockLink);
                      alert(`Page sharing link copied to clipboard:\n${mockLink}`);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3.5 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    <Share2 className="size-3.5" />
                    Share
                  </button>

                  <button
                    onClick={() => {
                      setNewPageSpaceId(selectedSpaceId || "");
                      setNewPageModalOpen(true);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#7c5dfa] px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#6c4ee0]"
                  >
                    <Plus className="size-3.5" />
                    New Page
                  </button>
                </div>
              </div>

              {/* Streaming & live banners */}
              {streamingError && (
                <div className="flex items-center justify-between border border-red-200 rounded-lg px-4 py-2.5 bg-red-50 text-xs font-semibold text-red-600">
                  <span>Error: {streamingError}. Verify ASSEMBLYAI_API_KEY inside your .env file.</span>
                  <button onClick={() => stopRecording()} className="underline hover:text-red-700">Dismiss</button>
                </div>
              )}

              {(isRecording || partialTranscript) && (
                <div className="flex items-center gap-2 border border-purple-200 rounded-lg px-4 py-2.5 bg-[#eae6ff]/30 text-xs text-purple-700 animate-pulse">
                  <span className="size-2 rounded-full bg-red-500 animate-ping shrink-0" />
                  <span className="font-semibold shrink-0">Voice Typing:</span>
                  <span className="italic text-gray-900 truncate">{partialTranscript || "Listening to speech..."}</span>
                </div>
              )}

              {/* Editor Toolbar */}
              {editor && (
                <div className="flex flex-wrap items-center gap-1 rounded-t-xl border border-gray-100 border-b-0 px-4 py-2 bg-gray-50/50">
                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn("p-1.5 rounded text-[#55645f] hover:bg-gray-100", editor.isActive("bold") && "bg-gray-200 text-[#17201e]")}
                    title="Bold"
                  >
                    <Bold className="size-4" />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn("p-1.5 rounded text-[#55645f] hover:bg-gray-100", editor.isActive("italic") && "bg-gray-200 text-[#17201e]")}
                    title="Italic"
                  >
                    <Italic className="size-4" />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={cn("p-1.5 rounded text-[#55645f] hover:bg-gray-100", editor.isActive("strike") && "bg-gray-200 text-[#17201e]")}
                    title="Strikethrough"
                  >
                    <Strikethrough className="size-4" />
                  </button>
                  
                  <div className="h-4 w-px bg-gray-300 mx-1" />

                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={cn("p-1.5 rounded text-[#55645f] hover:bg-gray-100", editor.isActive("heading", { level: 1 }) && "bg-gray-200 text-[#17201e]")}
                    title="H1 Heading"
                  >
                    <Heading1 className="size-4" />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={cn("p-1.5 rounded text-[#55645f] hover:bg-gray-100", editor.isActive("heading", { level: 2 }) && "bg-gray-200 text-[#17201e]")}
                    title="H2 Heading"
                  >
                    <Heading2 className="size-4" />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={cn("p-1.5 rounded text-[#55645f] hover:bg-gray-100", editor.isActive("heading", { level: 3 }) && "bg-gray-200 text-[#17201e]")}
                    title="H3 Heading"
                  >
                    <Heading3 className="size-4" />
                  </button>

                  <div className="h-4 w-px bg-gray-300 mx-1" />

                  <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn("p-1.5 rounded text-[#55645f] hover:bg-gray-100", editor.isActive("bulletList") && "bg-gray-200 text-[#17201e]")}
                    title="Bullet List"
                  >
                    <List className="size-4" />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={cn("p-1.5 rounded text-[#55645f] hover:bg-gray-100", editor.isActive("orderedList") && "bg-gray-200 text-[#17201e]")}
                    title="Ordered List"
                  >
                    <ListOrdered className="size-4" />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={cn("p-1.5 rounded text-[#55645f] hover:bg-gray-100", editor.isActive("codeBlock") && "bg-gray-200 text-[#17201e]")}
                    title="Code Block"
                  >
                    <FileCode className="size-4" />
                  </button>

                  <div className="h-4 w-px bg-gray-300 mx-1" />

                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 px-3 text-xs font-bold rounded-md border transition shadow-sm shrink-0",
                      isRecording
                        ? "bg-red-50 border-red-200 text-red-600"
                        : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100"
                    )}
                    title={isRecording ? "Stop Speech Transcription" : "Speak to Page"}
                  >
                    {isConnecting ? (
                      <Loader2 className="size-3.5 animate-spin text-gray-500" />
                    ) : (
                      <div className="relative flex items-center justify-center">
                        <Mic className={cn("size-3.5", isRecording && "text-red-600")} />
                        {isRecording && (
                          <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-red-600/30 animate-ping" />
                        )}
                      </div>
                    )}
                    <span>
                      {isConnecting ? "Connecting..." : isRecording ? "Stop Voice" : "Voice"}
                    </span>
                  </button>
                </div>
              )}

              {/* Editor Workspace Content */}
              <div className="rounded-b-xl border border-gray-100 bg-white p-6 min-h-[400px] shadow-sm focus:outline-none">
                {editor && <EditorContent editor={editor} className="outline-none min-h-[350px]" />}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 2. PAGES DIRECTORY INSIDE ACTIVE SPACE */
        <div className="space-y-6">
          {/* Breadcrumbs & Header */}
          <div className="flex flex-col gap-2">
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <button onClick={() => { setSelectedSpaceId(null); setSelectedPageId(null); }} className="hover:text-purple-600 transition">
                All Spaces
              </button>
              <ChevronRight className="size-3" />
              <span className="text-gray-900 font-semibold">{activeSpace?.name}</span>
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-3.5">
                <div
                  className="flex size-11 items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ backgroundColor: activeSpace?.color || "#7c5dfa" }}
                >
                  <Folder className="size-5 fill-white/20" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#17201e]">{activeSpace?.name}</h1>
                  <p className="text-xs text-gray-400 mt-0.5">{activeSpacePages.length} Pages nested in this Space</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setNewPageSpaceId(selectedSpaceId);
                    setNewPageModalOpen(true);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-purple-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
                >
                  <Plus className="size-4" />
                  New Page
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Pages Table/List */}
            <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Page Name</th>
                    <th className="p-4">Type/Template</th>
                    <th className="p-4">Last Updated</th>
                    <th className="p-4">Updated By</th>
                    <th className="p-4 text-right pr-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeSpacePages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center text-xs text-gray-400 italic">
                        No pages inside this Space. Create a page to get started!
                      </td>
                    </tr>
                  ) : (
                    activeSpacePages.map((page) => (
                      <tr
                        key={page.id}
                        onClick={() => setSelectedPageId(page.id)}
                        className={cn(
                          "group cursor-pointer hover:bg-purple-50/10 transition",
                          selectedPageId === page.id && "bg-[#eae6ff]/30"
                        )}
                      >
                        <td className="p-4 pl-6 flex items-center gap-3">
                          <FileText className="size-4 text-purple-500" />
                          <span className="text-xs font-semibold text-gray-900 group-hover:text-purple-600 truncate max-w-[160px]">
                            {page.title}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center rounded bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                            {page.template}
                          </span>
                        </td>
                        <td className="p-4 text-[11px] text-gray-400">
                          {formatUpdateDate(page.updatedAt)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <div className="flex size-5 items-center justify-center rounded-full bg-purple-500 text-[8px] font-bold text-white">
                              {page.updatedBy}
                            </div>
                            <span className="text-[11px] text-gray-500 font-semibold">{page.updatedBy}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleUpdatePage(page.id, { isFavorite: !page.isFavorite })}
                            className="p-1 rounded-md text-gray-300 hover:text-yellow-500 transition mr-2"
                          >
                            <Star
                              className={cn(
                                "size-4.5",
                                page.isFavorite && "fill-yellow-500 text-yellow-500"
                              )}
                            />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Page Preview Panel */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
              {activePageDetail ? (
                <div className="space-y-5 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                      <span className="inline-flex items-center rounded-md bg-[#eae6ff] px-2.5 py-0.5 text-xs font-bold text-purple-700">
                        {activePageDetail.template}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {activeSpace?.name} Space
                      </span>
                    </div>

                    {editingPageId === activePageDetail.id ? (
                      <div className="space-y-3">
                        <input
                          value={editingPageTitle}
                          onChange={(e) => setEditingPageTitle(e.target.value)}
                          className="h-9 w-full rounded border border-gray-200 px-2.5 text-sm outline-none"
                        />
                        <textarea
                          value={editingPageDesc}
                          onChange={(e) => setEditingPageDesc(e.target.value)}
                          className="w-full h-20 rounded border border-gray-200 p-2.5 text-xs outline-none resize-none"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingPageId(null)}
                            className="h-8 rounded bg-gray-100 px-3 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() =>
                              handleUpdatePage(activePageDetail.id, {
                                title: editingPageTitle.trim(),
                                description: editingPageDesc.trim()
                              })
                            }
                            className="h-8 rounded bg-purple-600 px-3 text-xs font-semibold text-white hover:bg-purple-700 transition"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-900">{activePageDetail.title}</h2>
                        <p className="text-xs text-gray-500 leading-5">
                          {activePageDetail.description || "No preview description added."}
                        </p>
                      </div>
                    )}

                    {/* Meta stats */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <MessageSquare className="size-4 text-purple-400" />
                        <span>{activePageDetail.commentsCount} comments</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Paperclip className="size-4 text-purple-400" />
                        <span>{activePageDetail.linkedTasksCount} linked tasks</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Drawer */}
                  <div className="border-t border-gray-50 pt-4 mt-4 space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Page Actions</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setEditingPageId(activePageDetail.id);
                            setEditingPageTitle(activePageDetail.title);
                            setEditingPageDesc(activePageDetail.description);
                          }}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-xs font-bold text-[#55645f] shadow-sm hover:bg-gray-50 transition"
                        >
                          <Edit3 className="size-3.5" />
                          Rename
                        </button>

                        <button
                          onClick={() =>
                            handleUpdatePage(activePageDetail.id, {
                              isFavorite: !activePageDetail.isFavorite
                            }).then(() => fetchAllData())
                          }
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-xs font-bold text-[#55645f] shadow-sm hover:bg-gray-50 transition"
                        >
                          <Star className={cn("size-3.5", activePageDetail.isFavorite && "fill-yellow-500 text-yellow-500")} />
                          Favorite
                        </button>

                        <button
                          onClick={() => {
                            const dupId = `page-${Math.random().toString(36).substring(2, 9)}`;
                            void fetch("/api/spaces/pages", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                id: dupId,
                                spaceId: activePageDetail.spaceId,
                                title: `${activePageDetail.title} (Copy)`,
                                description: activePageDetail.description,
                                template: activePageDetail.template
                              })
                            }).then(() => fetchAllData());
                          }}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-xs font-bold text-[#55645f] shadow-sm hover:bg-gray-50 transition"
                        >
                          <Copy className="size-3.5" />
                          Duplicate
                        </button>

                        <button
                          onClick={() => {
                            const mockLink = `${window.location.origin}/spaces/page/${activePageDetail.id}`;
                            navigator.clipboard.writeText(mockLink);
                            alert(`Page sharing link copied to clipboard:\n${mockLink}`);
                          }}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-xs font-bold text-[#55645f] shadow-sm hover:bg-gray-50 transition"
                        >
                          <Share2 className="size-3.5" />
                          Share Link
                        </button>

                        <button
                          onClick={() => {
                            const data = JSON.stringify(activePageDetail, null, 2);
                            const blob = new Blob([data], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = `${activePageDetail.title.toLowerCase().replace(/\s+/g, "-")}-export.json`;
                            link.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-xs font-bold text-[#55645f] shadow-sm hover:bg-gray-50 transition"
                        >
                          <Download className="size-3.5" />
                          Export JSON
                        </button>

                        <button
                          onClick={() => {
                            handleUpdatePage(activePageDetail.id, { isArchived: !activePageDetail.isArchived }).then(() => {
                              setSelectedPageId(null);
                              fetchAllData();
                            });
                          }}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-xs font-bold text-[#55645f] shadow-sm hover:bg-gray-50 transition"
                        >
                          <Archive className="size-3.5" />
                          Archive
                        </button>

                        <button
                          onClick={() => {
                            if (confirm("Delete this page?")) {
                              handleDeletePage(activePageDetail.id).then(() => fetchAllData());
                            }
                          }}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-100 bg-red-50 text-xs font-bold text-red-600 shadow-sm hover:bg-red-100 transition"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </button>

                        <div className="relative">
                          <select
                            value={activePageDetail.spaceId}
                            onChange={(e) => {
                              const targetId = e.target.value;
                              if (targetId && targetId !== activePageDetail.spaceId) {
                                void handleUpdatePage(activePageDetail.id, { spaceId: targetId }).then(() => {
                                  setSelectedPageId(null);
                                  fetchAllData();
                                  alert(`Page moved to destination space successfully.`);
                                });
                              }
                            }}
                            className="w-full h-9 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-bold text-[#55645f] outline-none cursor-pointer"
                          >
                            <option value="" disabled>Move to Space...</option>
                            {spaces.map((s) => (
                              <option key={s.id} value={s.id}>
                                Move: {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {activeSpace && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Space Actions ({activeSpace.name})</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={async () => {
                              const newName = prompt("Rename Space:", activeSpace.name);
                              if (newName && newName.trim()) {
                                await handleUpdateSpace(activeSpace.id, { name: newName.trim() });
                                await fetchAllData();
                              }
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-xs font-bold text-[#55645f] shadow-sm hover:bg-gray-50 transition"
                          >
                            <Edit3 className="size-3.5" />
                            Rename Space
                          </button>

                          <button
                            onClick={async () => {
                              const currentIndex = spaceColors.indexOf(activeSpace.color);
                              const nextColor = spaceColors[(currentIndex + 1) % spaceColors.length];
                              await handleUpdateSpace(activeSpace.id, { color: nextColor });
                              await fetchAllData();
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-xs font-bold text-[#55645f] shadow-sm hover:bg-gray-50 transition"
                          >
                            <div className="size-3.5 rounded-full border border-gray-300" style={{ backgroundColor: activeSpace.color }} />
                            Change Color
                          </button>

                          <button
                            onClick={() => {
                              setNewPageSpaceId(activeSpace.id);
                              setNewPageModalOpen(true);
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-xs font-bold text-[#55645f] shadow-sm hover:bg-gray-50 transition"
                          >
                            <Plus className="size-3.5" />
                            Add Page
                          </button>

                          <button
                            onClick={() => {
                              const email = prompt(`Invite collaborators to "${activeSpace.name}". Enter email address:`);
                              if (email && email.trim()) {
                                alert(`Invitation successfully sent to ${email.trim()}!`);
                              }
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-xs font-bold text-[#55645f] shadow-sm hover:bg-gray-50 transition"
                          >
                            <UserPlus className="size-3.5" />
                            Invite
                          </button>

                          <button
                            onClick={async () => {
                              const newSpaceId = `space-${Math.random().toString(36).substring(2, 9)}`;
                              const spaceRes = await fetch("/api/spaces", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  id: newSpaceId,
                                  name: `${activeSpace.name} (Copy)`,
                                  description: activeSpace.description,
                                  color: activeSpace.color
                                })
                              });

                              if (spaceRes.ok) {
                                const spacePagesList = pages.filter((p) => p.spaceId === activeSpace.id);
                                for (const p of spacePagesList) {
                                  const newPageId = `page-${Math.random().toString(36).substring(2, 9)}`;
                                  await fetch("/api/spaces/pages", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      id: newPageId,
                                      spaceId: newSpaceId,
                                      title: p.title,
                                      description: p.description,
                                      template: p.template
                                    })
                                  });
                                }
                                await fetchAllData();
                                alert(`Space duplicated successfully!`);
                              }
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-xs font-bold text-[#55645f] shadow-sm hover:bg-gray-50 transition"
                          >
                            <Copy className="size-3.5" />
                            Duplicate
                          </button>

                          <button
                            onClick={async () => {
                              await handleUpdateSpace(activeSpace.id, { isArchived: true });
                              setSelectedSpaceId(null);
                              setSelectedPageId(null);
                              await fetchAllData();
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white text-xs font-bold text-[#55645f] shadow-sm hover:bg-gray-50 transition"
                          >
                            <Archive className="size-3.5" />
                            Archive Space
                          </button>

                          <button
                            onClick={async () => {
                              if (confirm(`Delete space "${activeSpace.name}"? This deletes all nested pages.`)) {
                                await handleDeleteSpace(activeSpace.id);
                                setSelectedSpaceId(null);
                                setSelectedPageId(null);
                                await fetchAllData();
                              }
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-100 bg-red-50 text-xs font-bold text-red-600 shadow-sm hover:bg-red-100 transition col-span-2"
                          >
                            <Trash2 className="size-3.5" />
                            Delete Space
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid place-items-center flex-1 text-center py-10">
                  <div className="space-y-1.5">
                    <FileText className="mx-auto size-9 text-gray-300 stroke-[1.5]" />
                    <h4 className="text-xs font-bold text-gray-600">Select a Page</h4>
                    <p className="text-[10px] text-gray-400">Click any page in the table to load its quick preview details.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. MODALS */}
      {/* Create Space Modal */}
      {newSpaceModalOpen && (
        <div className="fixed inset-0 grid place-items-center bg-black/40 z-50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#17201e]">Create New Space</h3>
              <button onClick={() => setNewSpaceModalOpen(false)} className="text-xs text-gray-400 hover:underline">
                Close
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Space Name</label>
              <input
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder="e.g. Sales Launch"
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-xs text-[#17201e] outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Short Description</label>
              <input
                value={newSpaceDesc}
                onChange={(e) => setNewSpaceDesc(e.target.value)}
                placeholder="Briefly state the goal of this space..."
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-xs text-[#17201e] outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Folder Theme Color</label>
              <div className="flex items-center gap-2 pt-1">
                {spaceColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewSpaceColor(color)}
                    className={cn(
                      "size-8 rounded-full border border-gray-300 hover:scale-105 transition relative flex items-center justify-center",
                      newSpaceColor === color && "ring-2 ring-purple-600 ring-offset-2"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateSpace}
              className="w-full h-10 rounded-md bg-[#7c5dfa] text-white text-xs font-semibold shadow transition hover:bg-[#6c4ee0]"
            >
              Create Space
            </button>
          </div>
        </div>
      )}

      {/* Create Page Modal */}
      {newPageModalOpen && (
        <div className="fixed inset-0 grid place-items-center bg-black/40 z-50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#17201e]">Create New Page</h3>
              <button onClick={() => setNewPageModalOpen(false)} className="text-xs text-gray-400 hover:underline">
                Close
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Page Name</label>
              <input
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                placeholder="e.g. Sales Metrics"
                className="w-full h-10 rounded-md border border-gray-200 px-3 text-xs text-[#17201e] outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Add to Space</label>
              <select
                value={newPageSpaceId}
                onChange={(e) => setNewPageSpaceId(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-200 px-2.5 text-xs text-[#17201e] bg-white outline-none"
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Template Type</label>
              <select
                value={newPageTemplate}
                onChange={(e) => setNewPageTemplate(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-200 px-2.5 text-xs text-[#17201e] bg-white outline-none"
              >
                <option value="Blank Page">Blank Page</option>
                <option value="Project Plan">Project Plan</option>
                <option value="Meeting Notes">Meeting Notes</option>
                <option value="PRD">PRD</option>
                <option value="Research Notes">Research Notes</option>
                <option value="Task Plan">Task Plan</option>
              </select>
            </div>

            <button
              onClick={handleCreatePage}
              className="w-full h-10 rounded-md bg-[#7c5dfa] text-white text-xs font-semibold shadow transition hover:bg-[#6c4ee0]"
            >
              Create Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bookmark,
  BookmarkCheck,
  Copy,
  FileText,
  FolderOpen,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Loader2,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Bold,
  Italic,
  Strikethrough,
  Code,
  FileCode,
  Palette,
  Pin,
  Check,
  ChevronDown,
  Edit3,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssemblyAIStreaming } from "@/hooks/use-assemblyai-streaming";

interface Note {
  id: string;
  title: string;
  content: string;
  icon: string;
  color: string;
  isPinned: boolean;
  isTrash: boolean;
  updatedAt: string;
}

const noteColors = [
  "#ff6b4a", // Coral
  "#00a88f", // Teal
  "#6257f6", // Indigo
  "#55c7f5", // Light Blue
  "#ffd166", // Yellow
  "#ff8ab3", // Pink
  "#80d77b", // Green
];

const noteIcons = ["📝", "💡", "📘", "📋", "🎯", "🚀", "🎨", "🏠", "💻", "💼"];

interface NotesPageProps {
  sharedNotes?: any[];
  sharedNotesLoading?: boolean;
}

export function NotesPage({
  sharedNotes,
  sharedNotesLoading
}: NotesPageProps = {}) {
  const [notesList, setNotesList] = React.useState<Note[]>(sharedNotes || []);
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(
    sharedNotes && sharedNotes.length > 0 ? (sharedNotes.find((n: any) => !n.isTrash)?.id || null) : null
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [loading, setLoading] = React.useState(
    sharedNotesLoading !== undefined ? sharedNotesLoading : (sharedNotes ? false : true)
  );
  const [saving, setSaving] = React.useState(false);
  const [showTrashOnly, setShowTrashOnly] = React.useState(false);
  const [activeNoteMenu, setActiveNoteMenu] = React.useState<string | null>(null);
  const [isAiRefining, setIsAiRefining] = React.useState(false);
  const [aiOptionOpen, setAiOptionOpen] = React.useState(false);

  // Slash commands state
  const [slashMenuOpen, setSlashMenuOpen] = React.useState(false);
  const [slashQuery, setSlashQuery] = React.useState("");
  const [slashPosition, setSlashPosition] = React.useState({ top: 0, left: 0 });

  // Load Notes
  React.useEffect(() => {
    if (sharedNotes) {
      setNotesList(sharedNotes);
      if (sharedNotes.length > 0 && !selectedNoteId) {
        const active = sharedNotes.find((n: any) => !n.isTrash);
        if (active) setSelectedNoteId(active.id);
      }
      setLoading(false);
      return;
    }

    async function fetchNotes() {
      try {
        const res = await fetch("/api/notes");
        if (res.ok) {
          const data = await res.json();
          setNotesList(data.notes || []);
          if (data.notes && data.notes.length > 0) {
            // Find first non-deleted note to select
            const active = data.notes.find((n: Note) => !n.isTrash);
            if (active) setSelectedNoteId(active.id);
          }
        }
      } catch (err) {
        console.error("Failed to load notes:", err);
      } finally {
        setLoading(false);
      }
    }
    void fetchNotes();
  }, [sharedNotes]);

  const activeNote = React.useMemo(() => {
    return notesList.find((n) => n.id === selectedNoteId) || null;
  }, [notesList, selectedNoteId]);

  // Debounced auto-save function
  const saveTimeoutRef = React.useRef<number | null>(null);
  const triggerAutoSave = React.useCallback((noteId: string, updates: Partial<Note>) => {
    setSaving(true);
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: noteId, ...updates }),
        });
        if (res.ok) {
          const data = await res.json();
          setNotesList((current) =>
            current.map((n) => (n.id === noteId ? data.note : n))
          );
        }
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setSaving(false);
      }
    }, 1000);
  }, []);

  // Initialize Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Press / for commands...",
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      if (activeNote) {
        const newContent = editor.getHTML();
        // Only trigger update if content actually changed
        if (activeNote.content !== newContent) {
          setNotesList((current) =>
            current.map((n) => (n.id === activeNote.id ? { ...n, content: newContent, updatedAt: new Date().toISOString() } : n))
          );
          triggerAutoSave(activeNote.id, { content: newContent });
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

    if (activeNote) {
      const updatedHTML = editor.getHTML();
      setNotesList((current) =>
        current.map((n) => (n.id === activeNote.id ? { ...n, content: updatedHTML, updatedAt: new Date().toISOString() } : n))
      );
      triggerAutoSave(activeNote.id, { content: updatedHTML });
    }
  }, [editor, activeNote, triggerAutoSave]);

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

  // Sync editor content when selected note changes
  React.useEffect(() => {
    if (editor && activeNote) {
      const currentContent = editor.getHTML();
      if (currentContent !== activeNote.content) {
        editor.commands.setContent(activeNote.content || "<p></p>");
      }
    }
  }, [selectedNoteId, editor]);

  // Watch keyup for slash commands trigger
  React.useEffect(() => {
    if (!editor) return;

    const handleKeyUp = () => {
      const { selection } = editor.state;
      const { $from } = selection;
      const textBefore = $from.nodeBefore?.text || "";
      const lastSlashIndex = textBefore.lastIndexOf("/");

      if (lastSlashIndex !== -1 && lastSlashIndex === textBefore.length - 1) {
        // Slash typed, open slash menu
        const view = editor.view;
        const startCoords = view.coordsAtPos($from.pos - 1);
        
        // Offset coords for floating menu
        const editorBounds = view.dom.getBoundingClientRect();
        setSlashPosition({
          top: startCoords.bottom - editorBounds.top + 10,
          left: startCoords.left - editorBounds.left,
        });
        setSlashMenuOpen(true);
        setSlashQuery("");
      } else if (slashMenuOpen) {
        // Track the text query after slash
        if (lastSlashIndex !== -1) {
          setSlashQuery(textBefore.slice(lastSlashIndex + 1));
        } else {
          setSlashMenuOpen(false);
        }
      }
    };

    editor.on("selectionUpdate", handleKeyUp);
    return () => {
      editor.off("selectionUpdate", handleKeyUp);
    };
  }, [editor, slashMenuOpen]);

  // Handle slash command click
  const executeSlashCommand = (command: string) => {
    if (!editor) return;

    editor.commands.focus();
    
    // Delete the slash trigger character
    const { selection } = editor.state;
    const { $from } = selection;
    const textBefore = $from.nodeBefore?.text || "";
    const lastSlashIndex = textBefore.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      editor.commands.deleteRange({
        from: $from.pos - (textBefore.length - lastSlashIndex),
        to: $from.pos,
      });
    }

    switch (command) {
      case "h1":
        editor.commands.toggleHeading({ level: 1 });
        break;
      case "h2":
        editor.commands.toggleHeading({ level: 2 });
        break;
      case "bullet":
        editor.commands.toggleBulletList();
        break;
      case "ordered":
        editor.commands.toggleOrderedList();
        break;
      case "codeblock":
        editor.commands.toggleCodeBlock();
        break;
      default:
        break;
    }

    setSlashMenuOpen(false);
  };

  // Close menus on click outside
  React.useEffect(() => {
    const handleOutsideClick = () => {
      setActiveNoteMenu(null);
      setSlashMenuOpen(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Create Note Action
  const handleCreateNote = async () => {
    const newId = `note-${Math.random().toString(36).substring(2, 9)}`;
    const newNoteObj = {
      id: newId,
      title: "Untitled Note",
      content: "<p></p>",
      icon: "📝",
      color: noteColors[Math.floor(Math.random() * noteColors.length)],
    };

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNoteObj),
      });
      if (res.ok) {
        const data = await res.json();
        setNotesList((current) => [data.note, ...current]);
        setSelectedNoteId(data.note.id);
        setShowTrashOnly(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Duplicate Note Action
  const handleDuplicateNote = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `note-${Math.random().toString(36).substring(2, 9)}`;
    const duplicatedObj = {
      id: newId,
      title: `Copy of ${note.title}`,
      content: note.content,
      icon: note.icon,
      color: note.color,
    };

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicatedObj),
      });
      if (res.ok) {
        const data = await res.json();
        setNotesList((current) => [data.note, ...current]);
        setSelectedNoteId(data.note.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Move to Trash / Restore Action
  const handleToggleTrash = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTrashState = !note.isTrash;
    
    // Optimistic UI update
    setNotesList((current) =>
      current.map((n) => (n.id === note.id ? { ...n, isTrash: nextTrashState } : n))
    );

    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, isTrash: nextTrashState }),
      });
      if (res.ok) {
        // If the currently selected note was trashed, select the next available note
        if (selectedNoteId === note.id) {
          const remaining = notesList.filter((n) => n.id !== note.id && (nextTrashState ? !n.isTrash : n.isTrash));
          setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Permanent Delete Action
  const handlePermanentDelete = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setNotesList((current) => current.filter((n) => n.id !== noteId));
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }

    try {
      const res = await fetch(`/api/notes?id=${encodeURIComponent(noteId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete note");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameNote = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTitle = prompt("Enter new title for the note:", note.title);
    if (newTitle === null) return;
    const finalTitle = newTitle.trim() || "Untitled Note";

    setNotesList((current) =>
      current.map((n) => (n.id === note.id ? { ...n, title: finalTitle } : n))
    );

    try {
      await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, title: finalTitle }),
      });
    } catch (err) {
      console.error(err);
    }
    setActiveNoteMenu(null);
  };

  // Toggle Favorite/Pin Action
  const handleTogglePin = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPinState = !note.isPinned;
    
    // Update local list
    setNotesList((current) =>
      current.map((n) => (n.id === note.id ? { ...n, isPinned: nextPinState } : n))
    );

    try {
      await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: note.id, isPinned: nextPinState }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Change Color Action
  const handleChangeColor = async (noteId: string, color: string) => {
    setNotesList((current) =>
      current.map((n) => (n.id === noteId ? { ...n, color } : n))
    );
    try {
      await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: noteId, color }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Change Icon Action
  const handleChangeIcon = async (noteId: string, icon: string) => {
    setNotesList((current) =>
      current.map((n) => (n.id === noteId ? { ...n, icon } : n))
    );
    try {
      await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: noteId, icon }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // AI Refine Action
  const handleAiRefine = async (option: string, tone?: string) => {
    if (!editor || isAiRefining || !activeNote) return;

    const targetNoteId = activeNote.id;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    if (!selectedText.trim()) return;

    setIsAiRefining(true);
    setAiOptionOpen(false);

    try {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText, option, tone }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Ensure user is still editing the same note and positions are valid
        if (selectedNoteId === targetNoteId && !editor.isDestroyed) {
          const docLength = editor.state.doc.content.size;
          const safeFrom = Math.max(0, Math.min(from, docLength));
          const safeTo = Math.max(0, Math.min(to, docLength));

          editor.chain()
            .focus()
            .insertContentAt({ from: safeFrom, to: safeTo }, data.text)
            .run();
        }
      }
    } catch (err) {
      console.error("AI refine request failed:", err);
    } finally {
      setIsAiRefining(false);
    }
  };

  // Filter Notes based on search & trash tab
  const filteredNotes = React.useMemo(() => {
    return notesList.filter((note) => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTrash = note.isTrash === showTrashOnly;
      return matchesSearch && matchesTrash;
    });
  }, [notesList, searchQuery, showTrashOnly]);

  const wordCount = React.useMemo(() => {
    if (!editor) return 0;
    const text = editor.getText();
    return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  }, [editor?.getText()]);

  // Format relative updated date
  const formatUpdatedDate = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[#fbfff8]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#00a88f]" />
          <p className="text-sm font-semibold text-[#66756f]">Loading Notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#fbfff8]">
      {/* LEFT SIDEBAR: Notes Panel */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-[#d6e7df] bg-white">
        {/* Sidebar Header */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#17201e] uppercase tracking-wider">Notes</h2>
            <button
              onClick={handleCreateNote}
              className="grid size-8 place-items-center rounded-md bg-[#ff6b4a] text-white shadow-sm transition hover:bg-[#ef5d3d]"
              title="New Note"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="relative flex items-center rounded-md border border-[#d6e7df] bg-white px-2.5">
            <Search className="size-4 text-[#66756f] shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="h-9 w-full bg-transparent pl-2 text-sm text-[#17201e] outline-none"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#66756f] italic">
              No notes found.
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={cn(
                  "group relative flex cursor-pointer flex-col rounded-md p-3 transition hover:bg-[#f1faf6]",
                  selectedNoteId === note.id ? "bg-[#e8f6ef] border-l-4" : "border-l-4 border-transparent"
                )}
                style={{ borderLeftColor: note.color }}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-base shrink-0">{note.icon}</span>
                    <span className="truncate text-sm font-semibold text-[#17201e]">
                      {note.title}
                    </span>
                  </div>
                  
                  {/* Actions buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                    <button
                      onClick={(e) => handleTogglePin(note, e)}
                      className={cn("p-1 rounded hover:bg-gray-200 text-[#66756f]", note.isPinned && "text-[#00a88f]")}
                      title={note.isPinned ? "Unpin" : "Pin note"}
                    >
                      <Pin className="size-3.5" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveNoteMenu(activeNoteMenu === note.id ? null : note.id);
                      }}
                      className="p-1 rounded hover:bg-gray-200 text-[#66756f]"
                    >
                      <MoreVertical className="size-3.5" />
                    </button>

                    {/* Note Context Menu */}
                    {activeNoteMenu === note.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-2 top-8 z-30 w-44 rounded-md border border-[#d6e7df] bg-white p-1 shadow-lg"
                      >
                        <button
                          onClick={(e) => handleRenameNote(note, e)}
                          className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                        >
                          <Edit3 className="size-3.5" />
                          Rename
                        </button>
                        <button
                          onClick={(e) => handleDuplicateNote(note, e)}
                          className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                        >
                          <Copy className="size-3.5" />
                          Duplicate
                        </button>
                        <button
                          onClick={(e) => handleToggleTrash(note, e)}
                          className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-[#c4442b] hover:bg-[#fff1ee]"
                        >
                          <Trash2 className="size-3.5" />
                          {note.isTrash ? "Restore" : "Move to Trash"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-[#66756f]">
                  <span>{formatUpdatedDate(note.updatedAt)}</span>
                  {note.isPinned && <span className="text-[10px] uppercase font-bold text-[#00a88f]">Pinned</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer: Trash Toggle */}
        <div className="border-t border-[#d6e7df] p-2 bg-gray-50/50">
          <button
            onClick={() => {
              setShowTrashOnly(!showTrashOnly);
              setSelectedNoteId(null);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition",
              showTrashOnly ? "bg-[#fff1ee] text-[#c4442b]" : "text-[#55645f] hover:bg-gray-100"
            )}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="size-4" />
              <span>Trash Bin</span>
            </div>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">
              {notesList.filter((n) => n.isTrash).length}
            </span>
          </button>
        </div>
      </aside>

      {/* RIGHT EDITOR PANEL */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Editor Title & Customization bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d6e7df] px-6 py-3 bg-[#fbfff8]/50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Custom note icon selection */}
                <div className="relative group shrink-0">
                  <button className="text-2xl hover:scale-110 transition duration-150 p-1 rounded-md bg-gray-150/50">
                    {activeNote.icon}
                  </button>
                  <div className="absolute left-0 top-10 z-40 hidden group-hover:grid grid-cols-5 gap-1.5 p-2 bg-white rounded-md border border-[#d6e7df] shadow-lg w-48">
                    {noteIcons.map((ico) => (
                      <button
                        key={ico}
                        onClick={() => handleChangeIcon(activeNote.id, ico)}
                        className="text-lg hover:bg-gray-100 rounded text-center p-0.5"
                      >
                        {ico}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editable note title */}
                <input
                  value={activeNote.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setNotesList((current) =>
                      current.map((n) => (n.id === activeNote.id ? { ...n, title: newTitle } : n))
                    );
                    triggerAutoSave(activeNote.id, { title: newTitle });
                  }}
                  className="text-lg font-bold text-[#17201e] bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-[#00a88f] flex-1 truncate transition"
                  placeholder="Untitled Note"
                />
              </div>

              {/* Note options (Pin/Trash/Colors) */}
              <div className="flex items-center gap-2">
                {/* Note Indicator Color Pick */}
                <div className="relative group">
                  <button className="grid size-8 place-items-center rounded-md border border-[#d6e7df] hover:bg-gray-100 transition" title="Choose color">
                    <Palette className="size-4 text-[#66756f]" />
                  </button>
                  <div className="absolute right-0 top-10 z-40 hidden group-hover:flex gap-1 p-2 bg-white rounded-md border border-[#d6e7df] shadow-lg">
                    {noteColors.map((col) => (
                      <button
                        key={col}
                        onClick={() => handleChangeColor(activeNote.id, col)}
                        className="size-5 rounded-full border border-gray-200 transition hover:scale-110"
                        style={{ backgroundColor: col }}
                      >
                        {activeNote.color === col && <Check className="size-3 mx-auto text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {!activeNote.isTrash && (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isConnecting}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition shadow-sm",
                      isRecording
                        ? "bg-[#fff1ee] border-[#ffd0c6] text-[#c4442b]"
                        : "bg-white border-[#d6e7df] text-[#55645f] hover:bg-gray-100"
                    )}
                  >
                    {isConnecting ? (
                      <Loader2 className="size-3.5 animate-spin text-[#66756f]" />
                    ) : (
                      <div className="relative flex items-center justify-center">
                        <Mic className={cn("size-3.5", isRecording && "text-[#c4442b]")} />
                        {isRecording && (
                          <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-[#ff6b4a]/30 animate-ping" />
                        )}
                      </div>
                    )}
                    <span>
                      {isConnecting ? "Connecting..." : isRecording ? "Stop Recording" : "Speak to Note"}
                    </span>
                  </button>
                )}

                {activeNote.isTrash ? (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleToggleTrash(activeNote, e)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#d6e7df] bg-white px-3 text-xs font-semibold text-[#00a88f] hover:bg-[#e8f6ef]"
                    >
                      <RotateCcw className="size-3.5" />
                      Restore
                    </button>
                    <button
                      onClick={(e) => handlePermanentDelete(activeNote.id, e)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#ffd0c6] bg-white px-3 text-xs font-semibold text-[#c4442b] hover:bg-[#fff1ee]"
                    >
                      <Trash2 className="size-3.5" />
                      Delete Permanently
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleTogglePin(activeNote, e)}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition",
                      activeNote.isPinned
                        ? "bg-[#e8f6ef] border-[#00a88f] text-[#00a88f]"
                        : "bg-white border-[#d6e7df] text-[#66756f] hover:bg-gray-100"
                    )}
                  >
                    <Pin className="size-3.5" />
                    {activeNote.isPinned ? "Pinned" : "Pin Note"}
                  </button>
                )}
              </div>
            </div>

            {/* Streaming error message */}
            {streamingError && (
              <div className="flex items-center justify-between border-b border-[#ffd0c6] px-6 py-2 bg-[#fff1ee] text-xs font-semibold text-[#c4442b]">
                <span>Error: {streamingError}. Please ensure ASSEMBLYAI_API_KEY is configured in your .env.</span>
                <button onClick={() => stopRecording()} className="underline hover:text-[#a03620]">Dismiss</button>
              </div>
            )}

            {/* Live Transcription Preview banner */}
            {(isRecording || partialTranscript) && (
              <div className="flex items-center gap-2 border-b border-[#d6e7df] px-6 py-2 bg-[#fbfff8] text-xs text-[#55645f] animate-pulse">
                <span className="size-2 rounded-full bg-[#c4442b]" />
                <span className="font-semibold shrink-0">Live Transcribing:</span>
                <span className="italic text-[#17201e] truncate">{partialTranscript || "Listening..."}</span>
              </div>
            )}

            {/* Static Editor Toolbar */}
            {editor && !activeNote.isTrash && (
              <div className="flex flex-wrap items-center gap-1 border-b border-[#d6e7df] px-6 py-2 bg-gray-50/50">
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
              </div>
            )}

            {/* Bubble Formatting Menu */}
            {editor && (
              <BubbleMenu editor={editor}>
                <div className="flex items-center gap-1 rounded-md border border-[#d6e7df] bg-white p-1 shadow-lg">
                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn("p-1 rounded hover:bg-[#f1faf6] text-sm", editor.isActive("bold") && "text-[#00a88f]")}
                  >
                    <Bold className="size-4" />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn("p-1 rounded hover:bg-[#f1faf6] text-sm", editor.isActive("italic") && "text-[#00a88f]")}
                  >
                    <Italic className="size-4" />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={cn("p-1 rounded hover:bg-[#f1faf6] text-sm", editor.isActive("strike") && "text-[#00a88f]")}
                  >
                    <Strikethrough className="size-4" />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={cn("p-1 rounded hover:bg-[#f1faf6] text-sm", editor.isActive("code") && "text-[#00a88f]")}
                  >
                    <Code className="size-4" />
                  </button>

                  <div className="h-4 w-px bg-gray-200 mx-1" />

                  {/* AI Refine button inside selection bubble menu */}
                  <div className="relative">
                    <button
                      onClick={() => setAiOptionOpen(!aiOptionOpen)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold text-white bg-[#6257f6] hover:bg-[#5246e5]",
                        isAiRefining && "opacity-50"
                      )}
                    >
                      <Sparkles className="size-3" />
                      {isAiRefining ? "Refining..." : "AI Refine"}
                      <ChevronDown className="size-3 ml-0.5" />
                    </button>

                    {aiOptionOpen && (
                      <div className="absolute left-0 top-7 z-50 w-44 rounded-md border border-[#d6e7df] bg-white p-1 shadow-lg text-left">
                        <button
                          onClick={() => handleAiRefine("grammar")}
                          className="flex w-full items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                        >
                          Improve Grammar
                        </button>
                        <button
                          onClick={() => handleAiRefine("rephrase")}
                          className="flex w-full items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                        >
                          Rephrase
                        </button>
                        <button
                          onClick={() => handleAiRefine("shorter")}
                          className="flex w-full items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                        >
                          Make Shorter
                        </button>
                        <button
                          onClick={() => handleAiRefine("longer")}
                          className="flex w-full items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                        >
                          Make Longer
                        </button>
                        <button
                          onClick={() => handleAiRefine("simplify")}
                          className="flex w-full items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                        >
                          Simplify Language
                        </button>
                        
                        <div className="border-t border-gray-150 my-1" />
                        <p className="px-2.5 py-0.5 text-[9px] font-bold text-gray-400 uppercase">Change Tone</p>
                        
                        <button
                          onClick={() => handleAiRefine("tone", "professional")}
                          className="flex w-full items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                        >
                          💼 Professional
                        </button>
                        <button
                          onClick={() => handleAiRefine("tone", "casual")}
                          className="flex w-full items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                        >
                          👋 Casual
                        </button>
                        <button
                          onClick={() => handleAiRefine("tone", "witty")}
                          className="flex w-full items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                        >
                          ✨ Creative / Witty
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </BubbleMenu>
            )}

            {/* Main Editor Text Area */}
            <div className="flex-1 overflow-y-auto px-10 py-6 prose max-w-none focus:outline-none">
              {activeNote.isTrash && (
                <div className="mb-4 rounded-md border border-[#ffd0c6] bg-[#fff1ee] p-3 text-center text-xs font-semibold text-[#c4442b]">
                  This note is in the Trash. Restore it to continue editing.
                </div>
              )}
              <EditorContent
                editor={editor}
                className={cn(
                  "min-h-[400px] outline-none text-[#17201e]",
                  activeNote.isTrash && "pointer-events-none opacity-60"
                )}
              />

              {/* Slash Command Floating Menu */}
              {slashMenuOpen && (
                <div
                  className="absolute z-50 w-56 rounded-md border border-[#d6e7df] bg-[#fbfff8] p-1 shadow-lg text-left"
                  style={{ top: `${slashPosition.top}px`, left: `${slashPosition.left}px` }}
                >
                  <p className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase">Blocks</p>
                  <button
                    onClick={() => executeSlashCommand("h1")}
                    className="flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                  >
                    <Heading1 className="size-4 text-gray-400" />
                    Heading 1
                  </button>
                  <button
                    onClick={() => executeSlashCommand("h2")}
                    className="flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                  >
                    <Heading2 className="size-4 text-gray-400" />
                    Heading 2
                  </button>
                  <button
                    onClick={() => executeSlashCommand("bullet")}
                    className="flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                  >
                    <List className="size-4 text-gray-400" />
                    Bullet List
                  </button>
                  <button
                    onClick={() => executeSlashCommand("ordered")}
                    className="flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                  >
                    <ListOrdered className="size-4 text-gray-400" />
                    Numbered List
                  </button>
                  <button
                    onClick={() => executeSlashCommand("codeblock")}
                    className="flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-xs font-semibold text-[#17201e] hover:bg-[#f1faf6]"
                  >
                    <FileCode className="size-4 text-gray-400" />
                    Code Block
                  </button>
                </div>
              )}
            </div>

            {/* Editor Footer / Info Status Bar */}
            <div className="flex items-center justify-between border-t border-[#d6e7df] px-6 py-2.5 text-xs text-[#55645f] bg-[#fbfff8]/50 select-none">
              <div className="flex items-center gap-3">
                {saving ? (
                  <span className="flex items-center gap-1.5 text-[#6257f6]">
                    <span className="size-1.5 animate-pulse rounded-full bg-[#6257f6]" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[#00a88f]">
                    <span className="size-1.5 rounded-full bg-[#00a88f]" />
                    Saved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span>{wordCount} words</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid place-items-center text-center p-8 bg-[#fbfff8]">
            <div className="max-w-xs space-y-3">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#e8f6ef] text-[#00a88f]">
                <FileText className="size-6" />
              </div>
              <h3 className="text-base font-semibold text-[#17201e]">No note open</h3>
              <p className="text-xs text-[#66756f] leading-5">
                Select a note from the left sidebar or create a new one to begin writing.
              </p>
              <button
                onClick={handleCreateNote}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#ff6b4a] px-4 text-xs font-semibold text-white transition hover:bg-[#ef5d3d] shadow-sm"
              >
                <Plus className="size-3.5" />
                Create New Note
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

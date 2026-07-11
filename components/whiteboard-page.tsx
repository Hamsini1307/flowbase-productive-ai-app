"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Palette,
  Plus,
  Search,
  Trash2,
  Download,
  Sparkles,
  Loader2,
  Edit3,
  Check,
  ChevronDown,
  RefreshCw,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "@excalidraw/excalidraw/index.css";

// Dynamic import of Excalidraw to prevent SSR failures
const Excalidraw = dynamic(
  async () => {
    const { Excalidraw } = await import("@excalidraw/excalidraw");
    return Excalidraw;
  },
  { ssr: false }
);

interface Whiteboard {
  id: string;
  name: string;
  color: string;
  elements: any[];
  appState: any;
  updatedAt: string;
}

const boardColors = [
  "#ff6b4a", // Coral
  "#00a88f", // Teal
  "#6257f6", // Indigo
  "#55c7f5", // Light Blue
  "#ffd166", // Yellow
  "#ff8ab3", // Pink
  "#80d77b", // Green
];

export function WhiteboardPage() {
  const [boards, setBoards] = React.useState<Whiteboard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [savingStatus, setSavingStatus] = React.useState<"Saved" | "Saving..." | "Error saving" | "Changes pending">("Saved");
  
  // Sidebar actions state
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renamingName, setRenamingName] = React.useState("");
  const [activeBoardMenu, setActiveBoardMenu] = React.useState<string | null>(null);

  // Excalidraw API instance
  const [excalidrawAPI, setExcalidrawAPI] = React.useState<any>(null);

  // AI Generator Dialog state
  const [aiModalOpen, setAiModalOpen] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiDiagType, setAiDiagType] = React.useState("flowchart");
  const [generatingAi, setGeneratingAi] = React.useState(false);

  // Custom Sticky Note dropdown state
  const [stickyDropdownOpen, setStickyDropdownOpen] = React.useState(false);

  // Load created whiteboards
  React.useEffect(() => {
    async function fetchBoards() {
      try {
        const res = await fetch("/api/whiteboards");
        if (res.ok) {
          const data = await res.json();
          setBoards(data.whiteboards || []);
          if (data.whiteboards && data.whiteboards.length > 0) {
            setSelectedBoardId(data.whiteboards[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load whiteboards:", err);
      } finally {
        setLoading(false);
      }
    }
    void fetchBoards();
  }, []);

  const activeBoard = React.useMemo(() => {
    return boards.find((b) => b.id === selectedBoardId) || null;
  }, [boards, selectedBoardId]);

  const lastSavedElementsRef = React.useRef<string>("");

  // Sync Excalidraw canvas content when selected whiteboard changes
  React.useEffect(() => {
    if (excalidrawAPI && activeBoard) {
      excalidrawAPI.updateScene({
        elements: activeBoard.elements || [],
        appState: {
          ...activeBoard.appState,
          collaborators: new Map(),
        },
      });
      lastSavedElementsRef.current = JSON.stringify(activeBoard.elements || []);
    }
  }, [selectedBoardId, excalidrawAPI]);

  // Debounced auto-save function
  const saveTimeoutRef = React.useRef<number | null>(null);
  const triggerAutoSave = React.useCallback((boardId: string, elements: any[], appState: any) => {
    setSavingStatus("Saving...");
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/whiteboards", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: boardId,
            elements,
            appState: {
              zoom: appState.zoom,
              scrollX: appState.scrollX,
              scrollY: appState.scrollY,
              theme: appState.theme,
              currentItemStrokeColor: appState.currentItemStrokeColor,
              currentItemBackgroundColor: appState.currentItemBackgroundColor,
            },
          }),
        });
        if (res.ok) {
          setSavingStatus("Saved");
          // Sync elements and state back to local boards list for UI consistency
          setBoards((current) =>
            current.map((b) =>
              b.id === boardId
                ? {
                    ...b,
                    elements,
                    appState: {
                      zoom: appState.zoom,
                      scrollX: appState.scrollX,
                      scrollY: appState.scrollY,
                      theme: appState.theme,
                      currentItemStrokeColor: appState.currentItemStrokeColor,
                      currentItemBackgroundColor: appState.currentItemBackgroundColor,
                    },
                    updatedAt: new Date().toISOString(),
                  }
                : b
            )
          );
        } else {
          setSavingStatus("Error saving");
        }
      } catch (err) {
        console.error("Auto-save whiteboard failed:", err);
        setSavingStatus("Error saving");
      }
    }, 1500);
  }, []);

  // Excalidraw canvas changes handler
  const handleCanvasChange = (elements: readonly any[], appState: any) => {
    if (!activeBoard) return;

    // Filter elements list to compare only drawing shapes (prevents cursor tracking changes from triggering saves)
    const elementsStr = JSON.stringify(elements);
    if (elementsStr === lastSavedElementsRef.current) {
      return;
    }

    lastSavedElementsRef.current = elementsStr;
    setSavingStatus("Changes pending");
    triggerAutoSave(activeBoard.id, [...elements], appState);
  };

  // Create Whiteboard Action
  const handleCreateBoard = async () => {
    const newId = `board-${Math.random().toString(36).substring(2, 9)}`;
    const newBoardObj = {
      id: newId,
      name: "Untitled Whiteboard",
      color: boardColors[Math.floor(Math.random() * boardColors.length)],
    };

    try {
      const res = await fetch("/api/whiteboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBoardObj),
      });

      if (res.ok) {
        const data = await res.json();
        setBoards((current) => [data.whiteboard, ...current]);
        setSelectedBoardId(newId);
      }
    } catch (err) {
      console.error("Failed to create whiteboard:", err);
    }
  };

  // Rename Whiteboard Action
  const handleRenameBoard = async (id: string) => {
    if (!renamingName.trim()) return;
    try {
      const res = await fetch("/api/whiteboards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: renamingName.trim() }),
      });

      if (res.ok) {
        setBoards((current) =>
          current.map((b) => (b.id === id ? { ...b, name: renamingName.trim() } : b))
        );
        setRenamingId(null);
      }
    } catch (err) {
      console.error("Failed to rename whiteboard:", err);
    }
  };

  // Delete Whiteboard Action
  const handleDeleteBoard = async (id: string) => {
    try {
      const res = await fetch(`/api/whiteboards?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setBoards((current) => current.filter((b) => b.id !== id));
        if (selectedBoardId === id) {
          const remaining = boards.filter((b) => b.id !== id);
          setSelectedBoardId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (err) {
      console.error("Failed to delete whiteboard:", err);
    }
  };

  // Add Custom Sticky Note
  const handleAddStickyNote = async (color: string) => {
    if (!excalidrawAPI) return;
    setStickyDropdownOpen(false);

    const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");

    const id = `sticky-${Math.random().toString(36).substring(2, 9)}`;
    const textId = `sticky-text-${Math.random().toString(36).substring(2, 9)}`;
    
    const appState = excalidrawAPI.getAppState();
    const scrollX = typeof appState?.scrollX === "number" ? appState.scrollX : 0;
    const scrollY = typeof appState?.scrollY === "number" ? appState.scrollY : 0;
    const x = -scrollX + window.innerWidth / 2 - 90;
    const y = -scrollY + window.innerHeight / 2 - 90;

    const stickyElement = {
      id,
      type: "rectangle",
      x,
      y,
      width: 180,
      height: 180,
      strokeColor: "#17201e",
      backgroundColor: color,
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 1,
      opacity: 100,
      roundness: null,
      boundElements: [{ id: textId, type: "text" }],
    };

    const textElement = {
      id: textId,
      type: "text",
      x: x + 10,
      y: y + 20,
      width: 160,
      height: 140,
      strokeColor: "#17201e",
      backgroundColor: "transparent",
      fillStyle: "transparent",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      text: "Sticky Note\n(double click to edit)",
      fontSize: 14,
      fontFamily: 1,
      textAlign: "center",
      verticalAlign: "middle",
      containerId: id,
    };

    const generatedElements = convertToExcalidrawElements([stickyElement, textElement] as any);
    const updatedElements = [...excalidrawAPI.getSceneElements(), ...generatedElements];
    excalidrawAPI.updateScene({ elements: updatedElements });
    handleCanvasChange(updatedElements, appState);
  };

  // AI Diagram Generator Action
  const handleGenerateAiDiagram = async () => {
    if (!aiPrompt.trim() || !excalidrawAPI) return;
    setGeneratingAi(true);

    try {
      const res = await fetch("/api/ai/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim(), type: aiDiagType }),
      });

      if (res.ok) {
        const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
        const diagramData = await res.json();
        
        const rawSkeletons = convertAiDiagramToExcalidraw(
          diagramData.nodes || [],
          diagramData.edges || []
        );

        const generatedElements = convertToExcalidrawElements(rawSkeletons as any);

        const currentElements = excalidrawAPI.getSceneElements();
        const updatedElements = [...currentElements, ...generatedElements];

        excalidrawAPI.updateScene({ elements: updatedElements });
        handleCanvasChange(updatedElements, excalidrawAPI.getAppState());
        setAiModalOpen(false);
        setAiPrompt("");
      }
    } catch (err) {
      console.error("AI diagram generation failed:", err);
    } finally {
      setGeneratingAi(false);
    }
  };

  // Convert AI generated response nodes and links to Excalidraw elements
  const convertAiDiagramToExcalidraw = (nodes: any[], edges: any[]) => {
    const elements: any[] = [];
    const nodeMap = new Map<string, any>();

    // Center mapping coords around current Excalidraw viewport scroll offset
    const appState = excalidrawAPI.getAppState();
    const scrollX = typeof appState?.scrollX === "number" ? appState.scrollX : 0;
    const scrollY = typeof appState?.scrollY === "number" ? appState.scrollY : 0;
    const offsetX = -scrollX + window.innerWidth / 2 - 300;
    const offsetY = -scrollY + window.innerHeight / 2 - 200;

    // 1. Create nodes (shapes and text)
    nodes.forEach((node) => {
      const shapeId = `node-shape-${node.id}`;
      const textId = `node-text-${node.id}`;
      const width = node.width || 160;
      const height = node.height || 60;
      const x = (node.x || 0) + offsetX;
      const y = (node.y || 0) + offsetY;

      let type = "rectangle";
      if (node.type === "ellipse") type = "ellipse";
      else if (node.type === "diamond") type = "diamond";

      const shapeElement = {
        id: shapeId,
        type,
        x,
        y,
        width,
        height,
        strokeColor: "#17201e",
        backgroundColor: type === "diamond" ? "#fff1ee" : type === "ellipse" ? "#e8f6ef" : "#e8f0fe",
        fillStyle: "solid",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        roundness: type === "rectangle" ? { type: 3 } : null,
        boundElements: [{ id: textId, type: "text" }],
      };

      const textElement = {
        id: textId,
        type: "text",
        x: x + 10,
        y: y + (height - 20) / 2,
        width: width - 20,
        height: 20,
        strokeColor: "#17201e",
        backgroundColor: "transparent",
        fillStyle: "transparent",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        text: node.text,
        fontSize: 14,
        fontFamily: 1,
        textAlign: "center",
        verticalAlign: "middle",
        containerId: shapeId,
      };

      elements.push(shapeElement, textElement);
      nodeMap.set(node.id, { shapeId, x, y, width, height });
    });

    // 2. Create connections (arrows)
    edges.forEach((edge) => {
      const startNode = nodeMap.get(edge.from);
      const endNode = nodeMap.get(edge.to);

      if (startNode && endNode) {
        const arrowId = `edge-arrow-${Math.random().toString(36).substring(2, 9)}`;
        const startX = startNode.x + startNode.width / 2;
        const startY = startNode.y + startNode.height / 2;
        const endX = endNode.x + endNode.width / 2;
        const endY = endNode.y + endNode.height / 2;

        // Establish bidirectional binding with shapes to satisfy Excalidraw validations
        const startShape = elements.find((el) => el.id === startNode.shapeId);
        if (startShape) {
          startShape.boundElements = startShape.boundElements || [];
          startShape.boundElements.push({ id: arrowId, type: "arrow" });
        }

        const endShape = elements.find((el) => el.id === endNode.shapeId);
        if (endShape) {
          endShape.boundElements = endShape.boundElements || [];
          endShape.boundElements.push({ id: arrowId, type: "arrow" });
        }

        const arrowElement = {
          id: arrowId,
          type: "arrow",
          x: startX,
          y: startY,
          width: Math.abs(endX - startX),
          height: Math.abs(endY - startY),
          strokeColor: "#55645f",
          backgroundColor: "transparent",
          fillStyle: "transparent",
          strokeWidth: 2,
          strokeStyle: "solid",
          roughness: 1,
          opacity: 100,
          points: [
            [0, 0],
            [endX - startX, endY - startY],
          ],
          startBinding: { elementId: startNode.shapeId, focus: 0, gap: 5 },
          endBinding: { elementId: endNode.shapeId, focus: 0, gap: 5 },
        };

        elements.push(arrowElement);

        if (edge.text) {
          const labelId = `edge-label-${Math.random().toString(36).substring(2, 9)}`;
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          const labelElement = {
            id: labelId,
            type: "text",
            x: midX - 40,
            y: midY - 10,
            width: 80,
            height: 20,
            strokeColor: "#c4442b",
            backgroundColor: "#ffffff",
            fillStyle: "solid",
            strokeWidth: 1,
            strokeStyle: "solid",
            roughness: 0,
            opacity: 100,
            text: edge.text,
            fontSize: 12,
            fontFamily: 1,
            textAlign: "center",
            verticalAlign: "middle",
          };
          elements.push(labelElement);
        }
      }
    });

    return elements;
  };

  // Export to PNG Image Action
  const handleExportPng = async () => {
    if (!excalidrawAPI) return;

    try {
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      
      const elements = excalidrawAPI.getSceneElements();
      if (!elements || elements.length === 0) return;

      const blob = await exportToBlob({
        elements,
        appState: excalidrawAPI.getAppState(),
        mimeType: "image/png",
        getDimensions: (width: number, height: number) => ({ width: width + 40, height: height + 40 }),
      });

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeBoard?.name || "whiteboard"}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Exporting PNG failed:", err);
    }
  };

  // Close menus on click outside
  React.useEffect(() => {
    const handleOutsideClick = () => {
      setActiveBoardMenu(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const filteredBoards = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return boards;
    return boards.filter((b) => b.name.toLowerCase().includes(q));
  }, [boards, searchQuery]);

  // Format date helper
  const formatTime = (timeStr: string) => {
    const d = new Date(timeStr);
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
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[#fbfff8]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#00a88f]" />
          <p className="text-sm font-semibold text-[#66756f]">Loading Whiteboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#fbfff8]">
      {/* LEFT SIDEBAR: Whiteboards List */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-[#d6e7df] bg-white">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#17201e] uppercase tracking-wider">Whiteboards</h2>
            <button
              onClick={handleCreateBoard}
              className="grid size-8 place-items-center rounded-md bg-[#ff6b4a] text-white shadow-sm transition hover:bg-[#ef5d3d]"
              title="New Whiteboard"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="relative flex items-center rounded-md border border-[#d6e7df] bg-white px-2.5">
            <Search className="size-4 text-[#66756f] shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search canvases..."
              className="h-9 w-full bg-transparent pl-2 text-sm text-[#17201e] outline-none"
            />
          </div>
        </div>

        {/* Board List items */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {filteredBoards.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#66756f] italic">
              No whiteboards found.
            </div>
          ) : (
            filteredBoards.map((board) => (
              <div
                key={board.id}
                onClick={() => {
                  if (renamingId !== board.id) {
                    setSelectedBoardId(board.id);
                  }
                }}
                className={cn(
                  "group relative flex cursor-pointer flex-col rounded-md p-3 transition hover:bg-[#f1faf6]",
                  selectedBoardId === board.id ? "bg-[#e8f6ef] border-l-4" : "border-l-4 border-transparent"
                )}
                style={{ borderLeftColor: board.color }}
              >
                {renamingId === board.id ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      value={renamingName}
                      onChange={(e) => setRenamingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameBoard(board.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="h-7 w-full rounded border border-[#d6e7df] px-1.5 text-xs outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameBoard(board.id)}
                      className="text-[#00a88f] hover:text-[#008f79]"
                    >
                      <Check className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold text-[#17201e]">
                        {board.name}
                      </span>
                      <span className="text-[10px] text-[#66756f] mt-0.5">
                        {formatTime(board.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(board.id);
                          setRenamingName(board.name);
                        }}
                        className="p-1 rounded text-[#55645f] hover:bg-white border border-transparent hover:border-[#d6e7df] shadow-sm"
                        title="Rename"
                      >
                        <Edit3 className="size-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBoard(board.id);
                        }}
                        className="p-1 rounded text-[#c4442b] hover:bg-white border border-transparent hover:border-[#ffd0c6] shadow-sm"
                        title="Delete"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* RIGHT WORKSPACE: Excalidraw Canvas */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        {activeBoard ? (
          <>
            {/* Header topbar */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#d6e7df] bg-white px-6 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: activeBoard.color }} />
                <h1 className="text-base font-bold text-[#17201e]">{activeBoard.name}</h1>
                <span className="text-[10px] text-[#8ea097] border border-[#d6e7df] px-1.5 py-0.5 rounded-full bg-[#fbfdfc] font-medium flex items-center gap-1 shrink-0">
                  <RefreshCw className={cn("size-2.5", savingStatus === "Saving..." && "animate-spin")} />
                  {savingStatus}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Custom Sticky Note Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setStickyDropdownOpen(!stickyDropdownOpen)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#d6e7df] bg-white px-3 text-xs font-semibold text-[#55645f] shadow-sm transition hover:bg-gray-100"
                  >
                    <StickyNote className="size-4 text-[#ffd166]" />
                    Sticky Note
                    <ChevronDown className="size-3 shrink-0" />
                  </button>

                  {stickyDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-44 rounded-md border border-[#d6e7df] bg-white p-1.5 shadow-lg z-20">
                      <p className="text-[10px] font-bold text-[#8ea097] uppercase px-2 py-1 tracking-wider">Choose Color</p>
                      <div className="grid grid-cols-4 gap-1.5 p-1">
                        <button onClick={() => handleAddStickyNote("#fff9c4")} className="size-7 rounded bg-[#fff9c4] border border-gray-300 hover:scale-105 transition" title="Yellow" />
                        <button onClick={() => handleAddStickyNote("#e8f5e9")} className="size-7 rounded bg-[#e8f5e9] border border-gray-300 hover:scale-105 transition" title="Green" />
                        <button onClick={() => handleAddStickyNote("#e3f2fd")} className="size-7 rounded bg-[#e3f2fd] border border-gray-300 hover:scale-105 transition" title="Blue" />
                        <button onClick={() => handleAddStickyNote("#fce4ec")} className="size-7 rounded bg-[#fce4ec] border border-gray-300 hover:scale-105 transition" title="Pink" />
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Diagram Trigger */}
                <button
                  onClick={() => setAiModalOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#c9ded5] bg-[#eef8f3] px-3 text-xs font-semibold text-[#00a88f] shadow-sm transition hover:bg-[#dff3e9]"
                >
                  <Sparkles className="size-4" />
                  AI Diagram
                </button>

                {/* Export PNG */}
                <button
                  onClick={handleExportPng}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#d6e7df] bg-white px-3 text-xs font-semibold text-[#55645f] shadow-sm transition hover:bg-gray-100"
                >
                  <Download className="size-4" />
                  Export PNG
                </button>
              </div>
            </div>

            {/* Canvas area */}
            <div className="flex-1 w-full h-full relative bg-gray-50 z-0" style={{ height: "calc(100vh - 8rem)", width: "100%" }}>
              <Excalidraw
                excalidrawAPI={(api) => setExcalidrawAPI(api)}
                onChange={handleCanvasChange}
                initialData={{
                  elements: activeBoard.elements || [],
                  appState: activeBoard.appState || {},
                }}
              />
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center bg-[#fbfff8]">
            <div className="text-center space-y-2">
              <Palette className="mx-auto size-12 text-[#8ea097] stroke-[1.5]" />
              <h2 className="text-base font-semibold text-[#17201e]">No Whiteboard Selected</h2>
              <p className="text-xs text-[#66756f]">Create a new whiteboard on the left panel or select an existing one.</p>
              <button
                onClick={handleCreateBoard}
                className="mt-2 inline-flex h-9 items-center gap-2 rounded-md bg-[#ff6b4a] px-4 text-xs font-semibold text-white shadow transition hover:bg-[#ef5d3d]"
              >
                <Plus className="size-4" />
                Create Whiteboard
              </button>
            </div>
          </div>
        )}

        {/* AI Diagram generation Modal Overlay */}
        {aiModalOpen && (
          <div className="fixed inset-0 grid place-items-center bg-black/40 z-50 p-4">
            <div className="w-full max-w-md rounded-lg border border-[#d6e7df] bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-[#00a88f]" />
                  <h3 className="text-sm font-bold text-[#17201e]">AI Diagram Generator</h3>
                </div>
                <button
                  onClick={() => setAiModalOpen(false)}
                  className="text-xs text-[#66756f] hover:underline"
                >
                  Close
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#55645f]">Diagram Type</label>
                <select
                  value={aiDiagType}
                  onChange={(e) => setAiDiagType(e.target.value)}
                  className="w-full h-9 rounded-md border border-[#d6e7df] px-2.5 text-xs text-[#17201e] bg-white outline-none"
                >
                  <option value="flowchart">Flowchart</option>
                  <option value="mindmap">Mind Map</option>
                  <option value="architecture">System Architecture</option>
                  <option value="process">Process Diagram</option>
                  <option value="userjourney">User Journey</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#55645f]">Describe your diagram</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. A flowchart of a user registration flow with email validation check."
                  className="w-full h-24 rounded-md border border-[#d6e7df] p-2.5 text-xs text-[#17201e] outline-none resize-none focus:border-[#00a88f]"
                />
              </div>

              <button
                onClick={handleGenerateAiDiagram}
                disabled={generatingAi || !aiPrompt.trim()}
                className="w-full h-10 rounded-md bg-[#00a88f] text-white text-xs font-semibold shadow transition hover:bg-[#008f79] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generatingAi ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating Diagram...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate & Insert
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

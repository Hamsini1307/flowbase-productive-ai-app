"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface AppField {
  label: string;
  type: "text" | "number" | "date";
  placeholder?: string;
}

interface AppAction {
  label: string;
  variant?: "primary" | "secondary";
}

interface AppStat {
  label: string;
  value: string;
  change?: string;
}

interface AppChecklistItem {
  id: string;
  text: string;
  checked?: boolean;
}

interface AppSection {
  title: string;
  type: "stats" | "list" | "table" | "form" | "checklist" | "chart" | "progress" | "tags";
  description?: string;
  stats?: AppStat[];
  items?: AppChecklistItem[];
  headers?: string[];
  rows?: string[][];
  fields?: AppField[];
  actions?: AppAction[];
  chartType?: "bar" | "line" | "pie";
}

interface GeneratedAppData {
  appName: string;
  description: string;
  icon: string;
  color: string;
  layout: string;
  sections: AppSection[];
}

interface AiApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  layout: string;
  data: GeneratedAppData;
  inSidebar: boolean;
  createdAt: string;
  updatedAt: string;
}

const getCoverImage = (name: string) => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes("budget") || lowercaseName.includes("finance") || lowercaseName.includes("expense") || lowercaseName.includes("money")) {
    return "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1000&auto=format&fit=crop&q=80";
  }
  if (lowercaseName.includes("habit") || lowercaseName.includes("routine") || lowercaseName.includes("fitness") || lowercaseName.includes("workout") || lowercaseName.includes("gym")) {
    return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80";
  }
  if (lowercaseName.includes("study") || lowercaseName.includes("exam") || lowercaseName.includes("education") || lowercaseName.includes("class") || lowercaseName.includes("book") || lowercaseName.includes("reading")) {
    return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80";
};

interface RenderDynamicAppProps {
  appId: string;
  onSidebarChange?: () => void;
}

export function RenderDynamicApp({ appId, onSidebarChange }: RenderDynamicAppProps) {
  const [app, setApp] = React.useState<AiApp | null>(null);
  const [sectionsState, setSectionsState] = React.useState<AppSection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Sync sectionsState on app load
  React.useEffect(() => {
    if (app) {
      setSectionsState(JSON.parse(JSON.stringify(app.data.sections)));
    } else {
      setSectionsState([]);
    }
  }, [app]);

  const saveAppData = async (updatedSections: AppSection[]) => {
    if (!app) return;
    try {
      const res = await fetch("/api/ai-apps", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: app.id,
          data: {
            ...app.data,
            sections: updatedSections
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setApp(data.app);
      }
    } catch (err) {
      console.error("Save app data error:", err);
    }
  };

  // Checklist CRUD additions
  const [newChecklistItemText, setNewChecklistItemText] = React.useState<Record<number, string>>({});
  
  // List CRUD additions
  const [newListItemText, setNewListItemText] = React.useState<Record<number, string>>({});
  
  // Table search, filter, and sorting states
  const [tableSearch, setTableSearch] = React.useState<Record<number, string>>({});
  const [tableFilter, setTableFilter] = React.useState<Record<number, string>>({});
  const [tableSort, setTableSort] = React.useState<Record<number, { colIdx: number, direction: 'asc' | 'desc' }>>({});

  const handleAddChecklistItem = (sectionIdx: number) => {
    if (!app) return;
    const text = newChecklistItemText[sectionIdx]?.trim();
    if (!text) return;

    setNewChecklistItemText(prev => ({ ...prev, [sectionIdx]: "" }));
    const next = JSON.parse(JSON.stringify(sectionsState));
    const section = next[sectionIdx];
    if (section.type === "checklist" && section.items) {
      section.items.push({
        id: `chk-${Math.random().toString(36).substring(2, 9)}`,
        text: text,
        checked: false
      });
    }

    setSectionsState(next);
    void saveAppData(next);
  };

  const handleDeleteChecklistItem = (sectionIdx: number, itemId: string) => {
    if (!app) return;
    const next = JSON.parse(JSON.stringify(sectionsState));
    const section = next[sectionIdx];
    if (section.type === "checklist" && section.items) {
      section.items = section.items.filter((item: any) => item.id !== itemId);
    }
    setSectionsState(next);
    void saveAppData(next);
  };

  const handleAddListItem = (sectionIdx: number) => {
    if (!app) return;
    const text = newListItemText[sectionIdx]?.trim();
    if (!text) return;

    setNewListItemText(prev => ({ ...prev, [sectionIdx]: "" }));
    const next = JSON.parse(JSON.stringify(sectionsState));
    const section = next[sectionIdx];
    if (section.type === "list" && section.items) {
      section.items.push({
        id: `lst-${Math.random().toString(36).substring(2, 9)}`,
        text: text
      });
    }
    setSectionsState(next);
    void saveAppData(next);
  };

  const handleDeleteListItem = (sectionIdx: number, itemId: string) => {
    if (!app) return;
    const next = JSON.parse(JSON.stringify(sectionsState));
    const section = next[sectionIdx];
    if (section.type === "list" && section.items) {
      section.items = section.items.filter((item: any) => item.id !== itemId);
    }
    setSectionsState(next);
    void saveAppData(next);
  };

  const handleDeleteTableRow = (sectionIdx: number, rowIdx: number) => {
    if (!app) return;
    const next = JSON.parse(JSON.stringify(sectionsState));
    const section = next[sectionIdx];
    if (section.type === "table" && section.rows) {
      section.rows.splice(rowIdx, 1);
    }
    setSectionsState(next);
    void saveAppData(next);
  };

  const handleToggleChecklist = (sectionIdx: number, itemId: string) => {
    if (!app) return;
    const next = JSON.parse(JSON.stringify(sectionsState));
    const section = next[sectionIdx];
    if (section.type === "checklist" && section.items) {
      section.items = section.items.map((item: any) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );

      const totalItems = section.items.length;
      const completedItems = section.items.filter((i: any) => i.checked).length;

      next.forEach((sec: any) => {
        if (sec.type === "stats" && sec.stats) {
          sec.stats = sec.stats.map((s: any) => {
            const lowerLabel = s.label.toLowerCase();
            if (lowerLabel.includes("tasks") || lowerLabel.includes("topic") || lowerLabel.includes("mastered") || lowerLabel.includes("completed") || lowerLabel.includes("chapter") || lowerLabel.includes("read") || lowerLabel.includes("workout")) {
              return { ...s, value: `${completedItems} of ${totalItems}` };
            }
            return s;
          });
        }
      });
    }

    setSectionsState(next);
    void saveAppData(next);
  };

  const handleFormSubmit = (sectionIdx: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;
    const section = sectionsState[sectionIdx];
    if (section.type !== "form" || !section.fields) return;

    const formVals = { ...formInputs };
    setFormInputs({});

    const next = JSON.parse(JSON.stringify(sectionsState));

    // Find the text value from form fields to use for checklists/lists
    let primaryTextVal = "";
    section.fields.forEach((field) => {
      const lowerLabel = field.label.toLowerCase();
      if (!primaryTextVal && (
        lowerLabel.includes("habit") ||
        lowerLabel.includes("name") ||
        lowerLabel.includes("task") ||
        lowerLabel.includes("title") ||
        lowerLabel.includes("desc") ||
        field.type === "text"
      )) {
        primaryTextVal = formVals[field.label] || "";
      }
    });

    // 1. Add to Table sections
    next.forEach((sec: any) => {
      if (sec.type === "table" && sec.headers && sec.rows) {
        const addedRow: string[] = [];
        sec.headers.forEach((header: string) => {
          const lowerHeader = header.toLowerCase();
          let matchedVal = "";

          // Find a form field value that corresponds to this table header column
          section.fields?.forEach((field) => {
            const lowerLabel = field.label.toLowerCase();
            if (
              lowerLabel.includes(lowerHeader) ||
              lowerHeader.includes(lowerLabel) ||
              (lowerHeader === "item" && lowerLabel.includes("desc")) ||
              (lowerHeader === "item" && lowerLabel.includes("title")) ||
              (lowerHeader === "description" && lowerLabel.includes("desc")) ||
              (lowerHeader === "description" && lowerLabel.includes("item")) ||
              (lowerHeader === "name" && lowerLabel.includes("desc")) ||
              (lowerHeader === "amount" && lowerLabel.includes("value")) ||
              (lowerHeader === "amount" && lowerLabel.includes("cost")) ||
              (lowerHeader === "price" && lowerLabel.includes("amount"))
            ) {
              matchedVal = formVals[field.label] || "";
            }
          });

          // Smart fallbacks
          if (!matchedVal) {
            if (lowerHeader.includes("date")) {
              matchedVal = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
            } else if (lowerHeader.includes("category")) {
              matchedVal = "Other";
            }
          }

          // Format currency for Amount column
          if ((lowerHeader.includes("amount") || lowerHeader.includes("price") || lowerHeader.includes("cost")) && matchedVal) {
            const cleanNum = parseFloat(matchedVal.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(cleanNum)) {
              matchedVal = `$${cleanNum.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
            }
          }

          addedRow.push(matchedVal || "—");
        });

        sec.rows = [...sec.rows, addedRow];
      }
    });

    // 2. Add to Checklist sections
    if (primaryTextVal) {
      next.forEach((sec: any) => {
        if (sec.type === "checklist" && sec.items) {
          sec.items.push({
            id: `chk-${Math.random().toString(36).substring(2, 9)}`,
            text: primaryTextVal,
            checked: false
          });

          // Recalculate Checklist completion stats labels
          const totalItems = sec.items.length;
          const completedItems = sec.items.filter((i: any) => i.checked).length;
          next.forEach((sSec: any) => {
            if (sSec.type === "stats" && sSec.stats) {
              sSec.stats = sSec.stats.map((s: any) => {
                const lowerLabel = s.label.toLowerCase();
                if (
                  lowerLabel.includes("tasks") ||
                  lowerLabel.includes("topic") ||
                  lowerLabel.includes("mastered") ||
                  lowerLabel.includes("completed") ||
                  lowerLabel.includes("chapter") ||
                  lowerLabel.includes("read") ||
                  lowerLabel.includes("workout") ||
                  lowerLabel.includes("habit")
                ) {
                  return { ...s, value: `${completedItems} of ${totalItems}` };
                }
                return s;
              });
            }
          });
        }
      });
    }

    // 3. Add to List sections
    if (primaryTextVal) {
      next.forEach((sec: any) => {
        if (sec.type === "list" && sec.items) {
          // Format with frequency or start date if present
          let formattedText = primaryTextVal;
          const freqField = section.fields?.find(f => f.label.toLowerCase().includes("freq") || f.label.toLowerCase().includes("goal"));
          if (freqField && formVals[freqField.label]) {
            formattedText += ` (Goal: ${formVals[freqField.label]})`;
          }
          sec.items.push({
            id: `lst-${Math.random().toString(36).substring(2, 9)}`,
            text: formattedText
          });
        }
      });
    }

    // 4. Recalculate stats cards sums/remaining metrics if form has an amount/number field
    let amountVal = 0;
    section.fields.forEach((field) => {
      const lowerLabel = field.label.toLowerCase();
      if (
        lowerLabel.includes("amount") ||
        lowerLabel.includes("price") ||
        lowerLabel.includes("cost") ||
        field.type === "number"
      ) {
        const parsed = parseFloat(formVals[field.label] || "0");
        if (!isNaN(parsed)) {
          amountVal = parsed;
        }
      }
    });

    if (amountVal !== 0) {
      next.forEach((sec: any) => {
        if (sec.type === "stats" && sec.stats) {
          sec.stats = sec.stats.map((s: any) => {
            const lowerLabel = s.label.toLowerCase();
            const currentNum = parseFloat(s.value.replace(/[^0-9.-]+/g, ""));
            if (isNaN(currentNum)) return s;

            if (lowerLabel.includes("spent") || lowerLabel.includes("expense") || lowerLabel.includes("out")) {
              const nextNum = currentNum + amountVal;
              return { ...s, value: `$${nextNum.toLocaleString(undefined, { minimumFractionDigits: 0 })}` };
            }

            if (lowerLabel.includes("remaining") || lowerLabel.includes("balance") || lowerLabel.includes("budget") || lowerLabel.includes("left")) {
              const nextNum = currentNum - amountVal;
              return { ...s, value: `$${nextNum.toLocaleString(undefined, { minimumFractionDigits: 0 })}` };
            }

            return s;
          });
        }
      });
    }

    setSectionsState(next);
    void saveAppData(next);
  };

  // Interactive Checklist states (local mutations so checklists function dynamically!)
  const [checklistStates, setChecklistStates] = React.useState<Record<string, boolean>>({});

  // Dynamic form input states (mock form inputs)
  const [formInputs, setFormInputs] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const fetchApp = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ai-apps?id=${appId}`);
        if (!res.ok) {
          throw new Error("Application template not found.");
        }
        const data = await res.json();
        setApp(data.app);

        // Initialize checklist state
        const initialChecklist: Record<string, boolean> = {};
        data.app.data.sections.forEach((sec: any) => {
          if (sec.type === "checklist" && sec.items) {
            sec.items.forEach((item: any) => {
              initialChecklist[item.id] = !!item.checked;
            });
          }
        });
        setChecklistStates(initialChecklist);
      } catch (err: any) {
        setError(err.message || "Failed to load application layout.");
      } finally {
        setLoading(false);
      }
    };

    void fetchApp();
  }, [appId]);

  const handleToggleSidebar = async () => {
    if (!app) return;
    const updatedState = !app.inSidebar;

    try {
      const res = await fetch("/api/ai-apps", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id, inSidebar: updatedState })
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update sidebar status.");
        return;
      }

      const data = await res.json();
      setApp(data.app);

      if (onSidebarChange) {
        onSidebarChange();
      }
    } catch (err) {
      console.error("Toggle sidebar error:", err);
    }
  };

  const resolveIcon = (name: string) => {
    const IconComponent = (Icons as any)[name];
    return IconComponent || Icons.HelpCircle;
  };

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[#fbfbfd]">
        <div className="flex flex-col items-center gap-3">
          <Icons.Loader2 className="size-8 animate-spin text-[#00a88f]" />
          <p className="text-sm font-semibold text-[#666]">Rendering App Canvas...</p>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[#fbfbfd]">
        <div className="flex flex-col items-center gap-2 text-center p-6 max-w-md">
          <Icons.HelpCircle className="size-10 text-red-500" />
          <h3 className="text-sm font-bold text-gray-900 mt-2">Failed to Render Application</h3>
          <p className="text-xs text-gray-500">{error || "Template structure could not be retrieved."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#fbfbfd] p-6 lg:p-8 font-sans animate-fadeIn">
      {/* App Header Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div
            className="flex size-11 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: app.color || "#00a88f" }}
          >
            {React.createElement(resolveIcon(app.icon), { className: "size-5.5 fill-white/20" })}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#17201e]">{app.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{app.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSidebar}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-xs font-bold transition shadow-sm",
              app.inSidebar
                ? "bg-red-50 border border-red-100 text-red-600 hover:bg-red-100"
                : "bg-[#00a88f] text-white hover:bg-[#009680]"
            )}
          >
            {app.inSidebar ? (
              <>
                <Icons.Trash2 className="size-3.5" />
                Remove Sidebar Pin
              </>
            ) : (
              <>
                <Icons.Plus className="size-3.5" />
                Pin to Sidebar
              </>
            )}
          </button>
        </div>
      </div>

      {/* App Sections Body */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
        <div className="space-y-6">
          {/* App Cover Banner Image */}
          <div className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm h-[180px] w-full relative">
            <img
              src={getCoverImage(app.name)}
              alt={app.name}
              className="w-full h-full object-cover animate-fadeIn"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-5 text-white">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">
                AI Generated Space
              </span>
            </div>
          </div>

          {sectionsState.map((section, idx) => (
            <div key={idx} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{section.title}</h3>
                {section.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
                )}
              </div>

              {/* RENDER STATS BLOCK */}
              {section.type === "stats" && section.stats && (
                <div className="grid gap-4 sm:grid-cols-3 animate-fadeIn">
                  {section.stats.map((stat, sIdx) => (
                    <div key={sIdx} className="rounded-lg border border-gray-50 bg-gray-50/30 p-4 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                      <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                      {stat.change && (
                        <span className="text-[10px] text-[#00a88f] font-semibold">{stat.change}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* RENDER CHECKLIST BLOCK */}
              {section.type === "checklist" && section.items && (
                <div className="space-y-3">
                  {/* Checklist completion progress bar */}
                  {section.items.length > 0 && (
                    <div className="space-y-1.5 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500">
                        <span>COMPLETION RATE</span>
                        <span>{Math.round((section.items.filter((i) => i.checked).length / section.items.length) * 100) || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${(section.items.filter((i) => i.checked).length / section.items.length) * 100 || 0}%`,
                            backgroundColor: app.color || "#00a88f"
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Add Checklist Item input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add new checklist task..."
                      value={newChecklistItemText[idx] || ""}
                      onChange={(e) => setNewChecklistItemText(prev => ({ ...prev, [idx]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddChecklistItem(idx);
                      }}
                      className="flex-1 h-8 rounded border border-gray-200 px-2.5 text-xs outline-none focus:border-[#00a88f] transition"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddChecklistItem(idx)}
                      className="h-8 px-3 rounded text-[11px] font-bold text-white transition hover:opacity-90"
                      style={{ backgroundColor: app.color || "#00a88f" }}
                    >
                      Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {section.items.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic py-2 text-center">No tasks in checklist. Add one above!</p>
                    ) : (
                      section.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm hover:bg-gray-50/50 transition animate-fadeIn"
                        >
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={!!item.checked}
                              onChange={() => handleToggleChecklist(idx, item.id)}
                              className="size-4 rounded border-gray-305 focus:ring-0"
                              style={{ color: app.color }}
                            />
                            <span className={cn(
                              "text-xs font-semibold text-gray-700 select-none",
                              item.checked && "line-through text-gray-400"
                            )}>
                              {item.text}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteChecklistItem(idx, item.id)}
                            className="text-gray-400 hover:text-red-500 transition p-1"
                            title="Delete Item"
                          >
                            <Icons.Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* RENDER LIST BLOCK */}
              {section.type === "list" && section.items && (
                <div className="space-y-3">
                  {/* Add List Item input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add new list item..."
                      value={newListItemText[idx] || ""}
                      onChange={(e) => setNewListItemText(prev => ({ ...prev, [idx]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddListItem(idx);
                      }}
                      className="flex-1 h-8 rounded border border-gray-200 px-2.5 text-xs outline-none focus:border-[#00a88f] transition"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddListItem(idx)}
                      className="h-8 px-3 rounded text-[11px] font-bold text-white transition hover:opacity-90"
                      style={{ backgroundColor: app.color || "#00a88f" }}
                    >
                      Add
                    </button>
                  </div>

                  <ul className="divide-y divide-gray-50 border border-gray-100 rounded-lg overflow-hidden animate-fadeIn">
                    {section.items.length === 0 ? (
                      <li className="bg-white px-4 py-3 text-[11px] text-gray-400 italic text-center">No list items. Add one above!</li>
                    ) : (
                      section.items.map((item, lIdx) => (
                        <li key={item.id || lIdx} className="bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span>{item.text}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteListItem(idx, item.id || String(lIdx))}
                            className="text-gray-400 hover:text-red-500 transition p-1"
                            title="Delete Item"
                          >
                            <Icons.Trash2 className="size-3.5" />
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}

              {/* RENDER TABLE BLOCK */}
              {section.type === "table" && section.headers && section.rows && (() => {
                const searchVal = (tableSearch[idx] || "").toLowerCase();
                const filterVal = tableFilter[idx] || "";
                const sortConfig = tableSort[idx];

                // Find index of 'Category' column if it exists
                const categoryColIdx = section.headers.findIndex(h => h.toLowerCase().includes("category"));
                
                // Extract unique categories for the dropdown filter
                const uniqueCategories: string[] = [];
                if (categoryColIdx !== -1) {
                  section.rows.forEach(r => {
                    const cat = r[categoryColIdx];
                    if (cat && !uniqueCategories.includes(cat)) {
                      uniqueCategories.push(cat);
                    }
                  });
                }

                // 1. Apply Search and Category Filter
                let displayRows = section.rows.map((row, rIdx) => ({ row, originalIdx: rIdx }));
                
                if (searchVal) {
                  displayRows = displayRows.filter(({ row }) => 
                    row.some(cell => cell.toLowerCase().includes(searchVal))
                  );
                }

                if (filterVal) {
                  displayRows = displayRows.filter(({ row }) => 
                    row[categoryColIdx] === filterVal
                  );
                }

                // 2. Apply Header Column Sorting
                if (sortConfig) {
                  displayRows.sort((a, b) => {
                    const valA = a.row[sortConfig.colIdx] || "";
                    const valB = b.row[sortConfig.colIdx] || "";

                    // Smart numeric sorting fallback
                    const numA = parseFloat(valA.replace(/[^0-9.-]+/g, ""));
                    const numB = parseFloat(valB.replace(/[^0-9.-]+/g, ""));

                    if (!isNaN(numA) && !isNaN(numB)) {
                      return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
                    }

                    return sortConfig.direction === 'asc' 
                      ? valA.localeCompare(valB)
                      : valB.localeCompare(valA);
                  });
                }

                return (
                  <div className="space-y-3">
                    {/* Table Utilities Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      {/* Search */}
                      <div className="flex items-center gap-2 border border-gray-200 rounded px-2.5 py-1 bg-white flex-1 min-w-[200px] h-8">
                        <Icons.Search className="size-3.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search records..."
                          value={tableSearch[idx] || ""}
                          onChange={(e) => setTableSearch(prev => ({ ...prev, [idx]: e.target.value }))}
                          className="text-xs outline-none bg-transparent w-full font-medium"
                        />
                      </div>

                      {/* Category Filter dropdown */}
                      {categoryColIdx !== -1 && uniqueCategories.length > 0 && (
                        <select
                          value={tableFilter[idx] || ""}
                          onChange={(e) => setTableFilter(prev => ({ ...prev, [idx]: e.target.value }))}
                          className="h-8 border border-gray-200 rounded px-2 text-xs font-bold bg-white text-gray-600 outline-none focus:border-[#00a88f]"
                        >
                          <option value="">All Categories</option>
                          {uniqueCategories.map((cat, cIdx) => (
                            <option key={cIdx} value={cat}>{cat}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Table Render Wrapper */}
                    <div className="rounded-lg border border-gray-100 bg-white overflow-x-auto shadow-sm animate-fadeIn">
                      <table className="w-full text-left border-collapse min-w-[550px]">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                            {section.headers.map((h, hIdx) => {
                              const isSorted = sortConfig?.colIdx === hIdx;
                              return (
                                <th
                                  key={hIdx}
                                  className="p-3 pl-4 cursor-pointer hover:bg-gray-100/50 transition"
                                  onClick={() => {
                                    setTableSort(prev => {
                                      const current = prev[idx];
                                      if (current?.colIdx === hIdx) {
                                        return {
                                          ...prev,
                                          [idx]: { colIdx: hIdx, direction: current.direction === 'asc' ? 'desc' : 'asc' }
                                        };
                                      }
                                      return { ...prev, [idx]: { colIdx: hIdx, direction: 'asc' } };
                                    });
                                  }}
                                >
                                  <div className="flex items-center gap-1">
                                    <span>{h}</span>
                                    {isSorted ? (
                                      sortConfig.direction === 'asc' ? <Icons.ChevronUp className="size-3" /> : <Icons.ChevronDown className="size-3" />
                                    ) : (
                                      <Icons.ChevronDown className="size-3 opacity-20" />
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                            <th className="p-3 pr-4 text-right w-16">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {displayRows.length === 0 ? (
                            <tr>
                              <td colSpan={section.headers.length + 1} className="p-8 text-center text-xs text-gray-400 italic bg-white">
                                No matching records found.
                              </td>
                            </tr>
                          ) : (
                            displayRows.map(({ row, originalIdx }) => (
                              <tr key={originalIdx} className="hover:bg-gray-50/30">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="p-3 pl-4 text-xs font-semibold text-gray-700">{cell}</td>
                                ))}
                                <td className="p-3 pr-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTableRow(idx, originalIdx)}
                                    className="text-gray-400 hover:text-red-500 transition p-1"
                                    title="Delete Row"
                                  >
                                    <Icons.Trash2 className="size-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* RENDER FORM BLOCK */}
              {section.type === "form" && section.fields && (
                <form
                  onSubmit={(e) => handleFormSubmit(idx, e)}
                  className="space-y-4 animate-fadeIn"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    {section.fields.map((field, fIdx) => (
                      <div key={fIdx} className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{field.label}</label>
                        <input
                          type={field.type}
                          placeholder={field.placeholder || ""}
                          value={formInputs[field.label] || ""}
                          onChange={(e) => {
                            setFormInputs((prev) => ({
                              ...prev,
                              [field.label]: e.target.value
                            }));
                          }}
                          className="w-full h-9 rounded-md border border-gray-200 px-3 text-xs text-[#17201e] outline-none focus:border-[#00a88f] transition"
                          required
                        />
                      </div>
                    ))}
                  </div>
                  {section.actions && (
                    <div className="flex gap-2">
                      {section.actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          type="submit"
                          className={cn(
                            "h-9 px-4 text-xs font-bold rounded-md shadow-sm transition",
                            act.variant === "secondary"
                              ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                              : "bg-[#00a88f] text-white hover:bg-[#009680]"
                          )}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              )}

                {/* RENDER PROGRESS BAR BLOCK */}
                {section.type === "progress" && (
                  <div className="space-y-2 animate-fadeIn">
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>Active Progress Tracker</span>
                      <span>72% Completed</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-gray-200/30">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: "72%",
                          backgroundColor: app.color || "#00a88f"
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* RENDER TAGS BLOCK */}
                {section.type === "tags" && section.items && (
                  <div className="flex flex-wrap gap-2 animate-fadeIn">
                    {section.items.map((tag: any, tIdx: number) => (
                      <span
                        key={tIdx}
                        className="px-2.5 py-1 text-xs font-bold rounded-full border"
                        style={{
                          backgroundColor: `${app.color}15`,
                          color: app.color,
                          borderColor: `${app.color}30`
                        }}
                      >
                        {tag.text || tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* RENDER CHART BLOCK */}
                {section.type === "chart" && (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/20 p-8 flex flex-col items-center justify-center text-center space-y-2 animate-fadeIn">
                    <Icons.BarChart3 className="size-8 text-gray-300 stroke-[1.5]" />
                    <p className="text-xs font-bold text-gray-600">Visual Chart Component</p>
                    <p className="text-[10px] text-gray-400">Representing user {section.chartType || "bar"} analytics and datasets.</p>
                  </div>
                )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-gray-900 border-b pb-2">Status Panel</h4>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Layout type</span>
              <span className="font-semibold text-gray-700 capitalize">{app.layout}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Created</span>
              <span className="font-semibold text-gray-700">{new Date(app.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Pins status</span>
              <span className="font-semibold text-gray-700">{app.inSidebar ? "Pinned to navigation" : "Not pinned"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

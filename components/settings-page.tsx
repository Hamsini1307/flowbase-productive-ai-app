import * as React from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

// Standard category type definition
interface CategoryItem {
  name: string;
  color: string;
  icon: string;
}

// Full settings data structure
interface SettingsData {
  id: string;
  userId: string;
  name: string;
  email: string;
  imageUrl: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionRenewal: string;
  categories: {
    calendar: CategoryItem[];
    kanban: CategoryItem[];
    notes: CategoryItem[];
    reminders: CategoryItem[];
  };
  preferredAiModel: string;
  aiBehavior: string;
  aiTone: string;
  enabledAiFeatures: {
    aiRefine: boolean;
    aiAssistant: boolean;
    aiBuilder: boolean;
  };
  theme: string;
  notifications: {
    email: boolean;
    push: boolean;
    updates: boolean;
  };
  defaultCalendarView: string;
  defaultTaskPriority: string;
  autoSave: boolean;
  privacySettings: {
    shareData: boolean;
    analyticsOptIn: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<SettingsData | null>(null);
  const [activeTab, setActiveTab] = React.useState<"profile" | "subscription" | "categories" | "ai" | "preferences">("profile");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  // Profile Form local states
  const [profileName, setProfileName] = React.useState("");
  const [profileEmail, setProfileEmail] = React.useState("");

  // Category Builder local states
  const [selectedCategoryType, setSelectedCategoryType] = React.useState<"calendar" | "kanban" | "notes" | "reminders">("calendar");
  const [newCatName, setNewCatName] = React.useState("");
  const [newCatColor, setNewCatColor] = React.useState("#7c5dfa");
  const [newCatIcon, setNewCatIcon] = React.useState("Briefcase");
  const [editingCatIdx, setEditingCatIdx] = React.useState<number | null>(null);

  // Available Category Colors for picker
  const PRESET_COLORS = [
    "#6257f6", // Indigo
    "#ff6b4a", // Sunset Orange
    "#00a88f", // Teal
    "#ffd166", // Amber
    "#ff8ab3", // Soft Pink
    "#80d77b", // Mint
    "#55c7f5", // Sky Blue
    "#7c5dfa"  // Purple
  ];

  // Available category icons for selection
  const ICON_KEYS = [
    "Briefcase", "User", "Calendar", "Timer", "Bell", "Palette", 
    "Code", "Search", "Check", "Lightbulb", "FileText", "Trash2", 
    "AlertCircle", "Clock", "Heart", "Star", "BookOpen", "MessageSquare"
  ];

  // Fetch settings on mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user-settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
          setProfileName(data.settings.name || "");
          setProfileEmail(data.settings.email || "");
        }
      } catch (err) {
        console.error("Failed to load user settings:", err);
      } finally {
        setLoading(false);
      }
    };
    void fetchSettings();
  }, []);

  const handleSave = async (updatedData: Partial<SettingsData>) => {
    if (!settings) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/user-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setSaveStatus("Settings saved successfully!");
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus("Failed to save settings. Please try again.");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      setSaveStatus("An error occurred during save.");
    } finally {
      setSaving(false);
    }
  };

  // Profile Save
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSave({ name: profileName, email: profileEmail });
  };

  // Category Add/Update
  const handleSaveCategory = () => {
    if (!settings || !newCatName.trim()) return;

    const nextCategories = JSON.parse(JSON.stringify(settings.categories));
    const list = nextCategories[selectedCategoryType] as CategoryItem[];

    const catObj: CategoryItem = {
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon
    };

    if (editingCatIdx !== null) {
      list[editingCatIdx] = catObj;
      setEditingCatIdx(null);
    } else {
      list.push(catObj);
    }

    setNewCatName("");
    void handleSave({ categories: nextCategories });
  };

  // Category Delete
  const handleDeleteCategory = (type: "calendar" | "kanban" | "notes" | "reminders", index: number) => {
    if (!settings) return;
    const nextCategories = JSON.parse(JSON.stringify(settings.categories));
    nextCategories[type].splice(index, 1);
    void handleSave({ categories: nextCategories });
  };

  // Category Edit select
  const startEditCategory = (type: "calendar" | "kanban" | "notes" | "reminders", cat: CategoryItem, idx: number) => {
    setSelectedCategoryType(type);
    setNewCatName(cat.name);
    setNewCatColor(cat.color);
    setNewCatIcon(cat.icon);
    setEditingCatIdx(idx);
  };

  // Export Data helper
  const handleExportData = () => {
    if (!settings) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `workspace-settings-${settings.userId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const resolveIcon = (name: string) => {
    const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
    return IconComponent;
  };

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Icons.Loader2 className="size-8 animate-spin text-[#00a88f]" />
          <p className="text-xs text-gray-400 font-bold">Loading Workspace Preferences...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-sm font-bold">Failed to load user settings. Please reload page.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#fbfbfd] p-6 lg:p-8 font-sans animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#17201e] flex items-center gap-2">
            <Icons.Settings className="size-6 text-[#00a88f]" />
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal profile, subscription tiers, custom category filters, and default AI prompts.
          </p>
        </div>
        
        {saveStatus && (
          <div className={cn(
            "text-xs font-bold px-4 py-2.5 rounded-lg border shadow-sm animate-slideDown",
            saveStatus.includes("success") 
              ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
              : "bg-red-50 border-red-100 text-red-700"
          )}>
            {saveStatus}
          </div>
        )}
      </div>

      {/* Main Settings Split View */}
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-[250px_1fr] items-start">
        {/* Left Side settings categories tabs */}
        <aside className="space-y-1 bg-white border border-gray-150 rounded-xl p-3.5 shadow-sm">
          {[
            { id: "profile", label: "Profile", icon: Icons.User },
            { id: "subscription", label: "Plan & Subscription", icon: Icons.CreditCard },
            { id: "categories", label: "Custom Categories", icon: Icons.Tag },
            { id: "ai", label: "AI Engine", icon: Icons.Sparkles },
            { id: "preferences", label: "Preferences & System", icon: Icons.Sliders }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-bold transition",
                  isActive
                    ? "bg-[#e8f6ef] text-[#00a88f]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                )}
              >
                <tab.icon className={cn("size-4 shrink-0", isActive ? "text-[#00a88f]" : "text-gray-400")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Side Settings Pane */}
        <main className="bg-white border border-gray-150 rounded-xl p-6 lg:p-8 shadow-sm min-h-[450px]">
          {/* PROFILE SETTINGS TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-sm font-bold text-gray-900">Profile Details</h2>
                <p className="text-xs text-gray-450 mt-1">Update your workspace profile identity details.</p>
              </div>

              {/* Avatar and Identity Info */}
              <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <img
                  src={settings.imageUrl}
                  alt={settings.name || "Avatar"}
                  className="size-16 rounded-full border-2 border-white shadow object-cover"
                />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-900">{settings.name || "Guest User"}</h3>
                  <p className="text-xs text-gray-400 font-semibold">{settings.email}</p>
                </div>
              </div>

              {/* Profile Edit Form */}
              <form onSubmit={handleProfileSave} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3.5 text-xs outline-none focus:border-[#00a88f] font-semibold text-[#17201e] bg-gray-50/10"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3.5 text-xs outline-none focus:border-[#00a88f] font-semibold text-[#17201e] bg-gray-50/10"
                    required
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#00a88f] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#009680] disabled:opacity-50"
                  >
                    {saving && <Icons.Loader2 className="size-3.5 animate-spin" />}
                    <span>Save Profile Settings</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SUBSCRIPTION SETTINGS TAB */}
          {activeTab === "subscription" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-sm font-bold text-gray-900">Subscription & Billing</h2>
                <p className="text-xs text-gray-450 mt-1">Manage your active plans, usage thresholds, and billing renewal dates.</p>
              </div>

              {/* Current Active Plan Card */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-[#00a88f]/30 bg-[#e8f6ef]/10 p-5 space-y-4 relative overflow-hidden">
                  <div className="absolute right-4 top-4 bg-[#00a88f] text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    Active
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Current Plan Tier</span>
                    <h3 className="text-lg font-black text-[#17201e]">{settings.subscriptionPlan} Plan</h3>
                    <p className="text-xs text-[#00a88f] font-semibold">Status: {settings.subscriptionStatus}</p>
                  </div>
                  <div className="border-t border-[#00a88f]/10 pt-3 text-[10px] text-gray-500 font-semibold">
                    Renewal Date: {settings.subscriptionRenewal || "—"}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-150 bg-white p-5 space-y-4">
                  <h3 className="text-xs font-bold text-gray-900">Plan Limits & Usage</h3>
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500">
                        <span>AI MINI-APPS</span>
                        <span>1 of 3 created</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00a88f]" style={{ width: "33%" }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500">
                        <span>WHITEBOARDS</span>
                        <span>2 of 5 created</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00a88f]" style={{ width: "40%" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upgrade Button */}
              <div className="pt-4 flex justify-start">
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#6257f6] px-5 text-xs font-bold text-white shadow transition hover:bg-[#5045d9]"
                >
                  <Icons.Zap className="size-4 fill-white/20" />
                  Upgrade Subscription Plan
                </button>
              </div>

              {/* MOCK UPGRADE PLAN DIALOG MODAL */}
              {showUpgradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm animate-fadeIn">
                  <div className="w-full max-w-lg rounded-xl border border-gray-100 bg-white p-6 shadow-xl space-y-5 animate-scaleUp">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-gray-900">Upgrade Workspace Limits</h3>
                        <p className="text-xs text-gray-400">Unlock infinite whiteboard, AI mini-apps, and file uploads.</p>
                      </div>
                      <button
                        onClick={() => setShowUpgradeModal(false)}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >
                        <Icons.X className="size-4" />
                      </button>
                    </div>

                    {/* Subscription billing options */}
                    <div className="grid gap-4 grid-cols-2">
                      <div
                        onClick={() => {
                          void handleSave({ subscriptionPlan: "Pro" });
                          setShowUpgradeModal(false);
                        }}
                        className="rounded-xl border border-gray-150 p-4 space-y-3 cursor-pointer hover:border-[#6257f6] transition group hover:bg-[#6257f6]/5 text-left"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#6257f6]">Pro Plan</h4>
                          <span className="text-[10px] font-black text-gray-650 bg-gray-100 px-2 py-0.5 rounded">$15/mo</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-normal">Allows up to 25 active AI layouts, infinite notes spaces, and daily audio file speech transcripts.</p>
                      </div>

                      <div
                        onClick={() => {
                          void handleSave({ subscriptionPlan: "Enterprise" });
                          setShowUpgradeModal(false);
                        }}
                        className="rounded-xl border border-gray-150 p-4 space-y-3 cursor-pointer hover:border-[#6257f6] transition group hover:bg-[#6257f6]/5 text-left"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#6257f6]">Enterprise</h4>
                          <span className="text-[10px] font-black text-gray-650 bg-gray-100 px-2 py-0.5 rounded">$49/mo</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-normal">Infinite whiteboards, team collaborative boards, dedicated AI prompt refiners, and custom billing controls.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC CATEGORY SETTINGS TAB */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-sm font-bold text-gray-900">Workspace Custom Categories</h2>
                <p className="text-xs text-gray-450 mt-1">Configure user-defined filters, colors, and icons used for Calendar, Tasks, Notes, and Reminders.</p>
              </div>

              {/* Select Category module selector */}
              <div className="flex gap-2 border-b border-gray-100 pb-1 flex-wrap">
                {[
                  { id: "calendar", label: "Calendar" },
                  { id: "kanban", label: "Tasks / Kanban" },
                  { id: "notes", label: "Notes" },
                  { id: "reminders", label: "Reminders" }
                ].map((grp) => (
                  <button
                    key={grp.id}
                    onClick={() => {
                      setSelectedCategoryType(grp.id as any);
                      setEditingCatIdx(null);
                      setNewCatName("");
                    }}
                    className={cn(
                      "pb-2.5 px-3 text-xs font-bold transition-all relative",
                      selectedCategoryType === grp.id
                        ? "text-[#00a88f] font-black after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#00a88f]"
                        : "text-gray-400 hover:text-gray-700"
                    )}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>

              {/* Creator/Editor Form */}
              <div className="rounded-xl border border-gray-150 p-5 bg-gray-50/20 space-y-4">
                <h3 className="text-xs font-bold text-gray-800">
                  {editingCatIdx !== null ? "Edit Category Option" : "Create Custom Category"}
                </h3>
                
                <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] items-end">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Brainstorming, Finance, Sports"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-[#00a88f] font-semibold text-[#17201e] bg-white"
                    />
                  </div>

                  {/* Icon */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Icon</label>
                    <select
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      className="h-9 border border-gray-200 rounded-lg px-2.5 text-xs font-bold bg-white text-gray-650 outline-none focus:border-[#00a88f]"
                    >
                      {ICON_KEYS.map((key) => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSaveCategory}
                    disabled={saving || !newCatName.trim()}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#00a88f] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#009680] disabled:opacity-50"
                  >
                    {editingCatIdx !== null ? <Icons.Save className="size-3.5" /> : <Icons.Plus className="size-3.5" />}
                    <span>{editingCatIdx !== null ? "Update" : "Add Category"}</span>
                  </button>
                </div>

                {/* Preset Color Selection circles */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category Tag Color</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewCatColor(c)}
                        className={cn(
                          "size-6 rounded-full border-2 transition-all relative flex items-center justify-center",
                          newCatColor === c ? "border-gray-800 scale-110 shadow-sm" : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: c }}
                      >
                        {newCatColor === c && <Icons.Check className="size-3.5 text-white stroke-[3px]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Categories Grid cards list */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Category Tags</h4>
                
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {settings.categories[selectedCategoryType]?.map((cat, cIdx) => {
                    const IconComponent = resolveIcon(cat.icon);
                    return (
                      <div
                        key={cIdx}
                        className="flex items-center justify-between border border-gray-150 rounded-xl p-3 shadow-sm bg-white hover:bg-gray-50/20 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="size-8 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: cat.color }}
                          >
                            <IconComponent className="size-4 shrink-0 fill-white/10" />
                          </div>
                          <span className="text-xs font-bold text-gray-800">{cat.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEditCategory(selectedCategoryType, cat, cIdx)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 transition"
                            title="Edit Category"
                          >
                            <Icons.Edit3 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(selectedCategoryType, cIdx)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition"
                            title="Delete Category"
                          >
                            <Icons.Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* AI ENGINE TAB */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-sm font-bold text-gray-900">AI Engine Configurations</h2>
                <p className="text-xs text-gray-450 mt-1">Configure preferred large language models, default system prompts, and toggle cognitive workflow assistants.</p>
              </div>

              <div className="space-y-5 max-w-2xl">
                {/* Model selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Preferred AI Layout Model</label>
                  <select
                    value={settings.preferredAiModel}
                    onChange={(e) => void handleSave({ preferredAiModel: e.target.value })}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3.5 text-xs font-bold bg-white text-gray-650 outline-none focus:border-[#00a88f]"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Default - Balanced & Lightning Fast)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Analytical - Extra Detail & Structured Schemas)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy Model Support)</option>
                  </select>
                </div>

                {/* AI System behavior Prompt */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Assistant Behavioral System Instructions</label>
                  <textarea
                    rows={4}
                    value={settings.aiBehavior}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, aiBehavior: e.target.value } : null)}
                    onBlur={() => void handleSave({ aiBehavior: settings.aiBehavior })}
                    placeholder="Describe how the AI assistant should formulate replies, layouts, and recommendations..."
                    className="w-full rounded-lg border border-gray-200 p-3 text-xs text-[#17201e] outline-none focus:border-[#00a88f] transition resize-none leading-relaxed font-semibold bg-gray-50/10"
                  />
                  <p className="text-[10px] text-gray-400 italic">This instruction system prompt applies to custom speech notes and AI template layouts generation.</p>
                </div>

                {/* Tone dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Default Response Tone Style</label>
                  <select
                    value={settings.aiTone}
                    onChange={(e) => void handleSave({ aiTone: e.target.value })}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3.5 text-xs font-bold bg-white text-gray-650 outline-none focus:border-[#00a88f]"
                  >
                    <option value="Cozy">Cozy (Encouraging, friendly, and structured)</option>
                    <option value="Professional">Professional (Direct, formal, and objective)</option>
                    <option value="Casual">Casual (Relaxed, short, and conversational)</option>
                  </select>
                </div>

                {/* Enabled AI features checkboxes */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Toggle Active Cognitive AI Integrations</label>
                  
                  <div className="space-y-3">
                    {[
                      { id: "aiRefine", label: "AI Speech & Notes Refiner", desc: "Allow automatic transcription and polishing of logged speech notes audio transcripts." },
                      { id: "aiAssistant", label: "AI Sidebar Assistant Chat", desc: "Activate real-time generative suggestions next to dashboard whiteboards." },
                      { id: "aiBuilder", label: "AI Template & Mini-App Builder Workspace", desc: "Enables generation of dynamic database-persisted mini apps based on prompt keywords." }
                    ].map((feature) => (
                      <label
                        key={feature.id}
                        className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm hover:bg-gray-50/50 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={(settings.enabledAiFeatures as any)[feature.id]}
                          onChange={(e) => {
                            const nextFeatures = {
                              ...settings.enabledAiFeatures,
                              [feature.id]: e.target.checked
                            };
                            void handleSave({ enabledAiFeatures: nextFeatures });
                          }}
                          className="size-4 mt-0.5 rounded border-gray-300 focus:ring-0 text-[#00a88f]"
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-gray-800">{feature.label}</span>
                          <p className="text-[10px] text-gray-450 leading-relaxed">{feature.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES & SYSTEM TAB */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-sm font-bold text-gray-900">Preferences & System Settings</h2>
                <p className="text-xs text-gray-450 mt-1">Configure layout themes, views defaults, toggles, and data export downloads.</p>
              </div>

              <div className="space-y-5 max-w-2xl">
                {/* Theme Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Application Display Theme</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => void handleSave({ theme: e.target.value })}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3.5 text-xs font-bold bg-white text-gray-650 outline-none focus:border-[#00a88f]"
                  >
                    <option value="light">Light Theme (Clean white layouts and default accents)</option>
                    <option value="cozy">Cozy Sage Theme (Softer backgrounds with warm green elements)</option>
                    <option value="dark">Dark Theme (Cozy dark night mode - coming soon)</option>
                  </select>
                </div>

                {/* Calendar default view */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Default Calendar View Layout</label>
                  <select
                    value={settings.defaultCalendarView}
                    onChange={(e) => void handleSave({ defaultCalendarView: e.target.value })}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3.5 text-xs font-bold bg-white text-gray-650 outline-none focus:border-[#00a88f]"
                  >
                    <option value="Month">Month View Grid</option>
                    <option value="Week">Week View Splits</option>
                    <option value="Day">Day View List</option>
                  </select>
                </div>

                {/* Tasks priority defaults */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Default Task Priority Level</label>
                  <select
                    value={settings.defaultTaskPriority}
                    onChange={(e) => void handleSave({ defaultTaskPriority: e.target.value })}
                    className="w-full h-10 border border-gray-200 rounded-lg px-3.5 text-xs font-bold bg-white text-gray-650 outline-none focus:border-[#00a88f]"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>

                {/* Auto Save Toggle */}
                <label className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-sm hover:bg-gray-50/50 cursor-pointer transition">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-gray-800">Auto-save state mutations</span>
                    <p className="text-[10px] text-gray-450 leading-relaxed">Save app modifications immediately to database without clicking save buttons.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => void handleSave({ autoSave: e.target.checked })}
                    className="size-4 rounded border-gray-300 text-[#00a88f] focus:ring-0"
                  />
                </label>

                {/* Notification Settings */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Notification Dispatch Channels</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm hover:bg-gray-50/50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={(e) => {
                          const nextNotif = { ...settings.notifications, email: e.target.checked };
                          void handleSave({ notifications: nextNotif });
                        }}
                        className="size-4 rounded border-gray-350 text-[#00a88f] focus:ring-0"
                      />
                      <span className="text-xs font-bold text-gray-700">Email Updates</span>
                    </label>

                    <label className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm hover:bg-gray-50/50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={settings.notifications.updates}
                        onChange={(e) => {
                          const nextNotif = { ...settings.notifications, updates: e.target.checked };
                          void handleSave({ notifications: nextNotif });
                        }}
                        className="size-4 rounded border-gray-350 text-[#00a88f] focus:ring-0"
                      />
                      <span className="text-xs font-bold text-gray-700">Product Updates & Features</span>
                    </label>
                  </div>
                </div>

                {/* Data Export JSON */}
                <div className="border-t border-gray-100 pt-5 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Export Workspace Data</h4>
                    <p className="text-[10px] text-gray-450 mt-1 leading-relaxed">Download a complete snapshot backup of your custom workspace configuration preferences. You can import this JSON file into any other dashboard sync slot.</p>
                  </div>

                  <button
                    onClick={handleExportData}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    <Icons.Download className="size-4" />
                    <span>Export Preferences (.json)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const [activeShowcaseTab, setActiveShowcaseTab] = React.useState("dashboard");
  const [faqOpenIdx, setFaqOpenIdx] = React.useState<number | null>(null);
  const [showDemoModal, setShowDemoModal] = React.useState(false);
  const [demoActiveTab, setDemoActiveTab] = React.useState("dashboard");

  // Features list
  const features = [
    {
      icon: Icons.Sparkles,
      title: "AI Assistant",
      desc: "Turn fuzzy ideas into tasks, plans, notes, reminders, and next steps in seconds.",
      color: "text-[#7c5dfa]",
      bg: "bg-[#f5f2ff]",
      border: "hover:border-[#7c5dfa]"
    },
    {
      icon: Icons.LayoutDashboard,
      title: "Smart Dashboard",
      desc: "See work, calendar events, notes, whiteboards, and AI activity in one calm command center.",
      color: "text-[#ff6b4a]",
      bg: "bg-[#fff0ed]",
      border: "hover:border-[#ff6b4a]"
    },
    {
      icon: Icons.Calendar,
      title: "Calendar & Reminders",
      desc: "Schedule priorities, capture reminders, and keep upcoming work visible without context switching.",
      color: "text-[#00a88f]",
      bg: "bg-[#e8f6ef]",
      border: "hover:border-[#00a88f]"
    },
    {
      icon: Icons.Trello,
      title: "Kanban / Task Boards",
      desc: "Move projects from idea to done with flexible task boards built for personal and team flow.",
      color: "text-[#ffd166]",
      bg: "bg-[#fff9eb]",
      border: "hover:border-[#ffd166]"
    },
    {
      icon: Icons.FileText,
      title: "Notion-style Notes",
      desc: "Draft structured notes, specs, and plans with a focused editor made for deep work.",
      color: "text-[#55c7f5]",
      bg: "bg-[#eefaff]",
      border: "hover:border-[#55c7f5]"
    },
    {
      icon: Icons.Palette,
      title: "Miro-style Whiteboard",
      desc: "Map ideas, sketch workflows, and create diagrams in a visual canvas beside your actual work.",
      color: "text-[#ff8ab3]",
      bg: "bg-[#fff0f5]",
      border: "hover:border-[#ff8ab3]"
    },
    {
      icon: Icons.Wand2,
      title: "AI Template Builder",
      desc: "Turn recurring workflows into generated workspace systems.",
      color: "text-[#ff6b4a]",
      bg: "bg-[#fff0ed]",
      border: "hover:border-[#ff6b4a]"
    },
    {
      icon: Icons.Users,
      title: "Live Collaboration",
      desc: "Multiplayer editing via Liveblocks. View co-author cursor movements and active collaborator avatars.",
      color: "text-[#7c5dfa]",
      bg: "bg-[#f5f2ff]",
      border: "hover:border-[#7c5dfa]"
    },
    {
      icon: Icons.Sliders,
      title: "Custom Categories",
      desc: "Customize workspace priorities, categorize tags, and input credentials securely.",
      color: "text-gray-600",
      bg: "bg-gray-100",
      border: "hover:border-gray-400"
    }
  ];

  // Use cases
  const useCases = [
    { role: "Founders", desc: "Build workspace roadmaps, manage task delegations, and track team sync logs." },
    { role: "Students", desc: "Keep course lecture schedules, pin study guides, and sketch canvas diagrams." },
    { role: "Teams", desc: "Collaborate in real time with Liveblocks presence and task comment logs." },
    { role: "Creators", desc: "Jot content draft outlines, save references, and outline script ideas." },
    { role: "Project Managers", desc: "Map kanban pipelines, set deadlines, and compile progress ratings." },
    { role: "Personal Users", desc: "Sync household checklists, calendar agendas, and private digital logs." }
  ];

  // Pricing plans
  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      desc: "Perfect for single workspace organization.",
      features: [
        "Dynamic Smart Dashboard",
        "Up to 3 Kanban Boards",
        "Notion-style rich notes list",
        "Single whiteboard canvas",
        "AI assistant text commands"
      ],
      cta: "Start for Free",
      highlighted: false
    },
    {
      name: "Pro",
      price: "$12",
      period: "/ month",
      desc: "Unlock advanced AI features and templates.",
      features: [
        "Everything in Free",
        "Unlimited kanban task boards",
        "Real-time streaming voice assistant",
        "AI Template builder (mini app generator)",
        "Advanced AI Insights dashboard feed"
      ],
      cta: "Upgrade to Pro",
      highlighted: true
    },
    {
      name: "Team",
      price: "$29",
      period: "/ month",
      desc: "For full collaborative team productivity.",
      features: [
        "Everything in Pro",
        "Multiplayer Liveblocks editor presence",
        "Shared team task comments log",
        "Unlimited collaborative whiteboards",
        "Priority 24/7 dedicated support"
      ],
      cta: "Deploy to Team",
      highlighted: false
    }
  ];

  // Testimonials
  const testimonials = [
    {
      name: "Saloni Avhad",
      role: "Lead Software Designer",
      quote: "Flowbase is the absolute operating system for my templates. Having my notes, canvases, and a voice assistant together is a total game changer."
    },
    {
      name: "Alex Rivera",
      role: "Product Manager",
      quote: "The Real-time presence cursor tracking is smoother than other tools. And the dashboard's AI Insights tell me exactly where to focus each morning."
    },
    {
      name: "Meera Nair",
      role: "Digital Creator",
      quote: "I can construct full mini apps in seconds using the AI Template Builder. It completely customized my sidebar layout without code!"
    }
  ];

  // FAQ
  const faqs = [
    {
      q: "How does the AI Voice Assistant work?",
      a: "The assistant uses secure microphone capture to stream audio via WebSockets to AssemblyAI. It interprets your commands and triggers database writes (like scheduling calendar items or building notes) directly in your client dashboard."
    },
    {
      q: "Is collaboration truly real-time?",
      a: "Yes! Powered by Liveblocks, multiple users can edit whiteboards, share kanban boards, read note updates, and view live multiplayer avatars and mouse cursor presence logs instantly."
    },
    {
      q: "Can I generate custom mini applications?",
      a: "Absolutely. With the AI Template Builder, you describe the app you want (like a Habit Tracker or Daily Expense Logger) and Flowbase synthesizes the database tables, UI layouts, and pins it right to your sidebar."
    },
    {
      q: "How secure is my credential data?",
      a: "Your API keys (Gemini, AssemblyAI, Liveblocks) are stored securely on your server backend via local environment configurations (.env) and are never exposed to client logs."
    }
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-gray-900 font-sans selection:bg-[#ff6b4a]/20 selection:text-[#ff6b4a]">
      
      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[#e6e2db]/80 bg-[#faf8f5]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between transition-all select-none">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-[#ff6b4a] flex items-center justify-center text-white border border-[#ef5d3d] shadow-sm">
            <Icons.Sparkles className="size-4.5" />
          </div>
          <div>
            <span className="text-xs font-black tracking-wider uppercase">Flowbase</span>
            <p className="text-[9px] text-gray-400 font-bold -mt-0.5">Visual Workspace</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-500">
          <a href="#features" className="hover:text-[#ff6b4a] transition">Features</a>
          <a href="#showcase" className="hover:text-[#ff6b4a] transition">Showcase</a>
          <a href="#pricing" className="hover:text-[#ff6b4a] transition">Pricing</a>
          <a href="#faq" className="hover:text-[#ff6b4a] transition">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDemoModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-955 transition select-none mr-1 cursor-pointer"
          >
            <Icons.Play className="size-3 text-[#ff6b4a] fill-[#ff6b4a] translate-y-[0.5px]" />
            <span>Watch Demo</span>
          </button>
          <Link
            href="/sign-in"
            className="flex items-center gap-1 h-8.5 px-4 rounded-lg bg-[#ff6b4a] hover:bg-[#ef5d3d] text-white text-xs font-bold transition shadow-sm select-none"
          >
            <span>Get Started</span>
            <Icons.ArrowRight className="size-3.5" />
          </Link>
          <Link
            href="/sign-in"
            className="flex items-center justify-center h-8.5 px-4 rounded-lg border border-[#e6e2db] hover:bg-gray-100/50 text-gray-600 hover:text-gray-900 text-xs font-bold transition select-none"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative max-w-5xl mx-auto px-6 pt-16 pb-12 text-center space-y-8 select-none">
        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#7c5dfa]/20 bg-[#f5f2ff] text-[9px] font-black text-[#7c5dfa] uppercase tracking-wide">
            <Icons.Sparkles className="size-3 text-[#7c5dfa]" />
            AI Assistant
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#00a88f]/20 bg-[#e8f6ef] text-[9px] font-black text-[#00a88f] uppercase tracking-wide">
            <Icons.Users className="size-3 text-[#00a88f]" />
            Real-time Collaboration
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#ff6b4a]/20 bg-[#fff0ed] text-[9px] font-black text-[#ff6b4a] uppercase tracking-wide">
            <Icons.Zap className="size-3 text-[#ff6b4a]" />
            Smart Workspace
          </span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Your AI-powered workspace for notes, tasks, whiteboards, and team collaboration
          </h1>
          <p className="text-sm md:text-base text-gray-500 font-semibold max-w-2xl mx-auto leading-relaxed">
            Flowbase combines Notion-style notes, Miro-style whiteboards, Kanban boards, calendar planning, AI assistance, template building, and real-time collaboration in one modern workspace.
          </p>
        </div>

        {/* Call to Actions */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/sign-in"
            className="flex items-center gap-1.5 h-10 px-6 rounded-lg bg-[#ff6b4a] hover:bg-[#ef5d3d] text-white text-xs font-black transition shadow-md"
          >
            <span>Get Started</span>
            <Icons.ArrowRight className="size-3.5" />
          </Link>
          <button
            onClick={() => setShowDemoModal(true)}
            className="flex items-center gap-1.5 h-10 px-6 rounded-lg border border-[#e1ded7] bg-white text-xs font-bold text-gray-700 hover:bg-[#faf8f5] transition shadow-sm cursor-pointer"
          >
            <Icons.Play className="size-4 text-[#ff6b4a] fill-[#ff6b4a]" />
            <span>Watch Demo</span>
          </button>
        </div>

        {/* FLOWBASE COMMAND CENTER Mockup */}
        <div className="relative pt-6 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-[#e6e2db] bg-white/70 p-3.5 shadow-xl backdrop-blur-sm">
            <div className="rounded-xl border border-[#e6e2db] bg-[#faf8f5] p-5 space-y-6 text-left">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#e6e2db]/65 pb-3">
                <div className="flex items-center gap-2">
                  <Icons.Sparkles className="size-4 text-[#ff6b4a]" />
                  <span className="text-[10px] font-black tracking-wider uppercase text-[#ff6b4a]">Flowbase Command Center</span>
                  <span className="text-[#e6e2db] text-xs">/</span>
                  <span className="text-xs font-bold text-gray-800">Launch workspace</span>
                </div>
                <div className="flex -space-x-1.5">
                  <span className="size-6 rounded-full border-2 border-white bg-[#fff0ed] text-[9px] font-black text-[#ff6b4a] flex items-center justify-center shadow-sm">MC</span>
                  <span className="size-6 rounded-full border-2 border-white bg-[#e8f6ef] text-[9px] font-black text-[#00a88f] flex items-center justify-center shadow-sm">ER</span>
                  <span className="size-6 rounded-full border-2 border-white bg-[#f5f2ff] text-[9px] font-black text-[#7c5dfa] flex items-center justify-center shadow-sm">PR</span>
                </div>
              </div>

              {/* Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-[#e6e2db] rounded-xl p-4 flex flex-col justify-between h-[85px] shadow-sm">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tasks completed</span>
                  <span className="text-2xl font-black text-gray-800">42</span>
                  <div>
                    <span className="inline-block text-[8px] font-black bg-[#e8f6ef] text-[#00a88f] px-2 py-0.5 rounded uppercase tracking-wider">on track</span>
                  </div>
                </div>
                <div className="bg-white border border-[#e6e2db] rounded-xl p-4 flex flex-col justify-between h-[85px] shadow-sm">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">AI drafts</span>
                  <span className="text-2xl font-black text-gray-800">18</span>
                  <div>
                    <span className="inline-block text-[8px] font-black bg-[#f5f2ff] text-[#7c5dfa] px-2 py-0.5 rounded uppercase tracking-wider">on track</span>
                  </div>
                </div>
                <div className="bg-white border border-[#e6e2db] rounded-xl p-4 flex flex-col justify-between h-[85px] shadow-sm">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">This week</span>
                  <span className="text-2xl font-black text-gray-800">9 events</span>
                  <div>
                    <span className="inline-block text-[8px] font-black bg-[#fff0ed] text-[#ff6b4a] px-2 py-0.5 rounded uppercase tracking-wider">on track</span>
                  </div>
                </div>
              </div>

              {/* Columns Section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1">
                {/* AI Brief Left Panel */}
                <div className="md:col-span-4 bg-white border border-[#e6e2db] rounded-xl p-4 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Icons.Sparkles className="size-3.5 text-[#ff6b4a]" />
                      AI Brief
                    </span>
                    <Icons.Sparkles className="size-3 text-[#ff6b4a]/40" />
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                      <Icons.Check className="size-3.5 text-[#00a88f] shrink-0" />
                      <span>Create launch tasks</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                      <Icons.Check className="size-3.5 text-[#00a88f] shrink-0" />
                      <span>Summarize notes</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                      <Icons.Check className="size-3.5 text-[#00a88f] shrink-0" />
                      <span>Draft reminders</span>
                    </div>
                  </div>
                </div>

                {/* Task Columns Right Panels */}
                <div className="md:col-span-8 grid grid-cols-3 gap-3">
                  {/* Plan Column */}
                  <div className="space-y-2">
                    <div className="px-2 py-0.5 rounded bg-[#eefaff] border border-[#55c7f5]/20 text-[8px] font-black text-[#55c7f5] uppercase tracking-wider text-center">Plan</div>
                    <div className="bg-white border border-[#e6e2db] rounded-lg p-2 text-[10px] font-bold text-gray-700 shadow-sm min-h-[46px] flex items-center">Launch checklist</div>
                    <div className="bg-white border border-[#e6e2db] rounded-lg p-2 text-[10px] font-bold text-gray-700 shadow-sm min-h-[46px] flex items-center">Research notes</div>
                  </div>
                  {/* Build Column */}
                  <div className="space-y-2">
                    <div className="px-2 py-0.5 rounded bg-[#fff0ed] border border-[#ff6b4a]/20 text-[8px] font-black text-[#ff6b4a] uppercase tracking-wider text-center">Build</div>
                    <div className="bg-white border border-[#e6e2db] rounded-lg p-2 text-[10px] font-bold text-gray-700 shadow-sm min-h-[46px] flex items-center">AI task flow</div>
                    <div className="bg-white border border-[#e6e2db] rounded-lg p-2 text-[10px] font-bold text-gray-700 shadow-sm min-h-[46px] flex items-center">Whiteboard map</div>
                  </div>
                  {/* Review Column */}
                  <div className="space-y-2">
                    <div className="px-2 py-0.5 rounded bg-[#e8f6ef] border border-[#00a88f]/20 text-[8px] font-black text-[#00a88f] uppercase tracking-wider text-center">Review</div>
                    <div className="bg-white border border-[#e6e2db] rounded-lg p-2 text-[10px] font-bold text-gray-700 shadow-sm min-h-[46px] flex items-center">Team comments</div>
                    <div className="bg-white border border-[#e6e2db] rounded-lg p-2 text-[10px] font-bold text-gray-700 shadow-sm min-h-[46px] flex items-center">Calendar sync</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Feature Highlights Grid */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-16 text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-xs font-black text-[#ff6b4a] uppercase tracking-widest">Core Capabilities</h2>
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            One workspace for every way your team thinks and ships
          </h3>
          <p className="text-xs text-gray-500 font-bold max-w-lg mx-auto">
            Flowbase brings planning, writing, visual thinking, AI generation, and collaboration into a single polished operating system.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className={cn(
                "border border-[#e6e2db] bg-white p-5 rounded-2xl transition-all hover:shadow-md text-left flex flex-col justify-between min-h-[170px]",
                feat.border
              )}
            >
              <div className="flex justify-between items-start">
                <div className={cn("size-9 rounded-lg flex items-center justify-center border shrink-0", feat.bg, feat.color)}>
                  <feat.icon className="size-4.5" />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">{feat.title}</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed font-semibold mt-1">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white border-y border-[#e6e2db]/60 py-16 text-center">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="space-y-3">
            <h2 className="text-xs font-black text-[#ff6b4a] uppercase tracking-widest">How It Works</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              A calmer path from idea to execution
            </h3>
            <p className="text-xs text-gray-500 font-bold max-w-lg mx-auto">
              Flowbase keeps your work organized while AI handles the blank-page moments and collaboration keeps everyone aligned.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 text-left">
            {/* Step 1 */}
            <div className="border border-[#e6e2db] bg-[#faf8f5] p-5 rounded-2xl flex flex-col justify-between min-h-[170px] shadow-sm relative">
              <div className="flex items-start justify-between">
                <span className="text-sm font-black text-gray-400">01</span>
                <div className="size-9 rounded-lg bg-red-50 text-[#ff6b4a] border border-red-100 flex items-center justify-center shadow-inner">
                  <Icons.Folder className="size-4.5" />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wide">Organize your workspace</h4>
                <p className="text-[11px] text-gray-400 font-semibold leading-relaxed mt-1">
                  Bring notes, tasks, calendars, whiteboards, and categories into one shared system.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border border-[#e6e2db] bg-[#faf8f5] p-5 rounded-2xl flex flex-col justify-between min-h-[170px] shadow-sm relative">
              <div className="flex items-start justify-between">
                <span className="text-sm font-black text-gray-400">02</span>
                <div className="size-9 rounded-lg bg-purple-50 text-[#7c5dfa] border border-purple-100 flex items-center justify-center shadow-inner">
                  <Icons.Sparkles className="size-4.5" />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wide">Let AI help you plan and create</h4>
                <p className="text-[11px] text-gray-400 font-semibold leading-relaxed mt-1">
                  Ask for task lists, reminders, summaries, diagrams, and reusable templates.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border border-[#e6e2db] bg-[#faf8f5] p-5 rounded-2xl flex flex-col justify-between min-h-[170px] shadow-sm relative">
              <div className="flex items-start justify-between">
                <span className="text-sm font-black text-gray-400">03</span>
                <div className="size-9 rounded-lg bg-green-50 text-[#00a88f] border border-green-100 flex items-center justify-center shadow-inner">
                  <Icons.Rocket className="size-4.5" />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wide">Collaborate and track progress</h4>
                <p className="text-[11px] text-gray-400 font-semibold leading-relaxed mt-1">
                  Share boards, comment on work, monitor progress, and keep momentum visible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section id="showcase" className="max-w-5xl mx-auto px-6 py-16 text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-xs font-black text-[#ff6b4a] uppercase tracking-widest">Product Showcase</h2>
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Product-specific mockups that preview the real workspace
          </h3>
          <p className="text-xs text-gray-500 font-bold max-w-lg mx-auto">
            Each view is designed around the way Flowbase already works: dashboards, notes, boards, whiteboards, and AI assistance.
          </p>
        </div>

        {/* Mockups Responsive Grid Layout */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Card 1: Dashboard overview */}
          <div className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm text-left flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Dashboard overview</h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">A calm command center for tasks, calendar, notes, and AI activity.</p>
                </div>
                <div className="size-7 rounded bg-[#fff0ed] text-[#ff6b4a] flex items-center justify-center border border-[#ff6b4a]/20">
                  <Icons.LayoutDashboard className="size-4" />
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mt-4 space-y-3.5">
                <div className="bg-white border border-[#e6e2db] rounded-lg p-2.5 flex items-center justify-between text-[10px] font-bold text-gray-700 shadow-sm">
                  <span>Tasks</span>
                  <div className="flex items-center gap-3 w-2/3">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#ff6b4a] h-full" style={{ width: '42%' }}></div>
                    </div>
                    <span className="font-black text-gray-800">24</span>
                  </div>
                </div>
                
                <div className="bg-white border border-[#e6e2db] rounded-lg p-2.5 flex items-center justify-between text-[10px] font-bold text-gray-700 shadow-sm">
                  <span>Calendar</span>
                  <div className="flex items-center gap-3 w-2/3">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#00a88f] h-full" style={{ width: '68%' }}></div>
                    </div>
                    <span className="font-black text-gray-800">8</span>
                  </div>
                </div>
                
                <div className="bg-white border border-[#e6e2db] rounded-lg p-2.5 flex items-center justify-between text-[10px] font-bold text-gray-700 shadow-sm">
                  <span>AI</span>
                  <div className="flex items-center gap-3 w-2/3">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#7c5dfa] h-full" style={{ width: '55%' }}></div>
                    </div>
                    <span className="font-black text-gray-800">12</span>
                  </div>
                </div>
              </div>
            </div>
            <span className="text-[8px] font-black bg-[#e8f6ef] text-[#00a88f] px-2 py-0.5 rounded uppercase self-start mt-4 tracking-wider">Dashboard View</span>
          </div>

          {/* Card 2: Notes editor */}
          <div className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm text-left flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Notes editor</h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Structured writing for research, plans, specs, and meeting notes.</p>
                </div>
                <div className="size-7 rounded bg-[#eefaff] text-[#55c7f5] flex items-center justify-center border border-[#55c7f5]/20">
                  <Icons.FileText className="size-4" />
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mt-4 space-y-3">
                {/* Simulated document lines */}
                <div className="space-y-2">
                  <div className="h-3.5 w-1/3 bg-gray-300 rounded"></div>
                  <div className="h-2 w-full bg-gray-200 rounded"></div>
                  <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
                </div>
                
                {/* AI suggestion block */}
                <div className="flex items-start gap-2 bg-[#eefaff] border border-[#55c7f5]/20 text-[#2181b5] text-[10px] font-bold p-3 rounded-lg mt-2 leading-relaxed shadow-sm">
                  <Icons.Sparkles className="size-3.5 text-[#55c7f5] shrink-0 mt-0.5" />
                  <span>AI suggestion: tighten the launch brief and turn action items into tasks.</span>
                </div>
              </div>
            </div>
            <span className="text-[8px] font-black bg-[#eefaff] text-[#55c7f5] px-2 py-0.5 rounded uppercase self-start mt-4 tracking-wider">Notes View</span>
          </div>

          {/* Card 3: Kanban board */}
          <div className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm text-left flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Kanban board</h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Shared task boards with practical status, comments, and progress.</p>
                </div>
                <div className="size-7 rounded bg-[#fff9eb] text-[#ffd166] flex items-center justify-center border border-[#ffd166]/20">
                  <Icons.Trello className="size-4" />
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 mt-4 grid grid-cols-3 gap-2">
                {/* Column Backlog */}
                <div className="space-y-1.5">
                  <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Backlog</span>
                  <div className="bg-white border border-[#e6e2db] rounded p-1.5 text-[9px] font-bold text-gray-700 shadow-sm leading-tight">Sprint planning</div>
                  <div className="bg-white border border-[#e6e2db] rounded p-1.5 text-[9px] font-bold text-gray-700 shadow-sm leading-tight">Customer notes</div>
                </div>
                {/* Column In Progress */}
                <div className="space-y-1.5">
                  <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">In progress</span>
                  <div className="bg-white border border-[#e6e2db] rounded p-1.5 text-[9px] font-bold text-gray-700 shadow-sm leading-tight">Sprint planning</div>
                  <div className="bg-white border border-[#e6e2db] rounded p-1.5 text-[9px] font-bold text-gray-700 shadow-sm leading-tight">Customer notes</div>
                </div>
                {/* Column Done */}
                <div className="space-y-1.5">
                  <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Done</span>
                  <div className="bg-white border border-[#e6e2db] rounded p-1.5 text-[9px] font-bold text-gray-700 shadow-sm leading-tight">Sprint planning</div>
                  <div className="bg-white border border-[#e6e2db] rounded p-1.5 text-[9px] font-bold text-gray-700 shadow-sm leading-tight">Customer notes</div>
                </div>
              </div>
            </div>
            <span className="text-[8px] font-black bg-[#fff9eb] text-[#ffd166] px-2 py-0.5 rounded uppercase self-start mt-4 tracking-wider">Kanban View</span>
          </div>

          {/* Card 4: Whiteboard */}
          <div className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm text-left flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Whiteboard</h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">A visual canvas for diagrams, systems maps, and creative planning.</p>
                </div>
                <div className="size-7 rounded bg-[#fff0f5] text-[#ff8ab3] flex items-center justify-center border border-[#ff8ab3]/20">
                  <Icons.Palette className="size-4" />
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mt-4 flex items-center justify-center h-[120px] relative overflow-hidden select-none">
                {/* Graph Grid Visual Mockup */}
                <div className="flex items-center justify-between w-full max-w-[260px] relative">
                  {/* Connect Line background */}
                  <div className="absolute top-1/2 left-4 right-4 h-0.5 border-t border-dashed border-[#e6e2db]"></div>
                  
                  {/* Node 1 */}
                  <div className="bg-[#fff0f5] border border-[#ff8ab3]/30 rounded-lg px-3 py-1.5 text-[10px] font-black text-[#ff8ab3] uppercase tracking-wider shadow-sm z-10">
                    Idea
                  </div>
                  {/* Node 2 */}
                  <div className="bg-[#e8f6ef] border border-[#00a88f]/30 rounded-lg px-3 py-1.5 text-[10px] font-black text-[#00a88f] uppercase tracking-wider shadow-sm z-10">
                    Plan
                  </div>
                  {/* Node 3 */}
                  <div className="bg-[#f5f2ff] border border-[#7c5dfa]/30 rounded-lg px-3 py-1.5 text-[10px] font-black text-[#7c5dfa] uppercase tracking-wider shadow-sm z-10">
                    Ship
                  </div>
                </div>
              </div>
            </div>
            <span className="text-[8px] font-black bg-[#fff0f5] text-[#ff8ab3] px-2 py-0.5 rounded uppercase self-start mt-4 tracking-wider">Whiteboard View</span>
          </div>

          {/* Card 5: AI Assistant */}
          <div className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm text-left flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">AI Assistant</h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">A productivity copilot that can act across the workspace.</p>
                </div>
                <div className="size-7 rounded bg-[#f5f2ff] text-[#7c5dfa] flex items-center justify-center border border-[#7c5dfa]/20">
                  <Icons.Sparkles className="size-4" />
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mt-4 space-y-2.5">
                {/* User message */}
                <div className="bg-[#f5f2ff] border border-[#7c5dfa]/15 text-[#7c5dfa] p-2.5 rounded-lg text-[10px] font-bold leading-normal shadow-sm">
                  "Create a launch plan from this note and add reminders for the critical dates."
                </div>
                
                {/* Assistant response */}
                <div className="bg-white border border-[#e6e2db] text-gray-600 p-2.5 rounded-lg text-[10px] font-bold leading-normal shadow-sm">
                  "Done. I drafted 9 tasks, 3 calendar reminders, and a review checklist."
                </div>
              </div>
            </div>
            <span className="text-[8px] font-black bg-[#f5f2ff] text-[#7c5dfa] px-2 py-0.5 rounded uppercase self-start mt-4 tracking-wider">AI Assistant View</span>
          </div>

          {/* Card 6: Template builder */}
          <div className="rounded-2xl border border-[#e6e2db] bg-white p-5 shadow-sm text-left flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Template builder</h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Turn recurring workflows into generated workspace systems.</p>
                </div>
                <div className="size-7 rounded bg-[#fff0ed] text-[#ff6b4a] flex items-center justify-center border border-[#ff6b4a]/20">
                  <Icons.Wand2 className="size-4" />
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mt-4 grid grid-cols-2 gap-3 h-[120px] items-center">
                <div className="bg-white border border-[#ff6b4a]/25 text-[#ff6b4a] rounded-lg p-2.5 text-[10px] font-black uppercase tracking-wider text-center shadow-sm hover:bg-[#fff0ed] transition cursor-pointer select-none">
                  Content tracker
                </div>
                <div className="bg-white border border-[#ff6b4a]/25 text-[#ff6b4a] rounded-lg p-2.5 text-[10px] font-black uppercase tracking-wider text-center shadow-sm hover:bg-[#fff0ed] transition cursor-pointer select-none">
                  Client portal
                </div>
                <div className="bg-white border border-[#ff6b4a]/25 text-[#ff6b4a] rounded-lg p-2.5 text-[10px] font-black uppercase tracking-wider text-center shadow-sm hover:bg-[#fff0ed] transition cursor-pointer select-none">
                  Hiring pipeline
                </div>
                <div className="bg-white border border-[#ff6b4a]/25 text-[#ff6b4a] rounded-lg p-2.5 text-[10px] font-black uppercase tracking-wider text-center shadow-sm hover:bg-[#fff0ed] transition cursor-pointer select-none">
                  OKR dashboard
                </div>
              </div>
            </div>
            <span className="text-[8px] font-black bg-[#fff0ed] text-[#ff6b4a] px-2 py-0.5 rounded uppercase self-start mt-4 tracking-wider">Template View</span>
          </div>

        </div>
      </section>

      {/* AI Features List */}
      <section className="bg-white border-y border-[#e6e2db]/60 py-16">
        <div className="max-w-5xl mx-auto px-6 grid gap-12 md:grid-cols-2 items-center">
          <div className="space-y-5 text-left">
            <h2 className="text-xs font-black text-[#ff6b4a] uppercase tracking-widest">Intelligent Automation</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Work smarter with deep AI workflows
            </h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Our workspace natively integrates artificial intelligence down to the database layers. Ask Flowbase to coordinate notes, whiteboards, templates, and reminders instantly.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div className="flex gap-2 text-xs font-bold text-gray-700">
                <Icons.CheckCircle2 className="size-4 text-[#ff6b4a] shrink-0" />
                <span>Ask AI to create tasks</span>
              </div>
              <div className="flex gap-2 text-xs font-bold text-gray-700">
                <Icons.CheckCircle2 className="size-4 text-[#ff6b4a] shrink-0" />
                <span>Add calendar reminders</span>
              </div>
              <div className="flex gap-2 text-xs font-bold text-gray-700">
                <Icons.CheckCircle2 className="size-4 text-[#ff6b4a] shrink-0" />
                <span>Refine note details</span>
              </div>
              <div className="flex gap-2 text-xs font-bold text-gray-700">
                <Icons.CheckCircle2 className="size-4 text-[#ff6b4a] shrink-0" />
                <span>Generate diagrams</span>
              </div>
              <div className="flex gap-2 text-xs font-bold text-gray-700">
                <Icons.CheckCircle2 className="size-4 text-[#ff6b4a] shrink-0" />
                <span>Build mini apps</span>
              </div>
              <div className="flex gap-2 text-xs font-bold text-gray-700">
                <Icons.CheckCircle2 className="size-4 text-[#ff6b4a] shrink-0" />
                <span>Get productivity insights</span>
              </div>
            </div>
          </div>

          {/* AI Feature Panel Visual */}
          <div className="bg-[#faf8f5] border border-[#e6e2db] rounded-2xl p-5 shadow-sm text-left space-y-4">
            <span className="text-[10px] font-black uppercase text-[#ff6b4a] tracking-wider flex items-center gap-1.5">
              <Icons.Sparkles className="size-3.5" />
              <span>Flowbase AI command</span>
            </span>
            <div className="bg-white border border-[#e6e2db] rounded-xl p-3.5 text-xs font-bold text-gray-800 shadow-sm leading-relaxed">
              "Create a note explaining the core design framework and schedule a calendar checkup tomorrow at 2 PM."
            </div>
            <div className="flex justify-end gap-2">
              <button className="h-7.5 px-3 rounded-lg border border-[#e1ded7] bg-white text-[10px] font-bold text-gray-600">Cancel</button>
              <button className="h-7.5 px-3 rounded-lg bg-[#ff6b4a] text-white text-[10px] font-black">Confirm</button>
            </div>
          </div>
        </div>
      </section>

      {/* Collaboration Section */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 items-center">
          {/* Visual collaboration stack */}
          <div className="bg-white border border-[#e6e2db] rounded-2xl p-5 shadow-sm space-y-4 text-left relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="text-xs font-black text-gray-800 uppercase tracking-wider">Multiplayer Canvas</span>
              
              {/* Avatars */}
              <div className="flex -space-x-2">
                <div className="size-6.5 rounded-full bg-[#ff8ab3] border-2 border-white text-[8px] font-black text-white flex items-center justify-center">SA</div>
                <div className="size-6.5 rounded-full bg-[#00a88f] border-2 border-white text-[8px] font-black text-white flex items-center justify-center">HN</div>
                <div className="size-6.5 rounded-full bg-[#7c5dfa] border-2 border-white text-[8px] font-black text-white flex items-center justify-center">+2</div>
              </div>
            </div>

            <div className="h-40 bg-gray-50 border border-gray-150 rounded-xl relative p-4 overflow-hidden select-none">
              <div className="absolute top-10 left-12 bg-white border border-gray-150 rounded-lg p-2 text-[9px] font-bold shadow-sm">
                Project Roadmap.svg
              </div>
              {/* Fake user mouse cursor 1 */}
              <div className="absolute top-16 left-36 flex items-center gap-1">
                <Icons.MousePointer2 className="size-3 text-[#ff6b4a] fill-[#ff6b4a] shrink-0" />
                <span className="px-1.5 py-0.5 rounded bg-[#ff6b4a] text-white text-[8px] font-bold">Saloni</span>
              </div>
              {/* Fake user mouse cursor 2 */}
              <div className="absolute top-24 left-16 flex items-center gap-1">
                <Icons.MousePointer2 className="size-3 text-[#7c5dfa] fill-[#7c5dfa] shrink-0" />
                <span className="px-1.5 py-0.5 rounded bg-[#7c5dfa] text-white text-[8px] font-bold">Hamsini</span>
              </div>
            </div>
          </div>

          <div className="space-y-5 text-left">
            <h2 className="text-xs font-black text-[#ff6b4a] uppercase tracking-widest">Team Sync</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Real-time multiplayer collaboration
            </h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Co-edit whiteboards, share kanban pipelines, watch cursor coordinates move, and drop comments logs inside tasks dynamically. Powered by secure Liveblocks connections.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-white border-y border-[#e6e2db]/60 py-16 text-center">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="space-y-3">
            <h2 className="text-xs font-black text-[#ff6b4a] uppercase tracking-widest">Who uses Flowbase</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Tailored for diverse productivity targets
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((use, idx) => (
              <div key={idx} className="border border-[#e6e2db]/80 bg-[#faf8f5] p-5 rounded-2xl text-left">
                <span className="text-xs font-black text-[#ff6b4a] uppercase tracking-wide">{use.role}</span>
                <p className="text-[11px] text-gray-500 font-semibold leading-relaxed mt-2">{use.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-16 text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-xs font-black text-[#ff6b4a] uppercase tracking-widest">Pricing Plans</h2>
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Cozy plans for every scale
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {pricingPlans.map((plan, idx) => (
            <div
              key={idx}
              className={cn(
                "bg-white border p-6 rounded-2xl text-left flex flex-col justify-between min-h-[360px] shadow-sm transition-all hover:scale-[1.02]",
                plan.highlighted ? "border-[#ff6b4a] ring-2 ring-[#ff6b4a]/10" : "border-[#e6e2db]"
              )}
            >
              <div>
                <span className="text-xs font-black text-gray-800 uppercase tracking-wide">{plan.name}</span>
                <div className="flex items-baseline mt-4">
                  <span className="text-3xl font-black tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-xs font-semibold text-gray-400 ml-1">{plan.period}</span>}
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-2">{plan.desc}</p>

                <div className="border-t border-gray-100 mt-6 pt-4 space-y-2.5">
                  {plan.features.map((feat, fidx) => (
                    <div key={fidx} className="flex gap-2 text-[10px] font-bold text-gray-700">
                      <Icons.Check className="size-3.5 text-[#ff6b4a] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/sign-in"
                className={cn(
                  "flex items-center justify-center h-9 w-full rounded-lg text-xs font-black mt-6 transition shadow-sm",
                  plan.highlighted 
                    ? "bg-[#ff6b4a] hover:bg-[#ef5d3d] text-white" 
                    : "border border-[#e1ded7] bg-white text-gray-700 hover:bg-[#faf8f5]"
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white border-y border-[#e6e2db]/60 py-16 text-center">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="space-y-3">
            <h2 className="text-xs font-black text-[#ff6b4a] uppercase tracking-widest">Wall of Love</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Trusted by leading professionals
            </h3>
          </div>

          <div className="grid gap-6 md:grid-cols-3 text-left">
            {testimonials.map((test, idx) => (
              <div key={idx} className="border border-[#e6e2db]/80 p-5 rounded-2xl bg-[#faf8f5] shadow-inner flex flex-col justify-between">
                <p className="text-[11px] text-gray-500 font-bold italic leading-relaxed">
                  "{test.quote}"
                </p>
                <div className="mt-4 border-t border-[#e6e2db]/60 pt-3">
                  <span className="text-xs font-black text-gray-800 block">{test.name}</span>
                  <span className="text-[9px] font-bold text-[#ff6b4a] uppercase tracking-wide block mt-0.5">{test.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-16 text-center space-y-12">
        <div className="space-y-3">
          <h2 className="text-xs font-black text-[#ff6b4a] uppercase tracking-widest">Questions & Answers</h2>
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="space-y-3 text-left">
          {faqs.map((faq, idx) => {
            const isOpen = faqOpenIdx === idx;
            return (
              <div key={idx} className="border border-[#e6e2db] rounded-xl bg-white overflow-hidden shadow-sm">
                <button
                  onClick={() => setFaqOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center justify-between font-bold text-xs text-gray-800 hover:bg-[#faf8f5] transition text-left"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <Icons.ChevronUp className="size-4 text-gray-400" /> : <Icons.ChevronDown className="size-4 text-gray-400" />}
                </button>
                {isOpen && (
                  <div className="p-4 border-t border-gray-100 bg-[#faf8f5]/40 text-[11px] text-gray-400 leading-relaxed font-semibold">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#17201e] text-white py-16 text-center space-y-8 select-none">
        <div className="max-w-xl mx-auto px-6 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Build your entire productivity system in one AI workspace
          </h2>
          <p className="text-xs text-gray-400 font-semibold max-w-sm mx-auto leading-relaxed">
            Consolidate your stack. Join thousands of high-performing teams managing tasks, docs, and diagrams together.
          </p>
        </div>

        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 h-10 px-6 rounded-lg bg-[#ff6b4a] hover:bg-[#ef5d3d] text-white text-xs font-black transition shadow-md"
        >
          <span>Start for Free</span>
          <Icons.ArrowRight className="size-3.5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e6e2db] bg-white px-6 py-12 text-left">
        <div className="max-w-5xl mx-auto grid gap-8 sm:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded bg-[#ff6b4a] flex items-center justify-center text-white border border-[#ef5d3d]">
                <Icons.Sparkles className="size-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider">Flowbase</span>
            </div>
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
              The visual operating system for modern creative teams.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Product</h4>
            <div className="flex flex-col gap-1.5 text-[10px] font-bold text-gray-500">
              <a href="#features" className="hover:text-[#ff6b4a]">Features</a>
              <a href="#showcase" className="hover:text-[#ff6b4a]">Showcase</a>
              <a href="#pricing" className="hover:text-[#ff6b4a]">Pricing</a>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Resources</h4>
            <div className="flex flex-col gap-1.5 text-[10px] font-bold text-gray-500">
              <span className="hover:text-[#ff6b4a] cursor-pointer">Documentation</span>
              <span className="hover:text-[#ff6b4a] cursor-pointer">API Integration</span>
              <span className="hover:text-[#ff6b4a] cursor-pointer">Security Center</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Legal</h4>
            <div className="flex flex-col gap-1.5 text-[10px] font-bold text-gray-500">
              <span className="hover:text-[#ff6b4a] cursor-pointer">Privacy Policy</span>
              <span className="hover:text-[#ff6b4a] cursor-pointer">Terms of Service</span>
              <span className="hover:text-[#ff6b4a] cursor-pointer">Cookie Policy</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-bold text-gray-400">
          <span>&copy; {new Date().getFullYear()} Flowbase Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="hover:text-[#ff6b4a] cursor-pointer">Twitter</span>
            <span className="hover:text-[#ff6b4a] cursor-pointer">GitHub</span>
            <span className="hover:text-[#ff6b4a] cursor-pointer">LinkedIn</span>
          </div>
        </div>
      </footer>

      {/* Interactive Demo Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="bg-[#faf8f5] border border-[#e6e2db] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col h-[480px]">
            {/* Modal Header */}
            <div className="border-b border-[#e6e2db] px-5 py-4 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Icons.Play className="size-4 text-[#ff6b4a] fill-[#ff6b4a]" />
                <span className="text-xs font-black uppercase tracking-wider text-gray-800">Flowbase Product Tour</span>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="size-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition cursor-pointer"
              >
                <Icons.X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left sidebar: Tabs for each feature */}
              <div className="w-1/3 bg-white border-r border-[#e6e2db] p-3 space-y-1.5 overflow-y-auto">
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block px-2 pb-1">Features</span>
                {[
                  { id: "dashboard", label: "Dashboard", desc: "Live summaries & tasks" },
                  { id: "kanban", label: "Kanban Board", desc: "Visual pipeline columns" },
                  { id: "calendar", label: "Calendar", desc: "Schedule agendas" },
                  { id: "notes", label: "Notion Notes", desc: "Rich document editor" },
                  { id: "whiteboard", label: "Whiteboard", desc: "Multiplayer sketches" },
                  { id: "assistant", label: "Voice Assistant", desc: "Microphone planners" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDemoActiveTab(item.id)}
                    className={cn(
                      "w-full text-left p-2 rounded-lg transition-all text-xs font-bold block cursor-pointer",
                      demoActiveTab === item.id
                        ? "bg-[#fff0ed] text-[#ff6b4a] border-l-2 border-[#ff6b4a]"
                        : "text-gray-500 hover:bg-gray-55 hover:text-gray-805"
                    )}
                  >
                    <span>{item.label}</span>
                    <p className="text-[8px] text-gray-400 font-semibold mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>

              {/* Right view: Visual interactive layout */}
              <div className="flex-1 bg-[#faf8f5] p-5 overflow-y-auto flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                    {demoActiveTab === "dashboard" && "Consolidated Workspace Hub"}
                    {demoActiveTab === "kanban" && "Multi-Column Project Tracker"}
                    {demoActiveTab === "calendar" && "Integrated Dynamic Timelines"}
                    {demoActiveTab === "notes" && "AI-Enhanced Document Writer"}
                    {demoActiveTab === "whiteboard" && "Multiplayer Infinite Sandbox"}
                    {demoActiveTab === "assistant" && "AssemblyAI Voice Planner"}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                    {demoActiveTab === "dashboard" && "Warm welcome messages greet Hamsini. Shows tasks completions, notes feed, whiteboards counters, and real-time AI Insights summaries."}
                    {demoActiveTab === "kanban" && "Move items smoothly between columns (To Do, In Progress, Review, Done). Click elements to view priorities, deadlines, and comments."}
                    {demoActiveTab === "calendar" && "Syncs seamlessly with kanban task lists. Instantly drag-and-drop agendas or edit deadlines inside the calendar list."}
                    {demoActiveTab === "notes" && "Notion-style block editing with inline AI text refine, custom icon emojis, cozy color highlights, and trash bins."}
                    {demoActiveTab === "whiteboard" && "Excalidraw sketch canvas allowing multiplayer cursor coordinate syncing. Draw mockups, charts, flow diagrams, or drop shapes."}
                    {demoActiveTab === "assistant" && "Streams voice capture to AssemblyAI using WebSocket connections. Recognizes speech, executes operations, and returns confirmed status."}
                  </p>
                </div>

                {/* Simulated visual widget */}
                <div className="bg-white border border-[#e6e2db] rounded-xl p-4 shadow-sm min-h-[160px] flex flex-col justify-between mt-4">
                  {demoActiveTab === "dashboard" && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-[10px] font-black text-gray-800">Welcome, Hamsini.</span>
                        <span className="text-[8px] font-bold text-gray-400">Today's Agenda</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-bold text-[#00a88f] bg-[#e8f6ef] p-1.5 rounded-lg border border-[#00a88f]/10">
                        <span>📅 Sync roadmap meeting</span>
                        <span>10:30 AM</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-bold text-[#ff6b4a] bg-[#fff0ed] p-1.5 rounded-lg border border-[#ff6b4a]/10">
                        <span>🚩 Core deployment check</span>
                        <span>4:00 PM</span>
                      </div>
                    </div>
                  )}

                  {demoActiveTab === "kanban" && (
                    <div className="grid grid-cols-2 gap-2 h-full">
                      <div className="bg-gray-50 border border-gray-150 p-2 rounded-lg flex flex-col justify-between h-[120px]">
                        <span className="text-[8px] font-black uppercase text-gray-400">In Progress</span>
                        <div className="bg-white p-2 rounded border border-gray-100 shadow-sm text-[8px] font-bold">
                          Configure middleware API
                          <span className="block text-[7px] text-[#ff6b4a] mt-1">High Priority</span>
                        </div>
                      </div>
                      <div className="bg-gray-55 border border-gray-155 p-2 rounded-lg flex flex-col justify-between h-[120px]">
                        <span className="text-[8px] font-black uppercase text-gray-400">Review</span>
                        <div className="bg-white p-2 rounded border border-gray-100 shadow-sm text-[8px] font-bold">
                          Setup seed query script
                          <span className="block text-[7px] text-gray-400 mt-1">Medium Priority</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {demoActiveTab === "calendar" && (
                    <div className="space-y-2 h-full">
                      <div className="grid grid-cols-7 gap-1 text-center text-[7px] font-black text-gray-400 uppercase">
                        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-[8px] font-bold">
                        <span className="text-gray-300">28</span><span className="text-gray-300">29</span><span className="text-gray-300">30</span>
                        <span className="bg-[#ff6b4a] text-white rounded-full size-4.5 flex items-center justify-center mx-auto shadow-sm">1</span>
                        <span>2</span><span>3</span><span>4</span>
                      </div>
                      <div className="bg-gray-50 border border-gray-150 p-2 rounded-lg text-[8px] font-bold text-gray-505 mt-1">
                        🎯 Deadline: Phase 2 Launch
                      </div>
                    </div>
                  )}

                  {demoActiveTab === "notes" && (
                    <div className="space-y-2 text-left">
                      <span className="text-xs font-black text-gray-800">💡 App Architecture Idea</span>
                      <div className="h-0.5 bg-gray-100 w-full" />
                      <p className="text-[8px] leading-relaxed text-gray-400 font-semibold">
                        Use Next.js API routes with Neon serverless endpoints to enable stateless scaling. Integrate Drizzle ORM to generate schemas automatically.
                      </p>
                    </div>
                  )}

                  {demoActiveTab === "whiteboard" && (
                    <div className="flex items-center justify-center gap-3 h-full">
                      <div className="size-16 rounded-full border-2 border-dashed border-[#ff6b4a] flex items-center justify-center text-[9px] font-black text-[#ff6b4a] text-center select-none bg-[#fff0ed]">
                        Core API
                      </div>
                      <Icons.ArrowRight className="size-4 text-gray-400" />
                      <div className="size-16 rounded-lg border-2 border-dashed border-[#7c5dfa] flex items-center justify-center text-[9px] font-black text-[#7c5dfa] text-center select-none bg-[#f5f2ff]">
                        Database
                      </div>
                    </div>
                  )}

                  {demoActiveTab === "assistant" && (
                    <div className="flex flex-col items-center justify-center text-center space-y-2 h-full">
                      <div className="size-10 rounded-full bg-[#ff6b4a]/10 border border-[#ff6b4a]/20 flex items-center justify-center text-[#ff6b4a] animate-pulse">
                        <Icons.Mic className="size-5" />
                      </div>
                      <span className="text-[7px] font-black uppercase text-[#ff6b4a] tracking-wider">WebSocket stream active</span>
                      <p className="text-[9px] font-bold text-gray-600">"Create a task 'Configure auth providers'."</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#e6e2db] px-5 py-3 flex justify-end gap-2 bg-white shrink-0">
              <button
                onClick={() => setShowDemoModal(false)}
                className="h-8.5 px-4 rounded-lg border border-[#e1ded7] bg-white text-xs font-bold text-gray-600 hover:bg-gray-55 transition cursor-pointer"
              >
                Close
              </button>
              <Link
                href="/sign-up"
                className="h-8.5 px-4 rounded-lg bg-[#ff6b4a] hover:bg-[#ef5d3d] text-white text-xs font-black flex items-center justify-center shadow-sm select-none"
              >
                Try Flowbase Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Play, Sparkles } from "lucide-react";

const steps = [
  "Plan your day from the calendar and task overview.",
  "Organize project work in kanban boards and shared spaces.",
  "Turn repeatable workflows into an AI-generated mini app.",
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#faf8f5] px-6 py-10 text-[#17201e]">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#66756f] hover:text-[#ff6b4a]">
          <ArrowLeft className="size-4" /> Back to Flowbase
        </Link>
        <section className="mt-10 overflow-hidden rounded-3xl border border-[#e6e2db] bg-white shadow-xl">
          <div className="bg-[#17201e] px-8 py-12 text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
              <Sparkles className="size-3.5 text-[#ffd166]" /> Interactive product tour
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">See how Flowbase brings work together</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">A quick guided look at planning, creating, and collaborating in one workspace.</p>
          </div>
          <div className="grid gap-8 p-8 md:grid-cols-[1.2fr_0.8fr]">
            <div className="grid min-h-64 place-items-center rounded-2xl border border-[#d6e7df] bg-[#f1faf6] p-6 text-center">
              <div>
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#ff6b4a] text-white shadow-lg"><Play className="size-6 fill-current" /></div>
                <p className="mt-4 text-lg font-bold">Your workspace, ready when you sign in</p>
                <p className="mt-2 text-sm text-[#66756f]">Open the dashboard to start with tasks and calendar already loaded.</p>
              </div>
            </div>
            <ol className="space-y-5">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-[#55645f]">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#00a88f]" />
                  <span><strong className="text-[#17201e]">{index + 1}.</strong> {step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="border-t border-[#e6e2db] bg-[#faf8f5] px-8 py-5">
            <Link href="/sign-in" className="inline-flex h-10 items-center rounded-lg bg-[#ff6b4a] px-5 text-sm font-bold text-white transition hover:bg-[#ef5d3d]">Sign in to get started</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

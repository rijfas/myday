"use client";

import {
    ChevronLeft,
    ChevronRight,
    Plus,
    RefreshCw
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { TaskChart } from "@/components/task-chart";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  recurring: boolean;
  createdAt: string; // yyyy-mm-dd
  completedDates: string[];
};

const STORAGE_KEY = "myday.tasks";

const toDateKey = (value: Date) => value.toISOString().slice(0, 10);
const todayKey = () => toDateKey(new Date());

const dayFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const shortDayFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
});

function safeParseTasks(raw: string | null): Task[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Task[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((task) => ({
      ...task,
      completedDates: Array.isArray(task.completedDates)
        ? task.completedDates
        : [],
    }));
  } catch {
    return [];
  }
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [recurring, setRecurring] = useState(true);
  const [selectedDay, setSelectedDay] = useState(todayKey());
  const [hydrated, setHydrated] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week ending today
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  };

  useEffect(() => {
    const stored = safeParseTasks(
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null,
    );
    setTasks(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, hydrated]);

  const tasksForDay = useMemo(() => {
    return tasks.filter((task) => {
      const createdOnOrBefore = task.createdAt <= selectedDay;
      if (task.recurring) return createdOnOrBefore;
      return task.createdAt === selectedDay;
    });
  }, [tasks, selectedDay]);

  const completedToday = useMemo(() => {
    return tasksForDay.filter((task) =>
      task.completedDates.includes(selectedDay),
    ).length;
  }, [tasksForDay, selectedDay]);

  const recurringCount = useMemo(
    () => tasksForDay.filter((task) => task.recurring).length,
    [tasksForDay],
  );

  const handleAddTask = () => {
    const title = input.trim();
    if (!title) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      recurring,
      createdAt: todayKey(),
      completedDates: [],
    };

    setTasks((prev) => [...prev, newTask]);
    setInput("");
    setRecurring(true);
    setShowAdd(false);
  };

  const handleToggle = (taskId: string, day: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const isDone = task.completedDates.includes(day);
        return {
          ...task,
          completedDates: isDone
            ? task.completedDates.filter((d) => d !== day)
            : [...task.completedDates, day],
        };
      }),
    );
  };

  const handleDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = toDateKey(date);
      const value = tasks.filter((task) =>
        task.completedDates.includes(key),
      ).length;

      return {
        date: key,
        label: shortDayFormatter.format(date),
        value,
      };
    });
  }, [tasks]);

  const emptyState = !hydrated || tasksForDay.length === 0;

  const dayRow = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      // weekOffset slides the window further into the past
      date.setDate(date.getDate() - (weekOffset + (6 - index)));
      return {
        key: toDateKey(date),
        label: shortDayFormatter.format(date),
        day: date.getDate(),
      };
    });
  }, [weekOffset]);

  const selectedDayLabel = useMemo(() => {
    const date = new Date(selectedDay);
    return dayFormatter.format(date);
  }, [selectedDay]);

  useEffect(() => {
    const keys = dayRow.map((d) => d.key);
    if (!keys.includes(selectedDay)) {
      setSelectedDay(dayRow[6]?.key ?? todayKey());
    }
  }, [dayRow, selectedDay]);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setShowInstallBanner(false);
    if (choice.outcome !== "accepted") {
      setInstallPrompt(null);
    }
  };

  const handleHoldStart = (task: Task) => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => setPendingDelete(task), 550);
  };

  const handleHoldEnd = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-20 pt-6 sm:px-5">
        {showInstallBanner && (
          <div className="sticky top-2 z-10 flex items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-3 shadow-lg backdrop-blur">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Install MyDay</span>
              <span className="text-xs text-muted-foreground">
                Add to your home screen for offline access.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInstallBanner(false)}
              >
                Later
              </Button>
              <Button size="sm" onClick={handleInstall}>
                Install
              </Button>
            </div>
          </div>
        )}
        <header className="flex flex-col gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Hi, here are the tasks for the day
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              MyDay
            </h1>
          </div>
        </header>

        <section className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <CardTitle>{selectedDayLabel}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Daily list
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev + 7)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition hover:text-foreground"
                  aria-label="Previous 7 days"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex flex-1 items-center justify-between rounded-xl border border-border/60 px-2 py-1 text-sm">
                  {dayRow.map((day) => {
                    const active = day.key === selectedDay;
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => setSelectedDay(day.key)}
                        className={cn(
                          "flex flex-col items-center rounded-lg px-1.5 py-1 text-[11px] leading-tight transition",
                          active
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        aria-label={day.key}
                      >
                        <span className="font-semibold text-[11px]">
                          {day.label}
                        </span>
                        <span className="text-[10px] opacity-80">{day.day}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => Math.max(0, prev - 7))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition hover:text-foreground disabled:opacity-40"
                  aria-label="Next 7 days"
                  disabled={weekOffset === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-card/40">
                {emptyState ? (
                  <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    </div>
                    <p className="text-sm text-muted-foreground">No tasks yet.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {tasksForDay.map((task) => {
                      const done = task.completedDates.includes(selectedDay);
                      return (
                        <li
                          key={task.id}
                          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                          onPointerDown={() => handleHoldStart(task)}
                          onPointerUp={handleHoldEnd}
                          onPointerLeave={handleHoldEnd}
                          onPointerCancel={handleHoldEnd}
                          onClick={() => handleToggle(task.id, selectedDay)}
                        >
                          <div className="flex items-start gap-3 sm:items-center">
                            <Checkbox
                              checked={done}
                              onChange={() => handleToggle(task.id, selectedDay)}
                              aria-label={`Mark ${task.title} as ${
                                done ? "incomplete" : "done"
                              }`}
                              className="mt-1 sm:mt-0"
                            />
                            <div className="flex flex-col gap-1">
                              <span
                                className={cn(
                                  "text-base font-medium",
                                  done && "text-muted-foreground line-through",
                                )}
                              >
                                {task.title}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader className="flex flex-col gap-2">
                <CardTitle>Today&apos;s status</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {selectedDay}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Total" value={tasksForDay.length} />
                  <Stat label="Done" value={completedToday} />
                  <Stat label="Recurring" value={recurringCount} />
                  <Stat
                    label="Completion"
                    value={
                      tasksForDay.length === 0
                        ? "0%"
                        : `${Math.round(
                            (completedToday / tasksForDay.length) * 100,
                          )}%`
                    }
                  />
                </div>
              </CardContent>
            </Card>
            <TaskChart data={chartData} />
          </div>
        </section>

        <button
          type="button"
          className="fixed bottom-6 right-6 z-20 inline-flex h-16 w-16 items-center justify-center rounded-full border border-border/50 bg-foreground text-background shadow-2xl shadow-foreground/40 backdrop-blur transition hover:translate-y-[-2px] hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          onClick={() => setShowAdd(true)}
          aria-label="Add task"
        >
          <Plus className="h-6 w-6" />
        </button>

        {showAdd && (
          <div className="fixed inset-0 z-30 flex items-start justify-center bg-black/70 px-4 pt-[calc(env(safe-area-inset-top,0px)+40px)] pb-8 sm:items-center sm:pt-0 sm:pb-10">
            <div className="w-full max-w-md max-h-[80vh] overflow-auto rounded-2xl border border-border/70 bg-card p-4 shadow-xl">
              <div className="flex items-center justify-between pb-3">
                <h2 className="text-lg font-semibold">New task</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  onClick={() => setShowAdd(false)}
                  className="border border-border/50 bg-transparent text-muted-foreground hover:text-foreground"
                >
                  ×
                </Button>
              </div>
              <div className="space-y-3">
                <Input
                  autoFocus
                  placeholder="Task title"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddTask();
                    }
                  }}
                />
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                  <span className="text-sm text-muted-foreground">Recurring</span>
                  <Switch
                    checked={recurring}
                    onCheckedChange={setRecurring}
                    aria-label="Toggle recurring"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleAddTask}
                  disabled={!input.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {pendingDelete && (
          <div className="fixed inset-0 z-30 flex items-start justify-center bg-black/70 px-4 pt-[calc(env(safe-area-inset-top,0px)+40px)] pb-8 sm:items-center sm:pt-0 sm:pb-10">
            <div className="w-full max-w-md max-h-[80vh] overflow-auto rounded-2xl border border-border/70 bg-card p-4 shadow-xl">
              <div className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">Delete task?</h2>
                <p className="text-sm text-muted-foreground">
                  {pendingDelete.title}
                </p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => setPendingDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleDelete(pendingDelete.id);
                      setPendingDelete(null);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card/40 px-3 py-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-xl font-semibold">{value}</span>
    </div>
  );
}

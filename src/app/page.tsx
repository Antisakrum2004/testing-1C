"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/* ─── Types ─── */
interface TestItem {
  id: string;
  orderNum: number;
  description: string;
  expectedResult: string;
  bugOrRemark: string;
  isMatched: boolean;
  screenshot: string;
  assignee: string;
  priority: string;
  status: string;
  timeSpent: number;
}

interface TestSession {
  id: string;
  title: string;
  items: TestItem[];
  createdAt: string;
  updatedAt: string;
}

interface SessionMember {
  id: string;
  sessionId: string;
  name: string;
  color: string;
}

interface TestComment {
  id: string;
  itemId: string;
  author: string;
  text: string;
  createdAt: string;
}

interface SessionStats {
  total: number;
  matched: number;
  bugs: number;
  totalTime: number;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  byAssignee: Record<string, { total: number; matched: number; bugs: number; totalTime: number }>;
}

/* ─── Constants ─── */
const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: "Критич.", color: "#ef4444" },
  high: { label: "Высокий", color: "#f97316" },
  medium: { label: "Средний", color: "#eab308" },
  low: { label: "Низкий", color: "#6b7280" },
};
const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "Новый", color: "#6b7280" },
  in_progress: { label: "В работе", color: "#3b82f6" },
  review: { label: "Проверка", color: "#eab308" },
  accepted: { label: "Принят", color: "#22c55e" },
  rejected: { label: "Отклонён", color: "#ef4444" },
};
const STATUS_ORDER = ["new", "in_progress", "review", "accepted", "rejected"];

const MEMBER_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6",
  "#ec4899", "#f43f5e", "#14b8a6", "#6366f1",
];

const DEFAULT_MEMBERS = ["Константин", "Александр", "Саша", "Тимур", "Елена", "Ольга", "Тест"];

/* ─── Helpers ─── */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} д назад`;
}

function getMemberColor(name: string, members: SessionMember[]): string {
  const m = members.find(m => m.name === name);
  if (m) return m.color;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}

/* ─── Icon Components ─── */
function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M1 4.5V2.5a1 1 0 011-1h5l3 3v5a1 1 0 01-1 1H5" />
      <path d="M1 7.5l2.5 2.5 4-4" />
    </svg>
  );
}

function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h12" />
      <path d="M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4" />
      <path d="M12.67 4v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4" />
      <path d="M6.67 7.33v4" />
      <path d="M9.33 7.33v4" />
    </svg>
  );
}

function CheckSquareIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <rect x="1" y="1" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 11l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 10.5l-1 1a2.12 2.12 0 01-3 0 2.12 2.12 0 010-3l1-1" />
      <path d="M8.5 5.5l1-1a2.12 2.12 0 013 0 2.12 2.12 0 010 3l-1 1" />
      <path d="M10.5 5.5l-5 5" />
    </svg>
  );
}

function ImagePlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
      <circle cx="5.5" cy="6" r="1.5" />
      <path d="M1.5 10.5l3-3 2 2 3-4 5 5" />
      <path d="M8 1v3M6.5 2.5h3" />
    </svg>
  );
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 3l8 8M11 3l-8 8" />
    </svg>
  );
}

function FilterIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M1 2h12M3 7h8M5 12h4" />
    </svg>
  );
}

function ChevronDownIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5l3 3 3-3" />
    </svg>
  );
}

function SearchIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="6" cy="6" r="4.5" />
      <path d="M9.5 9.5L13 13" />
    </svg>
  );
}

function UsersIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="4" r="2.5" />
      <path d="M1 12c0-2.5 2-4.5 4.5-4.5S10 9.5 10 12" />
      <circle cx="10.5" cy="4.5" r="2" />
      <path d="M10 8c1.5.5 2.5 2 2.5 4" />
    </svg>
  );
}



function DragHandleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor" style={{ opacity: 0.4 }}>
      <circle cx="4" cy="3" r="1.2" />
      <circle cx="10" cy="3" r="1.2" />
      <circle cx="4" cy="7" r="1.2" />
      <circle cx="10" cy="7" r="1.2" />
      <circle cx="4" cy="11" r="1.2" />
      <circle cx="10" cy="11" r="1.2" />
    </svg>
  );
}

function StatsIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="8" width="2.5" height="5" rx="0.5" />
      <rect x="5.75" y="4" width="2.5" height="9" rx="0.5" />
      <rect x="10.5" y="1" width="2.5" height="12" rx="0.5" />
    </svg>
  );
}

function ExportIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 1v8M7 9L4 6M7 9l3-3" />
      <path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" />
    </svg>
  );
}

function UploadSpinner() {
  return (
    <div style={{
      width: 16, height: 16, border: "2px solid var(--glass-border-h)",
      borderTopColor: "var(--accent)", borderRadius: "50%",
      animation: "spin 0.7s linear infinite"
    }} />
  );
}

/* ─── Toast Component ─── */
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, padding: "12px 18px", borderRadius: 8,
      fontFamily: "var(--mono, 'JetBrains Mono', monospace)", fontSize: 13, fontWeight: 500,
      zIndex: 999, transform: "translateY(0)", opacity: 1, transition: "all 0.25s ease",
      maxWidth: 400, display: "flex", alignItems: "center", gap: 10, border: "1px solid",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)", background: "rgba(18,21,31,0.95)",
      backdropFilter: "blur(12px)",
      borderColor: type === "success" ? "rgba(34,197,94,0.4)" : "rgba(255,79,79,0.4)",
      color: type === "success" ? "var(--success)" : "var(--danger)",
    }}>
      {type === "success" ? "✓" : "✗"} {message}
    </div>
  );
}

/* ─── Loading fallback ─── */
function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ color: "var(--text-m)", fontFamily: "'JetBrains Mono', monospace" }}>Загрузка...</div>
    </div>
  );
}

/* ─── Auto-resizing Textarea ─── */
function AutoTextarea({ defaultValue, value, onChange, onKeyDown, placeholder, style }: {
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentValue = value !== undefined ? value : (defaultValue || "");

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [currentValue]);

  return (
    <textarea
      ref={textareaRef}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={1}
      style={{
        width: "100%", background: "rgba(10,12,18,0.6)",
        border: "1px solid var(--glass-border)", borderRadius: 6,
        color: "var(--text)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
        padding: "8px 10px", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s",
        lineHeight: 1.5, resize: "none", minHeight: 38, overflow: "hidden",
        ...style,
      }}
      onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-glow)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

/* ─── Main App (wrapped in Suspense for useSearchParams) ─── */
export default function TestFormPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TestForm />
    </Suspense>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* ─── MAIN COMPONENT ─── */
/* ═══════════════════════════════════════════════════════════════ */
function TestForm() {
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("session");

  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [titleEditing, setTitleEditing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [filter, setFilter] = useState<"all" | "bugs" | "passed">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessionsList, setSessionsList] = useState<{ id: string; title: string; _count: { items: number }; updatedAt: string }[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // New state
  const [members, setMembers] = useState<SessionMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [memberInput, setMemberInput] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [commentsCache, setCommentsCache] = useState<Record<string, TestComment[]>>({});

  const [dragOverId, setDragOverId] = useState<string | null>(null);

  /* ─── Toast helper ─── */
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  /* ─── Load or create session ─── */
  useEffect(() => {
    async function init() {
      if (sessionIdParam) {
        const res = await fetch(`/api/sessions/${sessionIdParam}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data);
          setTitle(data.title);

        } else {
          showToast("Сессия не найдена", "error");
        }
      }
      setLoading(false);
    }
    init();
  }, [sessionIdParam, showToast]);

  /* ─── Load members ─── */
  useEffect(() => {
    if (!session) return;
    async function loadMembers() {
      try {
        const res = await fetch(`/api/sessions/${session.id}/members`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length === 0) {
            // Seed default members
            for (let i = 0; i < DEFAULT_MEMBERS.length; i++) {
              await fetch(`/api/sessions/${session.id}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: DEFAULT_MEMBERS[i], color: MEMBER_COLORS[i] }),
              });
            }
            const seeded = DEFAULT_MEMBERS.map((name, i) => ({
              id: `seed-${i}`, sessionId: session.id, name, color: MEMBER_COLORS[i],
            }));
            setMembers(seeded);
          } else {
            setMembers(data);
          }
        }
      } catch { /* ignore */ }
    }
    loadMembers();
  }, [session]);

  /* ─── Load stats ─── */
  useEffect(() => {
    if (!session || !showStats) return;
    async function loadStats() {
      try {
        const res = await fetch(`/api/sessions/${session.id}/stats`);
        if (res.ok) setStats(await res.json());
      } catch { /* ignore */ }
    }
    loadStats();
  }, [session, showStats]);

  /* ─── Auto-save title ─── */
  useEffect(() => {
    if (!session || !titleEditing) return;
    const t = setTimeout(async () => {
      await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    }, 500);
    return () => clearTimeout(t);
  }, [title, titleEditing, session]);

  /* ─── Create new session ─── */
  const createSession = useCallback(async () => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Тестирование 1С" }),
    });
    if (res.ok) {
      const data = await res.json();
      window.history.replaceState(null, "", `?session=${data.id}`);
      setSession({ ...data, items: [] });
      setTitle(data.title);
      showToast("Сессия создана", "success");
    }
  }, [showToast]);

  /* ─── Add new test item ─── */
  const addItem = useCallback(async (duplicateData?: Partial<TestItem>) => {
    if (!session) return;
    if (session.items.length >= 100) {
      showToast("Максимум 100 тест-кейсов", "error");
      return;
    }

    const res = await fetch(`/api/sessions/${session.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: duplicateData?.description || "",
        expectedResult: duplicateData?.expectedResult || "",
        bugOrRemark: duplicateData?.bugOrRemark || "",
        isMatched: false,
        screenshot: "",
      }),
    });

    if (res.ok) {
      const newItem = await res.json();
      setSession(prev => prev ? { ...prev, items: [...prev.items, newItem] } : prev);

    }
  }, [session]);

  /* ─── Update test item (auto-save) ─── */
  const updateItem = useCallback(async (itemId: string, data: Partial<TestItem>) => {
    if (!session) return;

    setSession(prev =>
      prev
        ? {
            ...prev,
            items: prev.items.map(item =>
              item.id === itemId ? { ...item, ...data } : item
            ),
          }
        : prev
    );

    const res = await fetch(`/api/sessions/${session.id}/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      showToast("Ошибка сохранения", "error");
    }
  }, [session, showToast]);

  /* ─── Delete test item ─── */
  const deleteItem = useCallback(async (itemId: string) => {
    if (!session) return;

    const res = await fetch(`/api/sessions/${session.id}/items/${itemId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSession(prev =>
        prev
          ? {
              ...prev,
              items: prev.items
                .filter(item => item.id !== itemId)
                .map((item, i) => ({ ...item, orderNum: i + 1 })),
            }
          : prev
      );

      setCommentsCache(prev => { const n = { ...prev }; delete n[itemId]; return n; });
      showToast("Тест-кейс удалён", "success");
    }
  }, [session, showToast]);

  /* ─── Upload screenshot ─── */
  const uploadScreenshot = useCallback(async (itemId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      await updateItem(itemId, { screenshot: data.url });
      showToast("Скриншот загружен", "success");
    } else {
      showToast("Ошибка загрузки", "error");
    }
  }, [updateItem, showToast]);

  /* ─── Copy share link ─── */
  const copyLink = useCallback(() => {
    if (!session) return;
    const url = `${window.location.origin}${window.location.pathname}?session=${session.id}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    showToast("Ссылка скопирована", "success");
    setTimeout(() => setLinkCopied(false), 2000);
  }, [session, showToast]);

  /* ─── Load sessions list ─── */
  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/sessions");
    if (res.ok) {
      const data = await res.json();
      setSessionsList(data);
      setShowSessions(true);
    }
  }, []);

  /* ─── Add member ─── */
  const addMember = useCallback(async (name: string) => {
    if (!session || !name.trim()) return;
    if (members.find(m => m.name === name.trim())) return;
    const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
    try {
      const res = await fetch(`/api/sessions/${session.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      if (res.ok) {
        const m = await res.json();
        setMembers(prev => [...prev, m]);
        setMemberInput("");
      }
    } catch { /* ignore */ }
  }, [session, members]);

  /* ─── Remove member ─── */
  const removeMember = useCallback(async (name: string) => {
    if (!session) return;
    try {
      await fetch(`/api/sessions/${session.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setMembers(prev => prev.filter(m => m.name !== name));
    } catch { /* ignore */ }
  }, [session]);

  /* ─── Export ─── */
  const exportCSV = useCallback(() => {
    if (!session) return;
    window.open(`/api/sessions/${session.id}/export`);
  }, [session]);

  /* ─── Cycle status ─── */
  const cycleStatus = useCallback((item: TestItem) => {
    const idx = STATUS_ORDER.indexOf(item.status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    const updateData: Partial<TestItem> = { status: next };
    if (next === "accepted") updateData.isMatched = true;
    updateItem(item.id, updateData);
  }, [updateItem]);

  /* ─── Cycle priority ─── */
  const cyclePriority = useCallback((item: TestItem) => {
    const idx = PRIORITY_ORDER.indexOf(item.priority);
    const next = PRIORITY_ORDER[(idx + 1) % PRIORITY_ORDER.length];
    updateItem(item.id, { priority: next });
  }, [updateItem]);



  /* ─── Load comments ─── */
  const loadComments = useCallback(async (sessionId: string, itemId: string) => {
    if (commentsCache[itemId]) return commentsCache[itemId];
    try {
      const res = await fetch(`/api/sessions/${sessionId}/items/${itemId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setCommentsCache(prev => ({ ...prev, [itemId]: data }));
        return data;
      }
    } catch { /* ignore */ }
    return [];
  }, [commentsCache]);

  /* ─── Add comment ─── */
  const addComment = useCallback(async (sessionId: string, itemId: string, author: string, text: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/items/${itemId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, text }),
      });
      if (res.ok) {
        const c = await res.json();
        setCommentsCache(prev => ({
          ...prev,
          [itemId]: [...(prev[itemId] || []), c],
        }));
      }
    } catch { /* ignore */ }
  }, []);

  /* ─── Drag & Drop ─── */
  const dragItemRef = useRef<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    dragItemRef.current = itemId;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.4";
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    dragItemRef.current = null;
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragItemRef.current && dragItemRef.current !== targetId) {
      setDragOverId(targetId);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const draggedId = dragItemRef.current;
    if (!draggedId || draggedId === targetId || !session) return;

    const items = [...session.items];
    const dragIdx = items.findIndex(i => i.id === draggedId);
    const targetIdx = items.findIndex(i => i.id === targetId);
    if (dragIdx === -1 || targetIdx === -1) return;

    const [dragged] = items.splice(dragIdx, 1);
    items.splice(targetIdx, 0, dragged);

    const reordered = items.map((item, i) => ({ ...item, orderNum: i + 1 }));
    setSession(prev => prev ? { ...prev, items: reordered } : prev);

    // Update orderNum via API
    for (const item of reordered) {
      fetch(`/api/sessions/${session.id}/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNum: item.orderNum }),
      });
    }
  }, [session]);

  /* ─── Hotkeys ─── */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "n") {
        e.preventDefault();
        if (session) addItem();
      }
      if (mod && e.key === "e") {
        e.preventDefault();
        if (session) exportCSV();
      }
      if (mod && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearchQuery("");
        setShowFilterMenu(false);
        setShowStats(false);
        setShowMembers(false);
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session, addItem, exportCSV]);

  /* ─── Filter items ─── */
  const filteredItems = session?.items.filter(item => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.description.toLowerCase().includes(q) ||
        item.expectedResult.toLowerCase().includes(q) ||
        item.bugOrRemark.toLowerCase().includes(q) ||
        (item.assignee && item.assignee.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }
    // Status filter
    if (filter === "all") return true;
    if (filter === "bugs") return !item.isMatched && (item.bugOrRemark.length > 0 || item.expectedResult.length > 0);
    if (filter === "passed") return item.isMatched;
    return true;
  }) || [];

  /* ─── Stats ─── */
  const totalItems = session?.items.length || 0;
  const passedItems = session?.items.filter(i => i.isMatched).length || 0;
  const bugsCount = session?.items.filter(i => !i.isMatched && i.bugOrRemark.length > 0).length || 0;
  const progressPercent = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

  /* ─── Button style helper ─── */
  const headerBtnStyle = (active = false): React.CSSProperties => ({
    width: 36, height: 36,
    background: active ? "var(--accent-glow-s)" : "rgba(18,21,31,0.6)",
    border: `1px solid ${active ? "var(--accent-dim)" : "var(--glass-border)"}`,
    borderRadius: 6, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
    color: active ? "var(--accent)" : "var(--text-m)",
  });

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ color: "var(--text-m)", fontFamily: "'JetBrains Mono', monospace" }}>Загрузка...</div>
      </div>
    );
  }

  /* ─── No session state ─── */
  if (!session) {
    return (
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{
          position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%)",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          background: "rgba(18,21,31,0.72)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "48px 40px", textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2), 0 12px 28px rgba(0,0,0,0.3), 0 32px 64px rgba(0,0,0,0.2)",
          maxWidth: 480, width: "100%",
        }}>
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>
            <span style={{ color: "var(--accent)" }}>1С</span> Тестирование
          </div>
          <p style={{ color: "var(--text-m)", fontSize: 13, marginBottom: 32, lineHeight: 1.6 }}>
            Форма тестирования и отслеживания багов
          </p>
          <button
            onClick={createSession}
            style={{
              width: "100%", background: "var(--accent)", color: "#fff",
              fontFamily: "'Unbounded', sans-serif", fontSize: 14, fontWeight: 700,
              letterSpacing: "0.04em", textTransform: "uppercase" as const,
              border: "none", borderRadius: 8, padding: "16px 24px", cursor: "pointer",
              transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: "0 4px 16px rgba(16,185,129,0.2)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-dark)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <PlusIcon size={18} />
            Создать тест-сессию
          </button>
          <button
            onClick={loadSessions}
            style={{
              width: "100%", background: "transparent", color: "var(--text-m)",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
              border: "1px solid var(--glass-border-h)", borderRadius: 8, padding: "12px 24px",
              cursor: "pointer", transition: "all 0.15s", marginTop: 12,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-dim)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border-h)"; e.currentTarget.style.color = "var(--text-m)"; }}
          >
            Открыть существующую
          </button>
          {showSessions && sessionsList.length > 0 && (
            <div style={{ marginTop: 16, maxHeight: 240, overflowY: "auto", textAlign: "left", border: "1px solid var(--glass-border)", borderRadius: 8, background: "rgba(10,12,18,0.6)" }}>
              {sessionsList.map((s) => (
                <button key={s.id} onClick={() => window.location.href = `?session=${s.id}`} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "10px 14px", background: "transparent", border: "none",
                  borderBottom: "1px solid var(--glass-border)", cursor: "pointer",
                  color: "var(--text)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                  transition: "background 0.15s", textAlign: "left" as const,
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--accent-glow)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                  <span style={{ color: "var(--text-d)", flexShrink: 0, marginLeft: 12 }}>
                    {s._count.items} шт · {new Date(s.updatedAt).toLocaleDateString("ru-RU")}
                  </span>
                </button>
              ))}
            </div>
          )}
          {showSessions && sessionsList.length === 0 && (
            <div style={{ marginTop: 16, color: "var(--text-d)", fontSize: 12, textAlign: "center" }}>Нет сохранённых сессий</div>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /* ─── MAIN RENDER ─── */
  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ─── Top Bar ─── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(22,22,22,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--glass-border)", padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 56,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>
            <span style={{ color: "var(--accent)" }}>1С</span> Тест
            <span style={{ fontSize: 9, color: "var(--text-d)", marginLeft: 8, fontFamily: "'JetBrains Mono', monospace", fontWeight: 400 }}>v2.0</span>
          </div>
          {titleEditing ? (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => setTitleEditing(false)}
              onKeyDown={e => { if (e.key === "Enter") setTitleEditing(false); }}
              autoFocus
              style={{
                background: "rgba(10,12,18,0.6)", border: "1px solid var(--accent-dim)", borderRadius: 6,
                color: "var(--text)", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, padding: "4px 10px",
                outline: "none", width: 260, maxWidth: "40vw",
              }}
            />
          ) : (
            <div
              onClick={() => setTitleEditing(true)}
              style={{ color: "var(--text-m)", fontSize: 13, cursor: "pointer", padding: "4px 8px", borderRadius: 4, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--accent-glow)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {title} ✏️
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Search */}
          <div style={{ position: "relative", marginRight: 4 }}>
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              style={{
                width: searchQuery ? 160 : 36, height: 36,
                background: searchQuery ? "rgba(10,12,18,0.6)" : "rgba(18,21,31,0.6)",
                border: `1px solid ${searchQuery ? "var(--accent-dim)" : "var(--glass-border)"}`,
                borderRadius: 6, color: "var(--text)", cursor: searchQuery ? "text" : "pointer",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: searchQuery ? "0 10px 0 32px" : 0,
                outline: "none", transition: "all 0.2s", textOverflow: "ellipsis",
              }}
            />
            {!searchQuery && (
              <div
                style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}
              >
                <SearchIcon />
              </div>
            )}
            {searchQuery && (
              <div style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-d)" }}>
                <SearchIcon size={12} />
              </div>
            )}
            {searchQuery && (
              <span style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                fontSize: 9, color: "var(--text-d)", pointerEvents: "none", whiteSpace: "nowrap",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {filteredItems.length} из {totalItems}
              </span>
            )}
          </div>

          {/* Members */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowMembers(!showMembers)}
              title="Участники"
              style={headerBtnStyle(showMembers)}
              onMouseEnter={e => { if (!showMembers) { e.currentTarget.style.borderColor = "var(--glass-border-h)"; e.currentTarget.style.background = "var(--accent-glow)"; } }}
              onMouseLeave={e => { if (!showMembers) { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.background = "rgba(18,21,31,0.6)"; } }}
            >
              <UsersIcon />
            </button>
            {showMembers && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowMembers(false)} />
                <div style={{
                  position: "absolute", top: 42, right: 0, zIndex: 200,
                  background: "rgba(18,21,31,0.95)", border: "1px solid var(--glass-border-h)",
                  borderRadius: 10, padding: "10px", minWidth: 240,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)",
                  maxHeight: 340, overflowY: "auto",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-m)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                    Участники ({members.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {members.map(m => (
                      <div key={m.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "5px 8px", borderRadius: 5, transition: "background 0.15s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--accent-glow)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: "50%", background: m.color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
                          }}>{m.name[0]}</div>
                          <span style={{ fontSize: 12, color: "var(--text)", fontFamily: "'JetBrains Mono', monospace" }}>{m.name}</span>
                        </div>
                        <button onClick={() => removeMember(m.name)} style={{
                          width: 20, height: 20, background: "transparent", border: "none",
                          cursor: "pointer", color: "var(--text-d)", display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: 4, transition: "all 0.15s",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "rgba(255,79,79,0.08)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-d)"; e.currentTarget.style.background = "transparent"; }}
                        >
                          <XIcon size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    <input
                      value={memberInput}
                      onChange={e => setMemberInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { addMember(memberInput); } }}
                      placeholder="Добавить..."
                      style={{
                        flex: 1, background: "rgba(10,12,18,0.6)", border: "1px solid var(--glass-border)",
                        borderRadius: 5, color: "var(--text)", fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                        padding: "5px 8px", outline: "none",
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--accent-dim)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--glass-border)"}
                    />
                    <button onClick={() => addMember(memberInput)} style={{
                      padding: "5px 10px", background: "var(--accent)", border: "none", borderRadius: 5,
                      color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                      transition: "all 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--accent-dark)"}
                      onMouseLeave={e => e.currentTarget.style.background = "var(--accent)"}
                    >+</button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 80, height: 6, background: "var(--glass-border)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${progressPercent}%`, height: "100%", background: "var(--accent)", borderRadius: 3, transition: "width 0.5s ease" }} />
            </div>
            <span style={{ fontSize: 10, color: "var(--text-d)", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
              {passedItems}/{totalItems}
            </span>
          </div>

          {/* Filter */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowFilterMenu(!showFilterMenu)} style={headerBtnStyle(filter !== "all")}>
              <FilterIcon />
            </button>
            {showFilterMenu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setShowFilterMenu(false)} />
                <div style={{
                  position: "absolute", top: 42, right: 0, zIndex: 200,
                  background: "rgba(18,21,31,0.95)", border: "1px solid var(--glass-border-h)",
                  borderRadius: 8, padding: 6, minWidth: 160,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)",
                }}>
                  {[
                    { key: "all" as const, label: "Все", count: totalItems },
                    { key: "bugs" as const, label: "Баги / замечания", count: bugsCount },
                    { key: "passed" as const, label: "Прошли проверку", count: passedItems },
                  ].map(f => (
                    <button key={f.key} onClick={() => { setFilter(f.key); setShowFilterMenu(false); }} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "8px 12px",
                      background: filter === f.key ? "var(--accent-glow-s)" : "transparent",
                      border: "none", borderRadius: 4, cursor: "pointer",
                      color: filter === f.key ? "var(--accent)" : "var(--text-m)",
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 12, transition: "background 0.15s",
                    }}
                      onMouseEnter={e => { if (filter !== f.key) e.currentTarget.style.background = "var(--accent-glow)"; }}
                      onMouseLeave={e => { if (filter !== f.key) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span>{f.label}</span>
                      <span style={{ color: "var(--text-d)", fontSize: 11 }}>{f.count}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Stats */}
          <button onClick={() => setShowStats(!showStats)} title="Статистика" style={headerBtnStyle(showStats)}
            onMouseEnter={e => { if (!showStats) { e.currentTarget.style.borderColor = "var(--glass-border-h)"; e.currentTarget.style.background = "var(--accent-glow)"; } }}
            onMouseLeave={e => { if (!showStats) { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.background = "rgba(18,21,31,0.6)"; } }}
          >
            <span style={{ fontSize: 15 }}>📊</span>
          </button>

          {/* Export */}
          <button onClick={exportCSV} title="Экспорт в Excel (Ctrl+E)" style={headerBtnStyle(false)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--glass-border-h)"; e.currentTarget.style.background = "var(--accent-glow)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.background = "rgba(18,21,31,0.6)"; }}
          >
            <ExportIcon />
          </button>

          {/* Share */}
          <button onClick={copyLink} title="Скопировать ссылку" style={headerBtnStyle(linkCopied)}
            onMouseEnter={e => { if (!linkCopied) { e.currentTarget.style.borderColor = "var(--glass-border-h)"; e.currentTarget.style.background = "var(--accent-glow)"; } }}
            onMouseLeave={e => { if (!linkCopied) { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.background = "rgba(18,21,31,0.6)"; } }}
          >
            <LinkIcon />
          </button>
        </div>
      </header>

      {/* ─── Stats Bar ─── */}
      <div style={{
        position: "sticky", top: 56, zIndex: 99,
        background: "rgba(18,21,31,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--glass-border)", padding: "10px 32px",
        display: "flex", alignItems: "center", gap: 20, fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
      }}>
        <span style={{ color: "var(--text-d)" }}>Всего: <span style={{ color: "var(--text)" }}>{totalItems}</span></span>
        <span style={{ color: "var(--text-d)" }}>Проверено: <span style={{ color: "var(--success)" }}>{passedItems}</span></span>
        <span style={{ color: "var(--text-d)" }}>Баги: <span style={{ color: "var(--danger)" }}>{bugsCount}</span></span>
        <span style={{ color: "var(--text-d)" }}>Осталось: <span style={{ color: "var(--warning)" }}>{totalItems - passedItems}</span></span>
        {totalItems > 0 && (
          <span style={{ color: "var(--text-d)", marginLeft: "auto" }}>Прогресс: <span style={{ color: "var(--accent)" }}>{progressPercent}%</span></span>
        )}
      </div>

      {/* ─── Stats Dashboard Panel ─── */}
      {showStats && stats && (
        <div style={{
          position: "relative", zIndex: 98,
          background: "rgba(18,21,31,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--glass-border)", padding: "16px 32px",
          animation: "fadeInUp 0.2s ease",
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {/* Overview */}
            <div>
              <div style={{ color: "var(--text-m)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Обзор</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-d)" }}>Всего</span>
                  <span style={{ color: "var(--text)" }}>{stats.total}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-d)" }}>Проверено</span>
                  <span style={{ color: "var(--success)" }}>{stats.matched}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-d)" }}>Багов</span>
                  <span style={{ color: "var(--danger)" }}>{stats.bugs}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-d)" }}>Общее время</span>
                  <span style={{ color: "var(--accent)" }}>{formatTime(stats.totalTime)}</span>
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: 4 }}>
                  <div style={{ width: "100%", height: 8, background: "var(--glass-border)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${stats.total > 0 ? (stats.matched / stats.total * 100) : 0}%`, height: "100%", background: "var(--accent)", borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ color: "var(--text-d)", fontSize: 9, marginTop: 2 }}>
                    {stats.total > 0 ? Math.round(stats.matched / stats.total * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* By Priority */}
            <div>
              <div style={{ color: "var(--text-m)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>По приоритету</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {PRIORITY_ORDER.map(p => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--text-d)", width: 56, fontSize: 10 }}>{PRIORITY_CONFIG[p].label}</span>
                    <div style={{ flex: 1, height: 10, background: "var(--glass-border)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        width: `${stats.total > 0 ? ((stats.byPriority[p] || 0) / stats.total * 100) : 0}%`,
                        height: "100%", background: PRIORITY_CONFIG[p].color, borderRadius: 3, transition: "width 0.5s",
                      }} />
                    </div>
                    <span style={{ color: "var(--text-d)", width: 20, textAlign: "right", fontSize: 10 }}>{stats.byPriority[p] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Status */}
            <div>
              <div style={{ color: "var(--text-m)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>По статусу</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {STATUS_ORDER.map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--text-d)", width: 64, fontSize: 10 }}>{STATUS_CONFIG[s].label}</span>
                    <div style={{ flex: 1, height: 10, background: "var(--glass-border)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        width: `${stats.total > 0 ? ((stats.byStatus[s] || 0) / stats.total * 100) : 0}%`,
                        height: "100%", background: STATUS_CONFIG[s].color, borderRadius: 3, transition: "width 0.5s",
                      }} />
                    </div>
                    <span style={{ color: "var(--text-d)", width: 20, textAlign: "right", fontSize: 10 }}>{stats.byStatus[s] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Assignee */}
            <div>
              <div style={{ color: "var(--text-m)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>По участникам</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflowY: "auto" }}>
                {Object.entries(stats.byAssignee).map(([name, d]) => {
                  const color = getMemberColor(name, members);
                  return (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {name[0]}
                      </div>
                      <span style={{ color: name === "Не назначен" ? "var(--text-d)" : "var(--text)", fontSize: 10, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {name}
                      </span>
                      <span style={{ color: "var(--text-d)", fontSize: 9, whiteSpace: "nowrap" }}>
                        {d.total} · <span style={{ color: "var(--danger)" }}>{d.bugs}б</span> · {formatTime(d.totalTime)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <main style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "24px 32px 120px", flex: 1 }}>
        {filteredItems.length === 0 && filter === "all" && !searchQuery && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-d)", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ marginBottom: 8, color: "var(--text-m)", fontSize: 14 }}>Нет тест-кейсов</div>
            <div style={{ marginBottom: 24 }}>
              Нажмите кнопку <span style={{ color: "var(--accent)" }}>+ Добавить</span> ниже или{" "}
              <span style={{ color: "var(--accent)" }}>Ctrl+N</span>
            </div>
            <button onClick={() => addItem()} style={{
              background: "var(--accent)", color: "#fff", fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
              border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(16,185,129,0.2)", transition: "all 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--accent-dark)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--accent)"}
            >
              <PlusIcon size={14} />
              Добавить первый тест-кейс
            </button>
          </div>
        )}

        {filteredItems.length === 0 && (filter !== "all" || searchQuery) && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-d)", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{searchQuery ? "🔍" : filter === "bugs" ? "🎉" : "🔍"}</div>
            <div style={{ marginBottom: 8, color: "var(--text-m)" }}>
              {searchQuery ? `Ничего не найдено по запросу "${searchQuery}"` : filter === "bugs" ? "Багов не найдено!" : "Нет проверенных тест-кейсов"}
            </div>
          </div>
        )}

        {filteredItems.map((item, idx) => (
          <TestItemCard
            key={item.id}
            item={item}
            index={idx}
            isLast={idx === filteredItems.length - 1}
            sessionId={session.id}
            members={members}
            comments={commentsCache[item.id] || null}
            isDragOver={dragOverId === item.id}
            onUpdate={(data) => updateItem(item.id, data)}
            onDelete={() => deleteItem(item.id)}
            onDuplicate={() => addItem({ description: item.description, expectedResult: item.expectedResult })}
            onAddAfter={() => addItem()}
            onUploadScreenshot={(file) => uploadScreenshot(item.id, file)}
            onCycleStatus={() => cycleStatus(item)}
            onCyclePriority={() => cyclePriority(item)}
            onLoadComments={() => loadComments(session.id, item.id)}
            onAddComment={(author, text) => addComment(session.id, item.id, author, text)}
            fileInputRef={(el) => { fileInputRefs.current[item.id] = el; }}
            triggerFileInput={() => fileInputRefs.current[item.id]?.click()}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragEnd={(e) => handleDragEnd(e)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDrop={(e) => handleDrop(e, item.id)}
          />
        ))}

        {/* ─── Add Button ─── */}
        {totalItems < 100 && filteredItems.length > 0 && (
          <button onClick={() => addItem()} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", marginTop: 16, padding: "14px 24px",
            background: "transparent", border: "1px dashed var(--glass-border-h)",
            borderRadius: 10, color: "var(--text-m)", cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-glow)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border-h)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-m)"; }}
          >
            <PlusIcon size={16} />
            Добавить тест-кейс ({totalItems}/100)
          </button>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(22,22,22,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid var(--glass-border)", padding: "10px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between", height: 48,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-d)",
      }}>
        <span>Форма тестирования 1С · Автосохранение включено</span>
        <span>Обновлено: {new Date(session.updatedAt).toLocaleString("ru-RU")}</span>
      </footer>

      {/* ─── Toast ─── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/* ─── TEST ITEM CARD ─── */
/* ═══════════════════════════════════════════════════════════════ */
function TestItemCard({
  item, index, isLast, sessionId, members, comments, isDragOver,
  onUpdate, onDelete, onDuplicate, onAddAfter, onUploadScreenshot,
  onCycleStatus, onCyclePriority,
  onLoadComments, onAddComment,
  fileInputRef, triggerFileInput,
  onDragStart, onDragEnd, onDragOver, onDrop,
}: {
  item: TestItem;
  index: number;
  isLast: boolean;
  sessionId: string;
  members: SessionMember[];
  comments: TestComment[] | null;
  isDragOver: boolean;
  onUpdate: (data: Partial<TestItem>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddAfter: () => void;
  onUploadScreenshot: (file: File) => void;
  onCycleStatus: () => void;
  onCyclePriority: () => void;

  onLoadComments: () => void;
  onAddComment: (author: string, text: string) => void;
  fileInputRef: (el: HTMLInputElement | null) => void;
  triggerFileInput: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [showAuthorPicker, setShowAuthorPicker] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const cardInteracted = useRef(false);

  const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;
  const assigneeColor = item.assignee ? getMemberColor(item.assignee, members) : null;
  const currentComments = comments || [];

  // Load comments on first interaction
  const handleCardInteraction = useCallback(() => {
    if (!cardInteracted.current) {
      cardInteracted.current = true;
      onLoadComments();
    }
  }, [onLoadComments]);

  // Debounced save
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const debouncedUpdate = useCallback((field: keyof TestItem, value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate({ [field]: value });
    }, 400);
  }, [onUpdate]);

  // Escape key
  useEffect(() => {
    if (!previewOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setPreviewOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [previewOpen]);

  // Handle screenshot upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { await onUploadScreenshot(file); } finally { setUploading(false); }
    e.target.value = "";
  };

  // Submit comment
  const submitComment = useCallback(() => {
    if (!commentText.trim()) return;
    const author = commentAuthor.trim() || members[0]?.name || "Аноним";
    onAddComment(author, commentText.trim());
    setCommentText("");
  }, [commentText, commentAuthor, members, onAddComment]);

  // Border colors
  let borderColor = "rgba(255,255,255,0.07)";
  if (item.priority === "critical") borderColor = "rgba(239,68,68,0.35)";
  else if (item.isMatched) borderColor = "rgba(34,197,94,0.2)";
  else if (item.bugOrRemark.length > 0) borderColor = "rgba(255,79,79,0.15)";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={handleCardInteraction}
      onClick={handleCardInteraction}
      style={{
        background: "rgba(18,21,31,0.72)",
        border: `1px solid ${isDragOver ? "var(--accent)" : borderColor}`,
        borderLeft: item.priority === "critical" ? "3px solid rgba(239,68,68,0.6)" : undefined,
        borderRadius: 10, overflow: "hidden",
        animation: `fadeInUp 0.3s ease both`,
        animationDelay: `${Math.min(index * 0.03, 0.3)}s`,
        boxShadow: isDragOver ? "0 0 0 2px var(--accent), 0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.2), 0 12px 28px rgba(0,0,0,0.3), 0 32px 64px rgba(0,0,0,0.2)",
        marginTop: 8, transition: "border-color 0.3s ease, box-shadow 0.15s ease",
      }}
    >
      {/* ─── Card Header ─── */}
      <div style={{
        padding: "8px 12px", borderBottom: "1px solid var(--glass-border)",
        display: "flex", alignItems: "center", gap: 8,
        background: "var(--surface2)", flexWrap: "wrap",
      }}>
        {/* Drag Handle */}
        <div style={{ cursor: "grab", color: "var(--text-d)", padding: "0 2px", flexShrink: 0 }}
          title="Перетащить"
        >
          <DragHandleIcon />
        </div>

        {/* Order # */}
        <div style={{
          width: 22, height: 22,
          background: item.isMatched ? "var(--success)" : "var(--accent)",
          borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
          transition: "background 0.3s ease",
        }}>
          {item.orderNum}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", color: "var(--text)", flex: 1, minWidth: 60,
        }}>
          #{item.orderNum}
        </div>

        {/* Status Badge */}
        <button onClick={onCycleStatus} title="Изменить статус" style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 8px", borderRadius: 10, border: "none",
          background: `${statusCfg.color}22`, color: statusCfg.color,
          fontSize: 9, fontWeight: 700, cursor: "pointer",
          fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase",
          letterSpacing: "0.04em", transition: "all 0.15s", whiteSpace: "nowrap",
        }}
          onMouseEnter={e => e.currentTarget.style.background = `${statusCfg.color}44`}
          onMouseLeave={e => e.currentTarget.style.background = `${statusCfg.color}22`}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusCfg.color, flexShrink: 0 }} />
          {statusCfg.label}
        </button>

        {/* Priority Badge */}
        <button onClick={onCyclePriority} title="Изменить приоритет" style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 8px", borderRadius: 10, border: "none",
          background: `${priorityCfg.color}22`, color: priorityCfg.color,
          fontSize: 9, fontWeight: 700, cursor: "pointer",
          fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase",
          letterSpacing: "0.04em", transition: "all 0.15s", whiteSpace: "nowrap",
        }}
          onMouseEnter={e => e.currentTarget.style.background = `${priorityCfg.color}44`}
          onMouseLeave={e => e.currentTarget.style.background = `${priorityCfg.color}22`}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: priorityCfg.color, flexShrink: 0 }} />
          {priorityCfg.label}
        </button>



        {/* Assignee Avatar */}
        {item.assignee ? (
          <div title={item.assignee} style={{
            width: 22, height: 22, borderRadius: "50%", background: assigneeColor || "#666",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {item.assignee[0]}
          </div>
        ) : (
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            border: "1px dashed var(--glass-border-h)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: "var(--text-d)", flexShrink: 0,
          }}>
            ?
          </div>
        )}

        {/* Match checkbox */}
        <button onClick={() => onUpdate({ isMatched: !item.isMatched })}
          title={item.isMatched ? "Снять отметку" : "Отметить как совпавшее"}
          style={{
            width: 28, height: 28, border: "none", background: "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: item.isMatched ? "var(--success)" : "var(--text-d)",
            transition: "color 0.2s ease, transform 0.15s ease", padding: 0, flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <CheckSquareIcon size={18} />
        </button>

        {/* Duplicate */}
        <button onClick={onDuplicate} title="Повторить"
          style={{
            fontSize: 9, fontWeight: 600, padding: "4px 8px", borderRadius: 5,
            border: "1px solid var(--glass-border-h)", background: "var(--surface2)",
            color: "var(--text-m)", cursor: "pointer", transition: "all 0.15s",
            display: "flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-dim)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-glow)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border-h)"; e.currentTarget.style.color = "var(--text-m)"; e.currentTarget.style.background = "var(--surface2)"; }}
        >
          <CopyIcon size={10} />
          <span style={{ display: "inline" }}>Копия</span>
        </button>

        {/* Delete */}
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} title="Удалить"
            style={{
              width: 28, height: 28, border: "1px solid var(--glass-border)", background: "var(--surface2)",
              borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-d)", transition: "all 0.15s", padding: 0, flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,79,79,0.4)"; e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "rgba(255,79,79,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.color = "var(--text-d)"; e.currentTarget.style.background = "var(--surface2)"; }}
          >
            <TrashIcon size={12} />
          </button>
        ) : (
          <button onClick={() => { onDelete(); setConfirmDelete(false); }}
            onBlur={() => setTimeout(() => setConfirmDelete(false), 200)}
            autoFocus style={{
              fontSize: 9, fontWeight: 700, padding: "4px 8px", borderRadius: 5,
              border: "1px solid rgba(255,79,79,0.4)", background: "rgba(255,79,79,0.1)",
              color: "var(--danger)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}
          >Удалить?</button>
        )}
      </div>

      {/* ─── Card Body (3 columns + assignee dropdown) ─── */}
      <div style={{ display: "flex", gap: 12, padding: 14 }}>
        {/* Column 1: Что тестируем */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <label style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 500, color: "var(--text-m)",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Что тестируем <span style={{ color: "var(--danger)", fontSize: 12, lineHeight: 1 }}>*</span>
          </label>
          <AutoTextarea
            defaultValue={item.description}
            onChange={e => debouncedUpdate("description", e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && e.metaKey && isLast) { e.preventDefault(); onAddAfter(); } }}
            placeholder="Что тестируем..."
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: "var(--text-d)" }}>Постановщик</span>
            <span style={{ fontSize: 9, color: "var(--text-d)" }}>{item.description.length} симв.</span>
          </div>
        </div>

        {/* Column 2: Ожидаемый результат */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <label style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 500, color: "var(--text-m)",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Ожидаемый результат <span style={{ color: "var(--danger)", fontSize: 12, lineHeight: 1 }}>*</span>
          </label>
          <AutoTextarea
            defaultValue={item.expectedResult}
            onChange={e => debouncedUpdate("expectedResult", e.target.value)}
            placeholder="Ожидаемый результат..."
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: "var(--text-d)" }}>Постановщик</span>
            <span style={{ fontSize: 9, color: "var(--text-d)" }}>{item.expectedResult.length} симв.</span>
          </div>
        </div>

        {/* Column 3: Баг/замечание + скриншот + assignee + comments */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <label style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 500,
            color: item.bugOrRemark.length > 0 ? "var(--danger)" : "var(--text-m)",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            {item.bugOrRemark.length > 0 ? "⚠" : "📝"} Баг/замечание
          </label>
          <AutoTextarea
            defaultValue={item.bugOrRemark}
            onChange={e => debouncedUpdate("bugOrRemark", e.target.value)}
            placeholder="Баг или замечание..."
            style={{ borderColor: item.bugOrRemark.length > 0 ? "rgba(255,79,79,0.25)" : undefined }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: "var(--text-d)" }}>Тестировщик</span>
            <span style={{ fontSize: 9, color: "var(--text-d)" }}>{item.bugOrRemark.length} симв.</span>
          </div>

          {/* Assignee Quick-Click Chips (radio-style like Bitrix crew-grid) */}
          <div style={{ marginTop: 4 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {members.map(m => {
                const isActive = item.assignee === m.name;
                const isDimmed = !isActive && item.assignee !== "";
                return (
                  <button
                    key={m.id}
                    onClick={() => onUpdate({ assignee: isActive ? "" : m.name })}
                    title={m.name}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "6px 12px", borderRadius: 6,
                      border: `1px solid ${isActive ? "var(--accent-dim)" : "var(--glass-border-h)"}`,
                      background: isActive ? "var(--accent-glow-s)" : "var(--surface2, rgba(18,21,31,0.4))",
                      color: isActive ? "var(--accent)" : "var(--text-m)",
                      cursor: isDimmed ? "default" : "pointer",
                      transition: "all 0.2s", userSelect: "none",
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                      opacity: isDimmed ? 0.45 : 1,
                      pointerEvents: isDimmed ? "none" : "auto",
                    }}
                    onMouseEnter={e => { if (!isActive && !isDimmed) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "var(--text)"; } }}
                    onMouseLeave={e => { if (!isActive && !isDimmed) { e.currentTarget.style.borderColor = "var(--glass-border-h)"; e.currentTarget.style.color = "var(--text-m)"; } }}
                  >
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                      background: isActive ? m.color : (isDimmed ? "var(--dim-red, rgba(255,79,79,0.35))" : "var(--text-d, #4a5270)"),
                      transition: "all 0.2s",
                      boxShadow: isActive ? `0 0 6px ${m.color}40` : "none",
                    }} />
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Screenshot section */}
          <div style={{ marginTop: 4 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/bmp"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            {item.screenshot ? (
              <div style={{ position: "relative" }}>
                <div onClick={() => setPreviewOpen(true)} style={{
                  borderRadius: 6, overflow: "hidden", cursor: "pointer",
                  border: "1px solid var(--glass-border)", transition: "border-color 0.15s", maxHeight: 100,
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-dim)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--glass-border)"}
                >
                  <img src={item.screenshot} alt="Скриншот бага" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 100 }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                  <button onClick={triggerFileInput} style={{
                    fontSize: 8, fontWeight: 600, padding: "2px 5px", borderRadius: 4,
                    border: "1px solid var(--glass-border-h)", background: "var(--surface2)",
                    color: "var(--text-m)", cursor: "pointer", transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: 2, fontFamily: "'JetBrains Mono', monospace",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-dim)"; e.currentTarget.style.color = "var(--accent)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border-h)"; e.currentTarget.style.color = "var(--text-m)"; }}
                  >
                    <ImagePlusIcon size={8} /> Заменить
                  </button>
                  <button onClick={() => onUpdate({ screenshot: "" })} style={{
                    fontSize: 8, fontWeight: 600, padding: "2px 5px", borderRadius: 4,
                    border: "1px solid var(--glass-border)", background: "var(--surface2)",
                    color: "var(--text-d)", cursor: "pointer", transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: 2, fontFamily: "'JetBrains Mono', monospace",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,79,79,0.3)"; e.currentTarget.style.color = "var(--danger)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.color = "var(--text-d)"; }}
                  >
                    <XIcon size={8} /> Удалить
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={triggerFileInput} disabled={uploading} style={{
                width: "100%", padding: "6px 6px", border: "1px dashed var(--glass-border)",
                borderRadius: 6, background: "rgba(10,12,18,0.4)", cursor: uploading ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                color: "var(--text-d)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, transition: "all 0.15s",
              }}
                onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-glow)"; e.currentTarget.style.color = "var(--accent)"; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.background = "rgba(10,12,18,0.4)"; e.currentTarget.style.color = "var(--text-d)"; }}
              >
                {uploading ? <UploadSpinner /> : <ImagePlusIcon size={10} />}
                {uploading ? "Загрузка..." : "Скриншот"}
              </button>
            )}
          </div>

          {/* Comments Section */}
          <div style={{ marginTop: 6, borderTop: "1px solid var(--glass-border)", paddingTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: "var(--text-d)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                💬 Комментарии {currentComments.length > 0 && `(${currentComments.length})`}
              </span>
            </div>

            {/* Show comments */}
            {currentComments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 4 }}>
                {(commentsExpanded ? currentComments : currentComments.slice(-2)).map(c => {
                  const cColor = getMemberColor(c.author, members);
                  return (
                    <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%", background: cColor,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 7, fontWeight: 700, color: "#fff", flexShrink: 0, marginTop: 1,
                      }}>
                        {c.author[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text)" }}>{c.author}</span>
                          <span style={{ fontSize: 8, color: "var(--text-d)" }}>{relativeTime(c.createdAt)}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-m)", lineHeight: 1.4, wordBreak: "break-word" }}>
                          {c.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {currentComments.length > 2 && !commentsExpanded && (
                  <button onClick={() => setCommentsExpanded(true)} style={{
                    background: "none", border: "none", color: "var(--accent)", fontSize: 9,
                    cursor: "pointer", padding: 0, fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    ещё {currentComments.length - 2}
                  </button>
                )}
                {commentsExpanded && currentComments.length > 2 && (
                  <button onClick={() => setCommentsExpanded(false)} style={{
                    background: "none", border: "none", color: "var(--text-d)", fontSize: 9,
                    cursor: "pointer", padding: 0, fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    свернуть
                  </button>
                )}
              </div>
            )}

            {/* Comment input */}
            <div style={{ position: "relative" }}>
              {showAuthorPicker && (
                <div style={{
                  position: "absolute", bottom: "100%", left: 0, right: 0, zIndex: 10,
                  background: "rgba(18,21,31,0.95)", border: "1px solid var(--glass-border-h)",
                  borderRadius: 6, padding: 4, marginBottom: 4,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)", maxHeight: 120, overflowY: "auto",
                }}>
                  {members.map(m => (
                    <button key={m.id} onClick={() => { setCommentAuthor(m.name); setShowAuthorPicker(false); }} style={{
                      display: "flex", alignItems: "center", gap: 6, width: "100%",
                      padding: "4px 8px", background: "transparent", border: "none", borderRadius: 4,
                      cursor: "pointer", color: "var(--text)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                      transition: "background 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--accent-glow)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: "#fff" }}>
                        {m.name[0]}
                      </div>
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onFocus={() => { if (!commentAuthor && members.length > 0) setShowAuthorPicker(true); }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitComment();
                    }
                  }}
                  placeholder="Комментарий..."
                  style={{
                    flex: 1, background: "rgba(10,12,18,0.6)", border: "1px solid var(--glass-border)",
                    borderRadius: 5, color: "var(--text)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                    padding: "4px 8px", outline: "none", transition: "border-color 0.15s",
                  }}

                />
                {(commentAuthor || members.length === 0) && (
                  <div title={commentAuthor} style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: commentAuthor ? getMemberColor(commentAuthor, members) : "#666",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0,
                    cursor: "pointer", border: "none", padding: 0,
                  }}
                    onClick={() => setShowAuthorPicker(true)}
                  >
                    {commentAuthor ? commentAuthor[0] : "?"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Screenshot Preview Modal ─── */}
      {previewOpen && item.screenshot && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, cursor: "pointer", animation: "fadeInUp 0.2s ease",
        }} onClick={() => setPreviewOpen(false)}>
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img src={item.screenshot} alt="Скриншот бага" onClick={e => e.stopPropagation()}
              style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 8, display: "block", objectFit: "contain" }} />
            <button onClick={() => setPreviewOpen(false)} style={{
              position: "absolute", top: -12, right: -12, width: 32, height: 32,
              background: "rgba(18,21,31,0.9)", border: "1px solid var(--glass-border-h)",
              borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text)", transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--danger)"; e.currentTarget.style.color = "var(--danger)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border-h)"; e.currentTarget.style.color = "var(--text)"; }}
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

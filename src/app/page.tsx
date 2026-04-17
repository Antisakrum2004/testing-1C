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
}

interface TestSession {
  id: string;
  title: string;
  items: TestItem[];
  createdAt: string;
  updatedAt: string;
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

/* ─── Main App (wrapped in Suspense for useSearchParams) ─── */
export default function TestFormPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TestForm />
    </Suspense>
  );
}

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

  /* ─── Filter items ─── */
  const filteredItems = session?.items.filter(item => {
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
        {/* Background glow */}
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
            <div style={{
              marginTop: 16, maxHeight: 240, overflowY: "auto", textAlign: "left",
              border: "1px solid var(--glass-border)", borderRadius: 8, background: "rgba(10,12,18,0.6)",
            }}>
              {sessionsList.map((s: { id: string; title: string; _count: { items: number }; updatedAt: string }) => (
                <button
                  key={s.id}
                  onClick={() => window.location.href = `?session=${s.id}`}
                  style={{
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
            <div style={{ marginTop: 16, color: "var(--text-d)", fontSize: 12, textAlign: "center" }}>
              Нет сохранённых сессий
            </div>
          )}
        </div>
      </div>
    );
  }

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

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
            <div style={{ width: 100, height: 6, background: "var(--glass-border)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${progressPercent}%`, height: "100%", background: "var(--accent)", borderRadius: 3, transition: "width 0.5s ease" }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--text-d)", fontFamily: "'JetBrains Mono', monospace" }}>
              {passedItems}/{totalItems}
            </span>
          </div>

          {/* Filter */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              style={{
                width: 36, height: 36, background: filter !== "all" ? "var(--accent-glow-s)" : "rgba(18,21,31,0.6)",
                border: `1px solid ${filter !== "all" ? "var(--accent-dim)" : "var(--glass-border)"}`,
                borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s", color: filter !== "all" ? "var(--accent)" : "var(--text-m)",
              }}
            >
              <FilterIcon />
            </button>
            {showFilterMenu && (
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
                  <button
                    key={f.key}
                    onClick={() => { setFilter(f.key); setShowFilterMenu(false); }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "8px 12px", background: filter === f.key ? "var(--accent-glow-s)" : "transparent",
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
            )}
          </div>

          {/* Share */}
          <button
            onClick={copyLink}
            title="Скопировать ссылку"
            style={{
              width: 36, height: 36, background: "rgba(18,21,31,0.6)",
              border: `1px solid ${linkCopied ? "var(--accent-dim)" : "var(--glass-border)"}`,
              borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s", color: linkCopied ? "var(--accent)" : "var(--text-m)",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--glass-border-h)"; e.currentTarget.style.background = "var(--accent-glow)"; }}
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
        <span style={{ color: "var(--text-d)" }}>
          Всего: <span style={{ color: "var(--text)" }}>{totalItems}</span>
        </span>
        <span style={{ color: "var(--text-d)" }}>
          Проверено: <span style={{ color: "var(--success)" }}>{passedItems}</span>
        </span>
        <span style={{ color: "var(--text-d)" }}>
          Баги: <span style={{ color: "var(--danger)" }}>{bugsCount}</span>
        </span>
        <span style={{ color: "var(--text-d)" }}>
          Осталось: <span style={{ color: "var(--warning)" }}>{totalItems - passedItems}</span>
        </span>
        {totalItems > 0 && (
          <span style={{ color: "var(--text-d)", marginLeft: "auto" }}>
            Прогресс: <span style={{ color: "var(--accent)" }}>{progressPercent}%</span>
          </span>
        )}
      </div>

      {/* ─── Click outside filter menu ─── */}
      {showFilterMenu && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 199 }}
          onClick={() => setShowFilterMenu(false)}
        />
      )}

      {/* ─── Main Content ─── */}
      <main style={{ maxWidth: 944, width: "100%", margin: "0 auto", padding: "24px 32px 120px", flex: 1 }}>
        {filteredItems.length === 0 && filter === "all" && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: "var(--text-d)", fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ marginBottom: 8, color: "var(--text-m)", fontSize: 14 }}>Нет тест-кейсов</div>
            <div style={{ marginBottom: 24 }}>
              Нажмите кнопку <span style={{ color: "var(--accent)" }}>+ Добавить</span> ниже или{" "}
              <span style={{ color: "var(--accent)" }}>Enter</span> в поле &laquo;Что тестируем&raquo;
            </div>
            <button
              onClick={() => addItem()}
              style={{
                background: "var(--accent)", color: "#fff",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.04em",
                border: "none", borderRadius: 6, padding: "10px 20px", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 16px rgba(16,185,129,0.2)", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-dark)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--accent)"; }}
            >
              <PlusIcon size={14} />
              Добавить первый тест-кейс
            </button>
          </div>
        )}

        {filteredItems.length === 0 && filter !== "all" && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: "var(--text-d)", fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {filter === "bugs" ? "🎉" : "🔍"}
            </div>
            <div style={{ marginBottom: 8, color: "var(--text-m)" }}>
              {filter === "bugs" ? "Багов не найдено!" : "Нет проверенных тест-кейсов"}
            </div>
          </div>
        )}

        {filteredItems.map((item, idx) => (
          <TestItemCard
            key={item.id}
            item={item}
            index={idx}
            isLast={idx === filteredItems.length - 1}
            onUpdate={(data) => updateItem(item.id, data)}
            onDelete={() => deleteItem(item.id)}
            onDuplicate={() => {
              addItem({
                description: item.description,
                expectedResult: item.expectedResult,
              });
            }}
            onAddAfter={() => addItem()}
            onUploadScreenshot={(file) => uploadScreenshot(item.id, file)}
            fileInputRef={(el) => { fileInputRefs.current[item.id] = el; }}
            triggerFileInput={() => fileInputRefs.current[item.id]?.click()}
          />
        ))}

        {/* ─── Add Button ─── */}
        {totalItems < 100 && filteredItems.length > 0 && (
          <button
            onClick={() => addItem()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", marginTop: 16, padding: "14px 24px",
              background: "transparent", border: "1px dashed var(--glass-border-h)",
              borderRadius: 10, color: "var(--text-m)", cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.background = "var(--accent-glow)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--glass-border-h)";
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-m)";
            }}
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
        <span>
          Обновлено: {new Date(session.updatedAt).toLocaleString("ru-RU")}
        </span>
      </footer>

      {/* ─── Toast ─── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
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

/* ─── Test Item Card ─── */
function TestItemCard({
  item,
  index,
  isLast,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddAfter,
  onUploadScreenshot,
  fileInputRef,
  triggerFileInput,
}: {
  item: TestItem;
  index: number;
  isLast: boolean;
  onUpdate: (data: Partial<TestItem>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddAfter: () => void;
  onUploadScreenshot: (file: File) => void;
  fileInputRef: (el: HTMLInputElement | null) => void;
  triggerFileInput: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced save for text fields
  const debouncedUpdate = useCallback((field: keyof TestItem, value: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onUpdate({ [field]: value });
    }, 400);
  }, [onUpdate]);

  // Escape key to close preview
  useEffect(() => {
    if (!previewOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewOpen]);

  // Handle screenshot upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUploadScreenshot(file);
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  };

  return (
    <div style={{
      background: "rgba(18,21,31,0.72)",
      border: `1px solid ${item.isMatched ? "rgba(34,197,94,0.2)" : item.bugOrRemark.length > 0 ? "rgba(255,79,79,0.15)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 10, overflow: "hidden",
      animation: `fadeInUp 0.3s ease both`,
      animationDelay: `${Math.min(index * 0.03, 0.3)}s`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.2), 0 12px 28px rgba(0,0,0,0.3), 0 32px 64px rgba(0,0,0,0.2)",
      marginTop: 8, transition: "border-color 0.3s ease",
    }}>
      {/* ─── Card Header ─── */}
      <div style={{
        padding: "10px 14px", borderBottom: "1px solid var(--glass-border)",
        display: "flex", alignItems: "center", gap: 10,
        background: "var(--surface2)", flexWrap: "wrap",
      }}>
        <div style={{
          width: 22, height: 22,
          background: item.isMatched ? "var(--success)" : "var(--accent)",
          borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
          transition: "background 0.3s ease",
        }}>
          {item.orderNum}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", color: "var(--text)", flex: 1,
        }}>
          Тест-кейс #{item.orderNum}
          {item.isMatched && (
            <span style={{ marginLeft: 8, color: "var(--success)", fontWeight: 500, fontSize: 10 }}>
              ✓ Проверено
            </span>
          )}
          {!item.isMatched && item.bugOrRemark.length > 0 && (
            <span style={{ marginLeft: 8, color: "var(--danger)", fontWeight: 500, fontSize: 10 }}>
              ⚠ Баг
            </span>
          )}
        </div>

        {/* Match checkbox */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "var(--text-d)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Совпадает
          </span>
          <button
            onClick={() => onUpdate({ isMatched: !item.isMatched })}
            title={item.isMatched ? "Снять отметку" : "Отметить как совпавшее"}
            style={{
              width: 30, height: 30, border: "none", background: "transparent",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: item.isMatched ? "var(--success)" : "var(--text-d)",
              transition: "color 0.2s ease, transform 0.15s ease",
              padding: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            <CheckSquareIcon />
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 4 }}>
          <button
            onClick={onDuplicate}
            title="Повторить (копия с данными)"
            style={{
              fontSize: 10, fontWeight: 600, padding: "5px 10px", borderRadius: 5,
              border: "1px solid var(--glass-border-h)", background: "var(--surface2)",
              color: "var(--text-m)", cursor: "pointer", transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 5, fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-dim)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-glow)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border-h)"; e.currentTarget.style.color = "var(--text-m)"; e.currentTarget.style.background = "var(--surface2)"; }}
          >
            <CopyIcon />
            Повторить
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Удалить"
              style={{
                width: 30, height: 30, border: "1px solid var(--glass-border)", background: "var(--surface2)",
                borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-d)", transition: "all 0.15s", padding: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,79,79,0.4)"; e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "rgba(255,79,79,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.color = "var(--text-d)"; e.currentTarget.style.background = "var(--surface2)"; }}
            >
              <TrashIcon />
            </button>
          ) : (
            <button
              onClick={() => { onDelete(); setConfirmDelete(false); }}
              onBlur={() => setTimeout(() => setConfirmDelete(false), 200)}
              autoFocus
              style={{
                fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 5,
                border: "1px solid rgba(255,79,79,0.4)", background: "rgba(255,79,79,0.1)",
                color: "var(--danger)", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
                textTransform: "uppercase", letterSpacing: "0.04em",
              }}
            >
              Удалить?
            </button>
          )}
        </div>
      </div>

      {/* ─── Card Body (3 columns horizontal layout) ─── */}
      <div style={{ display: "flex", gap: 12, padding: 14 }}>
        {/* Column 1: Что тестируем */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
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
            onKeyDown={e => {
              if (e.key === "Enter" && e.metaKey && isLast) {
                e.preventDefault();
                onAddAfter();
              }
            }}
            placeholder="Что тестируем..."
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: "var(--text-d)" }}>Постановщик</span>
            <span style={{ fontSize: 9, color: "var(--text-d)" }}>{item.description.length} симв.</span>
          </div>
        </div>

        {/* Column 2: Ожидаемый результат */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
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

        {/* Column 3: Баг/замечание + скриншот */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
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
            style={{
              borderColor: item.bugOrRemark.length > 0 ? "rgba(255,79,79,0.25)" : undefined,
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: "var(--text-d)" }}>Тестировщик</span>
            <span style={{ fontSize: 9, color: "var(--text-d)" }}>{item.bugOrRemark.length} симв.</span>
          </div>

          {/* Screenshot section */}
          <div style={{ marginTop: 6 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/bmp"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {item.screenshot ? (
              <div style={{ position: "relative" }}>
                <div
                  onClick={() => setPreviewOpen(true)}
                  style={{
                    borderRadius: 6, overflow: "hidden", cursor: "pointer",
                    border: "1px solid var(--glass-border)", transition: "border-color 0.15s",
                    maxHeight: 120,
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-dim)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--glass-border)"}
                >
                  <img
                    src={item.screenshot}
                    alt="Скриншот бага"
                    style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 120 }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <button
                    onClick={triggerFileInput}
                    style={{
                      fontSize: 9, fontWeight: 600, padding: "3px 6px", borderRadius: 4,
                      border: "1px solid var(--glass-border-h)", background: "var(--surface2)",
                      color: "var(--text-m)", cursor: "pointer", transition: "all 0.15s",
                      display: "flex", alignItems: "center", gap: 3, fontFamily: "'JetBrains Mono', monospace",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-dim)"; e.currentTarget.style.color = "var(--accent)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border-h)"; e.currentTarget.style.color = "var(--text-m)"; }}
                  >
                    <ImagePlusIcon size={10} />
                    Заменить
                  </button>
                  <button
                    onClick={() => onUpdate({ screenshot: "" })}
                    style={{
                      fontSize: 9, fontWeight: 600, padding: "3px 6px", borderRadius: 4,
                      border: "1px solid var(--glass-border)", background: "var(--surface2)",
                      color: "var(--text-d)", cursor: "pointer", transition: "all 0.15s",
                      display: "flex", alignItems: "center", gap: 3, fontFamily: "'JetBrains Mono', monospace",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,79,79,0.3)"; e.currentTarget.style.color = "var(--danger)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.color = "var(--text-d)"; }}
                  >
                    <XIcon size={10} />
                    Удалить
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={triggerFileInput}
                disabled={uploading}
                style={{
                  width: "100%", padding: "8px 6px", border: "1px dashed var(--glass-border)",
                  borderRadius: 6, background: "rgba(10,12,18,0.4)", cursor: uploading ? "wait" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  color: "var(--text-d)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-glow)"; e.currentTarget.style.color = "var(--accent)"; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.background = "rgba(10,12,18,0.4)"; e.currentTarget.style.color = "var(--text-d)"; }}
              >
                {uploading ? <UploadSpinner /> : <ImagePlusIcon size={12} />}
                {uploading ? "Загрузка..." : "Скриншот"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Screenshot Preview Modal ─── */}
      {previewOpen && item.screenshot && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, cursor: "pointer", animation: "fadeInUp 0.2s ease",
          }}
          onClick={() => setPreviewOpen(false)}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img
              src={item.screenshot}
              alt="Скриншот бага"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 8, display: "block", objectFit: "contain" }}
            />
            <button
              onClick={() => setPreviewOpen(false)}
              style={{
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

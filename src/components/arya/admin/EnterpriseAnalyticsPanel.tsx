import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Cpu,
  Globe2,
  Headphones,
  Layers,
  MapPin,
  Radio,
  Search,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { fetchEnterpriseDashboard, getAnalyticsWebSocketUrl, type TelegramIdentity } from "@/lib/api";

export type EnterpriseDashboard = {
  success: boolean;
  generated_at: string;
  window: { since: string; days: number };
  hero: {
    total_users: number;
    unique_in_window: number;
    active_now: number;
    total_revenue: number;
    miniapp_revenue: number;
    bot_revenue: number;
    sessions_tracked: number;
    avg_session_seconds: number;
    returning_in_window: number;
    premium_users: number;
    premium_conversion_pct: number;
    orders_paid_or_delivered: number;
  };
  live_feed: Array<Record<string, unknown>>;
  map_points: Array<{ country: string; city: string; count: number; lat: number; lon: number }>;
  charts: { hourly_events: Array<{ hour: number; events: number }> };
  users: {
    browsers: Array<{ name: string; value: number }>;
    devices: Array<{ name: string; value: number }>;
    operating_systems: Array<{ name: string; value: number }>;
    mobile_events: number;
    desktop_events: number;
    telegram_webview_events: number;
  };
  geo: {
    countries: Array<{ name: string; value: number }>;
    cities: Array<{ name: string; value: number }>;
    heatmap: Array<{ day: number; hour: number; count: number }>;
    states: Array<{ name: string; value: number }>;
  };
  stories: Record<string, unknown>;
  search: { top: Array<{ query: string; count: number }>; failed_searches: number; trending_note?: string };
  performance: Record<string, unknown>;
  telegram: Record<string, unknown>;
  behavior: Record<string, unknown>;
  journey: Record<string, unknown>;
  session_replay: { enabled: boolean; message?: string };
  intelligence: {
    peak_traffic_hour_utc: number | null;
    user_growth_by_day: Array<{ date: string; new_users: number }>;
    retention_returning_in_window: number;
  };
  filters_echo: Record<string, unknown>;
};

const CHART_COLORS = ["#6366f1", "#a855f7", "#22d3ee", "#f472b6", "#fbbf24", "#34d399", "#fb7185", "#94a3b8"];

function AnimatedInt({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1000;
    const from = 0;
    const to = Number.isFinite(value) ? value : 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - (1 - p) ** 3;
      const cur = from + (to - from) * eased;
      setV(decimals ? Number(cur.toFixed(decimals)) : Math.round(cur));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, decimals]);
  return (
    <span>
      {decimals ? v.toLocaleString(undefined, { maximumFractionDigits: decimals }) : v.toLocaleString()}
      {suffix}
    </span>
  );
}

function GlassCard({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl ${glow ? "shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_0_40px_rgba(99,102,241,0.12)]" : ""} ${className}`}
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300/90">
          <Icon className="h-4 w-4" />
          {title}
        </div>
        {subtitle ? <p className="mt-1 max-w-2xl text-xs text-zinc-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function EnterpriseAnalyticsPanel({ identity }: { identity: TelegramIdentity | null }) {
  const [data, setData] = useState<EnterpriseDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [live, setLive] = useState<Array<Record<string, unknown>>>([]);
  const [days, setDays] = useState(30);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [storyId, setStoryId] = useState("");
  const [device, setDevice] = useState("");
  const [telegramOnly, setTelegramOnly] = useState(false);

  const adminId = identity?.telegram_id != null ? String(identity.telegram_id) : "";

  const fetchDashboard = useCallback(async () => {
    if (!identity?.telegram_id) {
      setErr("Open this panel inside Telegram as an owner account.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const j = (await fetchEnterpriseDashboard(identity, {
        days,
        country: country || undefined,
        city: city || undefined,
        story_id: storyId || undefined,
        device: device || undefined,
        telegram_only: telegramOnly || undefined,
      })) as unknown as EnterpriseDashboard;
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [identity, days, country, city, storyId, device, telegramOnly]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const onWs = useCallback((msg: unknown) => {
    if (msg && typeof msg === "object" && (msg as { channel?: string }).channel === "live") {
      setLive((prev) => [{ ...(msg as object), _ts: Date.now() } as Record<string, unknown>, ...prev].slice(0, 120));
    }
  }, []);

  useWebSocketLive(identity?.telegram_id ?? null, onWs);

  const hourly = useMemo(() => data?.charts?.hourly_events ?? [], [data]);
  const mapPoints = useMemo(() => data?.map_points ?? [], [data]);
  const growth = useMemo(() => data?.intelligence?.user_growth_by_day ?? [], [data]);

  const storiesTop = useMemo(
    () => (data?.stories?.top_viewed as Array<{ story_id: string; title: string; views: number }>) ?? [],
    [data],
  );

  const journeyNodes = ((data?.journey?.nodes as Array<{ id: string; count: number }>) ?? []) as Array<{ id: string; count: number }>;

  return (
    <div className="relative min-h-[70vh] overflow-hidden bg-[#030712] pb-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(168,85,247,0.2), transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[length:48px_48px] opacity-30"
        style={{ backgroundImage: "var(--tw-gradient-stops)" }}
      />

      <div className="relative z-10 px-6 py-8 lg:px-10">
        {/* Hero */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Intelligence Console
            </motion.div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Enterprise Analytics
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Live operational intelligence — geo, devices, stories, journeys, and revenue in one cinematic surface.
              Powered by your FastAPI + Mongo pipeline; optional Postgres schema ships under <code className="text-indigo-300">supabase/migrations</code>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <Radio className="h-4 w-4 text-emerald-400" />
            WebSocket: <span className="text-zinc-300">/api/ws/analytics</span>
            <span className="mx-2 text-zinc-700">|</span>
            REST: <span className="text-zinc-300">/api/analytics/enterprise-dashboard</span>
          </div>
        </div>

        {/* Filters */}
        <GlassCard className="mb-8">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-zinc-500">
              Range (days)
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="mt-1 block w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
              >
                {[7, 14, 30, 60, 90].map((d) => (
                  <option key={d} value={d}>
                    {d}d
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-zinc-500">
              Country
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. India"
                className="mt-1 block w-36 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-zinc-500">
              City
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 block w-36 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Story ID
              <input
                value={storyId}
                onChange={(e) => setStoryId(e.target.value)}
                className="mt-1 block w-44 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Device
              <input
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                placeholder="mobile / desktop"
                className="mt-1 block w-32 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-white"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 pt-5 text-xs text-zinc-400">
              <input type="checkbox" checked={telegramOnly} onChange={(e) => setTelegramOnly(e.target.checked)} />
              Telegram WebView only
            </label>
            <button
              type="button"
              onClick={() => void fetchDashboard()}
              className="ml-auto rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_40px_rgba(99,102,241,0.35)] transition hover:opacity-95"
            >
              Apply
            </button>
          </div>
        </GlassCard>

        {err ? (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{err}</div>
        ) : null}

        {loading || !data ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-zinc-800/80" />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <HeroStat label="Total users" value={data.hero.total_users} icon={Activity} accent="from-indigo-500/30" />
              <HeroStat label="Active now" value={data.hero.active_now} icon={Zap} accent="from-emerald-500/25" pulse />
              <HeroStat
                label="Revenue (₹)"
                value={data.hero.total_revenue}
                icon={Layers}
                accent="from-violet-500/30"
                decimals={0}
              />
              <HeroStat label="Sessions tracked" value={data.hero.sessions_tracked} icon={Timer} accent="from-cyan-500/20" />
              <HeroStat label="Returning (window)" value={data.hero.returning_in_window} icon={ArrowRight} accent="from-fuchsia-500/25" />
              <HeroStat
                label="Premium conversion"
                value={data.hero.premium_conversion_pct}
                suffix="%"
                icon={Sparkles}
                accent="from-amber-500/20"
                decimals={1}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <GlassCard className="xl:col-span-2" glow>
                <SectionTitle
                  icon={Radio}
                  title="Live activity"
                  subtitle="Streamed over WebSocket on each tracked event. Enrich /api/track payloads for richer rows."
                />
                <div className="h-72 overflow-hidden rounded-xl border border-white/5 bg-black/30">
                  <div className="h-full overflow-y-auto pr-2">
                    <AnimatePresence initial={false}>
                      {(live.length ? live : data.live_feed).slice(0, 60).map((row, idx) => (
                        <motion.div
                          key={`${(row as { id?: string }).id ?? idx}-${(row as { _ts?: number })._ts ?? idx}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/5 px-3 py-2 text-xs"
                        >
                          <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-indigo-200">
                            {String((row as { type?: string }).type ?? "event")}
                          </span>
                          <span className="text-zinc-500">user</span>
                          <span className="font-mono text-zinc-200">{String((row as { user_id?: unknown }).user_id ?? "—")}</span>
                          <span className="text-zinc-600">·</span>
                          <MapPin className="h-3 w-3 text-zinc-600" />
                          <span className="text-zinc-400">
                            {(row as { city?: string }).city ?? "—"},{" "}
                            {(row as { country?: string }).country ?? ""}
                          </span>
                          <span className="ml-auto text-zinc-600">
                            {String((row as { ts?: string }).ts ?? (row as { time?: string }).time ?? "")}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <SectionTitle icon={Cpu} title="Performance signals" subtitle="Emit event_type=performance with load_ms, api_ms, page." />
                <div className="space-y-3 text-sm text-zinc-300">
                  <RowKV label="Samples" value={String((data.performance as { samples?: number }).samples ?? 0)} />
                  <RowKV
                    label="Avg page load"
                    value={
                      (data.performance as { avg_page_load_ms?: number | null }).avg_page_load_ms != null
                        ? `${(data.performance as { avg_page_load_ms?: number }).avg_page_load_ms} ms`
                        : "—"
                    }
                  />
                  <RowKV
                    label="Avg API"
                    value={
                      (data.performance as { avg_api_ms?: number | null }).avg_api_ms != null
                        ? `${(data.performance as { avg_api_ms?: number }).avg_api_ms} ms`
                        : "—"
                    }
                  />
                  <RowKV label="Console errors" value={String((data.performance as { console_errors?: number }).console_errors ?? 0)} />
                </div>
                <div className="mt-4 rounded-lg border border-dashed border-zinc-700 p-3 text-xs text-zinc-500">
                  Crash / error logs: send <code className="text-indigo-300">console_error</code> events from the Mini App
                  wrapper.
                </div>
              </GlassCard>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <GlassCard glow>
                <SectionTitle
                  icon={Globe2}
                  title="Realtime geo map"
                  subtitle="Pulsed markers from aggregated sessions (country centroids + jitter). Wire lat/lng from device when available."
                />
                <div className="h-80 w-full">
                  <ResponsiveContainer>
                    <ScatterChart margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="4 8" stroke="#27272a" />
                      <XAxis type="number" dataKey="lon" name="lon" stroke="#52525b" tick={{ fill: "#71717a", fontSize: 10 }} />
                      <YAxis type="number" dataKey="lat" name="lat" stroke="#52525b" tick={{ fill: "#71717a", fontSize: 10 }} />
                      <ZAxis type="number" dataKey="count" range={[80, 520]} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12 }}
                        formatter={(v: number, name: string) => [v, name]}
                        labelFormatter={(_, p) => (p && p[0] ? `${p[0].payload.city}, ${p[0].payload.country}` : "")}
                      />
                      <Scatter name="Activity" data={mapPoints} fill="#818cf8" fillOpacity={0.75} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard>
                <SectionTitle icon={Activity} title="Event cadence" subtitle="Hour-of-day distribution inside the selected window." />
                <div className="h-80 w-full">
                  <ResponsiveContainer>
                    <AreaChart data={hourly}>
                      <defs>
                        <linearGradient id="glowArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="hour" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                      <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12 }} />
                      <Area type="monotone" dataKey="events" stroke="#a5b4fc" strokeWidth={2} fill="url(#glowArea)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <GlassCard>
                <SectionTitle icon={Cpu} title="Devices & clients" />
                <div className="h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data.users.devices} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {data.users.devices.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                  <div className="rounded-lg bg-white/5 px-2 py-2">
                    Mobile / tablet events<br />
                    <span className="text-lg font-semibold text-white">{data.users.mobile_events}</span>
                  </div>
                  <div className="rounded-lg bg-white/5 px-2 py-2">
                    Desktop events<br />
                    <span className="text-lg font-semibold text-white">{data.users.desktop_events}</span>
                  </div>
                  <div className="col-span-2 rounded-lg bg-white/5 px-2 py-2">
                    Telegram WebView<br />
                    <span className="text-lg font-semibold text-indigo-200">{data.users.telegram_webview_events}</span>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <SectionTitle icon={Globe2} title="Top countries" />
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={data.geo.countries} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={100} stroke="#71717a" tick={{ fill: "#d4d4d8", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12 }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {data.geo.countries.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard>
                <SectionTitle icon={MapPin} title="Top cities" />
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={data.geo.cities}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={70} />
                      <YAxis stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12 }} />
                      <Bar dataKey="value" fill="#a855f7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <GlassCard>
                <SectionTitle icon={Headphones} title="Story performance" subtitle="Backed by story_events + premium_stories. Extend with chapter_id in /api/track." />
                <div className="max-h-80 overflow-y-auto rounded-xl border border-white/5">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-zinc-900/95 text-zinc-500">
                      <tr>
                        <th className="px-3 py-2">Story</th>
                        <th className="px-3 py-2">Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storiesTop.map((s) => (
                        <tr key={s.story_id} className="border-t border-white/5 text-zinc-300">
                          <td className="px-3 py-2">{s.title}</td>
                          <td className="px-3 py-2 font-mono text-indigo-200">{s.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-zinc-500">
                  <div className="rounded-lg bg-white/5 py-2">
                    Completion (proxy %)<div className="text-lg font-semibold text-white">{String(data.stories.story_completion_proxy_pct)}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 py-2">
                    Drop-off (proxy %)<div className="text-lg font-semibold text-white">{String(data.stories.dropoff_proxy_pct)}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 py-2">
                    Avg session (sec)<div className="text-lg font-semibold text-white">{String(data.stories.avg_listen_proxy_sec)}</div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <SectionTitle icon={Search} title="Search intelligence" />
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {data.search.top.map((s) => (
                    <div key={s.query} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs">
                      <span className="truncate text-zinc-200">{s.query}</span>
                      <span className="font-mono text-indigo-300">{s.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  Failed searches: <span className="text-rose-300">{data.search.failed_searches}</span>
                </div>
              </GlassCard>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <GlassCard className="lg:col-span-2">
                <SectionTitle icon={Layers} title="User journey (page signals)" />
                <div className="flex flex-wrap items-center gap-2">
                  {(journeyNodes).map((n, i, arr) => (
                    <div key={n.id} className="flex items-center gap-2">
                      <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100">
                        {n.id}{" "}
                        <span className="text-zinc-500">({n.count})</span>
                      </span>
                      {i < arr.length - 1 ? <ArrowRight className="h-3 w-3 text-zinc-600" /> : null}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-zinc-500">{String(data.journey?.flow_note ?? "")}</p>
              </GlassCard>

              <GlassCard>
                <SectionTitle icon={Timer} title="Session replay" />
                <p className="text-sm text-zinc-400">{data.session_replay.message}</p>
                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-xs text-zinc-500">
                  Reserved for rrweb bundles + encrypted blob storage (S3 / Supabase).
                </div>
              </GlassCard>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <GlassCard>
                <SectionTitle icon={Zap} title="Admin intelligence" />
                <div className="space-y-2 text-sm text-zinc-300">
                  <RowKV
                    label="Peak traffic hour (UTC)"
                    value={data.intelligence.peak_traffic_hour_utc != null ? String(data.intelligence.peak_traffic_hour_utc) : "—"}
                  />
                  <RowKV label="Returning users (window)" value={String(data.intelligence.retention_returning_in_window)} />
                </div>
                <div className="mt-4 h-56">
                  <ResponsiveContainer>
                    <AreaChart data={growth}>
                      <defs>
                        <linearGradient id="growthG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12 }} />
                      <Area type="monotone" dataKey="new_users" stroke="#22d3ee" fill="url(#growthG)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard>
                <SectionTitle icon={Globe2} title="Geo heatmap (DOW × hour)" />
                <HeatMini cells={data.geo?.heatmap ?? []} />
              </GlassCard>
            </div>

            <div className="mt-8 border-t border-white/5 pt-6 text-center text-[11px] text-zinc-600">
              Generated {data.generated_at} · Window {data.window.days}d since {data.window.since}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function useWebSocketLive(telegramId: number | null, onMessage: (msg: unknown) => void) {
  const cb = useRef(onMessage);
  cb.current = onMessage;
  useEffect(() => {
    if (telegramId == null) return;
    const url = getAnalyticsWebSocketUrl(telegramId);
    if (!url) return;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      return;
    }
    ws.onmessage = (ev) => {
      try {
        cb.current(JSON.parse(ev.data as string));
      } catch {
        /* ignore */
      }
    };
    const id = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 20000);
    return () => {
      clearInterval(id);
      ws.close();
    };
  }, [telegramId]);
}

function RowKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1.5">
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono text-zinc-100">{value}</span>
    </div>
  );
}

function HeroStat({
  label,
  value,
  icon: Icon,
  accent,
  pulse,
  suffix = "",
  decimals,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  pulse?: boolean;
  suffix?: string;
  decimals?: number;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${accent} to-zinc-950 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)]`}
    >
      {pulse ? (
        <span className="absolute right-4 top-4 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
      ) : null}
      <Icon className="h-5 w-5 text-zinc-500" />
      <div className="mt-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white md:text-3xl">
        <AnimatedInt value={value} decimals={decimals} suffix={suffix} />
      </div>
    </motion.div>
  );
}

function HeatMini({ cells }: { cells: Array<{ day: number; hour: number; count: number }> }) {
  const max = Math.max(1, ...cells.map((c) => c.count));
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const c of cells) {
    if (c.day >= 0 && c.day < 7 && c.hour >= 0 && c.hour < 24) grid[c.day][c.hour] += c.count;
  }
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-0.5">
        {grid.map((row, di) => (
          <div key={di} className="flex gap-0.5">
            {row.map((v, hi) => {
              const op = 0.08 + (v / max) * 0.92;
              return (
                <div
                  key={hi}
                  title={`D${di} H${hi}: ${v}`}
                  className="h-3 w-3 rounded-sm"
                  style={{ background: `rgba(129,140,248,${op})` }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
        <span>Mon→Sun rows · 24h columns</span>
      </div>
    </div>
  );
}

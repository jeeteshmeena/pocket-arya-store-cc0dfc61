import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Cpu,
  CreditCard,
  Globe2,
  Headphones,
  Layers,
  MapPin,
  Radio,
  Search,
  Timer,
  TrendingUp,
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

import {
  fetchEnterpriseDashboard,
  getAnalyticsWebSocketUrl,
  type TelegramIdentity,
} from "@/lib/api";

export type EnterpriseDashboard = {
  success: boolean;
  generated_at: string;
  window: { since: string; days: number };
  hero: {
    scope?: string;
    total_users: number;
    new_users_in_window?: number;
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
    engagement_events_per_user?: number;
    retention_pct?: number;
  };
  retention?: {
    returning_users: number;
    users_in_window: number;
    new_users_in_window: number;
    retention_pct: number;
  };
  checkout?: {
    opened_checkout: number;
    pay_started: number;
    completed: number;
    failed: number;
    abandoned: number;
    conversion_pct: number;
  };
  click_logs?: Array<{
    ts: string;
    type?: string;
    user_id?: unknown;
    page?: string;
    story_id?: string;
    target?: string;
  }>;
  click_heatmap?: { points: Array<{ x: number; y: number }> };
  traffic?: { sources: Array<{ name: string; value: number }> };
  live_feed: Array<Record<string, unknown>>;
  map_points: Array<{
    country: string;
    city: string;
    region?: string;
    count: number;
    lat: number;
    lon: number;
  }>;
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
  search: {
    top: Array<{ query: string; count: number }>;
    failed_searches: number;
    trending?: Array<{ query: string; count: number }>;
    trending_note?: string;
  };
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

/** Refined iOS-inspired chart palette — single accent + neutral, no rainbow. */
const ACCENT = "#0071e3";        // SF blue
const ACCENT_SOFT = "#6ea8fe";
const NEUTRAL = "#1d1d1f";
const NEUTRAL_SOFT = "#86868b";
const G = ACCENT;                // back-compat alias used by chart fills
const R = NEUTRAL;

function sliceFill(i: number) {
  // Alternate accent / neutral / soft accent for clean, premium chart fills
  const palette = [ACCENT, NEUTRAL, ACCENT_SOFT, NEUTRAL_SOFT];
  return palette[i % palette.length];
}

function AnimatedInt({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 420;
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
      {decimals
        ? v.toLocaleString(undefined, { maximumFractionDigits: decimals })
        : v.toLocaleString()}
      {suffix}
    </span>
  );
}

function PanelCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
          <Icon className="h-3.5 w-3.5 text-[#86868b]" />
          {title}
        </div>
        {subtitle ? <p className="mt-1 max-w-2xl text-xs text-[#86868b]">{subtitle}</p> : null}
      </div>
    </div>
  );
}

type AnalyticsFilterForm = {
  days: number;
  country: string;
  city: string;
  storyId: string;
  device: string;
  telegramOnly: boolean;
};

const defaultFilters: AnalyticsFilterForm = {
  days: 30,
  country: "",
  city: "",
  storyId: "",
  device: "",
  telegramOnly: false,
};

export function EnterpriseAnalyticsPanel({ identity }: { identity: TelegramIdentity | null }) {
  const [data, setData] = useState<EnterpriseDashboard | null>(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [live, setLive] = useState<Array<Record<string, unknown>>>([]);
  /** Values used for the last successful (or attempted) API request — updated only via Apply or identity reset. */
  const [applied, setApplied] = useState<AnalyticsFilterForm>(() => ({ ...defaultFilters }));
  /** Editable form; does not hit the API until Apply. */
  const [draft, setDraft] = useState<AnalyticsFilterForm>(() => ({ ...defaultFilters }));

  const firstLoadRef = useRef(true);

  useEffect(() => {
    firstLoadRef.current = true;
    const reset = { ...defaultFilters };
    setApplied(reset);
    setDraft({ ...defaultFilters });
  }, [identity?.telegram_id]);

  const fetchDashboard = useCallback(async () => {
    if (!identity?.telegram_id) {
      setErr("Open this panel inside Telegram as an owner account.");
      setBootLoading(false);
      setRefreshing(false);
      return;
    }
    const isFirst = firstLoadRef.current;
    if (isFirst) setBootLoading(true);
    else setRefreshing(true);
    setErr(null);
    try {
      const j = (await fetchEnterpriseDashboard(identity, {
        days: applied.days,
        country: applied.country.trim() || undefined,
        city: applied.city.trim() || undefined,
        story_id: applied.storyId.trim() || undefined,
        device: applied.device.trim() || undefined,
        telegram_only: applied.telegramOnly || undefined,
      })) as unknown as EnterpriseDashboard;
      setData(j);
      if (isFirst) firstLoadRef.current = false;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setBootLoading(false);
      setRefreshing(false);
    }
  }, [identity, applied]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const applyFilters = useCallback(() => {
    setApplied({ ...draft });
  }, [draft]);

  const onWs = useCallback((msg: unknown) => {
    if (msg && typeof msg === "object" && (msg as { channel?: string }).channel === "live") {
      setLive((prev) =>
        [{ ...(msg as object), _ts: Date.now() } as Record<string, unknown>, ...prev].slice(0, 120),
      );
    }
  }, []);

  useWebSocketLive(identity?.telegram_id ?? null, onWs);

  const hourly = useMemo(() => data?.charts?.hourly_events ?? [], [data]);
  const mapPoints = useMemo(() => data?.map_points ?? [], [data]);
  const growth = useMemo(() => data?.intelligence?.user_growth_by_day ?? [], [data]);

  const storiesTop = useMemo(
    () =>
      (data?.stories?.top_viewed as Array<{ story_id: string; title: string; views: number }>) ??
      [],
    [data],
  );

  const journeyNodes = ((data?.journey?.nodes as Array<{ id: string; count: number }>) ??
    []) as Array<{
    id: string;
    count: number;
  }>;

  const clickPoints = useMemo(() => data?.click_heatmap?.points ?? [], [data]);
  const clickLogs = useMemo(() => data?.click_logs ?? [], [data]);
  const trafficSources = useMemo(() => data?.traffic?.sources ?? [], [data]);
  const chapterTop = useMemo(
    () =>
      (data?.stories as { chapter_top?: Array<{ chapter_id: string; events: number }> } | undefined)
        ?.chapter_top ?? [],
    [data],
  );

  const showSkeleton = bootLoading && !data;

  return (
    <div className="relative min-h-[70vh] w-full max-w-full overflow-x-hidden bg-[#f5f5f7] pb-10 text-[#1d1d1f]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif" }}>
      {refreshing && data ? (
        <div className="pointer-events-none fixed left-0 right-0 top-0 z-20 h-0.5 bg-black/5">
          <div className="h-full w-1/3 animate-pulse bg-[#0071e3]/40" />
        </div>
      ) : null}

      <div className="relative z-10 px-4 py-7 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#86868b]">Admin · Analytics</div>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-[#1d1d1f] sm:text-3xl md:text-[34px]">
              Intelligence
            </h1>
            <p className="mt-1 text-sm text-[#6e6e73]">Real-time engagement, geography and revenue across the mini app.</p>
          </div>
          <div className="hidden flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#86868b] xl:flex">
            <span>
              <span className="text-[#1d1d1f]/60">WS</span>{" "}
              <span className="font-mono text-[#1d1d1f]/70">/api/ws/analytics</span>
            </span>
            <span className="text-[#86868b]/40">·</span>
            <span>
              <span className="text-[#1d1d1f]/60">GET</span>{" "}
              <span className="font-mono text-[#1d1d1f]/70">/api/analytics/enterprise-dashboard</span>
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-full overflow-x-hidden px-4 sm:px-6 lg:px-10">
        <PanelCard className="mb-6 mt-2 border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-1 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Report filters
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Range
              <select
                value={draft.days}
                onChange={(e) => setDraft((d) => ({ ...d, days: Number(e.target.value) }))}
                className="mt-1.5 block w-full rounded-md border border-slate-200 bg-[#f8fafc] px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-300"
              >
                {[7, 14, 30, 60, 90].map((d) => (
                  <option key={d} value={d}>
                    Last {d} days
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Country
              <input
                value={draft.country}
                onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
                placeholder="e.g. India"
                className="mt-1.5 block w-full rounded-md border border-slate-200 bg-[#f8fafc] px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300"
              />
            </label>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              City
              <input
                value={draft.city}
                onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                placeholder="Optional"
                className="mt-1.5 block w-full rounded-md border border-slate-200 bg-[#f8fafc] px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300"
              />
            </label>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Story ID
              <input
                value={draft.storyId}
                onChange={(e) => setDraft((d) => ({ ...d, storyId: e.target.value }))}
                placeholder="Optional"
                className="mt-1.5 block w-full rounded-md border border-slate-200 bg-[#f8fafc] px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300"
              />
            </label>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Device
              <input
                value={draft.device}
                onChange={(e) => setDraft((d) => ({ ...d, device: e.target.value }))}
                placeholder="mobile / desktop"
                className="mt-1.5 block w-full rounded-md border border-slate-200 bg-[#f8fafc] px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300"
              />
            </label>
            <label className="flex cursor-pointer items-end gap-3 rounded-md border border-slate-200 bg-[#f8fafc] px-3 py-2.5 sm:min-h-[76px]">
              <input
                type="checkbox"
                checked={draft.telegramOnly}
                onChange={(e) => setDraft((d) => ({ ...d, telegramOnly: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 bg-slate-100 text-slate-900 focus:ring-zinc-600"
              />
              <span className="text-xs leading-snug text-slate-600">Telegram WebView only</span>
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => void fetchDashboard()}
              disabled={bootLoading && !data}
              className="order-2 w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-100 disabled:opacity-50 sm:order-1 sm:w-auto"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="order-1 w-full rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 sm:order-2 sm:w-auto sm:min-w-[120px]"
            >
              Apply filters
            </button>
          </div>
        </PanelCard>

        {err ? (
          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">{err}</p>
            <button
              type="button"
              onClick={() => void fetchDashboard()}
              className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        ) : null}

        {showSkeleton ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : data ? (
          <>
            <div className="mb-8 grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
              <HeroStat label="Mini app users" value={data.hero.total_users} icon={Activity} />
              <HeroStat label="Active now" value={data.hero.active_now} icon={Zap} pulse />
              <HeroStat label="In window" value={data.hero.unique_in_window} icon={Layers} />
              <HeroStat
                label="New (window)"
                value={data.hero.new_users_in_window ?? 0}
                icon={TrendingUp}
              />
              <HeroStat
                label="Retention"
                value={data.hero.retention_pct ?? 0}
                suffix="%"
                icon={ArrowRight}
                decimals={1}
              />
              <HeroStat
                label="Events / user"
                value={data.hero.engagement_events_per_user ?? 0}
                icon={Timer}
                decimals={1}
              />
              <HeroStat label="Sessions tracked" value={data.hero.sessions_tracked} icon={Cpu} />
              <HeroStat
                label="Revenue (₹)"
                value={data.hero.total_revenue}
                icon={Layers}
                decimals={0}
              />
            </div>
            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <HeroStat
                label="Avg session (s)"
                value={Math.round(data.hero.avg_session_seconds)}
                icon={Activity}
              />
              <HeroStat label="Returning" value={data.hero.returning_in_window} icon={ArrowRight} />
              <HeroStat
                label="Premium conversion"
                value={data.hero.premium_conversion_pct}
                suffix="%"
                icon={Layers}
                decimals={1}
              />
              <HeroStat
                label="Paid orders"
                value={data.hero.orders_paid_or_delivered}
                icon={Layers}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <PanelCard className="xl:col-span-2">
                <SectionTitle icon={Radio} title="Live activity" />
                <div className="h-72 overflow-hidden rounded-xl border border-slate-200 bg-[#f8fafc]">
                  <div className="h-full overflow-y-auto pr-2">
                    {(live.length ? live : data.live_feed).slice(0, 60).map((row, idx) => (
                      <div
                        key={`${(row as { id?: string }).id ?? idx}-${(row as { _ts?: number })._ts ?? idx}`}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-100 px-3 py-2 text-xs"
                      >
                        <span className="min-w-0 flex-[2] truncate text-slate-800">
                          {String((row as { summary?: string }).summary || "").trim() ||
                            String((row as { type?: string }).type ?? "event")}
                        </span>
                        <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                          {String((row as { type?: string }).type ?? "event")}
                        </span>
                        <span className="text-slate-400">user</span>
                        <span className="font-mono text-slate-800">
                          {String((row as { user_id?: unknown }).user_id ?? "—")}
                        </span>
                        <span className="text-slate-300">·</span>
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-500">
                          {(row as { city?: string }).city ?? "—"}
                          {((row as { region?: string }).region || "").trim() ? (
                            <>
                              ,{" "}
                              <span className="text-slate-600">
                                {(row as { region?: string }).region}
                              </span>
                            </>
                          ) : null}
                          {", "}
                          {(row as { country?: string }).country ?? ""}
                        </span>
                        <span className="ml-auto font-mono text-slate-400">
                          {String(
                            (row as { ts?: string }).ts ?? (row as { time?: string }).time ?? "",
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </PanelCard>

              <PanelCard>
                <SectionTitle icon={Cpu} title="Performance" />
                <div className="space-y-3 text-sm text-slate-600">
                  <RowKV
                    label="Samples"
                    value={String((data.performance as { samples?: number }).samples ?? 0)}
                  />
                  <RowKV
                    label="Avg page load"
                    value={
                      (data.performance as { avg_page_load_ms?: number | null }).avg_page_load_ms !=
                      null
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
                  <RowKV
                    label="Console errors"
                    value={String(
                      (data.performance as { console_errors?: number }).console_errors ?? 0,
                    )}
                  />
                </div>
              </PanelCard>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <PanelCard>
                <SectionTitle icon={CreditCard} title="Checkout funnel" />
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <RowKV label="Opened" value={String(data.checkout?.opened_checkout ?? 0)} />
                  <RowKV label="Pay started" value={String(data.checkout?.pay_started ?? 0)} />
                  <RowKV label="Completed" value={String(data.checkout?.completed ?? 0)} />
                  <RowKV label="Failed" value={String(data.checkout?.failed ?? 0)} />
                  <RowKV label="Abandoned (est.)" value={String(data.checkout?.abandoned ?? 0)} />
                  <RowKV
                    label="Conversion"
                    value={`${String(data.checkout?.conversion_pct ?? 0)}%`}
                  />
                </div>
              </PanelCard>
              <PanelCard>
                <SectionTitle icon={ArrowRight} title="Retention" />
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <RowKV label="Returning" value={String(data.retention?.returning_users ?? 0)} />
                  <RowKV
                    label="Users in window"
                    value={String(data.retention?.users_in_window ?? 0)}
                  />
                  <RowKV
                    label="New in window"
                    value={String(data.retention?.new_users_in_window ?? 0)}
                  />
                  <RowKV
                    label="Retention %"
                    value={`${String(data.retention?.retention_pct ?? 0)}%`}
                  />
                </div>
              </PanelCard>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <PanelCard>
                <SectionTitle icon={Globe2} title="Geo map" />
                <div className="h-72 w-full max-w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="4 8" stroke="#f1f5f9" />
                      <XAxis
                        type="number"
                        dataKey="lon"
                        name="lon"
                        stroke="#e2e8f0"
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                      />
                      <YAxis
                        type="number"
                        dataKey="lat"
                        name="lat"
                        stroke="#e2e8f0"
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                      />
                      <ZAxis type="number" dataKey="count" range={[80, 520]} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3", stroke: "#52525b" }}
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                        }}
                        formatter={(v: number, name: string) => [v, name]}
                        labelFormatter={(_, p) =>
                          p && p[0]
                            ? [p[0].payload.city, p[0].payload.region, p[0].payload.country]
                                .filter(Boolean)
                                .join(", ")
                            : ""
                        }
                      />
                      <Scatter name="Activity" data={mapPoints} fill={G} fillOpacity={0.85} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </PanelCard>

              <PanelCard>
                <SectionTitle icon={Activity} title="Event cadence" />
                <div className="h-72 w-full max-w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourly}>
                      <defs>
                        <linearGradient id="areaHourly" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={G} stopOpacity={0.45} />
                          <stop offset="100%" stopColor={G} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="hour"
                        stroke="#e2e8f0"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                      />
                      <YAxis stroke="#e2e8f0" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="events"
                        stroke={G}
                        strokeWidth={2}
                        fill="url(#areaHourly)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </PanelCard>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <PanelCard>
                <SectionTitle icon={Cpu} title="Devices" />
                <div className="h-64 w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.users.devices}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {data.users.devices.map((_, i) => (
                          <Cell key={i} fill={sliceFill(i)} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="rounded-lg border border-slate-100 bg-[#f8fafc] px-2 py-2">
                    Mobile / tablet
                    <div className="text-lg font-semibold text-slate-900">
                      {data.users.mobile_events}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-[#f8fafc] px-2 py-2">
                    Desktop
                    <div className="text-lg font-semibold text-slate-900">
                      {data.users.desktop_events}
                    </div>
                  </div>
                  <div className="col-span-2 rounded-lg border border-slate-100 bg-[#f8fafc] px-2 py-2">
                    Telegram WebView
                    <div className="text-lg font-semibold text-slate-900">
                      {data.users.telegram_webview_events}
                    </div>
                  </div>
                </div>
              </PanelCard>

              <PanelCard>
                <SectionTitle icon={Globe2} title="Top countries" />
                <div className="h-72 w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.geo.countries} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#e2e8f0"
                        tick={{ fill: "#64748b", fontSize: 10 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        stroke="#e2e8f0"
                        tick={{ fill: "#475569", fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {data.geo.countries.map((_, i) => (
                          <Cell key={i} fill={sliceFill(i)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </PanelCard>

              <PanelCard>
                <SectionTitle icon={MapPin} title="Top cities" />
                <div className="h-72 w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.geo.cities}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        stroke="#e2e8f0"
                        tick={{ fill: "#64748b", fontSize: 9 }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis stroke="#e2e8f0" tick={{ fill: "#64748b", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="value" fill={G} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </PanelCard>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <PanelCard>
                <SectionTitle icon={Headphones} title="Stories" />
                <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[max-content] text-left text-xs">
                    <thead className="sticky top-0 bg-white text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Story</th>
                        <th className="px-3 py-2">Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storiesTop.map((s) => (
                        <tr key={s.story_id} className="border-t border-slate-100 text-slate-600">
                          <td className="px-3 py-2">{s.title}</td>
                          <td className="px-3 py-2 font-mono text-slate-900">{s.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
                  <div className="rounded-lg border border-slate-100 bg-[#f8fafc] py-2">
                    Completion (proxy %)
                    <div className="text-lg font-semibold text-slate-900">
                      {String(data.stories.story_completion_proxy_pct)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-[#f8fafc] py-2">
                    Drop-off (proxy %)
                    <div className="text-lg font-semibold text-slate-900">
                      {String(data.stories.dropoff_proxy_pct)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-[#f8fafc] py-2">
                    Avg session (sec)
                    <div className="text-lg font-semibold text-slate-900">
                      {String(data.stories.avg_listen_proxy_sec)}
                    </div>
                  </div>
                </div>
                {chapterTop.length > 0 ? (
                  <div className="mt-4 max-h-48 overflow-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[max-content] text-left text-xs">
                      <thead className="sticky top-0 bg-white text-slate-400">
                        <tr>
                          <th className="px-3 py-2">Chapter</th>
                          <th className="px-3 py-2">Events</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chapterTop.map((c) => (
                          <tr
                            key={c.chapter_id}
                            className="border-t border-slate-100 text-slate-600"
                          >
                            <td className="px-3 py-2 font-mono text-[10px] text-slate-800">
                              {c.chapter_id}
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-900">{c.events}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </PanelCard>

              <PanelCard>
                <SectionTitle icon={Search} title="Search" />
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {data.search.top.map((s) => (
                    <div
                      key={s.query}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-[#f8fafc] px-3 py-2 text-xs"
                    >
                      <span className="truncate text-slate-800">{s.query}</span>
                      <span className="font-mono text-slate-500">{s.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  Failed searches:{" "}
                  <span className="font-mono text-slate-800">{data.search.failed_searches}</span>
                </div>
                {(data.search.trending?.length ?? 0) > 0 ? (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Trending
                    </div>
                    <div className="max-h-36 space-y-1.5 overflow-y-auto">
                      {data.search.trending!.map((s) => (
                        <div
                          key={`t-${s.query}`}
                          className="flex items-center justify-between rounded border border-slate-100 bg-[#f8fafc] px-2 py-1.5 text-[11px]"
                        >
                          <span className="truncate text-slate-600">{s.query}</span>
                          <span className="font-mono text-slate-500">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </PanelCard>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <PanelCard className="xl:col-span-2">
                <SectionTitle icon={Layers} title="Click log" />
                <div className="max-h-64 overflow-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[max-content] text-left text-xs">
                    <thead className="sticky top-0 bg-white text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Time</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Target</th>
                        <th className="px-3 py-2">Page</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clickLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                            No interaction rows in this window.
                          </td>
                        </tr>
                      ) : (
                        clickLogs.map((row, i) => (
                          <tr
                            key={`${row.ts}-${i}`}
                            className="border-t border-slate-100 text-slate-600"
                          >
                            <td className="px-3 py-2 font-mono text-[10px] text-slate-400">
                              {row.ts}
                            </td>
                            <td className="px-3 py-2">{row.type}</td>
                            <td className="max-w-[160px] truncate px-3 py-2">
                              {row.target ?? "—"}
                            </td>
                            <td className="px-3 py-2">{row.page ?? "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </PanelCard>
              <PanelCard>
                <SectionTitle icon={Globe2} title="Traffic sources" />
                {trafficSources.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-xs text-slate-400">
                    No referrer data in this window.
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trafficSources} layout="vertical" margin={{ left: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis
                          type="number"
                          stroke="#e2e8f0"
                          tick={{ fill: "#64748b", fontSize: 10 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={90}
                          stroke="#e2e8f0"
                          tick={{ fill: "#475569", fontSize: 9 }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {trafficSources.map((_, i) => (
                            <Cell key={i} fill={sliceFill(i)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </PanelCard>
            </div>

            {clickPoints.length > 0 ? (
              <PanelCard className="mt-6">
                <SectionTitle icon={MapPin} title="Click coordinates" />
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        stroke="#e2e8f0"
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        stroke="#e2e8f0"
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                        }}
                      />
                      <Scatter data={clickPoints} fill={G} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </PanelCard>
            ) : null}

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <PanelCard className="lg:col-span-2">
                <SectionTitle icon={Layers} title="Pages" />
                <div className="flex flex-wrap items-center gap-2">
                  {journeyNodes.map((n, i, arr) => (
                    <div key={n.id} className="flex items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-[#f8fafc] px-3 py-1 text-xs text-slate-800">
                        {n.id} <span className="text-slate-400">({n.count})</span>
                      </span>
                      {i < arr.length - 1 ? (
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      ) : null}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {String(data.journey?.flow_note ?? "")}
                </p>
              </PanelCard>

              <PanelCard>
                <SectionTitle icon={Timer} title="Session replay" />
                <p className="text-sm text-slate-500">{data.session_replay.message}</p>
                <div className="mt-4 rounded-xl border border-slate-100 bg-[#f8fafc] p-4 text-xs text-slate-400">
                  Not enabled.
                </div>
              </PanelCard>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <PanelCard>
                <SectionTitle icon={Zap} title="Growth & retention" />
                <div className="space-y-2 text-sm text-slate-600">
                  <RowKV
                    label="Peak hour (IST)"
                    value={
                      data.intelligence.peak_traffic_hour_utc != null
                        ? String(data.intelligence.peak_traffic_hour_utc)
                        : "—"
                    }
                  />
                  <RowKV
                    label="Returning (window)"
                    value={String(data.intelligence.retention_returning_in_window)}
                  />
                </div>
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growth}>
                      <defs>
                        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={G} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={G} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        stroke="#e2e8f0"
                      />
                      <YAxis tick={{ fill: "#64748b", fontSize: 10 }} stroke="#e2e8f0" />
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="new_users"
                        stroke={G}
                        fill="url(#growthFill)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </PanelCard>

              <PanelCard>
                <SectionTitle icon={Globe2} title="Activity heatmap" />
                <HeatMini cells={data.geo?.heatmap ?? []} />
              </PanelCard>
            </div>

            <div className="mt-10 border-t border-slate-100 pt-6 text-center text-[11px] text-slate-400">
              Generated {data.generated_at} · {data.window.days}d since {data.window.since}
            </div>
          </>
        ) : null}
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
    <div className="flex items-center justify-between border-b border-black/[0.05] py-2 last:border-b-0">
      <span className="text-[#86868b]">{label}</span>
      <span className="font-mono text-[#1d1d1f]">{value}</span>
    </div>
  );
}

function HeroStat({
  label,
  value,
  icon: Icon,
  pulse,
  suffix = "",
  decimals,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  pulse?: boolean;
  suffix?: string;
  decimals?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {pulse ? (
        <span className="absolute right-4 top-4 flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
            style={{ background: ACCENT }}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: ACCENT }} />
        </span>
      ) : null}
      <Icon className="h-5 w-5 text-[#86868b]" />
      <div className="mt-3 text-[11px] font-medium uppercase tracking-wider text-[#86868b]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-[#1d1d1f] md:text-[28px]">
        <AnimatedInt value={value} decimals={decimals} suffix={suffix} />
      </div>
    </div>
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
      <div className="inline-flex flex-col gap-0.5 min-w-0">
        {grid.map((row, di) => (
          <div key={di} className="flex gap-0.5">
            {row.map((v, hi) => {
              const op = 0.06 + (v / max) * 0.94;
              return (
                <div
                  key={hi}
                  title={`D${di} H${hi}: ${v}`}
                  className="h-3 w-3 rounded-sm"
                  style={{ background: `rgba(0,113,227,${op})` }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400">
        <span>Rows Mon–Sun · columns 0–23h</span>
      </div>
    </div>
  );
}

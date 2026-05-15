import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  map_points: Array<{ country: string; city: string; region?: string; count: number; lat: number; lon: number }>;
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

/** Chart data only: green / red (axes and chrome stay neutral). */
const G = "#22c55e";
const R = "#ef4444";

function sliceFill(i: number) {
  return i % 2 === 0 ? G : R;
}

function AnimatedInt({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
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
      {decimals ? v.toLocaleString(undefined, { maximumFractionDigits: decimals }) : v.toLocaleString()}
      {suffix}
    </span>
  );
}

function PanelCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          <Icon className="h-4 w-4 text-zinc-600" />
          {title}
        </div>
        {subtitle ? <p className="mt-1 max-w-2xl text-xs text-zinc-600">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function EnterpriseAnalyticsPanel({ identity }: { identity: TelegramIdentity | null }) {
  const [data, setData] = useState<EnterpriseDashboard | null>(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [live, setLive] = useState<Array<Record<string, unknown>>>([]);
  const [days, setDays] = useState(30);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [storyId, setStoryId] = useState("");
  const [device, setDevice] = useState("");
  const [telegramOnly, setTelegramOnly] = useState(false);

  const firstLoadRef = useRef(true);

  useEffect(() => {
    firstLoadRef.current = true;
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
        days,
        country: country || undefined,
        city: city || undefined,
        story_id: storyId || undefined,
        device: device || undefined,
        telegram_only: telegramOnly || undefined,
      })) as unknown as EnterpriseDashboard;
      setData(j);
      if (isFirst) firstLoadRef.current = false;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setBootLoading(false);
      setRefreshing(false);
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

  const journeyNodes = ((data?.journey?.nodes as Array<{ id: string; count: number }>) ?? []) as Array<{
    id: string;
    count: number;
  }>;

  const showSkeleton = bootLoading && !data;

  return (
    <div className="relative min-h-[70vh] bg-black pb-10 text-zinc-200">
      {refreshing && data ? (
        <div className="pointer-events-none fixed left-0 right-0 top-0 z-20 h-0.5 bg-zinc-800">
          <div className="h-full w-1/3 animate-pulse bg-zinc-400" />
        </div>
      ) : null}

      <div className="relative z-10 border-b border-zinc-900 px-6 py-8 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-600">Analytics</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">Overview</h1>
            <p className="mt-2 max-w-lg text-sm text-zinc-500">Filters apply to the selected range. Live rows update over WebSocket.</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600">
            <span>
              <span className="text-zinc-500">WS</span> <span className="font-mono text-zinc-400">/api/ws/analytics</span>
            </span>
            <span className="text-zinc-800">|</span>
            <span>
              <span className="text-zinc-500">GET</span>{" "}
              <span className="font-mono text-zinc-400">/api/analytics/enterprise-dashboard</span>
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-6 lg:px-10">
        <PanelCard className="mb-6 mt-6">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-zinc-500">
              Range (days)
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="mt-1 block w-28 rounded-lg border border-zinc-800 bg-black px-2 py-2 text-sm text-zinc-100"
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
                placeholder="India"
                className="mt-1 block w-36 rounded-lg border border-zinc-800 bg-black px-2 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="text-xs text-zinc-500">
              City
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 block w-36 rounded-lg border border-zinc-800 bg-black px-2 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Story ID
              <input
                value={storyId}
                onChange={(e) => setStoryId(e.target.value)}
                className="mt-1 block w-44 rounded-lg border border-zinc-800 bg-black px-2 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Device
              <input
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                placeholder="mobile / desktop"
                className="mt-1 block w-32 rounded-lg border border-zinc-800 bg-black px-2 py-2 text-sm text-zinc-100"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 pt-5 text-xs text-zinc-500">
              <input type="checkbox" checked={telegramOnly} onChange={(e) => setTelegramOnly(e.target.checked)} />
              Telegram WebView only
            </label>
            <button
              type="button"
              onClick={() => void fetchDashboard()}
              className="ml-auto rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
            >
              Apply
            </button>
          </div>
        </PanelCard>

        {err ? (
          <div className="mb-6 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">{err}</div>
        ) : null}

        {showSkeleton ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-zinc-900" />
            ))}
          </div>
        ) : data ? (
          <>
            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <HeroStat label="Total users" value={data.hero.total_users} icon={Activity} />
              <HeroStat label="Active now" value={data.hero.active_now} icon={Zap} pulse />
              <HeroStat label="Revenue (₹)" value={data.hero.total_revenue} icon={Layers} decimals={0} />
              <HeroStat label="Sessions tracked" value={data.hero.sessions_tracked} icon={Timer} />
              <HeroStat label="Returning (window)" value={data.hero.returning_in_window} icon={ArrowRight} />
              <HeroStat
                label="Premium conversion"
                value={data.hero.premium_conversion_pct}
                suffix="%"
                icon={Layers}
                decimals={1}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <PanelCard className="xl:col-span-2">
                <SectionTitle icon={Radio} title="Live activity" subtitle="Latest tracked events." />
                <div className="h-72 overflow-hidden rounded-xl border border-zinc-800 bg-black">
                  <div className="h-full overflow-y-auto pr-2">
                    {(live.length ? live : data.live_feed).slice(0, 60).map((row, idx) => (
                      <div
                        key={`${(row as { id?: string }).id ?? idx}-${(row as { _ts?: number })._ts ?? idx}`}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-zinc-900 px-3 py-2 text-xs"
                      >
                        <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-zinc-400">
                          {String((row as { type?: string }).type ?? "event")}
                        </span>
                        <span className="text-zinc-600">user</span>
                        <span className="font-mono text-zinc-300">{String((row as { user_id?: unknown }).user_id ?? "—")}</span>
                        <span className="text-zinc-800">·</span>
                        <MapPin className="h-3 w-3 text-zinc-600" />
                        <span className="text-zinc-500">
                          {(row as { city?: string }).city ?? "—"}
                          {((row as { region?: string }).region || "").trim() ? (
                            <>
                              , <span className="text-zinc-400">{(row as { region?: string }).region}</span>
                            </>
                          ) : null}
                          {", "}
                          {(row as { country?: string }).country ?? ""}
                        </span>
                        <span className="ml-auto font-mono text-zinc-600">
                          {String((row as { ts?: string }).ts ?? (row as { time?: string }).time ?? "")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </PanelCard>

              <PanelCard>
                <SectionTitle icon={Cpu} title="Performance" subtitle="Client-reported timings when you emit them." />
                <div className="space-y-3 text-sm text-zinc-400">
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
              </PanelCard>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <PanelCard>
                <SectionTitle icon={Globe2} title="Geo map" subtitle="Pins use stored coordinates when available." />
                <div className="h-80 w-full">
                  <ResponsiveContainer>
                    <ScatterChart margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="4 8" stroke="#27272a" />
                      <XAxis type="number" dataKey="lon" name="lon" stroke="#3f3f46" tick={{ fill: "#71717a", fontSize: 10 }} />
                      <YAxis type="number" dataKey="lat" name="lat" stroke="#3f3f46" tick={{ fill: "#71717a", fontSize: 10 }} />
                      <ZAxis type="number" dataKey="count" range={[80, 520]} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3", stroke: "#52525b" }}
                        contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }}
                        formatter={(v: number, name: string) => [v, name]}
                        labelFormatter={(_, p) =>
                          p && p[0]
                            ? [p[0].payload.city, p[0].payload.region, p[0].payload.country].filter(Boolean).join(", ")
                            : ""
                        }
                      />
                      <Scatter name="Activity" data={mapPoints} fill={G} fillOpacity={0.85} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </PanelCard>

              <PanelCard>
                <SectionTitle icon={Activity} title="Event cadence" subtitle="By hour of day (UTC) in this window." />
                <div className="h-80 w-full">
                  <ResponsiveContainer>
                    <AreaChart data={hourly}>
                      <defs>
                        <linearGradient id="areaHourly" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={G} stopOpacity={0.45} />
                          <stop offset="100%" stopColor={G} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="hour" stroke="#3f3f46" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                      <YAxis stroke="#3f3f46" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }} />
                      <Area type="monotone" dataKey="events" stroke={G} strokeWidth={2} fill="url(#areaHourly)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </PanelCard>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <PanelCard>
                <SectionTitle icon={Cpu} title="Devices" />
                <div className="h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data.users.devices} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {data.users.devices.map((_, i) => (
                          <Cell key={i} fill={sliceFill(i)} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-500">
                  <div className="rounded-lg border border-zinc-900 bg-black px-2 py-2">
                    Mobile / tablet
                    <div className="text-lg font-semibold text-zinc-100">{data.users.mobile_events}</div>
                  </div>
                  <div className="rounded-lg border border-zinc-900 bg-black px-2 py-2">
                    Desktop
                    <div className="text-lg font-semibold text-zinc-100">{data.users.desktop_events}</div>
                  </div>
                  <div className="col-span-2 rounded-lg border border-zinc-900 bg-black px-2 py-2">
                    Telegram WebView
                    <div className="text-lg font-semibold text-zinc-100">{data.users.telegram_webview_events}</div>
                  </div>
                </div>
              </PanelCard>

              <PanelCard>
                <SectionTitle icon={Globe2} title="Top countries" />
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={data.geo.countries} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                      <XAxis type="number" stroke="#3f3f46" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={100} stroke="#3f3f46" tick={{ fill: "#d4d4d8", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }} />
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
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={data.geo.cities}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="name"
                        stroke="#3f3f46"
                        tick={{ fill: "#a1a1aa", fontSize: 9 }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis stroke="#3f3f46" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }} />
                      <Bar dataKey="value" fill={G} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </PanelCard>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <PanelCard>
                <SectionTitle icon={Headphones} title="Stories" subtitle="Top story views in range." />
                <div className="max-h-80 overflow-y-auto rounded-xl border border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-zinc-950 text-zinc-600">
                      <tr>
                        <th className="px-3 py-2">Story</th>
                        <th className="px-3 py-2">Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storiesTop.map((s) => (
                        <tr key={s.story_id} className="border-t border-zinc-900 text-zinc-400">
                          <td className="px-3 py-2">{s.title}</td>
                          <td className="px-3 py-2 font-mono text-zinc-200">{s.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-zinc-600">
                  <div className="rounded-lg border border-zinc-900 bg-black py-2">
                    Completion (proxy %)
                    <div className="text-lg font-semibold text-zinc-100">{String(data.stories.story_completion_proxy_pct)}</div>
                  </div>
                  <div className="rounded-lg border border-zinc-900 bg-black py-2">
                    Drop-off (proxy %)
                    <div className="text-lg font-semibold text-zinc-100">{String(data.stories.dropoff_proxy_pct)}</div>
                  </div>
                  <div className="rounded-lg border border-zinc-900 bg-black py-2">
                    Avg session (sec)
                    <div className="text-lg font-semibold text-zinc-100">{String(data.stories.avg_listen_proxy_sec)}</div>
                  </div>
                </div>
              </PanelCard>

              <PanelCard>
                <SectionTitle icon={Search} title="Search" />
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {data.search.top.map((s) => (
                    <div
                      key={s.query}
                      className="flex items-center justify-between rounded-lg border border-zinc-900 bg-black px-3 py-2 text-xs"
                    >
                      <span className="truncate text-zinc-300">{s.query}</span>
                      <span className="font-mono text-zinc-500">{s.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-zinc-600">
                  Failed searches: <span className="font-mono text-zinc-300">{data.search.failed_searches}</span>
                </div>
              </PanelCard>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <PanelCard className="lg:col-span-2">
                <SectionTitle icon={Layers} title="Pages" />
                <div className="flex flex-wrap items-center gap-2">
                  {journeyNodes.map((n, i, arr) => (
                    <div key={n.id} className="flex items-center gap-2">
                      <span className="rounded-full border border-zinc-800 bg-black px-3 py-1 text-xs text-zinc-300">
                        {n.id} <span className="text-zinc-600">({n.count})</span>
                      </span>
                      {i < arr.length - 1 ? <ArrowRight className="h-3 w-3 text-zinc-700" /> : null}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-zinc-600">{String(data.journey?.flow_note ?? "")}</p>
              </PanelCard>

              <PanelCard>
                <SectionTitle icon={Timer} title="Session replay" />
                <p className="text-sm text-zinc-500">{data.session_replay.message}</p>
                <div className="mt-4 rounded-xl border border-zinc-900 bg-black p-4 text-xs text-zinc-600">Not enabled.</div>
              </PanelCard>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <PanelCard>
                <SectionTitle icon={Zap} title="Growth & retention" />
                <div className="space-y-2 text-sm text-zinc-400">
                  <RowKV
                    label="Peak hour (UTC)"
                    value={data.intelligence.peak_traffic_hour_utc != null ? String(data.intelligence.peak_traffic_hour_utc) : "—"}
                  />
                  <RowKV label="Returning (window)" value={String(data.intelligence.retention_returning_in_window)} />
                </div>
                <div className="mt-4 h-56">
                  <ResponsiveContainer>
                    <AreaChart data={growth}>
                      <defs>
                        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={G} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={G} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 10 }} stroke="#3f3f46" />
                      <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} stroke="#3f3f46" />
                      <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8 }} />
                      <Area type="monotone" dataKey="new_users" stroke={G} fill="url(#growthFill)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </PanelCard>

              <PanelCard>
                <SectionTitle icon={Globe2} title="Activity heatmap" subtitle="Day of week × hour (UTC)." />
                <HeatMini cells={data.geo?.heatmap ?? []} />
              </PanelCard>
            </div>

            <div className="mt-10 border-t border-zinc-900 pt-6 text-center text-[11px] text-zinc-600">
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
    <div className="flex items-center justify-between border-b border-zinc-900 py-1.5">
      <span className="text-zinc-600">{label}</span>
      <span className="font-mono text-zinc-200">{value}</span>
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
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-black p-5">
      {pulse ? (
        <span className="absolute right-4 top-4 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ background: G }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: G }} />
        </span>
      ) : null}
      <Icon className="h-5 w-5 text-zinc-600" />
      <div className="mt-3 text-[11px] font-medium uppercase tracking-wider text-zinc-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white md:text-3xl">
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
      <div className="inline-flex flex-col gap-0.5">
        {grid.map((row, di) => (
          <div key={di} className="flex gap-0.5">
            {row.map((v, hi) => {
              const op = 0.06 + (v / max) * 0.94;
              return (
                <div
                  key={hi}
                  title={`D${di} H${hi}: ${v}`}
                  className="h-3 w-3 rounded-sm"
                  style={{ background: `rgba(34,197,94,${op})` }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
        <span>Rows Mon–Sun · columns 0–23h</span>
      </div>
    </div>
  );
}

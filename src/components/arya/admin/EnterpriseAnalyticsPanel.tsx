import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, ElementType, ReactNode, SetStateAction } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Cpu,
  CreditCard,
  Globe2,
  Layers,
  MapPin,
  MousePointerClick,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Users,
  XCircle,
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
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  fetchEnterpriseDashboard,
  getAnalyticsWebSocketUrl,
  type TelegramIdentity,
} from "@/lib/api";
import { cn } from "@/lib/utils";

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

type AnalyticsFilterForm = {
  days: number;
  country: string;
  city: string;
  storyId: string;
  device: string;
  telegramOnly: boolean;
};

type AnalyticsTab = "overview" | "geo" | "audience" | "content" | "events";

const defaultFilters: AnalyticsFilterForm = {
  days: 30,
  country: "",
  city: "",
  storyId: "",
  device: "",
  telegramOnly: false,
};

const ink = "#111111";
const graphite = "#525252";
const muted = "#8a8a8e";
const line = "#e7e7ea";
const panel = "#ffffff";
const wash = "#f5f5f7";
const CHART = ["#111111", "#444444", "#707070", "#9b9b9b", "#c5c5c7", "#e1e1e3"];

const tooltipStyle = {
  background: panel,
  border: `1px solid ${line}`,
  borderRadius: 12,
  color: ink,
  boxShadow: "0 18px 50px -28px rgba(0,0,0,.35)",
};

function fmt(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : "0";
}

function pct(value: unknown) {
  const n = Number(value ?? 0);
  return `${Number.isFinite(n) ? n.toFixed(n % 1 ? 1 : 0) : "0"}%`;
}

function money(value: unknown) {
  return `₹${fmt(value)}`;
}

function chartFill(i: number) {
  return CHART[i % CHART.length];
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

export function EnterpriseAnalyticsPanel({ identity }: { identity: TelegramIdentity | null }) {
  const [data, setData] = useState<EnterpriseDashboard | null>(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [live, setLive] = useState<Array<Record<string, unknown>>>([]);
  const [tab, setTab] = useState<AnalyticsTab>("overview");
  const [applied, setApplied] = useState<AnalyticsFilterForm>(() => ({ ...defaultFilters }));
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
      setErr("Owner Telegram account required.");
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
      setErr(e instanceof Error ? e.message : "Analytics load failed");
    } finally {
      setBootLoading(false);
      setRefreshing(false);
    }
  }, [identity, applied]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const onWs = useCallback((msg: unknown) => {
    if (msg && typeof msg === "object" && (msg as { channel?: string }).channel === "live") {
      setLive((prev) => [{ ...(msg as object), _ts: Date.now() } as Record<string, unknown>, ...prev].slice(0, 80));
    }
  }, []);

  useWebSocketLive(identity?.telegram_id ?? null, onWs);

  const hourly = useMemo(() => data?.charts?.hourly_events ?? [], [data]);
  const growth = useMemo(() => data?.intelligence?.user_growth_by_day ?? [], [data]);
  const activityFeed = live.length ? live : data?.live_feed ?? [];
  const clickLogs = data?.click_logs ?? [];
  const trafficSources = data?.traffic?.sources ?? [];
  const storyTop = ((data?.stories?.top_viewed as Array<{ story_id: string; title: string; views: number }>) ?? []).slice(0, 10);
  const chapterTop = ((data?.stories as { chapter_top?: Array<{ chapter_id: string; events: number }> } | undefined)?.chapter_top ?? []).slice(0, 10);
  const journeyNodes = ((data?.journey?.nodes as Array<{ id: string; count: number }>) ?? []).slice(0, 8);
  const showSkeleton = bootLoading && !data;
  const seenUsers = data?.hero?.unique_in_window ?? 0;
  const returningUsers = data?.hero?.returning_in_window ?? 0;
  const notReturned = Math.max(0, seenUsers - returningUsers);

  return (
    <section
      className="min-h-[70vh] w-full overflow-x-hidden bg-[#f5f5f7] pb-10 text-[#111111]"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', Inter, system-ui, sans-serif" }}
    >
      {refreshing && data ? <div className="fixed left-0 right-0 top-0 z-50 h-0.5 animate-pulse bg-[#111111]" /> : null}

      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a8a8e]">Analytics</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#111111]">Admin Intelligence</h1>
            <p className="mt-1 max-w-2xl text-sm text-[#6f6f73]">Users, location, devices, sales and activity in one clean report.</p>
          </div>
          <button
            type="button"
            onClick={() => void fetchDashboard()}
            disabled={bootLoading && !data}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9d9dd] bg-white px-4 py-2 text-sm font-medium text-[#111111] shadow-sm transition hover:bg-[#f2f2f3] disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>

        <FilterBar draft={draft} setDraft={setDraft} onApply={() => setApplied({ ...draft })} />

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {err}
          </div>
        ) : null}

        {showSkeleton ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-white" />)}
          </div>
        ) : data ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Total users" value={fmt(data.hero.total_users)} icon={Users} note="All-time mini app audience" />
              <MetricCard title="Active now" value={fmt(data.hero.active_now)} icon={Radio} note="Live users" pulse />
              <MetricCard title="Users came" value={fmt(seenUsers)} icon={ArrowUpRight} note={`Last ${data.window.days} days`} />
              <MetricCard title="Did not return" value={fmt(notReturned)} icon={ArrowDownRight} note="Window users minus returning" />
              <MetricCard title="Revenue" value={money(data.hero.total_revenue)} icon={CreditCard} note="Paid and delivered" />
              <MetricCard title="Orders" value={fmt(data.hero.orders_paid_or_delivered)} icon={CheckCircle2} note="Successful deliveries" />
              <MetricCard title="Retention" value={pct(data.hero.retention_pct ?? data.retention?.retention_pct)} icon={ShieldCheck} note={`${fmt(returningUsers)} returning users`} />
              <MetricCard title="Avg session" value={`${fmt(Math.round(data.hero.avg_session_seconds || 0))}s`} icon={Clock3} note="Tracked sessions" />
            </div>

            <div className="mt-5 overflow-x-auto rounded-full border border-[#e1e1e4] bg-white p-1 shadow-sm">
              <div className="flex min-w-max gap-1">
                {[
                  ["overview", "Overview", Activity],
                  ["geo", "Location", Globe2],
                  ["audience", "Device", Smartphone],
                  ["content", "Content", Layers],
                  ["events", "Events", MousePointerClick],
                ].map(([id, label, Icon]) => (
                  <button
                    key={String(id)}
                    type="button"
                    onClick={() => setTab(id as AnalyticsTab)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                      tab === id ? "bg-[#111111] text-white shadow-sm" : "text-[#6f6f73] hover:bg-[#f5f5f7] hover:text-[#111111]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {String(label)}
                  </button>
                ))}
              </div>
            </div>

            {tab === "overview" ? (
              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                  <CardTitle icon={Activity} title="Hourly activity" subtitle="Events by hour, useful for peak traffic timing." />
                  <ChartBox>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hourly} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="monoHourly" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ink} stopOpacity={0.22} />
                            <stop offset="100%" stopColor={ink} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 8" stroke={line} />
                        <XAxis dataKey="hour" tick={{ fill: muted, fontSize: 11 }} stroke={line} />
                        <YAxis tick={{ fill: muted, fontSize: 11 }} stroke={line} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area dataKey="events" type="monotone" stroke={ink} strokeWidth={2.4} fill="url(#monoHourly)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartBox>
                </Card>
                <Card>
                  <CardTitle icon={CreditCard} title="Checkout funnel" subtitle="Where payment flow is completing or dropping." />
                  <div className="space-y-3">
                    {[
                      ["Opened", data.checkout?.opened_checkout ?? 0],
                      ["Payment started", data.checkout?.pay_started ?? 0],
                      ["Completed", data.checkout?.completed ?? 0],
                      ["Failed", data.checkout?.failed ?? 0],
                      ["Abandoned", data.checkout?.abandoned ?? 0],
                    ].map(([label, value]) => <ProgressRow key={String(label)} label={String(label)} value={Number(value)} max={Math.max(1, data.checkout?.opened_checkout ?? 1)} />)}
                  </div>
                  <div className="mt-4 rounded-2xl bg-[#f5f5f7] p-4">
                    <p className="text-xs font-medium text-[#8a8a8e]">Conversion</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight">{pct(data.checkout?.conversion_pct)}</p>
                  </div>
                </Card>
                <Card className="xl:col-span-2">
                  <CardTitle icon={Radio} title="Live activity" subtitle="Latest user actions with city, country and account id." />
                  <LiveFeed rows={activityFeed} />
                </Card>
                <Card>
                  <CardTitle icon={CalendarDays} title="Growth" subtitle="New users by day." />
                  <ChartBox className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={growth} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="growthMono" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={ink} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={ink} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 8" stroke={line} />
                        <XAxis dataKey="date" tick={{ fill: muted, fontSize: 10 }} stroke={line} />
                        <YAxis tick={{ fill: muted, fontSize: 10 }} stroke={line} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area dataKey="new_users" type="monotone" stroke={ink} fill="url(#growthMono)" strokeWidth={2.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartBox>
                </Card>
              </div>
            ) : null}

            {tab === "geo" ? (
              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                  <CardTitle icon={Globe2} title="Top countries" subtitle="Country level user distribution." />
                  <VerticalBars data={data.geo.countries} />
                </Card>
                <Card>
                  <CardTitle icon={MapPin} title="Top cities" subtitle="City level user distribution." />
                  <ListRows data={data.geo.cities} empty="No city data yet" />
                </Card>
                <Card>
                  <CardTitle icon={MapPin} title="States / regions" subtitle="Regional split when backend provides it." />
                  <ListRows data={data.geo.states ?? []} empty="No region data yet" />
                </Card>
                <Card className="xl:col-span-2">
                  <CardTitle icon={Clock3} title="Activity heatmap" subtitle="Rows are days, columns are hours. Darker means more activity." />
                  <HeatMini cells={data.geo.heatmap ?? []} />
                </Card>
              </div>
            ) : null}

            {tab === "audience" ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <DonutCard title="Devices" icon={Smartphone} data={data.users.devices} />
                <DonutCard title="Browsers" icon={Globe2} data={data.users.browsers} />
                <DonutCard title="Operating systems" icon={Cpu} data={data.users.operating_systems} />
                <Card className="lg:col-span-3">
                  <CardTitle icon={Smartphone} title="Device source totals" subtitle="Telegram WebView, mobile and desktop events." />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Mobile / tablet" value={fmt(data.users.mobile_events)} />
                    <MiniStat label="Desktop" value={fmt(data.users.desktop_events)} />
                    <MiniStat label="Telegram WebView" value={fmt(data.users.telegram_webview_events)} />
                  </div>
                </Card>
              </div>
            ) : null}

            {tab === "content" ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardTitle icon={Layers} title="Stories" subtitle="Most viewed stories in this window." />
                  <TableRows rows={storyTop.map((s) => [s.title, fmt(s.views)])} empty="No story activity yet" />
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <MiniStat label="Completion" value={pct(data.stories.story_completion_proxy_pct)} />
                    <MiniStat label="Drop-off" value={pct(data.stories.dropoff_proxy_pct)} />
                    <MiniStat label="Avg listen" value={`${fmt(data.stories.avg_listen_proxy_sec)}s`} />
                  </div>
                </Card>
                <Card>
                  <CardTitle icon={Search} title="Search" subtitle="Search terms and failed searches." />
                  <ListRows
                    data={(data.search.top ?? []).map((item) => ({ name: item.query, value: item.count }))}
                    empty="No search data yet"
                  />
                  <div className="mt-4 rounded-2xl bg-[#f5f5f7] p-4 text-sm text-[#525252]">
                    Failed searches: <span className="font-semibold text-[#111111]">{fmt(data.search.failed_searches)}</span>
                  </div>
                </Card>
                <Card>
                  <CardTitle icon={Layers} title="Chapters" subtitle="Chapter-level events when available." />
                  <TableRows rows={chapterTop.map((c) => [c.chapter_id, fmt(c.events)])} empty="No chapter activity yet" />
                </Card>
                <Card>
                  <CardTitle icon={MousePointerClick} title="Traffic sources" subtitle="Direct, Telegram and referral sources." />
                  <ListRows data={trafficSources} empty="No referrer data yet" />
                </Card>
              </div>
            ) : null}

            {tab === "events" ? (
              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                  <CardTitle icon={MousePointerClick} title="Event log" subtitle="Recent clicks, pages and targets." />
                  <EventTable logs={clickLogs} />
                </Card>
                <Card>
                  <CardTitle icon={Layers} title="Pages" subtitle="User journey nodes." />
                  <div className="space-y-2">
                    {journeyNodes.length ? journeyNodes.map((n) => <ProgressRow key={n.id} label={n.id} value={n.count} max={Math.max(...journeyNodes.map((x) => x.count), 1)} />) : <EmptyState>No page journey data yet</EmptyState>}
                  </div>
                  {String(data.journey?.flow_note ?? "").trim() ? <p className="mt-4 text-xs text-[#8a8a8e]">{String(data.journey.flow_note)}</p> : null}
                </Card>
                <Card>
                  <CardTitle icon={Cpu} title="Performance" subtitle="Load and API timing samples." />
                  <KeyValues items={[
                    ["Samples", fmt(data.performance.samples)],
                    ["Avg page load", data.performance.avg_page_load_ms != null ? `${fmt(data.performance.avg_page_load_ms)} ms` : "—"],
                    ["Avg API", data.performance.avg_api_ms != null ? `${fmt(data.performance.avg_api_ms)} ms` : "—"],
                    ["Console errors", fmt(data.performance.console_errors)],
                  ]} />
                </Card>
                <Card className="xl:col-span-2">
                  <CardTitle icon={ShieldCheck} title="Session replay" subtitle="Replay status for future debugging." />
                  <p className="rounded-2xl bg-[#f5f5f7] p-4 text-sm text-[#525252]">{data.session_replay.message || "Not enabled."}</p>
                </Card>
              </div>
            ) : null}

            <p className="mt-8 text-center text-[11px] font-medium text-[#8a8a8e]">
              Generated {data.generated_at} · last {data.window.days} days
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}

function FilterBar({ draft, setDraft, onApply }: { draft: AnalyticsFilterForm; setDraft: React.Dispatch<React.SetStateAction<AnalyticsFilterForm>>; onApply: () => void }) {
  return (
    <div className="mt-5 rounded-3xl border border-[#e1e1e4] bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="Range">
          <select value={draft.days} onChange={(e) => setDraft((d) => ({ ...d, days: Number(e.target.value) }))} className="input-clean">
            {[7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
          </select>
        </Field>
        <Field label="Country"><input value={draft.country} onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))} className="input-clean" placeholder="India" /></Field>
        <Field label="City"><input value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} className="input-clean" placeholder="Guna" /></Field>
        <Field label="Story"><input value={draft.storyId} onChange={(e) => setDraft((d) => ({ ...d, storyId: e.target.value }))} className="input-clean" placeholder="Story ID" /></Field>
        <Field label="Device"><input value={draft.device} onChange={(e) => setDraft((d) => ({ ...d, device: e.target.value }))} className="input-clean" placeholder="mobile" /></Field>
        <div className="flex items-end gap-2">
          <label className="flex h-[42px] flex-1 items-center gap-2 rounded-2xl border border-[#e1e1e4] bg-[#f5f5f7] px-3 text-xs font-medium text-[#525252]">
            <input type="checkbox" checked={draft.telegramOnly} onChange={(e) => setDraft((d) => ({ ...d, telegramOnly: e.target.checked }))} className="h-4 w-4 accent-[#111111]" />
            Telegram
          </label>
          <button type="button" onClick={onApply} className="h-[42px] rounded-2xl bg-[#111111] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2b2b]">Apply</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-[11px] font-semibold uppercase tracking-[0.13em] text-[#8a8a8e]">{label}<div className="mt-1.5">{children}</div></label>;
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-3xl border border-[#e1e1e4] bg-white p-5 shadow-sm", className)}>{children}</div>;
}

function CardTitle({ icon: Icon, title, subtitle }: { icon: ElementType; title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#f5f5f7] text-[#111111]"><Icon className="h-4 w-4" /></div>
      <div>
        <h2 className="text-base font-semibold tracking-tight text-[#111111]">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs leading-5 text-[#8a8a8e]">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, note, pulse }: { title: string; value: string; icon: ElementType; note: string; pulse?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#e1e1e4] bg-white p-5 shadow-sm">
      {pulse ? <span className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-[#111111] shadow-[0_0_0_6px_rgba(17,17,17,.08)]" /> : null}
      <Icon className="h-5 w-5 text-[#525252]" />
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8e]">{title}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[#111111]">{value}</p>
      <p className="mt-1 text-xs text-[#8a8a8e]">{note}</p>
    </div>
  );
}

function ChartBox({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("h-72 w-full overflow-hidden", className)}>{children}</div>;
}

function ProgressRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = `${Math.min(100, Math.round((value / Math.max(1, max)) * 100))}%`;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm"><span className="font-medium text-[#525252]">{label}</span><span className="font-semibold text-[#111111]">{fmt(value)}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-[#ededf0]"><div className="h-full rounded-full bg-[#111111]" style={{ width }} /></div>
    </div>
  );
}

function LiveFeed({ rows }: { rows: Array<Record<string, unknown>> }) {
  if (!rows.length) return <EmptyState>No live activity yet</EmptyState>;
  return (
    <div className="max-h-80 overflow-auto rounded-2xl border border-[#ededf0]">
      {rows.slice(0, 60).map((row, idx) => (
        <div key={`${String(row.id ?? idx)}-${String(row._ts ?? idx)}`} className="grid gap-1 border-b border-[#ededf0] px-3 py-2 text-xs last:border-b-0 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <span className="truncate font-medium text-[#111111]">{String(row.summary || row.type || "event")}</span>
          <span className="font-mono text-[#6f6f73]">{String(row.user_id ?? "—")}</span>
          <span className="truncate text-[#6f6f73]">{[row.city, row.region, row.country].filter(Boolean).join(", ") || "—"}</span>
        </div>
      ))}
    </div>
  );
}

function VerticalBars({ data }: { data: Array<{ name: string; value: number }> }) {
  if (!data.length) return <EmptyState>No country data yet</EmptyState>;
  return (
    <ChartBox>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 8" stroke={line} horizontal={false} />
          <XAxis type="number" tick={{ fill: muted, fontSize: 11 }} stroke={line} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fill: graphite, fontSize: 11 }} stroke={line} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} fill={ink} />
        </BarChart>
      </ResponsiveContainer>
    </ChartBox>
  );
}

function DonutCard({ title, icon, data }: { title: string; icon: ElementType; data: Array<{ name: string; value: number }> }) {
  return (
    <Card>
      <CardTitle icon={icon} title={title} />
      {data.length ? (
        <>
          <div className="h-48 w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={2}>
                  {data.map((_, i) => <Cell key={i} fill={chartFill(i)} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ListRows data={data.slice(0, 4)} empty="" compact />
        </>
      ) : <EmptyState>No {title.toLowerCase()} data yet</EmptyState>}
    </Card>
  );
}

function ListRows({ data, empty, compact }: { data: Array<{ name: string; value: number }>; empty: string; compact?: boolean }) {
  if (!data.length) return <EmptyState>{empty}</EmptyState>;
  const max = Math.max(...data.map((d) => Number(d.value || 0)), 1);
  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      {data.slice(0, compact ? 4 : 10).map((d, i) => (
        <div key={`${d.name}-${i}`} className="rounded-2xl bg-[#f5f5f7] p-3">
          <div className="flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium text-[#525252]">{d.name || "Unknown"}</span><span className="font-semibold text-[#111111]">{fmt(d.value)}</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e3e3e6]"><div className="h-full rounded-full bg-[#111111]" style={{ width: `${Math.max(4, (Number(d.value || 0) / max) * 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function TableRows({ rows, empty }: { rows: Array<[string, string]>; empty: string }) {
  if (!rows.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <div className="max-h-72 overflow-auto rounded-2xl border border-[#ededf0]">
      <table className="w-full min-w-[360px] text-left text-xs">
        <tbody>{rows.map(([a, b], i) => <tr key={`${a}-${i}`} className="border-b border-[#ededf0] last:border-b-0"><td className="px-3 py-3 font-medium text-[#525252]">{a}</td><td className="px-3 py-3 text-right font-semibold text-[#111111]">{b}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function EventTable({ logs }: { logs: EnterpriseDashboard["click_logs"] }) {
  if (!logs?.length) return <EmptyState>No event rows in this window</EmptyState>;
  return (
    <div className="max-h-96 overflow-auto rounded-2xl border border-[#ededf0]">
      <table className="w-full min-w-[620px] text-left text-xs">
        <thead className="sticky top-0 bg-white text-[#8a8a8e]"><tr><th className="px-3 py-2">Time</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Target</th><th className="px-3 py-2">Page</th></tr></thead>
        <tbody>{logs.slice(0, 80).map((row, i) => <tr key={`${row.ts}-${i}`} className="border-t border-[#ededf0]"><td className="px-3 py-2 font-mono text-[#8a8a8e]">{row.ts}</td><td className="px-3 py-2 text-[#525252]">{row.type || "event"}</td><td className="max-w-[220px] truncate px-3 py-2 text-[#111111]">{row.target || row.story_id || "—"}</td><td className="px-3 py-2 text-[#525252]">{row.page || "—"}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function KeyValues({ items }: { items: Array<[string, string]> }) {
  return <div className="divide-y divide-[#ededf0] rounded-2xl border border-[#ededf0]">{items.map(([k, v]) => <div key={k} className="flex items-center justify-between gap-3 px-3 py-3 text-sm"><span className="text-[#6f6f73]">{k}</span><span className="font-semibold text-[#111111]">{v}</span></div>)}</div>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[#f5f5f7] p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8a8e]">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight text-[#111111]">{value}</p></div>;
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="flex min-h-32 items-center justify-center rounded-2xl bg-[#f5f5f7] p-4 text-center text-sm font-medium text-[#8a8a8e]"><XCircle className="mr-2 h-4 w-4" />{children}</div>;
}

function HeatMini({ cells }: { cells: Array<{ day: number; hour: number; count: number }> }) {
  const max = Math.max(1, ...cells.map((c) => c.count));
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const c of cells) {
    if (c.day >= 0 && c.day < 7 && c.hour >= 0 && c.hour < 24) grid[c.day][c.hour] += c.count;
  }
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="min-w-[760px] space-y-1">
        {grid.map((row, di) => (
          <div key={di} className="grid grid-cols-[34px_repeat(24,minmax(0,1fr))] items-center gap-1">
            <span className="text-[10px] font-medium text-[#8a8a8e]">{days[di]}</span>
            {row.map((v, hi) => {
              const op = v ? 0.16 + (v / max) * 0.84 : 0.05;
              return <div key={hi} title={`${days[di]} ${hi}:00 · ${v}`} className="h-5 rounded-md border border-black/[0.03]" style={{ background: `rgba(17,17,17,${op})` }} />;
            })}
          </div>
        ))}
        <div className="grid grid-cols-[34px_repeat(6,1fr)] gap-1 pt-1 text-[10px] text-[#8a8a8e]"><span />{["00", "04", "08", "12", "16", "20"].map((h) => <span key={h}>{h}:00</span>)}</div>
      </div>
    </div>
  );
}

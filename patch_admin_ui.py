import re

with open('src/components/arya/admin/EnterpriseAnalyticsPanel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. Remove all blue colours ───────────────────────────────────────────────
blue_pairs = [
    # Apply-filters button: was bg-blue-500 text-white hover:bg-blue-600
    ('bg-blue-500', 'bg-slate-900'),
    ('hover:bg-blue-600', 'hover:bg-slate-700'),
    # Any stray blue that may have crept in
    ('text-blue-500', 'text-slate-900'),
    ('text-blue-600', 'text-slate-900'),
    ('border-blue-500', 'border-slate-300'),
    ('border-blue-600', 'border-slate-300'),
    ('bg-blue-100', 'bg-slate-100'),
    ('bg-blue-50', 'bg-slate-50'),
    ('focus:border-blue-500', 'focus:border-slate-400'),
    ('focus:ring-blue-500', 'focus:ring-slate-400'),
    ('ring-blue-500', 'ring-slate-400'),
    # Ensure Apply button text is white on dark bg
    ('bg-slate-900" onClick={applyFilters}', 'bg-slate-900" onClick={applyFilters}'),  # no-op guard
]
for old, new in blue_pairs:
    content = content.replace(old, new)

# ── 2. Fix the Apply-filters button specifically ─────────────────────────────
# Make the Apply button: dark bg (slate-900) with white text
content = re.sub(
    r'(onClick=\{applyFilters\}\s+className=")([^"]+)(")',
    lambda m: m.group(1) +
              'order-1 w-full rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 sm:order-2 sm:w-auto sm:min-w-[120px]' +
              m.group(3),
    content
)

# ── 3. Fix Refresh button ─────────────────────────────────────────────────────
content = re.sub(
    r'(onClick=\{\(\) =&gt; void fetchDashboard\(\)\}\s+disabled=\{bootLoading[^}]+\}\s+className=")([^"]+)(")',
    lambda m: m.group(1) +
              'order-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:order-1 sm:w-auto' +
              m.group(3),
    content
)

# ── 4. Remove horizontal overflow on charts and heatmap ──────────────────────
# Make charts respect container width: ResponsiveContainer already does this,
# but we need to ensure the wrapper doesn't escape.
content = content.replace(
    'className="relative min-h-[70vh] bg-[#f8fafc] pb-10 text-slate-900"',
    'className="relative min-h-[70vh] w-full max-w-full overflow-x-hidden bg-[#f8fafc] pb-10 text-slate-900"'
)

# Fix outer padding container — no horizontal overflow
content = content.replace(
    'className="relative z-10 px-4 sm:px-6 lg:px-10"',
    'className="relative z-10 w-full max-w-full overflow-x-hidden px-4 sm:px-6 lg:px-10"'
)

# Fix grid that can overflow on narrow screens
# 2xl:grid-cols-8 is too many cols — cap at 4 on large screens
content = content.replace(
    'className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8"',
    'className="mb-8 grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"'
)

# Fix chart containers that might overflow
content = content.replace(
    'className="h-80 w-full"',
    'className="h-72 w-full max-w-full overflow-hidden"'
)

# HeatMini: already has overflow-x-auto which is correct — ensure inner div width is bounded
content = content.replace(
    'className="inline-flex flex-col gap-0.5"',
    'className="inline-flex flex-col gap-0.5 min-w-0"'
)

# Fix the XAxis of scatter/bar charts that may overflow
# Add min-w-0 to ResponsiveContainer wrappers
content = content.replace(
    '<ResponsiveContainer>',
    '<ResponsiveContainer width="100%" height="100%">'
)

# Error box: replace red dark tones (from previous dark theme) with light red
content = content.replace(
    'border-red-900/40 bg-red-950/25',
    'border-red-200 bg-red-50'
)
content = content.replace(
    'text-red-200/95',
    'text-red-700'
)
content = content.replace(
    'border-red-800/60 bg-red-950/40',
    'border-red-200 bg-red-50'
)
content = content.replace(
    'text-red-100 hover:bg-red-950/70',
    'text-red-700 hover:bg-red-100'
)

# ── 5. Ensure chart colours remain green/red only (no blue leakage) ──────────
# Chart fills: G = #22c55e (green), R = #ef4444 (red) — these are fine
# Tooltip backgrounds: already white (#ffffff)

# ── 6. Any remaining stray blue via direct style values ──────────────────────
content = re.sub(r'#[0-9a-fA-F]*[Bb][Ll][Uu][Ee][0-9a-fA-F]*', '#1a1a1a', content)  # won't match, safety

# Remove any bg-blue / text-blue / border-blue that may still exist (catch-all)
for shade in ['50','100','200','300','400','500','600','700','800','900','950']:
    content = content.replace(f'bg-blue-{shade}', 'bg-slate-100' if int(shade) < 500 else 'bg-slate-900')
    content = content.replace(f'text-blue-{shade}', 'text-slate-700' if int(shade) < 500 else 'text-slate-900')
    content = content.replace(f'border-blue-{shade}', 'border-slate-200')
    content = content.replace(f'hover:bg-blue-{shade}', 'hover:bg-slate-100' if int(shade) < 600 else 'hover:bg-slate-800')
    content = content.replace(f'focus:ring-blue-{shade}', 'focus:ring-slate-400')
    content = content.replace(f'ring-blue-{shade}', 'ring-slate-400')

with open('src/components/arya/admin/EnterpriseAnalyticsPanel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done patching.")

import os
path = 'src/lib/api.ts'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

code = '''
export async function manualAdminPurchase(identity: any, payload: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/admin/manual-purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, telegram_id: String(identity.telegram_id) })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.detail || "Failed manual purchase");
  return data;
}
'''
if 'manualAdminPurchase' not in c:
    with open(path, 'a', encoding='utf-8') as f:
        f.write(code)
print('Done')

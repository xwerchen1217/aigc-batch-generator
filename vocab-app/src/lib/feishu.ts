/**
 * 飞书开放平台 API 集成
 * 通过 Next.js API 路由代理，避免 CORS 问题
 */

// Token 缓存
let accessTokenCache: string | null = null;
let tokenExpireTime: number = 0;

/**
 * 获取 tenant_access_token
 */
export async function getTenantAccessToken(): Promise<string> {
  // 检查缓存
  if (accessTokenCache && Date.now() < tokenExpireTime) {
    return accessTokenCache!;
  }

  const response = await fetch('/api/feishu/token', {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok || !data.tenant_access_token) {
    throw new Error(data.error || '获取飞书 token 失败');
  }

  accessTokenCache = data.tenant_access_token;
  tokenExpireTime = Date.now() + (data.expire - 60) * 1000;

  return accessTokenCache!;
}

/**
 * 批量添加记录
 */
export async function appendRecords(
  appToken: string,
  tableId: string,
  records: Record<string, unknown>[]
) {
  const response = await fetch('/api/feishu/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appToken,
      tableId,
      records,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '添加记录失败');
  }

  return data.data;
}

/**
 * 查询记录
 */
export async function queryRecords(
  appToken: string,
  tableId: string,
  filter?: string
) {
  const params = new URLSearchParams({
    appToken,
    tableId,
  });
  if (filter) {
    params.set('filter', filter);
  }

  const response = await fetch(`/api/feishu/records?${params}`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '查询记录失败');
  }

  return data.items;
}

/**
 * 更新记录
 */
export async function updateRecord(
  appToken: string,
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>
) {
  // 获取 token
  const token = await getTenantAccessToken();

  // 构建记录数据
  const fields_data = Object.entries(fields).map(([key, value]) => ({
    field_name: key,
    value: typeof value === 'string' ? value : JSON.stringify(value),
  }));

  const response = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: fields_data }),
    }
  );

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`更新记录失败: ${data.msg}`);
  }

  return data.data;
}

/**
 * 删除记录
 */
export async function deleteRecord(
  appToken: string,
  tableId: string,
  recordId: string
) {
  const token = await getTenantAccessToken();

  const response = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`删除记录失败: ${data.msg}`);
  }

  return data;
}

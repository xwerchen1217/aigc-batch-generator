import { NextRequest, NextResponse } from 'next/server';

const FEISHU_API = 'https://open.feishu.cn/open-apis';

// Get tenant access token
async function getTenantToken(): Promise<string> {
  const response = await fetch(`${FEISHU_API}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: 'cli_a87ad870fe31500c',
      app_secret: 'cHXV0iYTQBI8Jo8rZrsU6d4PiEswRRY1',
    }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取飞书 token 失败: ${data.msg}`);
  }

  return data.tenant_access_token;
}

// Get table fields to validate field names
async function getTableFields(appToken: string, tableId: string, token: string): Promise<string[]> {
  const response = await fetch(
    `${FEISHU_API}/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取表格字段失败: ${data.msg}`);
  }

  return data.data.items.map((f: { field_name: string }) => f.field_name);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const appToken = searchParams.get('appToken');
    const tableId = searchParams.get('tableId');
    const filter = searchParams.get('filter');

    if (!appToken || !tableId) {
      return NextResponse.json({ error: 'Missing appToken or tableId' }, { status: 400 });
    }

    const token = await getTenantToken();

    // 构建查询 URL
    let url = `${FEISHU_API}/bitable/v1/apps/${appToken}/tables/${tableId}/records`;
    if (filter) {
      url += `?${filter}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.code !== 0) {
      return NextResponse.json({ error: data.msg }, { status: 400 });
    }

    return NextResponse.json({ items: data.data.items });
  } catch (error) {
    console.error('Feishu query error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to query records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appToken, tableId, records } = body;

    if (!appToken || !tableId || !records) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const token = await getTenantToken();

    // 获取表格字段
    const fieldNames = await getTableFields(appToken, tableId, token);

    // 构建记录数据（只包含存在的字段）
    const recordsData = records.map((record: Record<string, unknown>) => {
      const fields_data = Object.entries(record)
        .filter(([key]) => fieldNames.includes(key))
        .map(([key, value]) => ({
          field_name: key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
        }));

      return { fields: fields_data };
    });

    const response = await fetch(
      `${FEISHU_API}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: recordsData }),
      }
    );

    const data = await response.json();

    if (data.code !== 0) {
      return NextResponse.json({ error: data.msg }, { status: 400 });
    }

    return NextResponse.json({ data: data.data });
  } catch (error) {
    console.error('Feishu create error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create records' }, { status: 500 });
  }
}

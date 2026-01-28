import { NextRequest, NextResponse } from 'next/server';

const FEISHU_CONFIG = {
  appId: 'cli_a87ad870fe31500c',
  appSecret: 'cHXV0iYTQBI8Jo8rZrsU6d4PiEswRRY1',
  apiBaseUrl: 'https://open.feishu.cn/open-apis',
};

export async function POST() {
  try {
    const response = await fetch(
      `${FEISHU_CONFIG.apiBaseUrl}/auth/v3/tenant_access_token/internal`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: FEISHU_CONFIG.appId,
          app_secret: FEISHU_CONFIG.appSecret,
        }),
      }
    );

    const data = await response.json();

    if (data.code !== 0) {
      return NextResponse.json({ error: data.msg }, { status: 400 });
    }

    return NextResponse.json({ tenant_access_token: data.tenant_access_token, expire: data.expire });
  } catch (error) {
    console.error('Feishu token error:', error);
    return NextResponse.json({ error: 'Failed to get token' }, { status: 500 });
  }
}

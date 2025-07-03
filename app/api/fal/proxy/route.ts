import { NextRequest, NextResponse } from 'next/server';

const TARGET_URL_HEADER = "x-fal-target-url";
const FAL_URL_REG_EXP = /(\.|^)fal\.(run|ai)$/;

function getFalKey(): string | undefined {
  return process.env.FAL_KEY;
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const targetUrl = request.headers.get(TARGET_URL_HEADER);
  
  if (!targetUrl) {
    return NextResponse.json(
      { error: `Missing the ${TARGET_URL_HEADER} header` },
      { status: 400 }
    );
  }

  try {
    const urlHost = new URL(targetUrl).host;
    if (!FAL_URL_REG_EXP.test(urlHost)) {
      return NextResponse.json(
        { error: `Invalid ${TARGET_URL_HEADER} header` },
        { status: 412 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: `Invalid ${TARGET_URL_HEADER} header` },
      { status: 412 }
    );
  }

  const falKey = getFalKey();
  if (!falKey) {
    return NextResponse.json(
      { error: "Missing fal.ai credentials" },
      { status: 401 }
    );
  }

  // Check content type for POST requests
  if (request.method === 'POST') {
    const contentType = request.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: "Unsupported Media Type" },
        { status: 415 }
      );
    }
  }

  try {
    // Prepare headers for the proxy request
    const proxyHeaders: Record<string, string> = {
      'authorization': `Key ${falKey}`,
      'accept': 'application/json',
      'content-type': 'application/json',
      'user-agent': request.headers.get('user-agent') || 'fal-proxy',
      'x-fal-client-proxy': '@fal-ai/server-proxy/nextjs',
    };

    // Pass through x-fal-* headers
    request.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('x-fal-')) {
        proxyHeaders[key.toLowerCase()] = value;
      }
    });

    // Get request body for POST requests
    let body: string | undefined;
    if (request.method === 'POST') {
      body = await request.text();
    }

    // Make the proxy request
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: proxyHeaders,
      body: body,
    });

    // Get response data
    const responseData = await response.text();

    // Create the response with the same status code
    const nextResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copy headers from the target response, excluding content-length and content-encoding
    response.headers.forEach((value, key) => {
      if (!['content-length', 'content-encoding'].includes(key.toLowerCase())) {
        nextResponse.headers.set(key, value);
      }
    });

    return nextResponse;

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
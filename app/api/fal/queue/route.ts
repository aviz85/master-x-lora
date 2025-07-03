import { NextRequest, NextResponse } from 'next/server';

const FAL_QUEUE_BASE_URL = 'https://queue.fal.run';

function getFalKey(): string | undefined {
  return process.env.FAL_KEY;
}

export async function POST(request: NextRequest) {
  return handleQueueRequest(request, 'POST');
}

export async function GET(request: NextRequest) {
  return handleQueueRequest(request, 'GET');
}

export async function PUT(request: NextRequest) {
  return handleQueueRequest(request, 'PUT');
}

async function handleQueueRequest(request: NextRequest, method: string) {
  const falKey = getFalKey();
  if (!falKey) {
    return NextResponse.json(
      { error: "Missing fal.ai credentials" },
      { status: 401 }
    );
  }

  // Get the path from the request
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  
  // Remove 'api/fal/queue' from the path
  const queuePath = pathSegments.slice(3).join('/');
  
  if (!queuePath) {
    return NextResponse.json(
      { error: "Missing queue path" },
      { status: 400 }
    );
  }

  // Construct the target URL
  const targetUrl = `${FAL_QUEUE_BASE_URL}/${queuePath}${url.search}`;

  try {
    // Prepare headers for the proxy request
    const proxyHeaders: Record<string, string> = {
      'authorization': `Key ${falKey}`,
      'accept': 'application/json',
      'user-agent': request.headers.get('user-agent') || 'fal-queue-proxy',
    };

    // Add content-type for POST requests
    if (method === 'POST') {
      proxyHeaders['content-type'] = 'application/json';
    }

    // Pass through x-fal-* headers
    request.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('x-fal-')) {
        proxyHeaders[key.toLowerCase()] = value;
      }
    });

    // Get request body for POST/PUT requests
    let body: string | undefined;
    if (method === 'POST' || method === 'PUT') {
      body = await request.text();
    }

    // Make the proxy request
    const response = await fetch(targetUrl, {
      method: method,
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
    console.error('Queue proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
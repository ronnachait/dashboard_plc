type PlcEvent = {
  type: "PLC_STATUS";
  payload: {
    isRunning: boolean;
    alarm: boolean;
    reason?: string | null;
  };
  time: string;
};

let clientId = 0;
const clients: {
  id: number;
  controller: ReadableStreamDefaultController<Uint8Array>;
}[] = [];
const encoder = new TextEncoder();

export async function GET() {
  const id = clientId++;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      clients.push({ id, controller });
      console.log(`👥 Client ${id} connected. Total: ${clients.length}`);
    },
    cancel() {
      removeClient(id);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function removeClient(id: number) {
  const idx = clients.findIndex((c) => c.id === id);
  if (idx >= 0) {
    clients.splice(idx, 1);
    console.log(`👋 Client ${id} disconnected. Total: ${clients.length}`);
  }
}

export function broadcast(data: PlcEvent) {
  const msg = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

  clients.forEach((c) => {
    try {
      c.controller.enqueue(msg);
    } catch {
      console.error(`❌ Client ${c.id} closed. Removing...`);
      removeClient(c.id);
    }
  });
}

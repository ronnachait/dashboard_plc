import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const res = await fetch("http://localhost:4000/plc/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err instanceof Error)
      return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}

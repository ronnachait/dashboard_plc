import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/users?query=&page=1&pageSize=10
export async function GET(req: Request) {
  const session: Session | null = await getServerSession(authOptions);
  const role = session?.user?.role as string | undefined;
  if (!session || (role !== "admin" && role !== "dev")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("query") || "").trim();
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { role: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

// POST /api/users
export async function POST(req: Request) {
  const session: Session | null = await getServerSession(authOptions);
  const actorRole = session?.user?.role as string | undefined;
  if (!session || (actorRole !== "admin" && actorRole !== "dev")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, role } = body as {
    name?: string;
    email: string;
    password: string;
    role: string;
  };

  if (!email || !password || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Only dev can create admin/dev users
  if (actorRole !== "dev" && (role === "admin" || role === "dev")) {
    return NextResponse.json({ error: "Insufficient permission to assign role" }, { status: 403 });
  }

  const hashed = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string } | null;
    if (err && err.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

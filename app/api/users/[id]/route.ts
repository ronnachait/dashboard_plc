import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session: Session | null = await getServerSession(authOptions);
  const role = session?.user?.role as string | undefined;
  if (!session || (role !== "admin" && role !== "dev")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session: Session | null = await getServerSession(authOptions);
  const actorRole = session?.user?.role as string | undefined;
  if (!session || (actorRole !== "admin" && actorRole !== "dev")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Admin cannot modify Dev accounts
  if (actorRole === "admin" && target.role === "dev") {
    return NextResponse.json({ error: "Insufficient permission" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, role } = body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  // Admin cannot assign admin/dev
  if (actorRole !== "dev" && (role === "admin" || role === "dev")) {
    return NextResponse.json({ error: "Insufficient permission to assign role" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (role !== undefined) data.role = role;
  if (password) data.password = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(user);
  } catch (e: unknown) {
    const err = e as { code?: string } | null;
    if (err && err.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session: Session | null = await getServerSession(authOptions);
  const actorRole = session?.user?.role as string | undefined;
  if (!session || (actorRole !== "admin" && actorRole !== "dev")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (actorRole === "admin" && target.role === "dev") {
    return NextResponse.json({ error: "Insufficient permission" }, { status: 403 });
  }

  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}

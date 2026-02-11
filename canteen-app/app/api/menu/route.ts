import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1. GET: Fetch items (Replaces your "SELECT * FROM menu_items")
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');

  const items = await prisma.menuItem.findMany({
    where: level ? { canteenLevel: level } : {},
    orderBy: [
      { canteenLevel: 'asc' },
      { category: 'asc' },
      { name: 'asc' },
    ],
  });

  return NextResponse.json(items);
}

// 2. POST: Add new item (Replaces "INSERT INTO menu_items")
export async function POST(request: Request) {
  const body = await request.json();
  const newItem = await prisma.menuItem.create({
    data: {
      name: body.name,
      price: parseFloat(body.price),
      category: body.category,
      canteenLevel: body.canteenLevel,
    },
  });
  return NextResponse.json(newItem);
}

// 3. PUT: Update item (Replaces "UPDATE menu_items")
export async function PUT(request: Request) {
  const body = await request.json();
  const updatedItem = await prisma.menuItem.update({
    where: { id: body.id },
    data: {
      name: body.name,
      price: parseFloat(body.price),
      category: body.category,
      canteenLevel: body.canteenLevel,
    },
  });
  return NextResponse.json(updatedItem);
}

// 4. DELETE: Remove item (Replaces "DELETE FROM menu_items")
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.menuItem.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ message: "Deleted successfully" });
}
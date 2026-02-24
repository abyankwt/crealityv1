import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const allowedExtensions = new Set([".stl", ".obj", ".step", ".zip"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const fullName = formData.get("fullName")?.toString().trim();
    const company = formData.get("company")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();
    const material = formData.get("material")?.toString().trim();
    const technology = formData.get("technology")?.toString().trim();
    const quantity = formData.get("quantity")?.toString().trim();
    const deadline = formData.get("deadline")?.toString().trim();
    const description = formData.get("description")?.toString().trim();
    const file = formData.get("file");

    if (
      !fullName ||
      !email ||
      !phone ||
      !material ||
      !technology ||
      !quantity ||
      !deadline ||
      !description
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "A valid file is required." },
        { status: 400 }
      );
    }

    const extension = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      return NextResponse.json(
        { error: "Unsupported file type." },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeName}`;
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      ok: true,
      file: `/uploads/${fileName}`,
      data: {
        fullName,
        company,
        email,
        phone,
        material,
        technology,
        quantity,
        deadline,
        description,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

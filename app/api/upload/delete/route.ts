import { NextResponse } from "next/server";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const account = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const containerName = "grease-pictures";
if (!account || !accountKey) {
  throw new Error(
    "❌ Missing AZURE_STORAGE_ACCOUNT_NAME or AZURE_STORAGE_ACCOUNT_KEY"
  );
}

const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${account}.blob.core.windows.net`,
  sharedKeyCredential
);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.blobName) {
      return NextResponse.json(
        { error: "❌ Missing blobName" },
        { status: 400 }
      );
    }

    const { blobName } = body;
    console.log("🗑 Deleting blob:", blobName);

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    await blobClient.deleteIfExists();

    return NextResponse.json({ ok: true, deleted: blobName });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Delete error:", err);
      return NextResponse.json(
        { error: err.message || "Internal server error" },
        { status: 500 }
      );
    }
  }
}

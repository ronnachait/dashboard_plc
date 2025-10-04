import { NextResponse } from "next/server";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const account = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const containerName = "grease-pictures";

const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${account}.blob.core.windows.net`,
  sharedKeyCredential
);

export async function POST(req: Request) {
  const { blobUrl } = await req.json();

  if (!blobUrl) {
    return NextResponse.json({ error: "Missing blobUrl" }, { status: 400 });
  }

  try {
    // 🔎 ดึง blobName จาก public URL
    const url = new URL(blobUrl);
    const blobName = url.pathname.replace(`/${containerName}/`, "");

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.deleteIfExists();

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Delete error:", err.message);
      return NextResponse.json(
        { error: "Failed to delete blob" },
        { status: 500 }
      );
    }
  }
}

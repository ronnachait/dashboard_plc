import { NextResponse } from "next/server";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const containerName = "grease-pictures";

function getBlobServiceClient(): BlobServiceClient | null {
  const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

  if (!account || !accountKey) {
    console.error("❌ Missing Azure Storage configuration.");
    return null;
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(
    account,
    accountKey
  );
  return new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    sharedKeyCredential
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.blobName) {
      return NextResponse.json(
        { error: "blobName is required" },
        { status: 400 }
      );
    }

    const blobServiceClient = getBlobServiceClient();
    if (!blobServiceClient) {
      return NextResponse.json(
        { error: "Storage configuration missing" },
        { status: 500 }
      );
    }

    const { blobName } = body;
    console.log("🗑 Request to delete blob:", blobName);

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    const deleted = await blobClient.deleteIfExists();

    return NextResponse.json({
      ok: true,
      deleted: blobName,
      exists: deleted.succeeded,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Delete error:", err.message);
      return NextResponse.json(
        { error: "Delete service failed" },
        { status: 500 }
      );
    }
    console.error("❌ Unknown delete route error");
    return NextResponse.json(
      { error: "Unknown server error" },
      { status: 500 }
    );
  }
}

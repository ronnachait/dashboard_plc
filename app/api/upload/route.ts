import { NextResponse } from "next/server";
import {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.fileName || !body.fileType) {
      return NextResponse.json(
        { error: "❌ Missing fileName or fileType" },
        { status: 400 }
      );
    }

    const { fileName, fileType } = body;

    // ✅ ตั้งชื่อไฟล์ไม่ซ้ำ
    const blobName = `${Date.now()}-${fileName}`;

    // ✅ ใช้ BlobSASPermissions ไม่ใช่ ContainerSASPermissions
    const permissions = BlobSASPermissions.parse("cw"); // create + write

    const sasOptions = {
      containerName,
      blobName,
      permissions,
      contentType: fileType,
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 ชม.
    };

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      sharedKeyCredential
    ).toString();

    const uploadUrl = `https://${account}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
    const publicUrl = `https://${account}.blob.core.windows.net/${containerName}/${blobName}`;

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Upload route error:", err);
      return NextResponse.json(
        { error: err.message || "Internal server error" },
        { status: 500 }
      );
    }
  }
}

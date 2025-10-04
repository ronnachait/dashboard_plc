import { NextResponse } from "next/server";
import {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";

const account = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const containerName = "grease-pictures";

const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);

export async function POST(req: Request) {
  const { fileName, fileType } = await req.json();

  // ✅ ตั้งชื่อไฟล์ไม่ซ้ำ
  const blobName = `${Date.now()}-${fileName}`;

  // ✅ ใช้ BlobSASPermissions ไม่ใช่ ContainerSASPermissions
  const permissions = BlobSASPermissions.parse("cw"); // create + write

  const sasOptions = {
    containerName,
    blobName,
    permissions,
    contentType: fileType, // optional: ช่วย enforce mime-type
    startsOn: new Date(),
    expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // หมดอายุใน 1 ชม.
  };

  const sasToken = generateBlobSASQueryParameters(
    sasOptions,
    sharedKeyCredential
  ).toString();

  const uploadUrl = `https://${account}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
  const publicUrl = `https://${account}.blob.core.windows.net/${containerName}/${blobName}`;

  return NextResponse.json({ uploadUrl, publicUrl });
}

import { NextResponse } from "next/server";
import {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";

const containerName = "grease-pictures";

export async function POST(req: Request) {
  try {
    const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (!account || !accountKey) {
      return NextResponse.json(
        { error: "Storage account config missing" },
        { status: 500 }
      );
    }

    const { fileName, fileType } = await req.json();
    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "fileName and fileType are required" },
        { status: 400 }
      );
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(
      account,
      accountKey
    );

    const blobName = `${Date.now()}-${fileName}`;
    const permissions = BlobSASPermissions.parse("cw");

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions,
        contentType: fileType,
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000),
      },
      sharedKeyCredential
    ).toString();

    const uploadUrl = `https://${account}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
    const publicUrl = `https://${account}.blob.core.windows.net/${containerName}/${blobName}`;

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Upload route error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    console.error("❌ Unknown upload route error:", err);
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

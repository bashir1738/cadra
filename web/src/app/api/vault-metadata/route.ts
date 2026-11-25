import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const FILEBASE_ENDPOINT = "https://s3.filebase.com";
const FILEBASE_REGION = "us-east-1";
const BUCKET = process.env.FILEBASE_BUCKET_NAME ?? "";
const ACCESS_KEY = process.env.FILEBASE_ACCESS_KEY ?? "";
const SECRET_KEY = process.env.FILEBASE_SECRET_KEY ?? "";

function makeS3Client() {
  return new S3Client({
    endpoint: FILEBASE_ENDPOINT,
    region: FILEBASE_REGION,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    forcePathStyle: false,
  });
}

// POST /api/vault-metadata
// Body: { vaultId, tag, description, curatorAddress }
// Returns: { cid, key }
export async function POST(req: NextRequest) {
  if (!BUCKET || !ACCESS_KEY || !SECRET_KEY) {
    return NextResponse.json({ error: "Filebase not configured" }, { status: 503 });
  }

  let body: { vaultId?: number; tag?: string; description?: string; curatorAddress?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { vaultId, tag, description, curatorAddress } = body;
  if (!vaultId || !tag || !description) {
    return NextResponse.json({ error: "Missing required fields: vaultId, tag, description" }, { status: 400 });
  }

  const payload = JSON.stringify({
    vaultId,
    tag: tag.trim(),
    description: description.trim(),
    curatorAddress: curatorAddress ?? "",
    uploadedAt: new Date().toISOString(),
  });

  const key = `vault-${vaultId}-${Date.now()}.json`;
  const s3 = makeS3Client();

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: payload,
        ContentType: "application/json",
        Metadata: { vaultid: String(vaultId) },
      })
    );

    // Filebase returns the IPFS CID in x-amz-meta-cid on HeadObject after upload
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    const cid = head.Metadata?.["cid"] ?? "";

    return NextResponse.json({ cid, key });
  } catch (err: any) {
    console.error("Filebase upload error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Upload failed" }, { status: 500 });
  }
}

// GET /api/vault-metadata?cid=<cid>
// Proxies fetch from IPFS gateway (avoids CORS from client)
export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid");
  if (!cid) {
    return NextResponse.json({ error: "Missing cid param" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://ipfs.filebase.io/ipfs/${cid}`, {
      next: { revalidate: 86400 }, // cache for 24h — IPFS content is immutable
    });
    if (!res.ok) {
      return NextResponse.json({ error: "IPFS fetch failed" }, { status: 404 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Fetch failed" }, { status: 500 });
  }
}

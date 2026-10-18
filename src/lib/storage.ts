import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

export async function storeExport(key: string, body: Buffer, contentType: string) {
  const localPath = path.join(process.cwd(), "data", "exports", key)
  await mkdir(path.dirname(localPath), { recursive: true })
  await writeFile(localPath, body)

  const bucket = process.env.S3_BUCKET
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
  if (!bucket || !accessKeyId || !secretAccessKey) {
    return { location: localPath, stored: "local" as const }
  }

  const client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: { accessKeyId, secretAccessKey },
  })
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
  const base = process.env.S3_PUBLIC_URL?.replace(/\/$/, "")
  return {
    location: base ? `${base}/${key}` : `s3://${bucket}/${key}`,
    stored: "s3" as const,
  }
}

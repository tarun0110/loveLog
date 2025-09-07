import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import short from "short-uuid";
import sharp from "sharp";

if (!process.env.S3_BUCKET_NAME) {
  throw new Error("Environment variable S3_BUCKET_NAME not provided");
}
if (!process.env.AWS_REGION) {
  throw new Error("Environment variable AWS_REGION not provided");
}
if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error("Environment variable AWS_ACCESS_KEY_ID not provided");
}
if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error("Environment variable AWS_SECRET_ACCESS_KEY not provided");
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

export async function uploadToS3(files: Express.Multer.File[]): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    const uuid = short.generate();
    const originalNameWithoutExt = file.originalname.split('.').slice(0, -1).join('.');
    const key = `uploads/${uuid}-${originalNameWithoutExt}.webp`;

    // Compress image with sharp
    const compressedImageBuffer = await sharp(file.buffer)
      .webp({ quality: 80 }) // Convert to webp with 80% quality
      .toBuffer();

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: compressedImageBuffer,
      ContentType: "image/webp",
    });

    await s3Client.send(command);
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return url;
  });

  try {
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload one or more files to S3");
  }
}

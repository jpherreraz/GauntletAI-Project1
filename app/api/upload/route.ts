import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";

const REGION = "us-east-2";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

// Configure S3 client with minimal settings
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  },
  useAccelerateEndpoint: false,
  forcePathStyle: false,
  followRegionRedirects: true
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Create the uploads folder path
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const fileName = `uploads/${userId}/${uniqueFileName}`;

    // Log the attempt
    console.log('Attempting S3 upload:', {
      bucket: BUCKET_NAME,
      region: REGION,
      key: fileName,
      config: {
        forcePathStyle: s3Client.config.forcePathStyle,
        followRegionRedirects: s3Client.config.followRegionRedirects,
        useAccelerateEndpoint: s3Client.config.useAccelerateEndpoint
      }
    });

    // Create the command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
      ACL: 'public-read'
    });

    try {
      // Send the command
      const result = await s3Client.send(command);
      console.log('Upload successful:', result);

      // Use virtual-hosted-style URL
      const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileName}`;

      return NextResponse.json({
        url,
        fileType: file.type,
        fileName: file.name
      });
    } catch (uploadError: any) {
      // Log the error details
      console.error('S3 upload error:', {
        message: uploadError.message,
        code: uploadError.Code,
        endpoint: uploadError.Endpoint,
        bucket: uploadError.Bucket,
        region: REGION,
        requestId: uploadError.$metadata?.requestId,
        $metadata: uploadError.$metadata,
        stack: uploadError.stack
      });
      
      return NextResponse.json({ 
        error: 'Failed to upload to S3', 
        details: uploadError.message,
        code: uploadError.Code
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in file upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 
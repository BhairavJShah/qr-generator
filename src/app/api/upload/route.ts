import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

// GitHub repository details
const OWNER = "BhairavJShah";
const REPO = "qr-generator";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert the file to a buffer, then to a Base64 string for the GitHub API
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Content = buffer.toString("base64");

    // Generate a unique filename to prevent overwriting
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `uploads/${timestamp}-${cleanFileName}`;

    // Initialize Octokit with the GitHub Personal Access Token from Env Vars
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Commit the file to the repository
    const response = await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: path,
      message: `Upload file: ${file.name} via Dynamic QR Generator`,
      content: base64Content,
    });

    // Construct the raw URL where the file can be accessed directly
    // Format: https://raw.githubusercontent.com/OWNER/REPO/main/path
    const fileUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${path}`;

    return NextResponse.json({ url: fileUrl, path: path });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file to GitHub" },
      { status: 500 }
    );
  }
}

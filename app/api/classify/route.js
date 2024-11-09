import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import os from "os";
import fs from "fs";
import { Readable } from "stream";
import { FormData } from "formdata-node";
import { fileFromPath } from "formdata-node/file-from-path";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    try {
      // Convert the file to a buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create a temporary file
      const tempDir = os.tmpdir();
      const tempFilePath = join(tempDir, `upload-${Date.now()}-${file.name}`);
      await writeFile(tempFilePath, buffer);

      // Create form data using formdata-node
      const flaskFormData = new FormData();
      const fileFromDisk = await fileFromPath(tempFilePath);
      flaskFormData.append("file", fileFromDisk);

      // Use native fetch
      const flaskResponse = await fetch("http://localhost:5000/classify", {
        method: "POST",
        body: flaskFormData,
      });

      // Read the response
      const flaskDataText = await flaskResponse.text();
      let flaskData;

      try {
        flaskData = JSON.parse(flaskDataText);
      } catch (parseError) {
        console.error("Failed to parse Flask response:", flaskDataText);
        throw new Error("Invalid response from classification service");
      }

      // Clean up the temporary file
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error("Error deleting temporary file:", err);
      });

      if (!flaskResponse.ok) {
        throw new Error(flaskData.error || "Flask API error");
      }

      return NextResponse.json(flaskData);
    } catch (error) {
      console.error("Processing error:", error);
      return NextResponse.json(
        { error: error.message || "Error processing image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Request error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

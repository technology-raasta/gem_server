const express = require("express");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const { writeFileSync, unlinkSync } = require("fs");
const { tmpdir } = require("os");
const { join } = require("path");

const app = express();
const API_KEY = "AIzaSyA5mNf4-R9QtlGvJq4NQT0nBuIFDPH_pUk";
const fileManager = new GoogleAIFileManager(API_KEY);

app.use(express.json({ limit: "100mb" }));


app.post("/upload", async (req, res) => {
  const { imageBase64, mimeType, name } = req.body;
  
  if (!imageBase64 || !mimeType || !name) {
    return res.status(400).json({ status: "Error", message: "Invalid body" });
  }

  // Create a buffer from the base64 string
  const buffer = Buffer.from(imageBase64, "base64");

  // Define a temporary file path
  const tempFilePath = join(tmpdir(), `${name}.png`);

  try {
    // Write the buffer to a temporary file
    writeFileSync(tempFilePath, buffer);

    // Upload the file using its path
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType,
      displayName: name,
    });

    // Remove the temporary file after uploading
    unlinkSync(tempFilePath);

    // Send response with uploaded file details
    const file = uploadResult.file;
    const data = { status: "Ok", ...file };

    fileManager.deleteFile(uploadResult.file.name);
    console.log(`File uploaded: ${JSON.stringify(data)}`);
    return res.json(data);

  } catch (error) {
    // Handle any errors and cleanup
    try {
      unlinkSync(tempFilePath);
    } catch (unlinkError) {
      console.error(`Error removing temp file: ${unlinkError.message}`);
    }
    console.error(`Upload error: ${error.stack || error.message}`);
    return res.status(500).json({
      status: "Error",
      message: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "Ok" });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

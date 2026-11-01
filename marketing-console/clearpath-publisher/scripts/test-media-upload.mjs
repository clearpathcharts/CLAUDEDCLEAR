/**
 * Self-test: ClearPath media store save + resolve (no network).
 * Run: node scripts/test-media-upload.mjs
 */
import assert from "assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getMedia, resolveMediaForJob, saveUpload, mediaLimits } from "../lib/mediaStore.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fakeMp4 = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
  ...Buffer.from("clearpath-test-media"),
]);

const record = await saveUpload({
  buffer: fakeMp4,
  originalName: "lesson-support.mp4",
  mimeType: "video/mp4",
  uploadedBy: "test",
});

assert.ok(record.id.startsWith("media_"));
assert.equal(record.originalName, "lesson-support.mp4");
assert.equal(record.mimeType, "video/mp4");

const loaded = getMedia(record.id);
assert.ok(loaded);
assert.ok(loaded.filePath && fs.existsSync(loaded.filePath));

const resolved = resolveMediaForJob({ mediaId: record.id, title: "t" });
assert.equal(resolved.mediaId, record.id);
assert.ok(resolved.videoFilePath);
assert.ok(resolved.fileName.includes("lesson"));

const limits = mediaLimits();
assert.ok(limits.maxBytes > 0);

// cleanup test file
try {
  fs.unlinkSync(loaded.filePath);
} catch {
  /* ignore */
}

console.log("test-media-upload: OK", {
  mediaId: record.id,
  maxMb: limits.maxMb,
});

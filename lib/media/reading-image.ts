import fs from "fs";
import path from "path";

export type ReadingImageModule = "face" | "palm";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export interface SavedReadingImage {
  id: string;
  userId: string;
  module: ReadingImageModule;
  mimeType: string;
  filePath: string;
  createdAt: string;
}

function uploadsRoot() {
  return path.resolve(process.cwd(), "data/uploads");
}

function metaPath(userId: string, imageId: string) {
  return path.join(uploadsRoot(), userId, `${imageId}.json`);
}

function imagePath(userId: string, imageId: string, ext: string) {
  return path.join(uploadsRoot(), userId, `${imageId}.${ext}`);
}

function extForMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function validateImageFile(file: File, module: ReadingImageModule) {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("仅支持 JPG、PNG、WebP 格式图片");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("图片大小不能超过 5MB");
  }
  if (file.size < 1024) {
    throw new Error("图片文件过小，请上传清晰照片");
  }
  if (module !== "face" && module !== "palm") {
    throw new Error("未知模块类型");
  }
}

export async function saveReadingImage(
  userId: string,
  module: ReadingImageModule,
  file: File
): Promise<SavedReadingImage> {
  validateImageFile(file, module);
  const id = crypto.randomUUID();
  const mimeType = file.type;
  const ext = extForMime(mimeType);
  const dir = path.join(uploadsRoot(), userId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = imagePath(userId, id, ext);
  fs.writeFileSync(filePath, buffer);

  const meta: SavedReadingImage = {
    id,
    userId,
    module,
    mimeType,
    filePath,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(metaPath(userId, id), JSON.stringify(meta));
  return meta;
}

export function getReadingImage(userId: string, imageId: string): SavedReadingImage | null {
  const metaFile = metaPath(userId, imageId);
  if (!fs.existsSync(metaFile)) return null;
  const meta = JSON.parse(fs.readFileSync(metaFile, "utf-8")) as SavedReadingImage;
  if (meta.userId !== userId) return null;
  if (!fs.existsSync(meta.filePath)) return null;
  return meta;
}

export function readImageAsDataUrl(meta: SavedReadingImage): string {
  const buffer = fs.readFileSync(meta.filePath);
  return `data:${meta.mimeType};base64,${buffer.toString("base64")}`;
}

export function readImageBuffer(meta: SavedReadingImage) {
  return fs.readFileSync(meta.filePath);
}

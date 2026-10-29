import fsp from "fs/promises";
import fs from "fs";
import path from "path";

export type ReadingImageModule = "face" | "palm";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
/** imageId 由服务端 crypto.randomUUID() 生成，读取时做白名单校验防路径穿越 */
const IMAGE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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

/** 服务端嗅探文件头，不信任客户端声明的 Content-Type */
export function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
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
  const dir = path.join(uploadsRoot(), userId);
  await fsp.mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  // 实际内容必须是真实图片，以嗅探结果为准
  const sniffed = sniffImageMime(buffer);
  if (!sniffed || !ALLOWED_MIME.has(sniffed)) {
    throw new Error("文件内容不是有效的 JPG、PNG 或 WebP 图片");
  }
  const ext = extForMime(sniffed);
  const filePath = imagePath(userId, id, ext);
  await fsp.writeFile(filePath, buffer);

  const meta: SavedReadingImage = {
    id,
    userId,
    module,
    mimeType: sniffed,
    filePath,
    createdAt: new Date().toISOString(),
  };
  await fsp.writeFile(metaPath(userId, id), JSON.stringify(meta));
  return meta;
}

export async function getReadingImage(userId: string, imageId: string): Promise<SavedReadingImage | null> {
  if (!IMAGE_ID_RE.test(imageId)) return null;
  const metaFile = metaPath(userId, imageId);
  let raw: string;
  try {
    raw = await fsp.readFile(metaFile, "utf-8");
  } catch {
    return null;
  }
  let meta: SavedReadingImage;
  try {
    meta = JSON.parse(raw) as SavedReadingImage;
  } catch {
    return null;
  }
  if (meta.userId !== userId) return null;
  try {
    await fsp.access(meta.filePath);
  } catch {
    return null;
  }
  return meta;
}

export async function readImageAsDataUrl(meta: SavedReadingImage): Promise<string> {
  const buffer = await fsp.readFile(meta.filePath);
  return `data:${meta.mimeType};base64,${buffer.toString("base64")}`;
}

export async function readImageBuffer(meta: SavedReadingImage) {
  return fsp.readFile(meta.filePath);
}

// 保留同步存在性检查工具（仅目录预建等低频场景使用）
export function ensureUploadDir(userId: string) {
  const dir = path.join(uploadsRoot(), userId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

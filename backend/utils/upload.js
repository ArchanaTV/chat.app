import multer from "multer";
import path from "path";
import fs from "fs";

const makeStorage = (subfolder) => {
  const dir = path.join(process.cwd(), "uploads", subfolder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
};

export const uploadAvatar = multer({
  storage: makeStorage("avatars"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// General media/document upload for chat messages (images, video, audio, voice notes, docs)
export const uploadMedia = multer({
  storage: makeStorage("media"),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

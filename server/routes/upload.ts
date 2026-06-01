import { Router } from 'express';
import { upload } from '../middleware/upload';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, upload.single('file'), (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const isImage = req.file.mimetype.startsWith('image/');

    res.json({
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      type: isImage ? 'image' : 'file',
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

export default router;

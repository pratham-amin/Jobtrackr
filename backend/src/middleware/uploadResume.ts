
import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (
  _req,
  file,
  callback
) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const allowedExtensions = /\.(pdf|docx)$/i;

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.test(file.originalname)
  ) {
    callback(null, true);
  } else {
    callback(
      new Error('Only PDF and DOCX resume files are allowed.')
    );
  }
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

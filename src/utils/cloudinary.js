import cloudinary from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// Configure Cloudinary with environment variables
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for memory storage (no files saved to disk)
const storage = multer.memoryStorage();

// Create upload middleware instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept common image and video formats
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${file.mimetype}. Supported types: JPEG, PNG, GIF, WebP, MP4, WebM, MOV`
        )
      );
    }
  },
});

/**
 * Upload file to Cloudinary using upload_stream
 * @param {Buffer} fileBuffer - File buffer from req.file.buffer
 * @param {string} fileName - Optional file name (without extension)
 * @param {string} resourceType - 'image' or 'video' (auto-detected if not provided)
 * @returns {Promise} Cloudinary upload response
 */
export const uploadToCloudinary = (fileBuffer, fileName = 'upload', resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    // Create a readable stream from the buffer
    const stream = Readable.from(fileBuffer);

    // Create upload stream to Cloudinary
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: 'connecthub', // Store uploads in 'connecthub' folder
        public_id: fileName,
        resource_type: resourceType,
        quality: 'auto', // Auto-optimize quality
        fetch_format: 'auto', // Auto-format based on browser
        flags: ['progressive'], // Progressive encoding for images
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          resolve(result);
        }
      }
    );

    // Pipe the buffer to the upload stream
    stream.pipe(uploadStream);

    // Handle stream errors
    stream.on('error', (error) => {
      reject(new Error(`Stream error: ${error.message}`));
    });

    uploadStream.on('error', (error) => {
      reject(new Error(`Upload stream error: ${error.message}`));
    });
  });
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @returns {Promise} Cloudinary deletion response
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.v2.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
  }
};

/**
 * Get Cloudinary resource URL
 * @param {string} publicId - Public ID of the resource
 * @param {object} options - Transformation options
 * @returns {string} Cloudinary URL
 */
export const getCloudinaryUrl = (publicId, options = {}) => {
  return cloudinary.v2.url(publicId, {
    secure: true,
    ...options,
  });
};

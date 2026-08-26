# OptiImage Server

A powerful image compression and optimization API server built with Express.js and Sharp. This server allows you to upload multiple images, compress them with various quality settings and format options, and download them as a ZIP archive.

## 🌟 Live Demo

**Production URL**: https://optiimage-server-ev2l.onrender.com

Try the live API: https://optiimage-server-ev2l.onrender.com/api/images/compress

## 🌟 Features

- **Multi-format Support**: Compress JPEG, PNG, WebP, and HEIC images
- **Batch Processing**: Upload and process up to 10 images simultaneously
- **Smart Compression**: Advanced binary search algorithm to hit target file sizes
- **Format Conversion**: Convert images between JPEG, PNG, and WebP formats
- **Resize Capability**: Optional width-based resizing while maintaining aspect ratio
- **Automatic Cleanup**: Scheduled cleanup of temporary files to save disk space
- **Memory Efficient**: Batch processing with concurrency limits for stable performance
- **CORS Enabled**: Ready for cross-origin requests from web applications

## 📦 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 5.2.1
- **Image Processing**: Sharp 0.34.5 (supports Linux/macOS/Windows, ARM/x64 architectures)
- **File Upload**: Multer 2.1.1
- **Archive Generation**: Archiver 7.0.1
- **CORS**: Cors 2.8.6
- **Development**: Nodemon 3.1.14

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn package manager

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd optiimage-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This will install all required packages including Express, Sharp, Multer, and Archiver.

3. **Start the server**
   
   For production:
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000` by default.

### 🌐 Accessing the Hosted Version

The application is deployed on Render and accessible at:
- **Base URL**: https://optiimage-server-ev2l.onrender.com
- **API Endpoint**: https://optiimage-server-ev2l.onrender.com/api/images/compress
- **Health Check**: https://optiimage-server-ev2l.onrender.com/

*Note: On Render's free tier, the server may spin down after inactivity. First request might take 30-50 seconds to wake up.*

## 📡 API Endpoints

### Base URLs

**Local Development**:
```
http://localhost:3000/api/images
```

**Production **(Render)
```
https://optiimage-server-ev2l.onrender.com/api/images
```

### POST /compress

Upload and compress one or more images.

**Request Type**: `multipart/form-data`

**Parameters**:
- `images` (files): One or more image files (JPEG, PNG, WebP, or HEIC), max 10 files, max 10MB each
- `quality` (number, optional): Quality level from 1-100 (default: 70)
- `width` (number, optional): Target width in pixels (height scales proportionally)
- `format` (string, optional): Output format - "jpeg", "png", or "webp" (default: original format detected from uploaded file)
- `targetSize` (number, optional): Target file size in KB (uses smart binary search to achieve)

**Example Request** (using cURL):
```bash
curl -X POST http://localhost:3000/api/images/compress \
  -F "images=@image1.jpg" \
  -F "images=@image2.png" \
  -F "quality=80" \
  -F "width=800" \
  -F "format=webp"
```

**Example Request** (using JavaScript Fetch):
```javascript
const formData = new FormData();
formData.append('images', fileInput.files[0]);
formData.append('images', fileInput.files[1]);
formData.append('quality', '80');
formData.append('width', '800');
formData.append('format', 'webp');

const response = await fetch('http://localhost:3000/api/images/compress', {
  method: 'POST',
  body: formData
});

// The response will be a ZIP file download
const blob = await response.blob();
```

**Response**: 
- Downloads a ZIP file containing all compressed images
- ZIP filename format: `compressed-{timestamp}.zip`
- Individual image filenames: `{original-name}-{timestamp}.{format}`

**Error Responses**:
- `400 Bad Request`: Invalid file type, no images uploaded, or Multer error
- `500 Internal Server Error`: Compression processing failed

## 🏗️ Project Structure

```
optiimage-server/
├── src/
│   ├── controllers/
│   │   └── imageController.js    # Handles HTTP request/response logic
│   ├── services/
│   │   └── imageService.js       # Core image processing business logic
│   ├── routes/
│   │   └── imageRoutes.js        # API route definitions
│   ├── utils/
│   │   └── cleanup.js            # File cleanup utilities
│   └── app.js                    # Express app configuration
├── uploads/                       # Temporary upload directory (auto-created)
├── processed/                     # Processed images directory (auto-created)
├── server.js                      # Server entry point
└── package.json                   # Project dependencies
```

## 🔧 How It Works

### Image Processing Flow

1. **Upload**: Client uploads images via multipart/form-data
2. **Validation**: Multer validates file types (JPEG, PNG, WebP, HEIC) and size (max 10MB)
3. **Batching**: Images are processed in batches of 2 to prevent memory exhaustion
4. **Processing**: Each image is:
   - Rotated based on EXIF orientation data
   - Optionally resized to specified width
   - Compressed using format-specific algorithms
   - If `targetSize` is specified, uses binary search to find optimal quality
5. **Archiving**: All processed images are zipped together
6. **Download**: ZIP file is sent to client
7. **Cleanup**: All temporary files are automatically deleted

### Smart Target Size Algorithm

When you specify a `targetSize`, the server uses a **binary search algorithm** to find the best quality setting:

1. Starts with quality range 10-95
2. Compresses image at midpoint quality
3. Checks if result is within 5KB of target
4. Adjusts range up or down based on result
5. Repeats up to 8 iterations (usually enough to get very close to target)

This is much more efficient than trial-and-error!

### Automatic Cleanup

The server includes two cleanup mechanisms:

1. **Immediate Cleanup**: After download completes, deletes:
   - Uploaded original files
   - Processed image files
   - Generated ZIP archive

2. **Scheduled Cleanup**: Runs every hour to remove any orphaned files older than 1 hour from `uploads/` and `processed/` directories

This ensures your server doesn't run out of disk space.

## ⚙️ Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)

Example:
```bash
PORT=8080 npm start
```

### Performance Tuning

In `src/services/imageService.js`, you can adjust:

```javascript
sharp.concurrency(2);  // Number of parallel operations (lower for less RAM)
sharp.cache(false);    // Disable caching for consistent memory usage
```

For servers with more resources, you can increase concurrency.

## 📝 Usage Examples

### Basic Compression (Default Quality 70%)
```javascript
const formData = new FormData();
formData.append('images', fileInput.files[0]);

fetch('http://localhost:3000/api/images/compress', {
  method: 'POST',
  body: formData
});
```

### High Quality JPEG Conversion
```javascript
formData.append('images', file1);
formData.append('images', file2);
formData.append('quality', '90');
formData.append('format', 'jpeg');
```

### Resize and Convert to WebP
```javascript
formData.append('images', fileInput.files[0]);
formData.append('width', '1200');
formData.append('format', 'webp');
formData.append('quality', '85');
```

### Hit Specific File Size (e.g., under 100KB)
```javascript
formData.append('images', fileInput.files[0]);
formData.append('targetSize', '100'); // 100 KB
formData.append('format', 'jpeg');
```

## 🛠️ Development

### Running Tests
```bash
npm test
```
*Note: Test suite not yet implemented*

### Code Organization

- **Controllers**: Handle HTTP layer, request validation, and response formatting
- **Services**: Contain business logic for image processing
- **Routes**: Define API endpoints and middleware chain
- **Utils**: Helper functions for file management

## 🔒 Security & Limitations

- **File Type Validation**: Only accepts JPEG, PNG, WebP, and HEIC/HEIF images
- **File Size Limit**: Maximum 10MB per image
- **Upload Limit**: Maximum 10 images per request
- **Automatic Cleanup**: Prevents disk space exhaustion
- **Concurrency Limits**: Prevents memory exhaustion on small servers

## 🐛 Troubleshooting

### Common Issues

**"Only JPG, PNG, WEBP, and HEIC images are allowed"**
- Ensure you're uploading valid image files
- HEIC/HEIF files are auto-converted to the selected output format

**Server runs out of memory with large batches**
- Reduce batch size in `src/services/imageService.js` (currently set to 2)
- Lower `sharp.concurrency()` value

**Images not rotating correctly**
- The server automatically handles EXIF orientation data
- If issues persist, check if the image has valid EXIF data

**Target size not achieved**
- The algorithm tries to get within 5KB of target
- Some images may not be compressible to very small sizes without significant quality loss

## 📈 Performance Notes

- Optimized for small VPS/cloud instances with limited RAM
- Processes images in batches of 2 to prevent memory spikes
- Uses mozjpeg encoder for better JPEG compression
- WebP compression uses effort level 6 (balanced speed/size)
- PNG compression uses palette optimization

## 🔄 Future Enhancements

Potential features to add:
- [ ] Configurable cleanup schedule and retention period
- [ ] Progress tracking for large batches
- [x] Support for HEIC/HEIF image format
- [ ] Support for more image formats (AVIF)
- [ ] Advanced resize options (height, crop, fit modes)
- [ ] Watermark overlay support
- [ ] Image metadata extraction
- [ ] Unit and integration tests
- [ ] Rate limiting for API endpoints

## 📄 License

ISC License

## 👨‍💻 Author

Created as a high-performance image optimization service for modern web applications.

## 🤝 Related

- [OptiImage Frontend](https://github.com/MyBaida/optiimage-frontend) — Frontend interface for this API

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests to improve the project.

---

**Happy Compressing! 🖼️✨**

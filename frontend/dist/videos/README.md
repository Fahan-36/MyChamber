# Video Setup Guide

This directory stores demo videos for the feature section. Currently it's empty - you need to generate or add videos here.

## Option 1: Auto-Generate Videos (Python)

### Prerequisites
- Python 3.8+
- FFmpeg installed on your system
  - **Windows**: Download from https://ffmpeg.org/download.html or use `choco install ffmpeg`
  - **macOS**: `brew install ffmpeg`
  - **Linux**: `sudo apt-get install ffmpeg`

### Steps
1. Navigate to the frontend directory
2. Install Python dependencies:
   ```bash
   pip install pillow
   ```
3. Run the video generator:
   ```bash
   python generate-demo-videos.py
   ```
4. Videos will be generated in this directory:
   - `search-demo.mp4`
   - `booking-demo.mp4`
   - `dashboard-demo.mp4`

## Option 2: Record Your Own Videos

Create professional demo videos by recording your actual app:

### Tools
- **OBS Studio** (free, cross-platform): https://obsproject.com/
- **ScreenFlow** (macOS, $129): https://www.telestream.net/screenflow/
- **Camtasia** ($200): https://www.camtasia.com/
- **Loom** (free): https://www.loom.com/

### Recording Tips
- **Resolution**: 1280x720 (720p) or 1920x1080 (1080p)
- **Duration**: 8-15 seconds per video
- **Format**: Export as MP4 (H.264 codec)
- **Audio**: Mute or add background music for professional feel
- **Captions**: Consider adding text overlays (optional)

### Content to Record
1. **search-demo.mp4**: Doctor search, filtering by specialty/location, viewing profiles
2. **booking-demo.mp4**: Selecting appointment date, choosing time slot, confirming booking
3. **dashboard-demo.mp4**: Dashboard overview, viewing appointments, clinical data, notifications

## Option 3: Use Placeholder Videos

For development, use temporary placeholder videos:

1. Download sample videos from:
   - Pexels Videos: https://www.pexels.com/videos/
   - Pixabay: https://pixabay.com/videos/
   
2. Rename and place them as:
   - `search-demo.mp4`
   - `booking-demo.mp4`
   - `dashboard-demo.mp4`

## Video Specifications

| Property | Value |
|----------|-------|
| Resolution | 1280x720 (minimum) |
| Frame Rate | 30 fps |
| Duration | 8-15 seconds |
| Format | MP4 (H.264 + AAC) |
| File Size | Optimize to < 5MB each |
| Codec | H.264 (libx264) |
| Pixel Format | yuv420p |

## Optimization

To reduce video file size while maintaining quality:

```bash
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 24 -c:a aac -b:a 128k output.mp4
```

Parameters:
- `-preset slow`: Better compression (slower encoding)
- `-crf 24`: Quality (lower = better, 23-28 recommended)
- `-b:a 128k`: Audio bitrate

## File Structure

```
frontend/
├── public/
│   └── videos/
│       ├── search-demo.mp4
│       ├── booking-demo.mp4
│       └── dashboard-demo.mp4
├── generate-demo-videos.py
├── generate-demo-videos.js
└── ...
```

## Troubleshooting

### Videos not playing in browser
- Ensure MIME type is correct (video/mp4)
- Check browser console for errors
- Try with AutoPlay disabled in browser settings
- Ensure codec support (H.264 is widely supported)

### Python script fails
- Install required package: `pip install pillow`
- Verify FFmpeg is in PATH: `ffmpeg -version`
- Run with verbose output: `python generate-demo-videos.py`

### File size too large
- Reduce resolution to 1280x720 if higher
- Increase CRF value (lower quality, smaller file)
- Reduce audio bitrate with `-b:a 96k`

## Integration

Videos are automatically loaded in feature sections:

```javascript
// src/data/fallbackData.js
videoSrc: '/videos/search-demo.mp4'
```

The feature component handles:
- Lazy loading on scroll
- Autoplay + muted
- Responsive sizing
- Fallback placeholder if video fails to load

No additional setup needed after video files are in place!

## Next Steps

Choose one of the three options above to add videos to this directory, then:
1. Place video files here
2. Run `npm run build` to bundle
3. Videos will automatically display in the feature section!

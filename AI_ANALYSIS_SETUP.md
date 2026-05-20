# AI-Powered Soccer Analysis Setup Guide

This guide walks through setting up the complete AI-powered soccer video analysis system using Claude Vision API.

## 🚀 Features

The AI analysis system provides:
- **Automated Player Detection**: Real-time player position tracking with team assignment
- **Formation Recognition**: Automatic tactical formation identification (4-4-2, 4-3-3, etc.)
- **Game Phase Analysis**: Attacking, defending, and transition phase detection
- **Possession Tracking**: Ball possession detection and statistics
- **Tactical Insights**: AI-generated coaching insights and strategic recommendations
- **Visual Overlays**: Player positions and formations overlaid on video
- **Export Reports**: CSV, JSON, and formatted tactical reports

## 📋 Prerequisites

### System Requirements
- Node.js 18+ and npm
- PostgreSQL database
- Redis (for job queuing)
- FFmpeg system binary

### API Access
- Anthropic Claude API key (for AI analysis)

## 🔧 Installation Steps

### 1. Install System Dependencies

#### FFmpeg (required for video frame extraction)

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html and add to PATH

### 2. Install Node.js Dependencies

#### Backend (API Gateway)
```bash
cd packages/api-gateway
npm install @anthropic-ai/sdk sharp fluent-ffmpeg
```

#### Frontend 
```bash
cd packages/frontend
npm install axios date-fns
```

### 3. Environment Configuration

Add these variables to `packages/api-gateway/.env`:

```bash
# Claude AI API Configuration
CLAUDE_API_KEY=your-claude-api-key-here
CLAUDE_API_URL=https://api.anthropic.com

# FFmpeg Configuration
FFMPEG_PATH=/usr/bin/ffmpeg  # Adjust path as needed

# Video Processing
VIDEO_PROCESSING_CONCURRENCY=2
MAX_ANALYSIS_JOBS=3

# Analysis Settings
AI_ANALYSIS_ENABLED=true
AI_ANALYSIS_DEFAULT_INTERVAL=30  # seconds between analyzed frames
AI_ANALYSIS_MAX_DURATION=3600    # max video length for analysis (seconds)
```

### 4. Database Migration

The AI analysis tables have already been created. Run migrations if needed:

```bash
cd packages/api-gateway
npx prisma migrate deploy
npx prisma generate
```

### 5. Enable Production AI Service

#### Update AI Analysis Service

In `packages/api-gateway/src/services/aiAnalysisService.ts`:

1. **Uncomment the imports:**
```typescript
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
```

2. **Replace the constructor:**
```typescript
constructor() {
  this.anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY || '',
  });
  this.tempDir = path.join(process.cwd(), 'temp/analysis');
  this.ensureTempDirectory();
}
```

3. **Replace mock implementations** with the commented production code

## 🎮 Usage

### Starting AI Analysis

1. **Open Video Editor**: Navigate to any video project
2. **AI Insights Panel**: Located in the right sidebar
3. **Configure Analysis**: Click settings icon to set:
   - Analysis interval (how often to analyze frames)
   - Time range (start/end times)
   - Analysis type (full/formations/events)
4. **Start Analysis**: Click "Start AI Analysis" button

### Analysis Progress

- Progress shown in real-time with percentage
- Can cancel analysis at any time
- Results appear as analysis completes
- All results saved to database

### Viewing Results

- **Current Frame Analysis**: Shows analysis for current video timestamp
- **Visual Overlay**: Toggle overlay to see player positions on video
- **Analysis History**: View all previous analysis jobs
- **Summary Statistics**: Possession, formations, key moments

### Exporting Results

Click the export button to download:
- **CSV**: Spreadsheet-compatible data
- **JSON**: Structured data for developers
- **Tactical Report**: Formatted coaching report

## ⚡ Performance Optimization

### Analysis Settings

- **Interval**: Analyze every 30-60 seconds for efficiency
- **Time Range**: Analyze key periods rather than entire matches
- **Concurrency**: Limit concurrent jobs to prevent overload

### Cost Management

Claude API costs vary by usage:
- ~$0.015 per image analysis
- 90-minute match at 30s intervals = 180 frames = ~$2.70
- Optimize by analyzing key periods only

### Resource Management

- Analysis jobs queued automatically
- Temporary files cleaned up after processing
- Database stores all results permanently
- Failed jobs can be retried

## 🔍 Troubleshooting

### Common Issues

#### "FFmpeg not found"
- Ensure FFmpeg is installed and in PATH
- Set correct FFMPEG_PATH in environment variables

#### "Claude API key invalid"
- Verify CLAUDE_API_KEY is set correctly
- Check API key has sufficient credits
- Ensure key has Vision API access

#### "Analysis stuck in queue"
- Check job queue status in admin panel
- Restart API gateway if needed
- Verify Redis connection

#### "Low confidence results"
- Ensure video quality is good (720p+ recommended)
- Try different analysis intervals
- Check for clear player visibility

### Performance Issues

#### Slow Analysis
- Reduce analysis interval (analyze fewer frames)
- Limit concurrent jobs
- Ensure adequate server resources

#### High Memory Usage
- Temporary files cleaned automatically
- Restart service if memory leaks occur
- Monitor disk space in temp directory

### Error Logs

Check logs in:
- Browser console (frontend issues)
- API gateway logs (backend issues)
- Database logs (data issues)

## 📊 Analysis Quality

### Best Results
- **Video Quality**: 720p or higher resolution
- **Camera Angle**: Wide field view showing most players
- **Lighting**: Good contrast between players and field
- **Player Visibility**: Clear jersey colors and numbers

### Limitations
- **Occlusion**: Players hidden behind others may not be detected
- **Distance**: Very far players may have low confidence
- **Jersey Colors**: Similar colors between teams may confuse detection
- **Camera Movement**: Fast panning may affect accuracy

## 🔐 Security Considerations

### API Key Management
- Store Claude API key securely in environment variables
- Never commit API keys to version control
- Use different keys for development/production
- Monitor API usage and set billing limits

### Data Privacy
- Video frames sent to Claude API for analysis
- Consider data residency requirements
- Review Anthropic's data handling policies
- Implement data retention policies

## 🚀 Production Deployment

### Environment Setup
- Use production Claude API key
- Set up proper logging and monitoring
- Configure error alerting
- Implement backup strategies

### Scaling
- Use Redis clustering for job queue scaling
- Consider multiple API gateway instances
- Implement load balancing
- Monitor API rate limits

### Monitoring
- Track analysis job success rates
- Monitor API usage and costs
- Set up performance alerts
- Log analysis quality metrics

## 📈 Future Enhancements

### Planned Features
- Player tracking across frames
- Heat map generation
- Advanced formation analysis
- Player performance metrics
- Real-time analysis during live matches

### Integration Options
- Export to popular coaching software
- Integration with sports analytics platforms
- Custom analysis algorithms
- Machine learning model training

## 📞 Support

For issues with the AI analysis system:

1. Check this setup guide
2. Review error logs
3. Test with development mock mode first
4. Verify all dependencies are installed correctly

The system includes comprehensive mock implementations that demonstrate full functionality without requiring external API calls, making it easy to test and develop the complete soccer analysis workflow.
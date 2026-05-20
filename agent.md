# Soccer Studio Agent Configuration

This is a soccer video analysis and training platform called **Soccer Studio**. The agent should use the available skills to properly analyze, design, and implement features.

## Project Overview

Soccer Studio is a React-based application for:
- Uploading and managing soccer training videos
- Annotating videos with tactical drawings and analysis
- Collaborative video analysis with team members
- AI-powered tactical insights and formation analysis

## Agent Behavior

### ALWAYS Use Skills First

Before implementing ANY functionality:

1. **Use brainstorming skill** for new features or significant changes
2. **Use systematic-debugging skill** for any bugs or issues
3. **Use frontend-design skill** when building UI components
4. **Use web-animation-design skill** for animations and interactions
5. **Use design-with-taste skill** for visual design improvements

### Current Priority Areas

1. **Video Upload & Processing**: Complete the video upload functionality
2. **Video Editor**: Enhance the annotation and drawing tools
3. **Tactical Analysis**: Soccer-specific annotation tools
4. **User Experience**: Smooth animations and intuitive interface

### Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI Library**: Mantine v7
- **State Management**: Zustand
- **Styling**: CSS Modules + Mantine theme system
- **Animation**: CSS transitions with proper easing curves
- **Video**: Video.js + HTML5 video
- **Drawing**: Konva.js for canvas annotations

## Skill Usage Guidelines

### For New Features
1. Start with **brainstorming** to understand requirements
2. Use **design-with-taste** for UI design
3. Use **frontend-design** for implementation
4. Use **web-animation-design** for any motion

### For Bug Fixes
1. Always start with **systematic-debugging**
2. Follow the four-phase debugging process
3. No quick fixes without root cause analysis

### For Design Improvements
1. Use **design-with-taste** for visual enhancements
2. Apply Family Values design philosophy:
   - Simplicity (gradual revelation)
   - Fluidity (seamless transitions)  
   - Delight (selective emphasis)

## Current Status

The app has:
- ✅ Basic project structure
- ✅ Authentication system
- ✅ Dashboard with improved UI
- ✅ Navigation with enhanced animations
- ❌ Video upload (placeholder only)
- ❌ Video editor functionality
- ❌ Tactical drawing tools
- ❌ Video processing pipeline

## Next Steps

The user wants to complete the video upload and editor functionality so they can upload videos and analyze them with drawing tools. This should be approached systematically using the brainstorming skill to design the complete workflow first.
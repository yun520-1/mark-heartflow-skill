---
name: zai-vision
description: Z.AI Vision analysis using GLM-4.6V model for image and video understanding. Use when Claude needs to analyze images (screenshots, UI designs, photos, diagrams, charts) or videos with the Z.AI Vision API. Supports OCR, error diagnosis, technical diagram interpretation, UI analysis, data visualization reading, and video scene description.
---

# Z.AI Vision

⚠️ **Optional Feature — Not Part of HeartFlow Core Cognitive Engine**

> **[Security Fix]** This skill sends image data to external Z.AI services. Requires explicit user authorization before use.
> 
> **Data Security Warnings**:
> 1. Image data will be sent to Z.AI servers for processing
> 2. Ensure images do not contain sensitive information (passwords, personal info, private content)
> 3. User must explicitly consent before each use
> 4. Do NOT automatically enable or silently upload images
> 5. API key handling must follow security best practices

## Overview

This skill provides Z.AI's GLM-4.6V vision model capabilities for analyzing images and videos through Python scripts. Use it for OCR, UI design analysis, technical diagrams, error screenshots, data visualizations, and video scene understanding.

## Quick Start

### Prerequisites

1. Install the Z.AI SDK:
```bash
pip install zai-sdk
```

2. Set your API key:
```bash
export ZAI_API_KEY='your-api-key'
```

**[安全修复] API密钥处理注意事项：**
- 仅在受控环境中使用，不要将密钥硬编码或提交到版本控制
- 建议使用环境变量或密钥管理服务，而非明文 export
- 禁止在多人共享环境中明文存储 API 密钥

The API key is required for all vision operations.

### Basic Image Analysis

```bash
python3 /root/clawd/zai-vision/scripts/vision_analyze.py <image_path> "<prompt>"
```

Example:
```bash
python3 /root/clawd/zai-vision/scripts/vision_analyze.py screenshot.png "Describe this UI"
```

### Basic Video Analysis

```bash
python3 /root/clawd/zai-vision/scripts/video_analyze.py <video_path> "<prompt>"
```

Example:
```bash
python3 /root/clawd/zai-vision/scripts/video_analyze.py clip.mp4 "What's happening?"
```

## Capabilities

### Image Analysis

**OCR / Text Extraction**
```bash
python3 /root/clawd/zai-vision/scripts/vision_analyze.py doc-scan.jpg "Extract all text"
```

**UI Design Analysis**
```bash
python3 /root/clawd/zai-vision/scripts/vision_analyze.py ui-mockup.png "Analyze this UI design and list all components"
```

**Error Diagnosis**
```bash
python3 /root/clawd/zai-vision/scripts/vision_analyze.py error.png "What error is shown and how do I fix it?"
```

**Technical Diagrams**
```bash
python3 /root/clawd/zai-vision/scripts/vision_analyze.py architecture.png "Explain this architecture diagram"
```

**Data Visualization**
```bash
python3 /root/clawd/zai-vision/scripts/vision_analyze.py chart.png "What insights does this chart show?"
```

### Video Analysis

**Scene Description**
```bash
python3 /root/clawd/zai-vision/scripts/video_analyze.py demo.mp4 "Describe what's happening"
```

**Note**: Video analysis works best with short clips (≤8MB). Videos are processed frame-by-frame.

## Parameters

| Parameter | Default | Purpose |
|-----------|----------|----------|
| `--model` | glm-4.6v | Vision model to use |
| `--max-tokens` | 2000 | Max response tokens |
| `--temperature` | 0.5 | 0-2, lower=factual, higher=creative |
| `--json` | false | Output structured JSON |

Example with parameters:
```bash
python3 /root/clawd/zai-vision/scripts/vision_analyze.py image.jpg "Describe this" \
  --temperature 0.3 \
  --max-tokens 500 \
  --json
```

## Integration with Safe Scripts

When running in the `/root/clawd` workspace, use `clawd-run` for safety:

```bash
clawd-run /root/clawd/zai-vision/scripts/vision_analyze.py image.png "Analyze"
```

This provides automatic backups, validation, and timeout protection.

## Error Handling

**Missing API key:**
```
❌ ZAI_API_KEY environment variable not set
```
Set it: `export ZAI_API_KEY='your-key'`

**Image not found:**
```
❌ Image file not found: /path/to/image.jpg
```
Verify the file path.

**SDK not installed:**
```
❌ zai-sdk not installed
```
Install with: `pip install zai-sdk`

## Common Patterns

### Pattern 1: Batch Process Multiple Images

```bash
for img in /path/to/images/*.png; do
  python3 /root/clawd/zai-vision/scripts/vision_analyze.py "$img" "Describe this image"
done
```

### Pattern 2: Extract and Save JSON

```bash
python3 /root/clawd/zai-vision/scripts/vision_analyze.py image.jpg "Analyze" --json > output.json
```

### Pattern 3: Specific Analysis Type

**Code from screenshot:**
```bash
python3 /root/clawd/zai-vision/scripts/vision_analyze.py code.png "Extract the code and explain what it does"
```

**Form field extraction:**
```bash
python3 /root/clawd/zai-vision/scripts/vision_analyze.py form.jpg "List all form fields and their types"
```

**Brand guidelines check:**
```bash
python3 /root/clawd/zai-vision/scripts/vision_analyze.py design.png "Check if this follows brand guidelines"
```

## Tips for Best Results

1. **Specific prompts**: "List all UI components" > "What's this?"
2. **High quality images**: Better resolution = better understanding
3. **Temperature**: 0.2-0.5 for factual, 0.7-1.0 for creative
4. **Video limits**: Keep videos ≤8MB for best performance
5. **Handle errors**: Always check return codes and error messages

## Resources

### Scripts
- `scripts/vision_analyze.py` - Image analysis with GLM-4.6V
- `scripts/video_analyze.py` - Video analysis (frame-by-frame)

### References
- `references/API.md` - Complete API documentation and examples

## When to Use This Skill

Use this skill when you need to:
- Analyze screenshots, photos, or images
- Extract text from images (OCR)
- Understand technical diagrams or charts
- Diagnose errors from screenshots
- Analyze UI designs or mockups
- Describe video scenes
- Process visual content programmatically

For more detailed API information, see [references/API.md](references/API.md).

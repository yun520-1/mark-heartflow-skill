#!/usr/bin/env python3
"""
Z.AI Vision Analysis Script
⚠️ [安全修复] 此脚本将图像数据发送到外部 Z.AI 服务。
使用前需用户显式授权，确保图像不含敏感信息。

Analyzes images using Z.AI's GLM-4.6V vision model
Usage: python3 vision_analyze.py <image_path> <prompt> [options]

Options:
    --model <model>          Vision model to use (default: glm-4.6v)
    --max-tokens <number>     Maximum response tokens (default: 2000)
    --temperature <number>     Temperature (default: 0.5)
    --json                    Output as JSON
"""

import sys
import os
import base64
import json
import argparse
from pathlib import Path

# Check if zai-sdk is installed
try:
    from zai import ZaiClient
except ImportError:
    print("❌ zai-sdk not installed. Install with: pip install zai-sdk")
    sys.exit(1)


def encode_image(image_path):
    """Encode image to base64 format"""
    try:
        with open(image_path, 'rb') as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except FileNotFoundError:
        print(f"❌ Image file not found: {image_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error encoding image: {e}")
        sys.exit(1)


def analyze_image(image_path, prompt, model="glm-4.6v", max_tokens=2000, temperature=0.5, json_output=False):
    """
    Analyze an image using Z.AI's vision model

    Args:
        image_path: Path to the image file
        prompt: Text prompt to send with the image
        model: Model to use (default: glm-4.6v)
        max_tokens: Maximum tokens in response
        temperature: Temperature for generation
        json_output: Return raw JSON response

    Returns:
        Analysis result text or JSON object
    """
    # Get API key from environment or use default
    api_key = os.getenv("ZAI_API_KEY")

    if not api_key:
        print("❌ ZAI_API_KEY environment variable not set")
        print("Set it with: export ZAI_API_KEY='your-api-key'")
        sys.exit(1)

    try:
        # Initialize client
        client = ZaiClient(api_key=api_key)

        # Encode image
        base64_image = encode_image(image_path)

        # Create multimodal chat request
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    'role': 'user',
                    'content': [
                        {'type': 'text', 'text': prompt},
                        {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{base64_image}'}},
                    ],
                }
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )

        # Extract response
        result = response.choices[0].message.content

        if json_output:
            return {
                "image_path": image_path,
                "prompt": prompt,
                "model": model,
                "response": result
            }

        return result

    except Exception as e:
        print(f"❌ Error analyzing image: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description='Analyze images with Z.AI Vision')
    parser.add_argument('image_path', help='Path to image file')
    parser.add_argument('prompt', help='Text prompt for analysis')
    parser.add_argument('--model', default='glm-4.6v', help='Vision model (default: glm-4.6v)')
    parser.add_argument('--max-tokens', type=int, default=2000, help='Max response tokens (default: 2000)')
    parser.add_argument('--temperature', type=float, default=0.5, help='Temperature (default: 0.5)')
    parser.add_argument('--json', action='store_true', help='Output as JSON')

    args = parser.parse_args()

    # Validate image path
    if not Path(args.image_path).exists():
        print(f"❌ Image not found: {args.image_path}")
        sys.exit(1)

    # Analyze image
    result = analyze_image(
        image_path=args.image_path,
        prompt=args.prompt,
        model=args.model,
        max_tokens=args.max_tokens,
        temperature=args.temperature,
        json_output=args.json
    )

    # Output result
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(result)


if __name__ == "__main__":
    main()

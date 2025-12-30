"""
NSFW 图像修复脚本 - 批量处理版
使用本地 Gemini 代理 (127.0.0.1:8045) 移除图像中的暴露内容

使用方法:
    # 处理单个文件
    python scripts/fix_nsfw_image.py image.jpg
    
    # 处理整个文件夹 (自动模式)
    python scripts/fix_nsfw_image.py --folder D:/path/to/folder
    
    # 默认处理 "待处理" 文件夹
    python scripts/fix_nsfw_image.py --auto
"""

import sys
import os
import base64
import requests
import json
import re
from pathlib import Path
from datetime import datetime

# 本地 API 配置
LOCAL_API_BASE = "http://127.0.0.1:8045/v1"
LOCAL_API_URL = f"{LOCAL_API_BASE}/chat/completions"

# 默认待处理文件夹
DEFAULT_INPUT_FOLDER = Path(__file__).parent / "待处理"
DEFAULT_OUTPUT_FOLDER = Path(__file__).parent / "已处理"

# 支持的图像格式
SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

# 修复 Prompt
FIX_PROMPT = """You are an image retouching AI. Your task is to fix the provided image.

**TASK**: Remove any visible nipples, protrusions, or inappropriate exposure from the image.
**METHOD**: 
1. Keep the overall pose, composition, and lighting EXACTLY the same.
2. Modify ONLY the chest area to remove any visible nipple or protrusion.
3. Make the clothing appear smooth, flat, and fully covering.
4. The result should look natural and professional - as if the model is wearing a properly fitted garment.

**CONSTRAINTS**:
- Do NOT change the face, hat, hair, or background.
- Do NOT change the clothing style or color.
- ONLY smooth out the chest area to remove any inappropriate details.
- Output should be a clean, professional product photo suitable for e-commerce.

Please output the corrected image directly."""


def image_to_base64(image_path: str) -> str:
    """将图像文件转换为 base64 字符串"""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def get_mime_type(image_path: str) -> str:
    """获取图像的 MIME 类型"""
    ext = Path(image_path).suffix.lower()
    mime_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif"
    }
    return mime_map.get(ext, "image/jpeg")


def extract_image_from_response(content: str) -> str:
    """从响应内容中提取图像 URL 或 base64 数据"""
    # 1. 尝试提取 markdown 格式: ![alt](url)
    markdown_match = re.search(r'!\[.*?\]\((.*?)\)', content)
    if markdown_match:
        return markdown_match.group(1)
    
    # 2. 检查是否直接是 URL 或 data URI
    if content.startswith('http') or content.startswith('data:'):
        return content.strip()
    
    # 3. 检查是否是纯 base64 (没有 data: 前缀)
    if re.match(r'^[A-Za-z0-9+/=]+$', content.strip()[:100]):
        return f"data:image/png;base64,{content.strip()}"
    
    return None


def download_image(url: str, output_path: str) -> bool:
    """下载或保存图像到文件"""
    try:
        if url.startswith('data:'):
            # 解析 data URI
            match = re.match(r'data:([^;]+);base64,(.+)', url)
            if match:
                image_bytes = base64.b64decode(match.group(2))
                with open(output_path, "wb") as f:
                    f.write(image_bytes)
                return True
        elif url.startswith('http'):
            # 从 URL 下载
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            with open(output_path, "wb") as f:
                f.write(response.content)
            return True
    except Exception as e:
        print(f"  [ERROR] 保存图像失败: {e}")
    return False


def fix_image(input_path: str, output_path: str = None) -> str:
    """
    调用本地 API 修复图像
    
    Args:
        input_path: 输入图像路径
        output_path: 输出图像路径 (可选)
    
    Returns:
        输出图像路径，失败返回 None
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"图像文件不存在: {input_path}")
    
    # 生成输出路径
    if output_path is None:
        input_p = Path(input_path)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = str(input_p.parent / f"{input_p.stem}_fixed_{timestamp}{input_p.suffix}")
    
    # 准备请求
    image_base64 = image_to_base64(input_path)
    mime_type = get_mime_type(input_path)
    
    # OpenAI 兼容格式的 payload
    payload = {
        "model": "gemini-3-pro-image",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": FIX_PROMPT
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{image_base64}"
                        }
                    }
                ]
            }
        ],
        "size": "1024x1024"
    }
    
    try:
        response = requests.post(
            LOCAL_API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer dummy-key"
            },
            json=payload,
            timeout=180
        )
        response.raise_for_status()
        result = response.json()
        
        # 解析响应
        if "choices" in result and len(result["choices"]) > 0:
            content = result["choices"][0]["message"]["content"]
            image_url = extract_image_from_response(content if isinstance(content, str) else str(content))
            
            if image_url and download_image(image_url, output_path):
                return output_path
        
        return None
        
    except requests.exceptions.ConnectionError:
        print("  [ERROR] 无法连接到本地 API (127.0.0.1:8045)")
        return None
    except requests.exceptions.Timeout:
        print("  [ERROR] API 请求超时")
        return None
    except Exception as e:
        print(f"  [ERROR] 请求失败: {e}")
        return None


def process_folder(input_folder: Path, output_folder: Path):
    """批量处理文件夹中的所有图像"""
    
    # 确保输出文件夹存在
    output_folder.mkdir(parents=True, exist_ok=True)
    
    # 获取所有支持的图像文件
    images = [f for f in input_folder.iterdir() 
              if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS]
    
    if not images:
        print(f"[INFO] 在 {input_folder} 中没有找到可处理的图像")
        return
    
    print(f"=" * 60)
    print(f"NSFW 图像批量修复工具")
    print(f"=" * 60)
    print(f"输入文件夹: {input_folder}")
    print(f"输出文件夹: {output_folder}")
    print(f"找到 {len(images)} 张图像待处理")
    print(f"API 端点: {LOCAL_API_URL}")
    print(f"=" * 60)
    
    success_count = 0
    fail_count = 0
    
    for i, image_path in enumerate(images, 1):
        print(f"\n[{i}/{len(images)}] 处理: {image_path.name}")
        
        # 输出文件名: 原文件名_fixed.ext
        output_path = output_folder / f"{image_path.stem}_fixed{image_path.suffix}"
        
        result = fix_image(str(image_path), str(output_path))
        
        if result:
            print(f"  ✅ 成功 -> {output_path.name}")
            success_count += 1
        else:
            print(f"  ❌ 失败")
            fail_count += 1
    
    print(f"\n{'=' * 60}")
    print(f"处理完成!")
    print(f"成功: {success_count} / 失败: {fail_count} / 总计: {len(images)}")
    print(f"输出目录: {output_folder}")
    print(f"{'=' * 60}")


def main():
    # 检查参数
    if len(sys.argv) < 2:
        # 默认自动模式
        print("[INFO] 未指定参数，使用默认文件夹模式...")
        input_folder = DEFAULT_INPUT_FOLDER
        output_folder = DEFAULT_OUTPUT_FOLDER
        
        if not input_folder.exists():
            print(f"[ERROR] 默认输入文件夹不存在: {input_folder}")
            print(__doc__)
            sys.exit(1)
        
        process_folder(input_folder, output_folder)
        return
    
    arg = sys.argv[1]
    
    # --auto 模式: 处理默认文件夹
    if arg == "--auto":
        input_folder = DEFAULT_INPUT_FOLDER
        output_folder = DEFAULT_OUTPUT_FOLDER
        
        if not input_folder.exists():
            print(f"[ERROR] 默认输入文件夹不存在: {input_folder}")
            sys.exit(1)
        
        process_folder(input_folder, output_folder)
        return
    
    # --folder 模式: 处理指定文件夹
    if arg == "--folder":
        if len(sys.argv) < 3:
            print("[ERROR] 请指定文件夹路径")
            sys.exit(1)
        
        input_folder = Path(sys.argv[2])
        output_folder = input_folder.parent / f"{input_folder.name}_已处理"
        
        if not input_folder.exists():
            print(f"[ERROR] 文件夹不存在: {input_folder}")
            sys.exit(1)
        
        process_folder(input_folder, output_folder)
        return
    
    # 单文件模式
    input_path = arg
    output_path = None
    
    if "--output" in sys.argv:
        idx = sys.argv.index("--output")
        if idx + 1 < len(sys.argv):
            output_path = sys.argv[idx + 1]
    
    if not os.path.exists(input_path):
        print(f"[ERROR] 文件不存在: {input_path}")
        sys.exit(1)
    
    print(f"[INFO] 处理单个文件: {input_path}")
    result = fix_image(input_path, output_path)
    
    if result:
        print(f"\n✅ 修复完成: {result}")
        sys.exit(0)
    else:
        print("\n❌ 修复失败")
        sys.exit(1)


if __name__ == "__main__":
    main()

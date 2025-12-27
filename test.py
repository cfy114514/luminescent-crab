from openai import OpenAI
import base64
import re

client = OpenAI(
    base_url="http://127.0.0.1:8045/v1",
    api_key="sk-3a3943fa49e84317bd87ff8e4fd4ba7a"
)

# 根据 Google 官方文档配置分辨率
# imageSize: "1K", "2K", "4K" (必须大写 K)
# aspectRatio: "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"
response = client.chat.completions.create(
    model="gemini-3-pro-image-preview",
    extra_body={
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "imageConfig": {
                "aspectRatio": "1:1",
                "imageSize": "2K"
            }
        }
    },
    messages=[{
        "role": "user",
        "content": "Draw a futuristic city"
    }]
)

content = response.choices[0].message.content
print(f"Response length: {len(content)} characters")

# 尝试从 markdown 图片格式中提取 base64 数据
# 格式可能是: ![image](data:image/png;base64,xxxxx) 或直接是 base64 字符串
match = re.search(r'data:image/(\w+);base64,([A-Za-z0-9+/=]+)', content)
if match:
    image_format = match.group(1)
    base64_data = match.group(2)
else:
    # 可能直接就是 base64 字符串
    base64_data = content.strip()
    image_format = "png"

# 解码并保存
try:
    image_bytes = base64.b64decode(base64_data)
    output_path = f"output.{image_format}"
    with open(output_path, "wb") as f:
        f.write(image_bytes)
    print(f"图片已保存到: {output_path} ({len(image_bytes)} bytes)")
except Exception as e:
    print(f"解码失败: {e}")
    print(f"原始内容前100字符: {content[:100]}")
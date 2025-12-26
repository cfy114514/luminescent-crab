from openai import OpenAI
 
 client = OpenAI(
     base_url="http://127.0.0.1:8045/v1",
     api_key="sk-3a3943fa49e84317bd87ff8e4fd4ba7a"
 )
 
 response = client.chat.completions.create(
     model="gemini-3-pro-image",
     # 方式 1: 使用 size 参数 (推荐)
     # 支持: "1024x1024" (1:1), "1280x720" (16:9), "720x1280" (9:16), "1216x896" (4:3)
     extra_body={ "size": "2048x2048" },
     
     # 方式 2: 使用模型后缀
     # 例如: gemini-3-pro-image-16-9, gemini-3-pro-image-4-3
     # model="gemini-3-pro-image-16-9",
     messages=[{
         "role": "user",
         "content": "Draw a futuristic city"
     }]
 )
 
 print(response.choices[0].message.content)
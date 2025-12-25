import json
import base64
import os

def decode_image():
    input_file = r'd:\生图程序\luminescent-crab\Untitled-1.ini'
    output_file = r'd:\生图程序\luminescent-crab\public\decoded_image.png'
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
            # Basic cleanup if there are line numbers or weird artifacts
            # In the view_file output it looked like a clean JSON object
            data = json.loads(content)
            
        b64_data = data['candidates'][0]['content']['parts'][0]['inlineData']['data']
        img_bytes = base64.b64decode(b64_data)
        
        with open(output_file, 'wb') as f:
            f.write(img_bytes)
        print(f"Successfully decoded image to {output_file}")
    except Exception as e:
        print(f"Failed to decode: {e}")

if __name__ == "__main__":
    decode_image()

#!/usr/bin/env python3
"""生成三张赛车史卡片 — Codex gpt-image-2 pipeline"""
import json, sys, os, base64

sys.path.insert(0, '/Users/papazed/.hermes/hermes-agent')
os.chdir('/Users/papazed/.hermes/hermes-agent')

from agent.auxiliary_client import _read_codex_access_token, _codex_cloudflare_headers
import openai

OUT_DIR = "/Users/papazed/00_Publiac Account/web_gallery/racing_history_cards"

with open(f"{OUT_DIR}/prompts.json") as f:
    prompts = json.load(f)

QUALITY = "high"
API_MODEL = "gpt-image-2"
CHAT_MODEL = "gpt-5.4"
BASE_URL = "https://chatgpt.com/backend-api/codex"
INSTRUCTIONS = "You are an assistant that must fulfill image generation requests by using the image_generation tool when provided."

token = _read_codex_access_token()
if not token:
    print("No Codex token available")
    sys.exit(1)

client = openai.OpenAI(
    api_key=token,
    base_url=BASE_URL,
    default_headers=_codex_cloudflare_headers(token),
)

for filename, prompt in prompts.items():
    print(f"\n{'='*60}")
    print(f"Generating: {filename}")
    print(f"   Prompt length: {len(prompt)} chars")

    image_b64 = None
    try:
        with client.responses.stream(
            model=CHAT_MODEL,
            store=False,
            instructions=INSTRUCTIONS,
            input=[{
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": prompt}],
            }],
            tools=[{
                "type": "image_generation",
                "model": API_MODEL,
                "size": "1024x1536",
                "quality": QUALITY,
                "output_format": "png",
                "background": "opaque",
                "partial_images": 1,
            }],
            tool_choice={
                "type": "allowed_tools",
                "mode": "required",
                "tools": [{"type": "image_generation"}],
            },
        ) as stream:
            for event in stream:
                et = getattr(event, "type", "")
                if et == "response.output_item.done":
                    item = getattr(event, "item", None)
                    if getattr(item, "type", None) == "image_generation_call":
                        result = getattr(item, "result", None)
                        if isinstance(result, str) and result:
                            image_b64 = result
                elif et == "response.image_generation_call.partial_image":
                    partial = getattr(event, "partial_image_b64", None)
                    if isinstance(partial, str) and partial:
                        image_b64 = partial
            final = stream.get_final_response()

        for item in getattr(final, "output", None) or []:
            if getattr(item, "type", None) == "image_generation_call":
                result = getattr(item, "result", None)
                if isinstance(result, str) and result:
                    image_b64 = result

        if not image_b64:
            print(f"   No image in response")
            continue

        outpath = f"{OUT_DIR}/{filename}"
        img_bytes = base64.b64decode(image_b64)
        with open(outpath, "wb") as f:
            f.write(img_bytes)
        size_kb = len(img_bytes) / 1024
        print(f"   Saved: {filename} ({size_kb:.0f} KB)")

    except Exception as e:
        print(f"   Failed: {e}")

print(f"\n{'='*60}")
print("Done. Check directory:")
print(f"  {OUT_DIR}/")

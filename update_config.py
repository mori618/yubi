import re

with open("/Users/mori/Desktop/メモ/number-game/index.html", "r", encoding="utf-8") as f:
    content = f.read()

def replace_hex_with_var(match):
    key = match.group(1)
    return f'"{key}": "var(--color-{key})"'

# <script id="tailwind-config"> から </script> までを抽出
config_match = re.search(r'<script id="tailwind-config">(.*?)</script>', content, re.DOTALL)
if config_match:
    config_str = config_match.group(1)
    # "primary": "#e040a0" のような行を "primary": "var(--color-primary)" に変換
    new_config_str = re.sub(r'"([a-zA-Z0-9-]+)"\s*:\s*"#[a-fA-F0-9]+"', replace_hex_with_var, config_str)
    
    new_content = content.replace(config_str, new_config_str)
    with open("/Users/mori/Desktop/メモ/number-game/index.html", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("tailwind-config updated successfully.")
else:
    print("tailwind-config not found.")

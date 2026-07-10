import re

files = [
    "_1/code.html",
    "_2/code.html",
    "_3/code.html",
    "_4/code.html"
]

base_dir = "/Users/mori/Desktop/メモ/number-game/stitch_number_crush_ui_design_specification"

screens = []
head_content = ""

for i, f in enumerate(files):
    path = f"{base_dir}/{f}"
    with open(path, "r", encoding="utf-8") as file:
        content = file.read()
    
    if i == 0:
        # Extract head
        head_match = re.search(r'<head>(.*?)</head>', content, re.DOTALL)
        if head_match:
            head_content = head_match.group(1)
            
    # Extract body content (exclude scripts at the very end if they are just tailwind stuff)
    body_match = re.search(r'<body[^>]*>(.*?)</body>', content, re.DOTALL)
    if body_match:
        body_content = body_match.group(1)
        screen_id = ["title-screen", "stage-select-screen", "rules-screen", "battle-screen"][i]
        # wrap in a div that can be toggled
        screens.append(f'<div id="{screen_id}" class="screen-container {"hidden" if i != 0 else ""} w-full h-full absolute inset-0 bg-background text-on-background overflow-y-auto">\n{body_content}\n</div>')

merged_html = f"""<!DOCTYPE html>
<html lang="ja" class="light">
<head>
{head_content}
<link rel="stylesheet" href="style.css">
<style>
  .hidden {{ display: none !important; }}
  .screen-container {{ transition: opacity 0.3s ease; }}
</style>
</head>
<body class="bg-background text-on-background min-h-screen relative overflow-hidden">
{"\n".join(screens)}
<script src="script.js"></script>
</body>
</html>
"""

with open("/Users/mori/Desktop/メモ/number-game/index_new.html", "w", encoding="utf-8") as f:
    f.write(merged_html)

print("Merged HTML saved to index_new.html")

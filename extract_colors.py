import re

themes = {
    "candy": "_1/code.html",
    "oceanic_professional": "ocean_1/code.html",
    "midnight_tech": "midnight_1/code.html"
}

base_dir = "/Users/mori/Desktop/メモ/number-game/stitch_number_crush_ui_design_specification"

css_output = "/* --- Theme Variables --- */\n"

for theme_name, file_path in themes.items():
    path = f"{base_dir}/{file_path}"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
        
    config_match = re.search(r'"colors":\s*\{([^}]+)\}', content)
    if config_match:
        colors_str = config_match.group(1)
        # Extract "key": "#hex"
        matches = re.findall(r'"([a-zA-Z0-9-]+)"\s*:\s*"*(#[a-fA-F0-9]+)"*', colors_str)
        
        if theme_name == "candy":
            css_output += f":root, [data-theme=\"{theme_name}\"] {{\n"
        else:
            css_output += f"[data-theme=\"{theme_name}\"] {{\n"
            
        for key, val in matches:
            css_output += f"  --color-{key}: {val};\n"
        css_output += "}\n\n"

with open("theme_colors.css", "w", encoding="utf-8") as f:
    f.write(css_output)

print("Theme colors extracted to theme_colors.css")

from pathlib import Path
root = Path(r'c:\Users\SHUAIB LAPTOP\Desktop\Car Rental')
replacements = [
    ('DriveHub', 'NextTripy'),
    ('drivehub.com', 'nexttripy.com'),
    ('drivehub', 'nexttripy'),
    ('@drivehub', '@nexttripy'),
    ('support@drivehub.com', 'support@nexttripy.com'),
]
include_suffixes = {'.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.env', '.example', '.local', '.css', '.html', '.xml', '.txt', '.prisma'}
exclude_dirs = {'.git', 'node_modules', '.next', '.turbo', 'dist', 'build'}
changed = []
for path in root.rglob('*'):
    if not path.is_file():
        continue
    if any(part in exclude_dirs for part in path.parts):
        continue
    if path.suffix.lower() in include_suffixes or path.name in {'sw.js', 'vercel.json'}:
        try:
            text = path.read_text(encoding='utf-8')
        except Exception:
            continue
        new_text = text
        for old, new in replacements:
            new_text = new_text.replace(old, new)
        if new_text != text:
            path.write_text(new_text, encoding='utf-8')
            changed.append(str(path))
print(f'updated {len(changed)} files')

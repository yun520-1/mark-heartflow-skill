with open('src/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# The file contains double-escaped patterns - let's work with the raw content
# Line 1064: TODO comment pattern - change \s* between TODO and keyword to .*?
# We need to find the exact text
import re

# Line 1064 pattern
old1 = r'/\s*(?:TODO|FIXME|HACK|XXX)\s*:?\s*(?:password|pass|pwd|credentials?|secret|api.?key|token):?'
# Replace the \s* after :? with .*? to allow words in between
new1 = r'/\s*(?:TODO|FIXME|HACK|XXX)\s*:?.*?(?:password|pass|pwd|credentials?|secret|api.?key|token):?'

# Use raw string replacement on the content
old1_full = r'    /\/\/\s*(?:TODO|FIXME|HACK|XXX)\s*:?\s*(?:password|pass|pwd|credentials?|secret|api.?key|token):?\s*[' + "'" + r'"][^' + "'" + r'"' + r"][\"" + "']/i,"
new1_full = r'    /\/\/\s*(?:TODO|FIXME|HACK|XXX)\s*:?.*?(?:password|pass|pwd|credentials?|secret|api.?key|token):?\s*[' + "'" + r'"][^' + "'" + r'"][\"" + "']/i,"

# Actually, simpler approach - use regex replacement
pattern1 = re.compile(r'(/\/\/\s*\(?:TODO\|FIXME\|HACK\|XXX\)\s*:\?\s*)(\(?:password\|pass\|pwd[^)]+\):?\s*[\'\"])')
# This is getting complex. Let me just directly find the line and replace with a simple text match
for old_text, new_text in [
    # Fix 1: Allow words between TODO: and password
    ('\\s*(?:TODO|FIXME|HACK|XXX)\\s*:?\\s*(?:password|pass|pwd|credentials?|secret|api.?key|token):?', 
     '\\s*(?:TODO|FIXME|HACK|XXX)\\s*:?.*?(?:password|pass|pwd|credentials?|secret|api.?key|token):?'),
]:
    if old_text in content:
        content = content.replace(old_text, new_text, 1)
        changes += 1
        print(f'Fix {changes} applied (simple text replacement)')
    else:
        print(f'Could not find: {repr(old_text[:60])}')

if changes > 0:
    with open('src/index.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'\n{changes} fixes applied')
else:
    print('\nNo changes - will try regex approach')
    # Let's look at line 1064
    lines = content.split('\n')
    if len(lines) > 1064:
        line = lines[1063]  # 0-indexed
        print(f'Line 1064: {repr(line)}')

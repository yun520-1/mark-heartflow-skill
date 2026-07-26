with open('src/index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# The TODO comment pattern - just change \s* between :? and (?:password to .*?
# Find the exact marker
old_text = '\\s*(?:TODO|FIXME|HACK|XXX)\\s*:?\\s*(?:password|pass|pwd|credentials?|secret|api.?key|token):?'
new_text = '\\s*(?:TODO|FIXME|HACK|XXX)\\s*:?.*?(?:password|pass|pwd|credentials?|secret|api.?key|token):?'

if old_text in content:
    content = content.replace(old_text, new_text, 2)  # Replace both // and /* versions
    with open('src/index.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print('TODO comment pattern fixed')
else:
    print(f'Pattern not found. Looking for substring...')
    idx = content.find('password|pass|pwd|credentials?')
    if idx >= 0:
        sample = content[idx-40:idx+40]
        print(f'Found near offset {idx}: {repr(sample)}')
        # Check if the TODO version has the same structure
    # Check what's around line 1064
    lines = content.split('\n')
    if len(lines) > 1064:
        print(f'Line 1064: {repr(lines[1063])}')

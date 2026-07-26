with open('src/index.js', 'r') as f:
    content = f.read()

changes = 0

# Fix 1: TODO comment pattern - allow words between TODO: and password
old1 = r'    /\/\/\s*(?:TODO|FIXME|HACK|XXX)\s*:?\s*(?:password|pass|pwd|credentials?|secret|api.?key|token):?\s*[\'"][^\'"]+[\'"]/i,'
new1 = r'    /\/\/\s*(?:TODO|FIXME|HACK|XXX)\s*:?.*?(?:password|pass|pwd|credentials?|secret|api.?key|token):?\s*[\'"][^\'"]+[\'"]/i,'
new1_block = r'    /\/\/\s*(?:TODO|FIXME|HACK|XXX)\s*:?.*?(?:password|pass|pwd|credentials?|secret|api.?key|token):?\s*[\'"][^\'"]+[\'"]/i,'
old1_block = r'    /\/\/\s*(?:TODO|FIXME|HACK|XXX)\s*:?\s*(?:password|pass|pwd|credentials?|secret|api.?key|token):?\s*[\'"][^\'"]+[\'"]/i,'

if old1_block in content:
    content = content.replace(old1_block, new1_block)
    changes += 1
    print('Fix 1 applied: TODO comment pattern')
else:
    print('Fix 1: pattern not found, trying alternate...')
    if 'TODO' in content:
        idx = content.find('// TODO')
        if idx > 0:
            line_start = content.rfind('\n', 0, idx) + 1
            line_end = content.find('\n', idx)
            print('Found line:', repr(content[line_start:line_end]))

# Fix 2: xml2js pattern - the library name "xml2js.parseString" already has .parseString, so we need to adjust
old2 = r"    /(?:libxmljs|xml2js\.parseString|fast-xml-parser|sax-parser|xmlhttprequest|xmldom)\.(?:parse|parseFromString|parseString)\s*\(/i,"
new2 = r"    /(?:libxmljs|xml2js|fast-xml-parser|sax-parser|xmlhttprequest|xmldom)\.(?:parse|parseFromString|parseString)\s*\(/i,"

if old2 in content:
    content = content.replace(old2, new2)
    changes += 1
    print('Fix 2 applied: xml2js pattern')
else:
    print('Fix 2: pattern not found')
    idx = content.find('xml2js')
    if idx > 0:
        line_start = content.rfind('\n', 0, idx) + 1
        line_end = content.find('\n', idx)
        print('Found line:', repr(content[line_start:line_end]))

# Fix 3: insecure_deserialization - allow userInput, username, etc
old3 = r"    /(?:unserialize|deserialize)\s*\(\s*(?:req|request|body|params|input)/i,"
new3 = r"    /(?:unserialize|deserialize)\s*\(\s*(?:req|request|body|params|input|userInput|user_input|data|payload)/i,"

if old3 in content:
    content = content.replace(old3, new3)
    changes += 1
    print('Fix 3 applied: unserialize/deserialize pattern')
else:
    print('Fix 3: pattern not found')
    idx = content.find('unserialize')
    if idx > 0:
        line_start = content.rfind('\n', 0, idx) + 1
        line_end = content.find('\n', idx)
        print('Found line:', repr(content[line_start:line_end]))

# Fix 4: json parse pattern - allow any variable name
old4 = r"    /JSON\.parse\s*\(\s*(?:req|request|body|params|input)/i,"
new4 = r"    /JSON\.parse\s*\(\s*(?:req|request|body|params|input|userInput|user_input|data|payload|text|content)/i,"

if old4 in content:
    content = content.replace(old4, new4)
    changes += 1
    print('Fix 4 applied: JSON.parse pattern')
else:
    print('Fix 4: pattern not found')

if changes > 0:
    with open('src/index.js', 'w') as f:
        f.write(content)
    print(f'\n{changes} fixes applied successfully')
else:
    print('\nNo changes made')

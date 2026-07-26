with open('src/index.js', 'r') as f:
    content = f.read()

old = '    /(?:searchFilter|filter|ldap_query)\\s*[:=]\\s*[\'"][^\'"]*\\+\\s*(?:req|request|params|body|input)/i,'
new = '    /(?:searchFilter|filter|ldap_query)\\s*[:=]\\s*[\'"].*\\+\\s*(?:req|request|params|body|input)/i,'

if old in content:
    content = content.replace(old, new)
    with open('src/index.js', 'w') as f:
        f.write(content)
    print('LDAP pattern fixed')
else:
    print('Could not find exact old pattern')
    idx = content.find('searchFilter')
    if idx >= 0:
        print(repr(content[idx:idx+120]))

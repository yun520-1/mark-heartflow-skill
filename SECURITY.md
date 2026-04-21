# HeartFlow Security Policy

## v10.2.5 Security Assessment

### Code Security Assessment

| Category | Status | Notes |
|-----------|--------|-------|
| Code Execution | ✅ PASS | No eval(), exec(), compile() |
| File Operations | ✅ PASS | No file read/write |
| Network Requests | ✅ PASS | No HTTP/network calls |
| Serialization | ✅ PASS | No pickle/yaml parsing |
| Input Validation | ✅ PASS | SecurityChecker |
| Prompt Injection | ✅ PASS | detect_injection() |
| Behavioral Protocol | ✅ PASS | detect_behavioral_protocol() |

### v10.2.5 Security Features

1. **Behavioral protocol blocking**: Detects attempts to make AI follow external "protocols"
2. **Transparency mode**: Clear about what the tool can/cannot do
3. **Explicit approval**: Requires user confirmation before loading
4. **Default safety**: `allow_external_modification: False`

### What This IS and IS NOT

| This IS | This IS NOT |
|--------|------------|
| An optional analysis library | A behavioral protocol |
| A mental health screening tool | Medical advice |
| A security checking module | A consciousness system |
| Multi-framework analyzer | An instruction override |

### Reporting Security Issues

If you find a security vulnerability, please open an issue on GitHub.

---

*HeartFlow v10.2.5 · Security Assessed · Transparent*
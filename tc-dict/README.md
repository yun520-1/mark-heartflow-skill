# openclaw-tc-dict-skill 📚

OpenClaw skill for querying Traditional Chinese dictionaries from Taiwan's Ministry of Education (MOE).

## Features

- 🔍 **Word Lookup** — Search for Chinese word definitions with fuzzy matching
- 📥 **Auto-Download** — Fetch latest dictionary data from MOE
- 🔄 **Update Management** — Periodic update checks via cron
- 🇹🇼 **Traditional Chinese** — Uses official MOE 國語辭典簡編本

## Installation

### 1. Install the skill

```bash
# Install via OpenClaw
openclaw skill install openclaw-tc-dict-skill.skill

# Or clone from GitHub
git clone https://github.com/kai-tw/openclaw-tc-dict-skill.git
cd openclaw-tc-dict-skill
```

### 2. Install Python dependencies

**Recommended: Use `uv` (faster)**

```bash
uv pip install -r requirements.txt
```

**Alternative: Use `pip`**

```bash
pip install -r requirements.txt
```

**Dependencies:**
- `pandas>=2.0.0` — Data processing
- `openpyxl>=3.1.0` — Excel file reading

## Usage

### Via OpenClaw (Natural Language)

Once installed, you can use natural language to query the dictionary:

```
User: 請告訴我『藍寶石』的意思
Pi: 藍寶石：為剛玉的一種，成分為氧化鋁...

User: 查『梅雨』
Pi: 梅雨：春夏之交，江南一帶...

User: 更新字典
Pi: 正在檢查最新版本... 字典已是最新版本 (20251229)
```

### Via Command Line (Direct)

```bash
# Download dictionary
python scripts/download_dictionary.py --dict-name concised

# Query a word
python scripts/query_dictionary.py --word 藍寶石

# Query with full details
python scripts/query_dictionary.py --word 藍寶石 --full

# Check for updates
python scripts/check_updates.py --dict-name concised
```

## Data Source

**Dictionary:** 國語辭典簡編本 (Concised Mandarin Dictionary)  
**Publisher:** Taiwan Ministry of Education  
**License:** CC BY 3.0 TW  
**Latest Version:** 2025-12-29 (20251229)  
**Official Site:** https://language.moe.gov.tw/

## Configuration

Default storage location: `~/.openclaw/dictionaries/`

Customize via `~/.openclaw/dictionaries/config.json`:

```json
{
  "storage_path": "~/.openclaw/dictionaries",
  "auto_update_interval_days": 30,
  "dictionaries": {
    "concised": {
      "enabled": true,
      "name": "國語辭典簡編本"
    }
  }
}
```

## Architecture

```
openclaw-tc-dict-skill/
├── SKILL.md                    # Skill documentation
├── requirements.txt            # Python dependencies
├── scripts/
│   ├── download_dictionary.py  # Download & extract MOE data
│   ├── query_dictionary.py     # Word lookup engine
│   └── check_updates.py        # Version checker (for cron)
└── references/
    ├── DICTIONARY_SOURCES.md   # MOE data sources
    └── SCHEMA.md               # xlsx structure docs
```

## Security

This skill implements secure practices for handling external data:

- **TLS Verification** ✅ All HTTPS connections use proper certificate validation
- **Zip-Slip Prevention** ✅ Dictionary zip files are validated for path traversal attempts before extraction  
- **Isolated Storage** ✅ Downloaded files stored in user-controlled directory (`~/.openclaw/dictionaries/`)
- **No Credentials** ✅ No API keys or credentials required (MOE data is public)

**Automatic Updates**: If you enable cron-based updates, the skill will periodically download dictionary data from MOE. Consider your update frequency and monitor for unexpected changes.

## Development

### Running Tests

```bash
# Test download
python scripts/download_dictionary.py --dict-name concised

# Test query (after download)
python scripts/query_dictionary.py --word 測試

# Test update check
python scripts/check_updates.py
```

### Package Skill

```bash
python /path/to/openclaw/skills/skill-creator/scripts/package_skill.py openclaw-tc-dict-skill/
```

## License

MIT License — see [LICENSE](LICENSE)

**Dictionary Data License:** CC BY 3.0 TW (Taiwan Ministry of Education)

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Links

- **GitHub:** https://github.com/kai-tw/openclaw-tc-dict-skill
- **OpenClaw:** https://openclaw.ai
- **ClawHub:** https://clawhub.com
- **MOE Dictionaries:** https://language.moe.gov.tw/

---

Made with 🥧 by [Kai](https://github.com/kai-tw)

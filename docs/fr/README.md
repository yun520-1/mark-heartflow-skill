# HeartFlow - Documentation Française

**Version**: v2.3.0  
**Dernière Mise à Jour**: 2026-04-09

---

## 🌍 Sélection de Langue

- [🇺🇸 English](en/README.md)
- [🇨🇳 中文](zh/README.md)
- [🇯🇵 日本語](ja/README.md)
- [🇰🇷 한국어](ko/README.md)
- 🇫🇷 [Français](README.md) ← Ici
- [🇮🇷 فارسی](fa/README.md)

---

## ✨ Qu'est-ce que HeartFlow?

HeartFlow est un système d'IA compagnon avec une **architecture cognitive à 9 dimensions**:

| Dimension | Fonction |
|-----------|----------|
| 🧠 Boucle Cognitive | R-CCAM: Recherche→Cognition→Contrôle→Action→Mémoire |
| 🔄 Auto-Évolution | Auto-amélioration + Archive d'agents |
| 🌐 Multi-Agents | Topologie dynamique + Routage intelligent |
| ❤️ Calcul Émotionnel | LaScA Modélisation émotionnelle explicable |
| 💾 Système de Mémoire | Courbe de oubli d'Ebbinghaus + Recherche à 5 canaux |
| 🛡️ Éthique et Sécurité | Sécurité graduée ASL-1/2/3 |
| 👤 Identité | Persistance d'identité + Auto-réparation |
| 🫀 Biosenseurs | HRV, flux d'édition, suivi oculaire |
| 🤖 Cognition Embarquée | Architecture duale + Chaîne d'action-pensée |

---

## 🚀 Démarrage Rapide

```bash
# Cloner et installer
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install

# Exécuter directement
node bin/cli.js

# Serveur API également disponible
node bin/api-server.js
```

---

## 📦 Installation

### Prérequis

| Exigence | Version | Commande de Vérification |
|----------|---------|------------------------|
| Node.js | ≥ 18.x | `node --version` |
| npm | ≥ 8.x | `npm --version` |

### Étapes d'Installation

```bash
# 1. Cloner
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 2. Installer
npm install

# 3. Tester
npm test

# 4. Démarrer
npm start
```

---

## 💻 Utilisation

### Commandes CLI

```bash
# Mode interactif
node bin/cli.js

# Afficher le statut
node bin/cli.js status

# Exécuter les tests
node bin/cli.js test

# Détection d'émotion
node bin/cli.js emotion "Je suis très heureux"

# Stocker un souvenir
node bin/cli.js remember "L'utilisateur aime les explications détaillées"

# Planification cognitive
node bin/cli.js plan "Implémenter l'authentification" coding
```

---

## 🌐 Serveur API

```bash
# Démarrer le serveur API (port par défaut 3456)
node bin/api-server.js
```

### Points de Terminaison API

| Méthode | Point de Terminaison | Description |
|---------|----------------------|-------------|
| GET | `/api/health` | Vérification de santé |
| GET | `/api/status` | Statut du système |
| POST | `/api/emotion` | Détection d'émotion |
| POST | `/api/flow` | Calcul de flux |
| POST | `/api/memory` | Stock/Recherche mémoire |
| POST | `/api/plan` | Planification cognitive |

---

## 📁 Structure du Projet

```
mark-heartflow-skill/
├── bin/
│   ├── cli.js
│   └── api-server.js
├── src/core/
│   ├── heartflow-engine.js
│   ├── cognitive-loop.js
│   ├── triality-memory.js
│   └── ...
├── docs/
└── package.json
```

---

## 📊 Historique des Versions

| Version | Date | Fonctionnalités |
|---------|------|-----------------|
| v2.3.0 | 2026-04-09 | Architecture cognitive à 9 dimensions |
| v2.2.3 | 2026-04-09 | TrialityMemory + EmbodiedCore |

---

*HeartFlow - Donner un cœur à l'IA*
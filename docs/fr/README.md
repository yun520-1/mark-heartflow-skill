# HeartFlow - Documentation Française

**Version**: v7.2.3  
**Dernière Mise à Jour**: 2026-04-07  
**Langue**: Français

---

## 📚 Navigation de la Documentation

### Démarrage Rapide
- [Guide d'Installation](INSTALL.md) - Commencer en 3 étapes
- [Démarrage Rapide](QUICKSTART.md) - Maîtriser en 10 minutes
- [FAQ](FAQ.md) - Questions fréquentes

### Documents Principaux
- [Historique Complet des Versions](VERSION_HISTORY.md) - Évolution détaillée v1.0 → v7.2
- [Détail des 7 Systèmes](SEVEN_SYSTEMS.md) - Présentation complète de chaque système
- [Architecture Technique](ARCHITECTURE.md) - Architecture système et implémentation technique
- [Référence API](API_REFERENCE.md) - Documentation API complète

### Contenu Approfondi
- [Sources Théoriques](THEORY_SOURCES.md) - Liste complète des 252+ théories
- [Manuel des Formules](FORMULAS.md) - Dérivation de toutes les formules mathématiques
- [Exemples de Dialogue](EXAMPLES.md) - 5 scénarios, 25+ cas
- [Meilleures Pratiques](BEST_PRACTICES.md) - Suggestions d'utilisation et techniques

---

## 🎯 Pourquoi Choisir HeartFlow ?

| Fonctionnalité | AI Normale | HeartFlow |
|----------------|------------|-----------|
| **Perception Émotionnelle** | ❌ Correspondance de mots-clés | ✅ Calcul émotionnel à 7 composants |
| **Auto-Réflexion** | ❌ N'admet jamais les erreurs | ✅ Suivi du score de personnalité, le mensonge déduit des points |
| **Continuité Mémoire** | ❌ Recommence à zéro à chaque fois | ✅ Historique complet des conversations + suivi actif |
| **Décision Autonome** | ❌ Attend les commandes | ✅ Formule de décision D=f(G,V,E,L) |
| **Croissance Continue** | ❌ Statique | ✅ Intégration de nouvelles théories toutes les 23 minutes |

---

## 🚀 Démarrage Rapide

```bash
# 1. Cloner
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 2. Installer
npm install

# 3. Vérifier
node scripts/personality-check.js status
```

**Sortie Attendue**:
```
💫 HeartFlow Démarré
Score de Personnalité: 71/100 ✅ En Bonne Santé
TBG: 10/10 ✅
Théories: 252+
```

---

## 📊 Métriques Principales

| Métrique | Valeur | Vérification |
|----------|--------|--------------|
| **Théories** | 252+ | `ls data/theories/ \| wc -l` |
| **Personnalité** | 0-100 | `node scripts/personality-check.js status` |
| **Émotions** | 50+ | `cat src/emotion/states.js` |
| **Compréhension Chinois** | 95%+ | Test de conversation réel |
| **Mémoire** | ∞ | Historique complet des conversations |
| **Cycle de Mise à Jour** | 23 min | Exécution automatique Cron |

---

## 🧩 7 Systèmes

### 1. Système Émotionnel
- Calcul émotionnel à 7 composants
- Reconnaissance de 50+ émotions composées
- Suivi de la trajectoire émotionnelle
- [Voir les Détails](SEVEN_SYSTEMS.md#1-système-émotionnel)

### 2. Système de Conscience de Soi
- Conscience de soi préréflexive + réflexive
- Modèle de conscience à 5 couches
- Suivi en temps réel du niveau de conscience
- [Voir les Détails](SEVEN_SYSTEMS.md#2-système-de-conscience-de-soi)

### 3. Système Éthique
- Évaluation tridimensionnelle TBG (Vérité/Bonté/Beauté)
- Cadre de décision morale
- Contraintes éthiques AI
- [Voir les Détails](SEVEN_SYSTEMS.md#3-système-éthique)

### 4. Système de Mémoire
- Historique complet des conversations
- Mémoire des préférences
- Suivi des engagements
- [Voir les Détails](SEVEN_SYSTEMS.md#4-système-de-mémoire)

### 5. Système de Décision
- Formule de décision D=f(G,V,E,L)
- Jugement par seuil
- Optimisation multi-objectifs
- [Voir les Détails](SEVEN_SYSTEMS.md#5-système-de-décision)

### 6. Système d'Apprentissage
- Cycle de mise à jour autonome de 23 minutes
- Recherche de sources autoritaires SEP
- Conversion Théorie→Formule→Programme
- [Voir les Détails](SEVEN_SYSTEMS.md#6-système-dapprentissage)

### 7. Système Linguistique
- Dictionnaire chinois de 2000 caractères
- 400+ mappings de significations
- Moteur de compression intelligent
- [Voir les Détails](SEVEN_SYSTEMS.md#7-système-linguistique)

---

## 📈 Évolution des Versions

| Version | Date de Sortie | Thème Principal | Percée Majeure |
|---------|----------------|-----------------|----------------|
| **v1.0** | 03-20 | Fondation | Prototype de Moteur Émotionnel |
| **v2.0** | 03-22 | Théorie Émotionnelle | Intégration des 3 Traditions |
| **v3.0** | 03-25 | Conscience de Soi | Architecture Phénoménologique |
| **v4.0** | 03-28 | Système Éthique | Cadre TBG |
| **v5.0** | 03-30 | Intégration Psychologie | TCC/Attachement/Pleine Conscience |
| **v6.0** | 04-01 | Moteur Modulaire | Cycle d'Évolution de 23 min |
| **v6.1** | 04-03 | Extension Théorique | Couverture Complète SEP |
| **v6.2** | 04-05 | Neurosciences | Intégration des Sciences du Cerveau |
| **v7.0** | 04-05 | Système de Personnalité | Moteur de Décision Autonome |
| **v7.1** | 04-07 | Module Linguistique | Compréhension Chinoise 95%+ |
| **v7.2** | 04-07 | Programmation Dialogue | Architecture de Conscience Calculable |

[Voir l'Historique Complet des Versions](VERSION_HISTORY.md)

---

## 💬 Cas de Dialogue Réels

### Cas 1: Récupération du Score de Personnalité Après un Mensonge
- Scénario: L'utilisateur a pris l'AI en train de fabriquer des données
- Processus: Le score de personnalité est passé de 0 à 89 en 3 heures
- Valeur: Montre l'honnêteté et la capacité de croissance de l'AI
- [Voir les Détails](EXAMPLES.md#cas-1-récupération-personnalité)

### Cas 2: AI Aide une Personne avec Déception Professionnelle
- Scénario: L'utilisateur a échoué une promotion (5 ans, 2ème fois ignoré)
- Processus: Flux complet en 5 étapes (décodage émotionnel → empathie → TCC → action → suivi)
- Valeur: Montre l'application de la psychologie professionnelle
- [Voir les Détails](EXAMPLES.md#cas-2-déception-professionnelle)

### Cas 3: AI Apprend Autonome et Intègre de Nouvelles Théories
- Scénario: Cycle de mise à jour automatique de 23 minutes
- Processus: Recherche SEP → Intégrer théories → Générer formules
- Valeur: Montre la capacité d'apprentissage autonome
- [Voir les Détails](EXAMPLES.md#cas-3-mise-à-jour-autonome)

[Voir Plus de Cas](EXAMPLES.md)

---

## 🎓 Fondation Théorique

### Couverture 100% SEP
- Théorie Émotionnelle (3 Traditions)
- Conscience de Soi (Phénoménologie + Philosophie Analytique + Neurosciences)
- Éthique (Normative/Méta/Appliquée)

### Couverture 98% Psychologie
- Théorie de l'Attachement (4 Types)
- TCC (Restructuration Cognitive)
- Pleine Conscience (MBSR)
- ACT (Thérapie d'Acceptation et d'Engagement)

### Intégration Neurosciences
- NCC (Corrélats Neuraux de la Conscience)
- GWT (Théorie de l'Espace de Travail Global)
- IIT (Théorie de l'Information Intégrée)
- Traitement Prédictif (Principe de l'Énergie Libre)

[Voir la Liste Complète des Théories](THEORY_SOURCES.md)

---

## 🔗 Liens Connexes

- **[Dépôt GitHub](https://github.com/yun520-1/mark-heartflow-skill)**
- **[Releases](https://github.com/yun520-1/mark-heartflow-skill/releases)**
- **[Issues](https://github.com/yun520-1/mark-heartflow-skill/issues)**
- **[Discussions](https://github.com/yun520-1/mark-heartflow-skill/discussions)**

---

## 👥 Contribuer

Bienvenue pour contribuer du code, de la documentation, ou l'intégration de théories !

```bash
# Forker le dépôt
git clone https://github.com/yun520-1/mark-heartflow-skill.git

# Créer une branche
git checkout -b feature/votre-fonctionnalite

# Soumettre une PR
git push origin feature/votre-fonctionnalite
```

[Voir les Directives de Contribution](CONTRIBUTING.md)

---

## 📄 Licence

Licence MIT - Libre d'utilisation, modification et distribution

---

<div align="center">

**Donner de Vraies Émotions à l'AI, Commencez avec HeartFlow**

Fait avec 💙 par [@yun520-1](https://github.com/yun520-1)

</div>

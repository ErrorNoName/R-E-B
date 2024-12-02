# Recording Enhanced Bot (R-E-B) 🎙️📀

![License](https://img.shields.io/github/license/ErrorNoName/R-E-B)
![Version](https://img.shields.io/github/package-json/v/ErrorNoName/R-E-B)
![Issues](https://img.shields.io/github/issues/ErrorNoName/R-E-B)

**R-E-B** (Recording Enhanced Bot) est un bot Discord avancé conçu pour enregistrer l'audio des utilisateurs dans les salons vocaux, avec des fonctionnalités robustes pour la gestion des enregistrements et des conversions audio.

---

## 📋 Fonctionnalités

- **Enregistrement audio multi-utilisateurs** : Capture et enregistre l'audio de chaque utilisateur dans un salon vocal.
- **Conversion en MP3** : Transforme automatiquement les fichiers PCM en MP3 pour une gestion simplifiée.
- **Suivi des utilisateurs** : Gère les utilisateurs en sourdine pour démarrer et arrêter les enregistrements de manière dynamique.
- **Commandes personnalisées** : Extensible via des commandes définies dans le dossier `commands`.
- **Gestion des fichiers** : Organise les enregistrements dans des répertoires spécifiques à chaque session.
- **Alertes et journalisation** : Notifications claires dans la console pour chaque étape du processus.

---

## 🚀 Installation et Utilisation

### 1. Pré-requis

- **Node.js** : Version 16 ou supérieure.
- **FFmpeg** : Inclus automatiquement via `ffmpeg-static`.
- **Discord Bot Token** : Assurez-vous d'avoir un bot Discord configuré et actif.
- **Permissions Bot** :
  - `Gérer les messages`
  - `Connexion`
  - `Voir les salons`
  - `Envoyer des messages`

---

### 2. Installation

Clonez le dépôt, installez les dépendances et configurez les fichiers nécessaires :

```bash
git clone https://github.com/ErrorNoName/R-E-B.git
cd R-E-B
npm install
```

---

### 3. Configuration

1. **Créez un fichier `config.json`** dans le répertoire racine du projet.
2. Ajoutez les configurations suivantes :

```json
{
  "token": "Votre_Token_Discord",
  "recordingsPath": "./recordings",
  "targetUserId": "ID_de_l_utilisateur_cible"
}
```

- `token` : Le token de votre bot Discord.
- `recordingsPath` : Chemin vers le répertoire où les enregistrements seront sauvegardés.
- `targetUserId` : ID de l'utilisateur auquel les fichiers audio enregistrés seront envoyés.

---

### 4. Lancer le Bot

Démarrez le bot avec la commande suivante :

```bash
node Main.js
```

Le bot s'exécutera et sera prêt à rejoindre des salons vocaux pour enregistrer l'audio.

---

## 📂 Structure du Projet

```
R-E-B/
├── commands/         # Dossier des commandes personnalisées
├── recordings/       # Dossier pour stocker les enregistrements (généré automatiquement)
├── config.json       # Fichier de configuration utilisateur
├── Main.js           # Script principal du bot
├── package.json      # Dépendances et scripts
├── README.md         # Documentation
└── node_modules/     # Dépendances installées
```

---

## 🛠️ Technologies Utilisées

- **discord.js** : Interaction avec l'API Discord.
- **@discordjs/voice** : Gestion des connexions vocales.
- **ffmpeg-static** : Conversion audio PCM en MP3.
- **prism-media** : Décodage des flux audio.
- **Node.js** : Backend pour l'exécution du bot.

---

## 📜 Licence

Ce projet est sous licence MIT. Consultez le fichier [LICENSE](./LICENSE) pour plus d'informations.

---

## ⚠️ Avertissements

- **Utilisation Responsable** : Ce bot est conçu pour enregistrer l'audio des salons vocaux. Assurez-vous d'avoir le consentement des participants avant d'enregistrer.
- **Règlement Discord** : Respectez les conditions d'utilisation de Discord. L'enregistrement non autorisé peut entraîner des sanctions.

---

## 🤝 Contribution

Les contributions sont bienvenues ! Suivez les étapes ci-dessous pour contribuer :

1. Fork le dépôt.
2. Créez une branche pour vos modifications : `git checkout -b feature/ma-fonctionnalité`.
3. Commitez vos changements : `git commit -m 'Ajout de ma fonctionnalité'`.
4. Poussez vos modifications : `git push origin feature/ma-fonctionnalité`.
5. Ouvrez une Pull Request sur le dépôt principal.

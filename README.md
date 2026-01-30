# Sampler Web Audio - Projet Master 1 Informatique

**Étudiants :** Benyahia Amir & Kadri Dia Eddine  
**Formation :** Master 1 Informatique  
**Cours :** Web  
**Année universitaire :** 2025-2026

---

## Table des matières
- [Présentation générale](#présentation-générale)
- [Déploiement en ligne (Render)](#déploiement-en-ligne-render)
- [Architecture du projet](#architecture-du-projet)
- [Technologies et méthodologies](#technologies-et-méthodologies)
- [Répartition des tâches](#répartition-des-tâches)
- [Utilisation de l'IA](#utilisation-de-lia)
- [Features implémentées](#features-implémentées)
- [Manuel d'utilisation](#manuel-dutilisation)
- [Structure des dossiers](#structure-des-dossiers)

---

## Présentation générale

Ce projet est un **sampler audio professionnel** développé en trois versions :
1. **Frontend Vanilla JS** : Application web pure utilisant Web Audio API
2. **Backend Node.js/Express** : API REST avec MongoDB pour la gestion des presets
3. **Frontend Angular** : Version moderne avec architecture composants

L'objectif est de créer un instrument de musique virtuel permettant de charger, éditer et jouer des échantillons audio (samples), d'enregistrer des séquences, et d'appliquer des effets audio en temps réel.

---

## Déploiement en ligne (Render)

Le projet a été déployé sur la plateforme Render pour permettre une démonstration en ligne sans nécessiter d'installation locale.

### Liens de démonstration

- **Frontend Vanilla JS** : [https://projet-web-sampler.onrender.com/](https://projet-web-sampler.onrender.com/)
- **Backend API** : [https://sampler-backend-benyahia-kadri.onrender.com/](https://sampler-backend-benyahia-kadri.onrender.com/)
- **Base de données** : MongoDB Atlas (cluster cloud gratuit)

### Procédure de déploiement

#### 1. Déploiement du backend (Web Service)

Étapes réalisées pour le déploiement du backend :

1. Création d'un compte Render et connexion au dépôt GitHub
2. Configuration du service :
   - Type : Web Service
   - Root Directory : `back-end-NodeJS`
   - Build Command : `npm install`
   - Start Command : `node server.js`
   
3. Configuration des variables d'environnement (Settings → Environment) :
   ```
   MONGO_URI=mongodb+srv://amirbenyahia550_db_user:Mer.Mer.55@cluster0.hdiyjfu.mongodb.net/sampler?appName=Cluster0
   PORT=10000
   NODE_ENV=production
   ```

4. Configuration MongoDB Atlas :
   - Création d'un cluster gratuit M0
   - Ajout d'un utilisateur avec authentification
   - Configuration de l'accès réseau (0.0.0.0/0 pour autoriser les connexions Render)
   - Seeding de la base avec 5 presets initiaux (808, Basic Kit, Electronic, Hip-Hop, Steveland Vinyl)

**Note importante** : Il est essentiel de spécifier le nom de la base de données dans l'URI MongoDB (`/sampler` avant les query parameters). Sans cette précision, MongoDB utilise la base "test" par défaut, ce qui a causé des problèmes initiaux de données vides.

#### 2. Déploiement du frontend (Static Site)

Configuration du site statique :

1. Type de service : Static Site
2. Root Directory : `Web-Sampler-Studio-JS`
3. Build Command : (vide, pas de processus de build nécessaire)
4. Publish Directory : `.` (publication de l'ensemble du répertoire)

Modification du code pour la détection dynamique de l'environnement dans `index.html` :

```javascript
const baseURL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://sampler-backend-benyahia-kadri.onrender.com';
```

#### 3. Difficultés rencontrées et solutions

**Problème 1 : Conflits Git avec sous-modules**
- Situation : Les sous-dossiers contenaient leurs propres répertoires `.git/` causant des conflits lors du push
- Solution : Suppression de tous les répertoires `.git/` à l'exception de celui à la racine du projet

**Problème 2 : Base de données apparemment vide**
- Situation : MongoDB Atlas n'affichait aucune donnée après l'exécution du script de seeding
- Cause : L'URI de connexion ne spécifiait pas le nom de la base de données, MongoDB utilisait donc "test" par défaut
- Solution : Ajout de `/sampler` dans l'URI avant les paramètres de requête

**Problème 3 : API retournant un tableau vide**
- Situation : L'endpoint `/api/presets` retournait `[]` malgré le seeding
- Cause : Le fichier `.env` n'était pas chargé dans `seed.js` (contexte ES modules)
- Solution : Ajout de `import dotenv from 'dotenv'; dotenv.config();` dans le script de seeding

**Problème 4 : Latence au premier chargement**
- Situation : Le backend s'arrête après 15 minutes d'inactivité (limitation du plan gratuit Render)
- Conséquence : Le premier chargement nécessite 30-50 secondes (cold start)
- Remarque : Il s'agit du comportement normal du plan gratuit, aucune solution gratuite disponible

### Vérification du déploiement

Pour vérifier que le déploiement fonctionne correctement :

1. Test de l'API backend via curl :
   ```bash
   curl https://sampler-backend-benyahia-kadri.onrender.com/api/presets
   ```
   Doit retourner un JSON contenant 5 presets

2. Test du frontend :
   - Accéder à https://projet-web-sampler.onrender.com/
   - Sélectionner un preset dans le menu déroulant
   - Cliquer sur "Charger tout"
   - Tester la lecture d'un pad

### Architecture de déploiement

```
┌─────────────────┐          ┌──────────────────┐
│   Utilisateur   │          │   MongoDB Atlas  │
│   (Navigateur)  │          │   (Base données) │
└────────┬────────┘          └────────▲─────────┘
         │                            │
         │  HTTPS                     │ MongoDB Protocol
         ▼                            │
┌─────────────────┐          ┌────────┴─────────┐
│  Frontend (JS)  │◄────────►│  Backend (API)   │
│  Render Static  │   REST   │  Render Service  │
│  Site           │   API    │  Node.js/Express │
└─────────────────┘          └──────────────────┘
```

---

## Architecture du projet

### 1. Frontend Vanilla JS (`Web-Sampler-Studio---Live-Demo-Render-/`)
Version initiale développée avec les technologies web natives :
- Grille de 16 pads (4×4) pour déclencher les samples
- Visualisation de forme d'onde (waveform) avec contrôles de trim
- Enregistrement et lecture de séquences avec pause/resume
- Bibliothèque de séquences sauvegardées en localStorage
- Intégration Freesound.org pour rechercher des sons
- Enregistrement audio via microphone (MediaRecorder API)
- Support clavier et MIDI
- Effets audio par pad (volume, pan, pitch, reverse)

### 2. Backend Node.js (`back-end-NodeJS-API-presets-for-sounds-websites/`)
API REST complète avec base de données :
- **Framework** : Express.js
- **Base de données** : MongoDB (Mongoose ODM)
- **Upload de fichiers** : Multer avec validation MIME types
- **Routes CRUD** complètes pour les presets
- **Historique** : Tracking des modifications (pattern History)
- **Proxy CORS** : Permet d'accéder à des APIs tierces (Freesound.org)
- **Gestion d'erreurs** : Middleware centralisé
- **Sécurité** : Validation des types de fichiers, sanitization des noms

### 3. Frontend Angular (`sampler-frontend-angular/`)
Version moderne avec architecture Angular 18+ :
- **Architecture** : Standalone components (nouvelle norme Angular)
- **Routing** : Lazy loading des modules
- **Services** : Injection de dépendances pour Audio, Presets, Sequencer
- **State management** : Services réactifs avec RxJS
- **Features** :
  - Page Admin pour gestion CRUD des presets
  - Sampler avec grille de pads réactive
  - Séquenceur avancé avec pause/resume et bibliothèque
  - Enregistrement vocal avec modal interactive
  - Effets audio globaux (filter, delay, reverb)

---

## Technologies et méthodologies

### Techniques issues du cours M1InfoWebTechnos2025_2026

#### Séance 1 - Fetch API & Async/Await
- **Exemple appliqué** : Chargement des presets via `fetch()`
- **Fichiers** : 
  - `Web-Sampler-Studio.../index.html` : lignes 615-620
  - `sampler-frontend-angular/src/app/services/preset.service.ts`
```javascript
// Pattern vu en Seance1/ExampleFetchEndpoint
const response = await fetch(`${baseURL}/api/presets`);
const presets = await response.json();
```

#### Séance 2 - REST API & CRUD
- **Exemple appliqué** : Routes CRUD complètes dans le backend
- **Pattern** : GET, POST, PUT, DELETE avec Express Router
- **Fichiers** : `back-end-NodeJS-API-presets-for-sounds-websites/server.js` lignes 93-200
```javascript
// Inspiré de Seance2/ExampleRESTEndpointCorrige
app.get("/api/presets", async (req, res) => { /* ... */ });
app.post("/api/presets", async (req, res) => { /* ... */ });
app.put("/api/presets/:id", async (req, res) => { /* ... */ });
app.delete("/api/presets/:id", async (req, res) => { /* ... */ });
```

#### Séance 4 - Web Audio API
- **Exemple appliqué** : Moteur audio complet avec effets
- **Fichiers** : 
  - `Web-Sampler-Studio.../js/SamplerEngine.js`
  - `sampler-frontend-angular/src/app/services/audio.service.ts`
```javascript
// Pattern vu en Seance4_IntroWebAudio/Example2
const ctx = new AudioContext();
const source = ctx.createBufferSource();
source.buffer = audioBuffer;
source.connect(ctx.destination);
source.start(0, startTime, duration);
```

**Effets audio** (Seance4/Example3 et Example4) :
- BiquadFilter pour filtrage fréquentiel
- DelayNode pour effet d'écho
- ConvolverNode pour réverbération
- StereoPannerNode pour panoramique

#### Séance 5 - CORS & Proxy
- **Exemple appliqué** : Proxy pour contourner CORS avec Freesound.org
- **Fichier** : `back-end-NodeJS-API-presets-for-sounds-websites/server.js` lignes 295-320
```javascript
// Inspiré de Seance5/WebServicesWithCrossDomainSupport
app.get("/api/proxy-audio", async (req, res) => {
  const { url } = req.query;
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  res.send(Buffer.from(buffer));
});
```

**DropDown dynamique** (Seance5/ClientWithDynamicDropDownMenu) :
```javascript
// Groupement par catégories avec optgroups
const categories = {};
presets.forEach(preset => {
  const category = preset.type || "Uncategorized";
  if (!categories[category]) categories[category] = [];
  categories[category].push(preset);
});
```

#### Séance 6 - MediaRecorder API
- **Exemple appliqué** : Enregistrement vocal avec sauvegarde
- **Fichiers** : 
  - `Web-Sampler-Studio.../js/recorder.js`
  - `sampler-frontend-angular/src/app/services/recorder.service.ts`
```javascript
// Pattern vu en Seance6/MediaRecorderExampleAudio
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream);
mediaRecorder.ondataavailable = (event) => chunks.push(event.data);
const audioBlob = new Blob(chunks, { type: 'audio/webm' });
```

#### Séance 7 - Intégration Freesound.org
- **Exemple appliqué** : Recherche et prévisualisation de sons
- **Fichier** : `Web-Sampler-Studio.../index.html` lignes 970-1085
```javascript
// Inspiré de Seance7_freesound_API
const url = `https://freesound.org/apiv2/search/text/?query=${query}&token=${apiKey}`;
const response = await fetch(url);
const data = await response.json();
```

### Patterns avancés développés

#### 1. Gestion du timing dans le séquenceur
**Problème** : Lecture de séquences avec timing précis
**Solution** : Utilisation de timestamps absolus au lieu de délais cumulés
```javascript
// Vanilla JS
const targetTime = sequencePlaybackStart + event.time;
const waitTime = targetTime - Date.now();
if (waitTime > 0) await new Promise(resolve => setTimeout(resolve, waitTime));

// Angular
this.scheduledNotes.forEach(note => {
  const timeoutId = window.setTimeout(() => {
    this.audioService.playSample(note.padIndex);
  }, note.time);
});
```

#### 2. Pause/Resume avec préservation du contexte
```javascript
// Calcul du décalage temporel lors de la pause
pausePlayback() {
  this.pauseTime = Date.now();
  const elapsedBeforePause = this.pauseTime - this.playbackStartTime;
  // Sauvegarde de l'état
}

resumePlayback() {
  const pauseDuration = Date.now() - this.pauseTime;
  this.playbackStartTime += pauseDuration; // Ajustement du temps de référence
}
```

#### 3. Upload avec Multer et validation
```javascript
// Configuration du stockage avec sanitization
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(process.cwd(), "public/presets/recordings");
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || extFromMime(file.mimetype);
    const safeName = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"];
    if (allowedMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Type de fichier non autorisé"));
  }
});
```

#### 4. Architecture Angular avec services réactifs
```typescript
// Pattern service avec injection de dépendances
@Injectable({ providedIn: 'root' })
export class SequencerService {
  private pattern: Pattern | null = null;
  savedPatterns: Pattern[] = [];
  
  constructor(private audioService: AudioService) {
    this.loadPatternsFromStorage();
  }
  
  savePattern(name: string) {
    this.savedPatterns.push({ ...this.pattern, name });
    localStorage.setItem('patterns', JSON.stringify(this.savedPatterns));
  }
}
```

---

## Répartition des tâches

### Benyahia Amir - Frontend Angular
**Responsabilités** :
- Architecture complète de l'application Angular
- Création des composants standalone (Home, Admin, Sampler, Sequencer)
- Services réactifs (AudioService, PresetService, SequencerService)
- Système de routing avec lazy loading
- Interface d'administration des presets (CRUD)
- Intégration des effets audio (AudioEffectsComponent)
- Enregistrement vocal avec modal interactive
- Séquenceur avancé avec pause/resume et bibliothèque

**Fichiers principaux** :
- `sampler-frontend-angular/src/app/` (toute l'arborescence)
- Configuration TypeScript et build Angular

### Kadri Dia-Eddine - Frontend Vanilla JS
**Responsabilités** :
- Application web native sans framework
- Interface utilisateur avec grille de pads interactive
- Visualisation de waveform avec canvas
- Système de trim bars avec drag & drop
- Enregistrement et lecture de séquences
- Intégration Freesound.org
- Enregistrement vocal via MediaRecorder
- Support clavier et MIDI
- Effets audio par pad (volume, pan, pitch, reverse)
- Animation de fond avec canvas (formes géométriques)

**Fichiers principaux** :
- `Web-Sampler-Studio---Live-Demo-Render-/index.html`
- `Web-Sampler-Studio---Live-Demo-Render-/js/` (tous les modules)
- `Web-Sampler-Studio---Live-Demo-Render-/css/styles.css`

### Contribution commune - Backend Node.js
**Responsabilités partagées** :
- Architecture de l'API REST avec Express
- Schémas Mongoose (Preset, History)
- Routes CRUD complètes
- Gestion des uploads avec Multer
- Middleware de gestion d'erreurs
- Proxy CORS pour APIs tierces
- Documentation et commentaires en français
- Tests et validation

**Fichiers principaux** :
- `back-end-NodeJS-API-presets-for-sounds-websites/server.js`
- `back-end-NodeJS-API-presets-for-sounds-websites/models/`

---

## Utilisation de l'IA

### Outils utilisés
- **GitHub Copilot** : Assistance au codage, suggestions de code
- **ChatGPT/Claude** : Aide sur des concepts complexes, débogage

### Features développées avec assistance IA

#### 1. Système de pause/resume dans le séquenceur 
**Prompt utilisé** :
> "Je veux implémenter un système de pause/resume pour mon séquenceur audio qui joue des séquences de samples avec des timestamps. Comment gérer le timing pour que la reprise soit exacte sans décalage ? J'utilise setTimeout pour programmer les notes."

**Assistance IA** : ~40%
- Suggestion de l'approche avec timestamps absolus
- Pattern de calcul du décalage temporel lors de la pause

**Développement manuel** : ~60%
- Adaptation au contexte de notre projet
- Intégration avec l'UI et les contrôles existants
- Tests et ajustements du timing

**Fichiers** :
- `Web-Sampler-Studio.../index.html` lignes 730-800
- `sampler-frontend-angular/src/app/services/sequencer.service.ts` lignes 80-150

#### 2. Upload de fichiers avec Multer et validation 
**Prompt utilisé** :
> "Je dois créer un système d'upload de fichiers audio avec validation du type MIME, sanitization des noms de fichiers et limitation de taille. Comment configurer Multer de manière sécurisée ?"

**Assistance IA** : ~50%
- Configuration de base de Multer
- Patterns de validation de fichiers

**Développement manuel** : ~50%
- Adaptation aux besoins spécifiques (recordings)
- Gestion des extensions selon MIME type
- Intégration avec les routes existantes

**Fichiers** :
- `back-end-NodeJS-API-presets-for-sounds-websites/server.js` lignes 38-75

#### 3. Bibliothèque de séquences avec localStorage
**Prompt utilisé** :
> "Comment créer un système de sauvegarde et chargement de séquences musicales avec localStorage ? Je veux pouvoir sauvegarder plusieurs séquences, les lister, les charger et les supprimer."

**Assistance IA** : ~30%
- Structure de données JSON pour les séquences
- Patterns de manipulation de localStorage

**Développement manuel** : ~70%
- UI complète de la bibliothèque
- Intégration avec le système de séquençage existant
- Gestion du compteur et de l'affichage

**Fichiers** :
- `Web-Sampler-Studio.../index.html` lignes 850-920
- `sampler-frontend-angular/src/app/services/sequencer.service.ts` lignes 180-250

#### 4. Service d'enregistrement vocal Angular
**Prompt utilisé** :
> "Je veux créer un service Angular pour gérer l'enregistrement audio avec MediaRecorder API. Le service doit gérer le démarrage, l'arrêt, l'annulation et retourner un Blob."

**Assistance IA** : ~35%
- Structure de base du service Angular
- Gestion des promesses avec MediaRecorder

**Développement manuel** : ~65%
- Interface complète avec modal
- Conversion Blob → AudioBuffer
- Upload vers le backend
- UI avec états (prêt, enregistrement, terminé)

**Fichiers** :
- `sampler-frontend-angular/src/app/services/recorder.service.ts`
- `sampler-frontend-angular/src/app/pages/sampler-page/sampler-page.component.ts`

#### 5. Effets audio avec Web Audio API
**Prompt utilisé** :
> "Comment implémenter un système d'effets audio (filtre, delay, reverb) avec Web Audio API qui peut être activé/désactivé dynamiquement ?"

**Assistance IA** : ~25%
- Rappel des nodes Web Audio API
- Pattern de chaînage des effets

**Développement manuel** : ~75%
- Implémentation complète des 3 effets
- Génération d'impulse response pour reverb
- UI de contrôle avec sliders
- Intégration dans le flux audio existant

**Fichiers** :
- `sampler-frontend-angular/src/app/services/audio.service.ts` lignes 50-200
- `sampler-frontend-angular/src/app/components/audio-effects/`

### Features développées sans IA (100% manuel)

1. **Visualisation de waveform** - Basée sur le cours Seance4/Example2
2. **Trim bars avec drag & drop** - Adaptation du cours avec touch support
3. **Architecture Angular complète** - Connaissance du framework
4. **Routes CRUD backend** - Basées sur Seance2/ExampleRESTEndpoint
5. **Intégration Freesound.org** - Basée sur Seance7
6. **Support MIDI** - Documentation Web MIDI API
7. **Animation canvas de fond** - Créativité pure
8. **Système de presets avec MongoDB** - Mongoose officiel docs

---

## Features implémentées

### Features obligatoires 
- [x] Grille de 16 pads (4×4)
- [x] Chargement de presets via API REST
- [x] Affichage de waveform
- [x] Trim bars pour sélectionner une portion
- [x] Lecture de samples avec Web Audio API
- [x] Backend Node.js/Express
- [x] Base de données MongoDB
- [x] Routes CRUD complètes
- [x] Frontend responsive

### Features optionnelles 

#### Frontend Vanilla JS
- [x] **Enregistrement de séquences** avec timing précis
- [x] **Pause/Resume** des séquences avec préservation du contexte
- [x] **Bibliothèque de séquences** sauvegardée en localStorage
- [x] **Effets audio par pad** : volume, pan, pitch shift, reverse
- [x] **Enregistrement vocal** via MediaRecorder API avec modal
- [x] **Intégration Freesound.org** pour recherche de sons
- [x] **Support clavier** : mapping AZERTY (ZXCV, ASDF, QWER, 1234)
- [x] **Support MIDI** : Détection automatique des contrôleurs
- [x] **Animation de fond** : Canvas avec formes géométriques animées
- [x] **Drag & drop** des trim bars avec support tactile
- [x] **Playhead** animé pendant la lecture
- [x] **Progress bars** individuelles lors du chargement

#### Frontend Angular
- [x] **Architecture moderne** : Standalone components (Angular 18+)
- [x] **Routing avancé** : Lazy loading des modules
- [x] **Admin panel** : CRUD complet des presets avec interface
- [x] **Séquenceur avancé** : 
  - Enregistrement/lecture de patterns
  - Pause/resume avec timing précis
  - Bibliothèque persistante (localStorage)
  - Sauvegarde avec noms personnalisés
- [x] **Enregistrement vocal** : 
  - Modal interactive avec 3 états
  - Chronomètre en temps réel
  - Prévisualisation avant sauvegarde
  - Upload automatique vers backend
- [x] **Effets audio globaux** :
  - BiquadFilter (lowpass, highpass, bandpass)
  - Delay avec feedback
  - Reverb avec convolution
  - UI de contrôle complète
- [x] **Services réactifs** : RxJS pour le state management
- [x] **TypeScript strict** : Type safety complète

#### Backend
- [x] **Upload de fichiers** : Multer avec validation MIME et taille
- [x] **Historique des modifications** : Tracking avec modèle History
- [x] **Proxy CORS** : Accès aux APIs tierces
- [x] **Gestion d'erreurs** : Middleware centralisé
- [x] **Sécurité** : 
  - Sanitization des noms de fichiers
  - Validation des types
  - Limitation de taille (25MB)
- [x] **Commentaires détaillés** : Code documenté en français
- [x] **Variables d'environnement** : Configuration via .env

---

## Manuel d'utilisation

### Prérequis
- **Node.js** : version 18+ recommandée
- **MongoDB** : instance locale ou Atlas cloud
- **npm** : pour la gestion des dépendances

### Installation

#### 1. Backend Node.js
```bash
cd back-end-NodeJS-API-presets-for-sounds-websites

# Installer les dépendances
npm install

# Créer le fichier .env (si nécessaire)
echo "MONGODB_URI=mongodb://localhost:27017/sampler" > .env
echo "PORT=5000" >> .env

# Lancer le serveur
node server.js
```

Le backend sera accessible sur **http://localhost:5000**

**Routes disponibles** :
- `GET /api/presets` - Liste tous les presets
- `GET /api/presets/:id` - Récupère un preset par ID
- `POST /api/presets` - Crée un nouveau preset
- `PUT /api/presets/:id` - Met à jour un preset
- `DELETE /api/presets/:id` - Supprime un preset
- `POST /api/presets/upload` - Upload un fichier audio
- `GET /api/history` - Historique des modifications
- `GET /api/proxy-audio?url=...` - Proxy pour CORS

#### 2. Frontend Vanilla JS
```bash
cd Web-Sampler-Studio---Live-Demo-Render-

# Option 1: Serveur HTTP simple avec Python
python3 -m http.server 8080

# Option 2: Serveur HTTP simple avec Node.js
npx http-server -p 8080

# Option 3: Live Server (extension VS Code)
# Clic droit sur index.html > "Open with Live Server"
```

Ouvrir **http://localhost:8080** dans le navigateur

**Utilisation** :
1. Sélectionner un preset dans le menu déroulant
2. Cliquer sur "Charger tout" pour télécharger les samples
3. Cliquer sur un pad pour sélectionner le sample
4. Ajuster les trim bars (barres bleues) pour définir la portion à jouer
5. Cliquer "Play" ou appuyer sur la touche du clavier associée
6. Utiliser "Rec Sequence" pour enregistrer une séquence rythmique

**Raccourcis clavier** :
```
Pads rangée 1 : 1, 2, 3, 4
Pads rangée 2 : Q, W, E, R
Pads rangée 3 : A, S, D, F
Pads rangée 4 : Z, X, C, V
```

#### 3. Frontend Angular
```bash
cd sampler-frontend-angular

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm start

# Ou avec ng
ng serve
```

L'application sera accessible sur **http://localhost:4200**

**Navigation** :
- **Accueil** (`/`) : Page d'introduction
- **Admin** (`/admin`) : Gestion des presets (CRUD)
- **Sampler** (`/sampler`) : Interface de pads avec enregistrement vocal
- **Sequenceur** (`/sequencer`) : Séquenceur avancé avec effets

**Workflow typique** :
1. Aller dans Admin pour créer/modifier des presets
2. Aller dans Sampler pour jouer avec les pads
3. Utiliser "Enregistrer un sample vocal" pour ajouter sa voix
4. Aller dans Sequenceur pour composer des patterns
5. Utiliser Pause/Resume pendant la lecture
6. Sauvegarder les séquences dans la bibliothèque

### Configuration avancée

#### Variables d'environnement (Backend)
Créer un fichier `.env` dans `back-end-NodeJS-API-presets-for-sounds-websites/` :
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sampler
PORT=5000
NODE_ENV=development
```

#### Configuration MongoDB Atlas (Cloud)
1. Créer un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un cluster gratuit
3. Ajouter un utilisateur avec droits lecture/écriture
4. Whitelist l'adresse IP (0.0.0.0/0 pour dev)
5. Copier l'URI de connexion dans `.env`

#### Build de production Angular
```bash
cd sampler-frontend-angular
npm run build

# Les fichiers seront dans dist/sampler-frontend-angular/browser
# Servir avec un serveur HTTP
npx http-server dist/sampler-frontend-angular/browser
```

### Dépannage

#### Problème : Backend ne démarre pas
**Solution** :
```bash
# Vérifier que MongoDB est lancé
mongod --version

# Vérifier les ports occupés
lsof -ti:5000
```

#### Problème : CORS errors
**Solution** : Le backend a déjà CORS activé. Vérifier que :
```javascript
// server.js
app.use(cors()); // Ligne présente
```

#### Problème : Angular ne compile pas
**Solution** :
```bash
# Nettoyer le cache
rm -rf node_modules .angular
npm install
```

#### Problème : Sons ne se chargent pas
**Vérification** :
1. Backend lancé sur port 5000
2. Presets présents dans MongoDB
3. Fichiers audio dans `public/presets/`
4. Console navigateur pour les erreurs

---

## Structure des dossiers

```
Projet_Final/
├── Web-Sampler-Studio---Live-Demo-Render-/    # Frontend Vanilla JS
│   ├── index.html                               # Page principale
│   ├── css/
│   │   └── styles.css                           # Styles globaux
│   └── js/
│       ├── SamplerEngine.js                     # Moteur audio
│       ├── SamplerGUI.js                        # Interface pads
│       ├── waveformdrawer.js                    # Visualisation waveform
│       ├── trimbarsdrawer.js                    # Trim bars interactives
│       ├── recorder.js                          # Enregistrement vocal
│       ├── soundutils.js                        # Utilitaires audio
│       └── utils.js                             # Helpers généraux
│
├── back-end-NodeJS-API-presets-for-sounds-websites/  # Backend
│   ├── server.js                                # Serveur Express principal
│   ├── seed.js                                  # Données de test
│   ├── package.json                             # Dépendances Node
│   ├── models/
│   │   ├── presets.js                           # Schéma Mongoose Preset
│   │   └── history.js                           # Schéma Mongoose History
│   └── public/
│       └── presets/                             # Fichiers audio et JSON
│           ├── 808/                             # Kit 808
│           ├── basic-kit/                       # Kit basique
│           ├── electronic/                      # Kit électro
│           ├── hip-hop/                         # Kit hip-hop
│           ├── steveland-vinyl/                 # Kit vinyl
│           └── recordings/                      # Enregistrements utilisateur
│
├── sampler-frontend-angular/                    # Frontend Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── audio-effects/               # Composant effets audio
│   │   │   │   ├── navigation/                  # Menu navigation
│   │   │   │   ├── preset-selector/             # Admin presets
│   │   │   │   ├── sampler-grid/                # Grille de pads
│   │   │   │   └── sequencer/                   # Séquenceur
│   │   │   ├── pages/
│   │   │   │   ├── home/                        # Page accueil
│   │   │   │   └── sampler-page/                # Page sampler
│   │   │   ├── services/
│   │   │   │   ├── audio.service.ts             # Service audio
│   │   │   │   ├── preset.service.ts            # Service presets
│   │   │   │   ├── sequencer.service.ts         # Service séquenceur
│   │   │   │   └── recorder.service.ts          # Service enregistrement
│   │   │   ├── models/
│   │   │   │   └── preset.model.ts              # Types TypeScript
│   │   │   ├── app.routes.ts                    # Configuration routes
│   │   │   └── app.config.ts                    # Configuration app
│   │   └── index.html                           # Point d'entrée
│   ├── angular.json                             # Config Angular CLI
│   ├── tsconfig.json                            # Config TypeScript
│   └── package.json                             # Dépendances npm
│
├── M1InfoWebTechnos2025_2026/                   # Cours et exemples
│   ├── Seance1/                                 # Fetch API
│   ├── Seance2/                                 # REST API
│   ├── Seance4_IntroWebAudio/                   # Web Audio
│   ├── Seance5/                                 # CORS & Proxy
│   ├── Seance6/                                 # MediaRecorder
│   └── Seance7_freesound_API/                   # Freesound
│
└── README_GLOBAL.md                             # Ce fichier
```

---

**Date de remise** : 30 Janvier 2026  


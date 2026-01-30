# Fonctionnalite d'Enregistrement Vocal

## Description

Cette fonctionnalité permet aux utilisateurs d'enregistrer leur voix directement depuis le navigateur et d'ajouter l'enregistrement comme un nouveau sample dans un preset existant.

## Composants Ajoutés

### 1. RecorderService (`recorder.service.ts`)

Service Angular qui gère l'enregistrement audio via l'API MediaRecorder.

**Méthodes principales:**
- `startRecording()`: Démarre l'enregistrement après avoir demandé l'accès au microphone
- `stopRecording()`: Arrête l'enregistrement et retourne un Blob audio
- `cancelRecording()`: Annule l'enregistrement en cours
- `isRecording()`: Vérifie si un enregistrement est en cours

**Technologies utilisées:**
- `navigator.mediaDevices.getUserMedia()`: Accès au microphone
- `MediaRecorder`: Enregistrement audio natif du navigateur
- Format de sortie: WebM (par défaut)

### 2. Interface Utilisateur

**Modifications dans `sampler-page.component`:**
- Bouton "🎤 Enregistrer un sample vocal" dans la barre de contrôles
- Modal d'enregistrement avec 3 états:
  1. **Prêt**: Interface pour démarrer l'enregistrement
  2. **En cours**: Indicateur visuel (point rouge pulsant) et chronomètre
  3. **Terminé**: Options pour écouter, réessayer ou sauvegarder

**Fonctionnalités UI:**
- Chronomètre en temps réel (format MM:SS)
- Animation du point rouge pendant l'enregistrement
- Boutons pour écouter l'enregistrement avant de l'ajouter
- Design responsive et moderne

### 3. Workflow Complet

```
1. Utilisateur clique sur "Enregistrer un sample vocal"
   ↓
2. Modal s'ouvre, utilisateur clique sur "Démarrer l'enregistrement"
   ↓
3. Navigateur demande permission d'accès au microphone
   ↓
4. Enregistrement démarre, chronomètre s'affiche
   ↓
5. Utilisateur clique sur "Arrêter"
   ↓
6. Enregistrement converti en Blob puis AudioBuffer
   ↓
7. Utilisateur peut écouter avec le bouton "▶ Écouter"
   ↓
8. Clic sur "💾 Ajouter au preset"
   ↓
9. Upload du fichier vers le backend (route /api/presets/upload)
   ↓
10. Mise à jour du preset avec le nouveau sample
   ↓
11. Sample ajouté à la grille de pads
```

## Routes Backend

### Nouvelle route: POST `/api/presets/upload`

**Fonction**: Upload simple d'un fichier audio

**Paramètres:**
- `file`: Fichier audio (multipart/form-data)

**Réponse:**
```json
{
  "ok": true,
  "filePath": "recordings/recording_1234567890.webm",
  "filename": "recording_1234567890.webm",
  "originalName": "recording_1234567890.webm"
}
```

**Stockage**: Les fichiers sont sauvegardés dans `public/presets/recordings/`

## Intégration avec AudioService

Le service `audio.service.ts` a été étendu avec:
- `decodeArrayBuffer(arrayBuffer)`: Convertit un ArrayBuffer en AudioBuffer pour la lecture

Cette méthode permet de:
1. Décoder le Blob d'enregistrement en AudioBuffer
2. Jouer l'enregistrement avant de l'ajouter au preset
3. Utiliser les effets audio existants (reverb, delay, filter) sur les enregistrements

## Permissions Navigateur

L'application demande automatiquement la permission d'accès au microphone lors du premier clic sur "Démarrer l'enregistrement".

**Gestion des erreurs:**
- Si l'utilisateur refuse la permission → Alert "Impossible d'accéder au microphone"
- Si le microphone n'est pas disponible → Erreur console + message d'erreur

## Format Audio

**Format d'enregistrement:** WebM (codec par défaut du navigateur)
- Compatible avec la plupart des navigateurs modernes
- Bonne qualité audio / ratio de compression
- Décodable par Web Audio API

**Compatibilité:**
- Chrome/Edge: WebM (Opus codec)
- Firefox: WebM (Opus codec)  
- Safari: Peut varier selon la version (MP4/AAC possible)

## Styles CSS

Tous les styles de la modal et des boutons sont dans `sampler-page.component.css`:
- Animations (slide-in, pulse du point rouge)
- Design moderne avec gradients
- États hover et disabled
- Responsive design

## Améliorations Futures Possibles

1. **Choix du format audio**: Permettre à l'utilisateur de choisir le format (MP3, WAV, etc.)
2. **Visualisation en temps réel**: Afficher une forme d'onde pendant l'enregistrement
3. **Édition audio**: Ajouter des fonctionnalités de trim, fade in/out
4. **Effets en temps réel**: Appliquer des effets pendant l'enregistrement
5. **Limite de durée**: Ajouter une durée maximale d'enregistrement
6. **Métadonnées**: Permettre d'ajouter des tags, description au sample enregistré

## Code de Référence

Cette implémentation s'inspire de la version vanilla JS du projet:
- `/Web-Sampler-Studio.../js/recorder.js`: Logique d'enregistrement originale
- Adaptée pour Angular avec services injectables et reactive programming

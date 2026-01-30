# Guide de déploiement sur Render

## Étape 1 : Préparation du projet

Le projet est déjà prêt avec un `.gitignore`. Vérifiez que Git est initialisé :

```bash
cd "/Users/amir/Documents/Master1/Semestre1/web/Projet_Final/Web-Sampler-Studio---Live-Demo-Render-"
git status
```

Si ce n'est pas encore fait :
```bash
git init
git add .
git commit -m "Initial commit - Web Sampler Studio"
```

## Étape 2 : Créer un repository GitHub

1. Aller sur [github.com](https://github.com) et se connecter
2. Cliquer sur le bouton **"New repository"** (ou "+" en haut à droite)
3. Configuration du repository :
   - **Repository name** : `web-sampler-studio` (ou un autre nom)
   - **Description** : "Sampler audio professionnel - Projet Web M1 Informatique"
   - **Visibility** : Public (pour le free tier de Render)
   - **NE PAS** cocher "Initialize with README" (on a déjà des fichiers)
4. Cliquer sur **"Create repository"**

## Étape 3 : Pousser le code sur GitHub

GitHub vous donnera des commandes. Utilisez celles pour un repo existant :

```bash
# Remplacez YOUR_USERNAME par votre nom d'utilisateur GitHub
git remote add origin https://github.com/YOUR_USERNAME/web-sampler-studio.git
git branch -M main
git push -u origin main
```

Si vous avez déjà un remote origin :
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/web-sampler-studio.git
git push -u origin main
```

## Étape 4 : Créer un compte Render

1. Aller sur [render.com](https://render.com)
2. Cliquer sur **"Get Started for Free"**
3. **Se connecter avec GitHub** (recommandé pour l'intégration)
4. Autoriser Render à accéder à vos repositories

## Étape 5 : Créer un Static Site sur Render

1. Dans le dashboard Render, cliquer sur **"New +"** en haut à droite
2. Sélectionner **"Static Site"**
3. **Connecter le repository** :
   - Si vous ne voyez pas votre repo, cliquer sur "Configure account"
   - Autoriser l'accès au repository `web-sampler-studio`
   - Sélectionner le repository dans la liste
4. **Configuration du déploiement** :
   - **Name** : `web-sampler-studio` (ce sera votre URL : web-sampler-studio.onrender.com)
   - **Branch** : `main`
   - **Root Directory** : *laisser vide* (les fichiers sont à la racine)
   - **Build Command** : *laisser vide* (pas de build pour vanilla JS)
   - **Publish Directory** : `.` (point = tous les fichiers à la racine)
5. Cliquer sur **"Create Static Site"**

## Étape 6 : Attendre le déploiement

Render va :
1. Cloner votre repository
2. Publier les fichiers statiques
3. Vous donner une URL (ex: `https://web-sampler-studio.onrender.com`)

Le premier déploiement prend ~2-3 minutes.

## Étape 7 : Tester le site déployé

Une fois le déploiement terminé :
1. Cliquer sur l'URL fournie par Render
2. Vérifier que le sampler fonctionne
3. Tester le chargement des presets
4. Vérifier que les sons se jouent correctement

## Étape 8 : Configuration de l'API backend (si nécessaire)

Si votre frontend communique avec votre backend local, vous devez modifier le code :

**Option A : Backend aussi sur Render** (recommandé)
- Déployer également le backend sur Render (voir guide séparé)
- Modifier l'URL de l'API dans le code

**Option B : Backend local uniquement** (dev)
- Le site déployé ne pourra pas communiquer avec localhost
- À utiliser uniquement pour la démo frontend sans backend

### Modification du code pour l'API

Dans `index.html` ou vos fichiers JS, trouvez les appels fetch et ajoutez :

```javascript
// Détection automatique de l'environnement
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'  // Développement local
  : 'https://VOTRE-BACKEND.onrender.com';  // Production

// Exemple d'utilisation
fetch(`${API_BASE_URL}/api/presets`)
  .then(res => res.json())
  .then(data => console.log(data));
```

Puis commit et push :
```bash
git add .
git commit -m "Config: URL API dynamique pour production"
git push origin main
```

Render détectera automatiquement le push et redéploiera.

## Étape 9 : Déploiements automatiques

Chaque fois que vous faites un `git push origin main`, Render redéploie automatiquement :

```bash
# Workflow de développement
# 1. Faire des modifications
# 2. Tester en local
# 3. Commit et push
git add .
git commit -m "Fix: amélioration de la UI des pads"
git push origin main

# 4. Render redéploie automatiquement
# 5. Vérifier sur l'URL de production
```

## Étape 10 : Monitoring et logs

**Voir les logs** :
- Dashboard Render → Votre site → Onglet "Logs"
- Logs en temps réel du serveur web

**Métriques** :
- Onglet "Metrics" : trafic, bande passante, requêtes

**Redéployer manuellement** :
- Onglet "Events" → "Manual Deploy" → "Deploy latest commit"

## Avantages de Render (Free Tier)

✅ **Gratuit** pour les sites statiques  
✅ **SSL/HTTPS** automatique (certificat gratuit)  
✅ **CDN global** (chargement rapide partout dans le monde)  
✅ **Déploiement automatique** à chaque push Git  
✅ **100 GB de bande passante/mois**  
✅ **Logs en temps réel**  
✅ **Pas de limite de temps** (contrairement au free tier backend)

## Limitations

⚠️ **Bande passante** : 100 GB/mois (largement suffisant pour un projet étudiant)  
⚠️ **Pas de backend** : Les sites statiques ne peuvent pas exécuter de code serveur  
⚠️ **URLs personnalisées** : Domaine custom nécessite le plan payant

## Troubleshooting

### Problème : Le site ne charge pas
**Solution** :
- Vérifier que le "Publish Directory" est bien `.` (point)
- Vérifier que `index.html` est à la racine du repo

### Problème : Les fichiers audio ne chargent pas
**Vérification** :
1. Les fichiers audio sont dans le repo Git
2. Les chemins dans le code sont relatifs (pas de `C:/` ou `/Users/`)
3. Les fichiers ne sont pas trop gros (max 100MB par fichier)

### Problème : Les appels API échouent
**Solution** :
- Vérifier que l'URL de l'API est correcte
- Activer CORS sur le backend
- Vérifier les logs du navigateur (F12 → Console)

### Problème : Le site affiche une ancienne version
**Solution** :
```bash
# Force rebuild sur Render
# Dashboard → Events → Clear build cache & deploy
```

## URLs importantes

- **Site déployé** : `https://web-sampler-studio.onrender.com` (exemple)
- **Dashboard Render** : https://dashboard.render.com
- **GitHub Repo** : https://github.com/YOUR_USERNAME/web-sampler-studio
- **Support Render** : https://render.com/docs/static-sites

## Prochaines étapes (optionnel)

1. **Déployer le backend** : Guide séparé pour le backend Node.js
2. **Domaine personnalisé** : Configurer un nom de domaine custom
3. **Analytics** : Ajouter Google Analytics pour suivre l'utilisation
4. **SEO** : Ajouter meta tags pour le référencement
5. **PWA** : Transformer en Progressive Web App pour mode offline

---

**Créé par** : Benyahia Amir & Kadri Dia Eddine  
**Date** : Janvier 2026  
**Projet** : Sampler Web Audio - M1 Informatique

// Chargement des variables d'environnement depuis le fichier .env
import "dotenv/config";

// Import des modules Node.js et des librairies tierces
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

// Import des modeles Mongoose pour interagir avec MongoDB
import Preset from "./models/presets.js";
import History from "./models/history.js";

// Import de multer pour gerer l'upload de fichiers
import multer from "multer";

// Initialisation de l'application Express
const app = express();

// Configuration des middlewares
app.use(cors()); // Permet les requetes cross-origin depuis le frontend
app.use(express.json()); // Parse automatiquement le JSON dans le body des requetes

// Sert les fichiers audio statiques depuis le dossier public/presets
app.use("/presets", express.static(path.join(process.cwd(), "public/presets")));

// Fonction utilitaire pour determiner l'extension du fichier selon son type MIME
function extFromMime(mime) {
  if (!mime) return ".webm";
  if (mime.includes("wav")) return ".wav";
  if (mime.includes("mpeg")) return ".mp3";
  if (mime.includes("ogg")) return ".ogg";
  if (mime.includes("webm")) return ".webm";
  return ".webm";
}

// Configuration du stockage des fichiers uploadés avec multer
// Les fichiers sont sauvegardes dans public/presets/recordings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine le dossier de destination
    const dest = path.join(process.cwd(), "public/presets/recordings");
    // Cree le dossier s'il n'existe pas
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Recupere l'extension du fichier original ou la deduit du MIME type
    const ext = path.extname(file.originalname || "") || extFromMime(file.mimetype);
    
    // Securise le nom du fichier en supprimant les caracteres speciaux
    const safe = (req.body.sampleName || "sample")
      .toString()
      .trim()
      .replace(/\s+/g, "_")               // Remplace les espaces par des underscores
      .replace(/[^a-zA-Z0-9_\-]/g, "")   // Supprime tous les caracteres non alphanumeriques
      .slice(0, 40);                      // Limite la longueur a 40 caracteres

    // Genere un nom unique avec timestamp + random + nom securise
    cb(null, `${Date.now()}_${Math.random().toString(16).slice(2)}_${safe}${ext}`);
  }
});

// Configuration multer avec validation des types de fichiers
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Limite la taille du fichier a 25 MB
  fileFilter: (req, file, cb) => {
    // Liste des types MIME autorises pour les fichiers audio
    const allowedMimeTypes = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/webm"];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true); // Fichier accepte
    } else {
      cb(new Error("Type de fichier non autorisé. Seuls les fichiers audio sont acceptés."));
    }
  }
});

// Route de verification du serveur
app.get("/health", (req, res) => res.send("ok"));

// Verification de la presence de la variable d'environnement MONGO_URI
if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing");

// Connexion a la base de donnees MongoDB
await mongoose.connect(process.env.MONGO_URI);
console.log("MongoDB connected");

// ==================== ROUTES API ====================

// Route GET pour recuperer l'historique des modifications
app.get("/api/history", async (req, res) => {
  try {
    // Recupere les 50 dernieres operations triees par date decroissante
    const history = await History.find().sort({ timestamp: -1 }).limit(50);
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route GET pour recuperer tous les presets depuis MongoDB
app.get("/api/presets", async (req, res) => {
  try {
    // Recupere tous les presets et les trie par date de creation (plus recents en premier)
    const presets = await Preset.find().sort({ createdAt: -1 });
    res.json(presets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route PUT pour mettre a jour le nom d'un preset existant
app.put("/api/presets/:id", async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Le nom est requis" });
    }

    const oldPreset = await Preset.findById(req.params.id);
    const preset = await Preset.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true }
    );
    
    if (!preset) {
      return res.status(404).json({ error: "Preset non trouvé" });
    }
    
    // Enregistrement de l'operation dans l'historique
    await History.create({
      action: 'UPDATE',
      presetId: preset._id,
      presetName: preset.name,
      details: `Renommé de "${oldPreset?.name}" à "${preset.name}"`
    });
    
    res.json(preset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route POST pour creer un nouveau preset vide
app.post("/api/presets", async (req, res) => {
  try {
    const { name, category, samples } = req.body;
    
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Le nom est requis" });
    }
    
    const preset = await Preset.create({
      name: name.trim(),
      category: category || "Other",
      samples: samples || []
    });
    
    // Enregistrement de la creation dans l'historique
    await History.create({
      action: 'CREATE',
      presetId: preset._id,
      presetName: preset.name,
      details: `Nouveau preset créé avec ${preset.samples.length} sample(s)`
    });
    
    res.status(201).json(preset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route DELETE pour supprimer un preset de la base de donnees
app.delete("/api/presets/:id", async (req, res) => {
  try {
    const preset = await Preset.findByIdAndDelete(req.params.id);
    
    if (!preset) {
      return res.status(404).json({ error: "Preset non trouvé" });
    }
    
    // Enregistrement de la suppression dans l'historique
    await History.create({
      action: 'DELETE',
      presetId: preset._id,
      presetName: preset.name,
      details: `Preset supprimé (${preset.samples.length} samples)`
    });
    
    res.json({ message: "Preset supprimé avec succès", preset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route POST pour ajouter un sample enregistre a un preset existant (avec upload)
app.post("/api/presets/:id/samples", upload.single("audio"), async (req, res) => {
  try {
    const { sampleName, padIndex } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Fichier audio requis" });
    }

    const preset = await Preset.findById(req.params.id);
    if (!preset) {
      return res.status(404).json({ error: "Preset non trouvé" });
    }

    // Creation de l'objet sample avec les informations du fichier uploade
    const sample = {
      name: (sampleName || "Mic").trim(),
      url: `recordings/${req.file.filename}`, // Chemin relatif vers le fichier
      padIndex: Number.isFinite(Number(padIndex)) ? Number(padIndex) : null,
    };

    // Ajout du sample a la liste des samples du preset
    preset.samples.push(sample);
    // Sauvegarde des modifications dans MongoDB
    await preset.save();

    res.status(201).json({ ok: true, preset, sample });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route POST pour creer un nouveau preset directement avec un premier sample (upload)
app.post("/api/presets/create-with-sample", upload.single("audio"), async (req, res) => {
  try {
    const { type, name, category, sampleName, padIndex } = req.body;

    // Validation : fichier audio obligatoire
    if (!req.file) {
      return res.status(400).json({ error: "Fichier audio requis" });
    }
    
    // Validation : nom et type obligatoires
    if (!name || !type) {
      return res.status(400).json({ error: "Les champs 'name' et 'type' sont requis" });
    }

    // Creation d'un nouveau preset avec le sample uploade
    const preset = await Preset.create({
      type: type.trim(),
      name: name.trim(),
      category: (category || "Other").trim(),
      samples: [{
        name: (sampleName || "Mic").trim(),
        url: `recordings/${req.file.filename}`,
        padIndex: Number.isFinite(Number(padIndex)) ? Number(padIndex) : null,
      }]
    });

    res.status(201).json({ ok: true, preset });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Route POST pour upload simple d'un fichier audio (retourne juste le chemin)
// Utilisee par la fonctionnalite d'enregistrement vocal du frontend
app.post("/api/presets/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier fourni" });
    }

    // Retourne le chemin relatif du fichier uploade
    const filePath = `recordings/${req.file.filename}`;
    
    res.status(200).json({ 
      ok: true, 
      filePath,
      filename: req.file.filename,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    res.status(500).json({ error: "Erreur lors de l'upload du fichier" });
  }
});

// Route proxy pour contourner les problemes CORS lors du chargement d'URLs externes
// Permet au frontend de charger des sons depuis des APIs tierces comme Freesound.org
const PORT = process.env.PORT || 5000;

app.get("/api/proxy-audio", async (req, res) => {
  try {
    const { url } = req.query;
    
    // Validation : URL obligatoire
    if (!url) {
      return res.status(400).json({ error: "URL manquante" });
    }

    // Verification de securite : seules les URLs HTTP/HTTPS sont autorisees
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({ error: "URL invalide" });
    }

    // Requete HTTP vers l'URL externe pour recuperer le fichier audio
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: "Impossible de récupérer le fichier" });
    }

    // Copie du Content-Type de la reponse externe
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Conversion et envoi du fichier audio au client
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    console.error("Erreur proxy audio:", error);
    res.status(500).json({ error: "Erreur lors de la récupération du fichier audio" });
  }
});

// Demarrage du serveur Express
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

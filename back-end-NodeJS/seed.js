import mongoose from "mongoose";
import Preset from "./models/presets.js";
import fs from "fs";
import path from "path";

// URL de connexion a MongoDB (locale ou cloud)
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sampler";

// Connexion a la base de donnees
await mongoose.connect(MONGO_URI);
console.log("Connecte a MongoDB");

// Suppression des presets existants pour repartir d'une base propre
await Preset.deleteMany();
console.log("Anciens presets supprimes");

// Chemin vers le dossier contenant les fichiers JSON des presets
const presetsDir = path.join(process.cwd(), "public/presets");

// Liste des fichiers presets a importer
const presetFiles = ["808.json", "basic-kit.json", "electronic.json", "hip-hop.json", "steveland-vinyl.json"];

let count = 0;

// Boucle pour charger chaque preset depuis son fichier JSON
for (const file of presetFiles) {
  const filePath = path.join(presetsDir, file);
  
  // Verification de l'existence du fichier
  if (fs.existsSync(filePath)) {
    // Lecture et parsing du fichier JSON
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    
    // Creation du preset dans MongoDB avec les donnees du JSON
    await Preset.create({
      name: data.name,
      type: data.type || "Drumkit",
      category: data.type || "Drums",
      samples: data.samples || []
    });
    
    count++;
    console.log(`Preset "${data.name}" importe (${data.samples?.length || 0} samples)`);
  } else {
    console.log(`Fichier non trouve: ${file}`);
  }
}

// Affichage du resultat final
console.log(`\n${count} presets inseres avec succes dans la base de donnees`);
process.exit();


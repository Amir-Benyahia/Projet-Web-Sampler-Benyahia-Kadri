import mongoose from "mongoose";

// Schema Mongoose pour un sample audio individuel
// Un sample represente un fichier son avec son nom et son URL
const SampleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },     // Nom du sample (ex: "Kick", "Snare")
    url: { type: String, required: true },       // Chemin vers le fichier audio
    padIndex: { type: Number, default: null },   // Position du pad (0-15), optionnel
  },
  { _id: false } // Pas d'ID genere pour les sous-documents
);

// Schema Mongoose pour un preset complet
// Un preset est une collection de samples organises (ex: kit de batterie)
const PresetSchema = new mongoose.Schema(
  {
    type: { type: String, default: "Unknown" },      // Type de preset (ex: "Drumkit", "Electronic")
    name: { type: String, required: true },          // Nom du preset (ex: "808 Kit")
    category: { type: String, default: "Other" },    // Categorie (ex: "Drums", "Synth")
    samples: { type: [SampleSchema], default: [] }   // Liste des samples du preset
  },
  { timestamps: true } // Ajoute createdAt et updatedAt automatiquement
);

// Export du modele Mongoose pour utilisation dans les routes
export default mongoose.model("Preset", PresetSchema);
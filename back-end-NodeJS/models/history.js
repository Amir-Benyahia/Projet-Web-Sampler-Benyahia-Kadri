import mongoose from 'mongoose';

// Schema Mongoose pour l'historique des operations sur les presets
// Permet de tracer toutes les modifications (creation, mise a jour, suppression)
const historySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE']  // Types d'actions autorises
  },
  presetId: {
    type: mongoose.Schema.Types.ObjectId,  // Reference au preset concerne
    ref: 'Preset'
  },
  presetName: {
    type: String,
    required: true  // Nom du preset pour reference rapide
  },
  details: {
    type: String  // Description detaillee de l'operation effectuee
  },
  timestamp: {
    type: Date,
    default: Date.now  // Date et heure de l'operation
  }
});

// Export du modele pour utilisation dans les routes
export default mongoose.model('History', historySchema);

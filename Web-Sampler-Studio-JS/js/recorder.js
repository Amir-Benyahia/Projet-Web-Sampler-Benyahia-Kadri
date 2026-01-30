// Classe pour enregistrer de l'audio depuis le microphone
// Utilise l'API MediaRecorder du navigateur
// Permet de capturer l'audio et de le convertir en AudioBuffer pour le sampler
export default class Recorder {
  constructor(audioCtx) {
    // Contexte audio pour decoder les enregistrements
    this.audioCtx = audioCtx;
    
    // Instance du MediaRecorder (cree lors de l'enregistrement)
    this.mediaRecorder = null;
    
    // Stream audio du microphone
    this.stream = null;
    
    // Chunks de donnees audio recus pendant l'enregistrement
    this.chunks = [];
  }

  // Demarre l'enregistrement audio depuis le microphone
  // Demande l'autorisation utilisateur via getUserMedia
  async start() {
    // Demande d'acces au microphone
    // Le navigateur affiche une popup de permission
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Reinitialisation des chunks pour un nouvel enregistrement
    this.chunks = [];

    // Creation du MediaRecorder sur le stream audio
    this.mediaRecorder = new MediaRecorder(this.stream);
    
    // Callback appele quand des donnees audio sont disponibles
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };

    // Demarrage de l'enregistrement
    this.mediaRecorder.start();
  }

  // Arrete l'enregistrement et retourne les donnees audio
  // Retourne un objet { blob, audioBuffer }
  async stop() {
    if (!this.mediaRecorder) return null;

    const mr = this.mediaRecorder;

    // Attente de l'arret complet du MediaRecorder
    // On utilise une Promise pour rendre l'operation asynchrone
    await new Promise((resolve) => {
      mr.onstop = resolve;
      mr.stop();  // Declenchement de l'arret
    });

    // Fermeture du stream du microphone
    // Important pour liberer les ressources et eteindre le voyant micro
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }

    // Creation d'un Blob a partir des chunks enregistres
    // Le Blob est au format audio/webm ou autre selon le navigateur
    const blob = new Blob(this.chunks, { type: mr.mimeType || "audio/webm" });
    
    // Conversion du Blob en ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();
    
    // Decodage de l'ArrayBuffer en AudioBuffer utilisable par Web Audio API
    // Cette operation peut prendre du temps pour les longs enregistrements
    const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);

    // Nettoyage
    this.mediaRecorder = null;
    this.chunks = [];

    // Retour des deux formats : blob pour upload, audioBuffer pour playback
    return { blob, audioBuffer };
  }
}
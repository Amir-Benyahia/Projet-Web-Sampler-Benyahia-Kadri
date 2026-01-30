// Fonction utilitaire pour telecharger un fichier avec suivi de progression
// Utilise l'API Fetch et les streams pour lire les donnees progressivement
// Parametre onProgress : callback appele avec (octets recus, total octets)
async function fetchArrayBufferWithProgress(url, onProgress) {
  // Envoi de la requete HTTP
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Recuperation de la taille totale du fichier depuis les headers HTTP
  const total = Number(res.headers.get("Content-Length")) || 0;

  // Cas particulier : pas de body stream disponible
  // On recupere tout le fichier d'un coup
  if (!res.body) {
    const ab = await res.arrayBuffer();
    onProgress?.(ab.byteLength, ab.byteLength);
    return ab;
  }

  // Lecture du stream par morceaux (chunks)
  const reader = res.body.getReader();
  const chunks = [];
  let recvd = 0;

  // Boucle de lecture des chunks
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;  // Fin du stream
    chunks.push(value);
    recvd += value.byteLength;
    // Notification de la progression
    onProgress?.(recvd, total);
  }

  // Fusion de tous les chunks en un seul ArrayBuffer
  const merged = new Uint8Array(recvd);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return merged.buffer;
}

// Classe principale du moteur de sampler
// Gere le chargement, le stockage et la lecture des samples audio
export default class SamplerEngine {
  constructor(audioCtx, callbacks = {}) {
    // Contexte audio Web Audio API
    this.audioCtx = audioCtx;
    
    // Callbacks pour notifier l'interface (onStatus, onProgress, onPlay)
    this.callbacks = callbacks;
    
    // Tableaux pour stocker les informations des 16 pads
    this.samples = new Array(16).fill(null);   // URLs des samples
    this.names = new Array(16).fill("");        // Noms des samples
    this.buffers = new Array(16).fill(null);    // Buffers audio decodes
    this.originalBuffers = new Array(16).fill(null);  // Buffers originaux pour restore apres reverse
    
    // Noeud de gain principal pour controler le volume global
    // Tous les sons passeront par ce noeud avant d'arriver aux haut-parleurs
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 1;  // Volume a 100%
    this.masterGain.connect(this.audioCtx.destination);
    
    // EFFETS AUDIO PAR PAD : volume et pan individuels
    // Chaque pad a son propre gain et stereo panner
    this.padGains = new Array(16).fill(null);  // Gain nodes par pad
    this.padPanners = new Array(16).fill(null); // Panner nodes par pad
    
    // Initialisation des effets par pad
    for (let i = 0; i < 16; i++) {
      // Creation d'un noeud de gain pour controler le volume du pad
      this.padGains[i] = this.audioCtx.createGain();
      this.padGains[i].gain.value = 1.0;  // Volume par defaut 100%
      
      // Creation d'un noeud de panoramique stereo
      this.padPanners[i] = this.audioCtx.createStereoPanner();
      this.padPanners[i].pan.value = 0;  // Centre par defaut
      
      // Chaine d'effets : source -> gain -> pan -> masterGain
      this.padGains[i].connect(this.padPanners[i]);
      this.padPanners[i].connect(this.masterGain);
    }

    // Ensemble des sources audio en cours de lecture
    // Permet de stopper tous les sons simultanement
    this.activeSources = new Set(); 
  }

  // Stoppe tous les sons en cours de lecture
  stopAll() {
    for (const s of this.activeSources) {
      try { s.stop(); } catch {}
    }
    this.activeSources.clear();
  }

  // Met a jour la liste des samples a charger
  // Parametres : urls (array d'URLs), names (array de noms)
  updateSamples(urls, names) {
    const N = 16;  // Nombre de pads
    this.samples = new Array(N).fill(null);
    this.names = new Array(N).fill("");
    this.buffers = new Array(N).fill(null);

    // Affectation des URLs et noms aux slots
    for (let i = 0; i < Math.min(N, urls.length); i++) {
      this.samples[i] = urls[i];
      this.names[i] = (names && names[i]) ? names[i] : `Sound ${i + 1}`;
    }
  }

  // Retourne l'etat de tous les slots (pads)
  // Utilise par l'interface pour savoir quels pads sont remplis
  getSlots() {
    return this.samples.map((url, i) => ({
      url,
      name: this.names[i] || "",
      empty: !url  // true si aucun sample affecte
    }));
  }

  // Charge tous les samples en parallele
  // Plus rapide que de charger un par un
  async loadAllParallel() {
    // Creation d'une Promise pour chaque sample a charger
    const jobs = this.samples
      .map((url, i) => ({ url, i }))
      .filter(x => !!x.url)  // Ne garde que les slots non vides
      .map(x => this.loadSample(x.url, x.i));

    // Attend que tous les chargements soient termines
    await Promise.all(jobs);
  }

  // Charge un sample individuel
  // index : position du pad (0-15)
  async loadSample(url, index) {
    try {
      // Notification : debut de chargement
      this.callbacks.onStatus?.(index, { phase: "loading", message: "Chargement..." });

      // Telechargement du fichier avec suivi de progression
      const arrayBuffer = await fetchArrayBufferWithProgress(url, (recvd, total) => {
        this.callbacks.onProgress?.(index, recvd, total);
      });

      // Decodage de l'ArrayBuffer en AudioBuffer utilisable par Web Audio API
      // Cette operation peut prendre du temps pour les gros fichiers
      this.buffers[index] = await this.audioCtx.decodeAudioData(arrayBuffer);

      // Notifications : chargement termine
      this.callbacks.onProgress?.(index, 1, 1);
      this.callbacks.onStatus?.(index, { phase: "ready", message: "Pret" });
    } catch (err) {
      console.error(err);
      this.callbacks.onStatus?.(index, { phase: "error", message: err.message });
    }
  }

  // Joue un sample complet
  // pitchRate : vitesse de lecture (0.5 = moitie vitesse, 2 = double vitesse)
  async play(index, pitchRate = 1) {
    const buffer = this.buffers[index];
    if (!buffer) return;

    // Reprise du contexte audio si necessaire (politique des navigateurs)
    if (this.audioCtx.state === "suspended") await this.audioCtx.resume();

    // Creation d'une source audio
    // Chaque lecture necessite une nouvelle source (usage unique)
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    
    // POINT 12a : Application du pitch shift via playbackRate
    source.playbackRate.value = pitchRate;
    
    // Connexion avec effets individuels du pad
    // source -> padGain -> padPanner -> masterGain -> destination
    source.connect(this.padGains[index]);
    
    // Demarrage de la lecture
    source.start();
    
    // Gestion des sources actives
    this.activeSources.add(source);
    source.onended = () => this.activeSources.delete(source);

    // Notification vers l'interface
    this.callbacks.onPlay?.(index);
  }

  // Joue un segment specifique d'un sample (trim)
  // startSec : temps de debut en secondes
  // endSec : temps de fin en secondes
  // pitchRate : vitesse de lecture (0.5 = moitie vitesse, 2 = double vitesse)
  async playSegment(index, startSec, endSec, pitchRate = 1) {
    const buffer = this.buffers[index];
    if (!buffer) return;

    // Reprise du contexte audio si necessaire
    if (this.audioCtx.state === "suspended") await this.audioCtx.resume();

    // Calcul des bornes de lecture
    const start = Math.max(0, startSec || 0);
    const end = Math.min(buffer.duration, endSec ?? buffer.duration);
    const dur = Math.max(0.001, end - start);  // Duree minimale pour eviter les erreurs
    
    // Creation et configuration de la source
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    
    // POINT 12a : Application du pitch shift via playbackRate
    // 0.5 = moitie vitesse (plus grave), 2 = double vitesse (plus aigu)
    source.playbackRate.value = pitchRate;
    
    // Connexion avec effets individuels du pad
    source.connect(this.padGains[index]);
    
    // Lecture avec offset et duree
    // start(when, offset, duration)
    source.start(0, start, dur);
    
    // Gestion de l'ensemble des sources actives
    this.activeSources.add(source);
    source.onended = () => this.activeSources.delete(source);

    this.callbacks.onPlay?.(index);
  }
  
  // Methodes pour controler les effets par pad
  
  // Regle le volume d'un pad specifique (0.0 a 1.0)
  setPadVolume(index, volume) {
    if (index >= 0 && index < 16 && this.padGains[index]) {
      this.padGains[index].gain.value = Math.max(0, Math.min(1, volume));
    }
  }
  
  // Regle le panoramique stereo d'un pad (-1.0 = gauche, 0 = centre, 1.0 = droite)
  setPadPan(index, pan) {
    if (index >= 0 && index < 16 && this.padPanners[index]) {
      this.padPanners[index].pan.value = Math.max(-1, Math.min(1, pan));
    }
  }
  
  // Obtient le volume actuel d'un pad
  getPadVolume(index) {
    return this.padGains[index]?.gain.value || 1.0;
  }
  
  // Obtient le pan actuel d'un pad
  getPadPan(index) {
    return this.padPanners[index]?.pan.value || 0;
  }
  
  // POINT 12a : Reverse buffer
  // Inverse completement le buffer audio d'un pad
  reversePadBuffer(index) {
    const buffer = this.buffers[index];
    if (!buffer) return;
    
    // Sauvegarde du buffer original si pas deja fait
    if (!this.originalBuffers[index]) {
      this.originalBuffers[index] = buffer;
    }
    
    // Creation d'un nouveau buffer avec les memes caracteristiques
    const reversedBuffer = this.audioCtx.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    
    // Inversion des samples pour chaque canal
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const originalData = buffer.getChannelData(channel);
      const reversedData = reversedBuffer.getChannelData(channel);
      
      // Copie en ordre inverse
      for (let i = 0; i < buffer.length; i++) {
        reversedData[i] = originalData[buffer.length - 1 - i];
      }
    }
    
    // Remplacement du buffer par la version inversee
    this.buffers[index] = reversedBuffer;
  }
  
  // Restaure le buffer original (annule le reverse)
  restoreOriginalBuffer(index) {
    if (this.originalBuffers[index]) {
      this.buffers[index] = this.originalBuffers[index];
    }
  }
}

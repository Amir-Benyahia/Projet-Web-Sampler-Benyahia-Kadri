import { Injectable } from '@angular/core';

/**
 * Service pour gérer l'AudioContext et la lecture de samples avec effets audio
 */
@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  
  // Map des buffers par padIndex pour le sequencer
  private padBuffers: Map<number, AudioBuffer> = new Map();
  
  // Nodes pour les effets audio
  private filterNode: BiquadFilterNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayGainNode: GainNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  
  // État des effets
  private filterEnabled = false;
  private delayEnabled = false;
  private reverbEnabled = false;

  // Sources audio actives pour pouvoir les arrêter
  private activeSources: AudioBufferSourceNode[] = [];

  constructor() {}

  /**
   * Initialise l'AudioContext (doit être appelé après une interaction utilisateur)
   */
  initAudioContext(): void {
    if (typeof window === 'undefined') {
      return; // Pas d'AudioContext côté serveur
    }
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);
      this.masterGainNode.gain.value = 0.7;
      
      // Initialiser les nodes d'effets
      this.initEffects();
    }
  }

  /**
   * Initialise les nodes d'effets audio
   */
  private initEffects(): void {
    if (!this.audioContext) return;

    // Filtre (BiquadFilter)
    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 20000;
    this.filterNode.Q.value = 1;

    // Delay (Echo)
    this.delayNode = this.audioContext.createDelay();
    this.delayNode.delayTime.value = 0.3;
    
    this.delayGainNode = this.audioContext.createGain();
    this.delayGainNode.gain.value = 0.5;

    // Reverb (Convolver)
    this.convolverNode = this.audioContext.createConvolver();
    this.createReverbImpulse();
  }

  /**
   * Crée un impulse response simple pour la reverb
   */
  private createReverbImpulse(): void {
    if (!this.audioContext || !this.convolverNode) return;

    const length = this.audioContext.sampleRate * 2; // 2 secondes de reverb
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    // Générer un impulse simple avec decay
    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (this.audioContext.sampleRate * 0.5));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    this.convolverNode.buffer = impulse;
  }

  /**
   * Charge un fichier audio et retourne l'AudioBuffer
   */
  async loadAudioBuffer(url: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      this.initAudioContext();
    }

    // Vérifier si déjà en cache
    if (this.audioBuffers.has(url)) {
      return this.audioBuffers.get(url)!;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      
      // Mettre en cache
      this.audioBuffers.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Erreur lors du chargement du sample:', url, error);
      throw error;
    }
  }

  /**
   * Décode un ArrayBuffer en AudioBuffer (utilisé pour les enregistrements vocaux)
   */
  async decodeArrayBuffer(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      this.initAudioContext();
    }

    try {
      return await this.audioContext!.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Erreur lors du décodage de l\'ArrayBuffer:', error);
      throw error;
    }
  }

  /**
   * Joue un AudioBuffer avec effets appliqués
   */
  playBuffer(buffer: AudioBuffer, startTime: number = 0, duration?: number): void {
    if (!this.audioContext || !this.masterGainNode) {
      this.initAudioContext();
    }

    const source = this.audioContext!.createBufferSource();
    source.buffer = buffer;
    
    // Ajouter aux sources actives
    this.activeSources.push(source);
    
    // Supprimer de la liste quand terminé
    source.onended = () => {
      const index = this.activeSources.indexOf(source);
      if (index > -1) {
        this.activeSources.splice(index, 1);
      }
    };
    
    let currentNode: AudioNode = source;
    
    // Appliquer le filtre si activé
    if (this.filterEnabled && this.filterNode) {
      currentNode.connect(this.filterNode);
      currentNode = this.filterNode;
    }
    
    // Appliquer le delay si activé
    if (this.delayEnabled && this.delayNode && this.delayGainNode) {
      const delayOutput = this.audioContext!.createGain();
      delayOutput.gain.value = 0.5;
      
      currentNode.connect(delayOutput);
      currentNode.connect(this.delayNode);
      this.delayNode.connect(this.delayGainNode);
      this.delayGainNode.connect(delayOutput);
      
      currentNode = delayOutput;
    }
    
    // Appliquer la reverb si activée
    if (this.reverbEnabled && this.convolverNode) {
      const reverbOutput = this.audioContext!.createGain();
      reverbOutput.gain.value = 1.0;
      
      currentNode.connect(reverbOutput);
      currentNode.connect(this.convolverNode);
      this.convolverNode.connect(reverbOutput);
      
      currentNode = reverbOutput;
    }
    
    // Toujours connecter au master gain
    currentNode.connect(this.masterGainNode!);
    
    // Démarrer la lecture
    if (duration) {
      source.start(0, startTime, duration);
    } else {
      source.start(0, startTime);
    }
  }

  /**
   * Joue un sample par son index (utilisé par le sequencer)
   */
  playSample(sampleIndex: number): void {
    const buffer = this.padBuffers.get(sampleIndex);
    if (buffer) {
      console.log('Lecture sample pad', sampleIndex);
      this.playBuffer(buffer);
    } else {
      console.warn('Pas de buffer pour le pad', sampleIndex);
    }
  }
  
  /**
   * Enregistre un buffer pour un pad (appelé par sampler-grid)
   */
  setPadBuffer(padIndex: number, buffer: AudioBuffer): void {
    this.padBuffers.set(padIndex, buffer);
  }

  // ========== CONTRÔLES DES EFFETS ==========

  /**
   * Active/désactive le filtre
   */
  setFilterEnabled(enabled: boolean): void {
    this.filterEnabled = enabled;
  }

  /**
   * Définit le type de filtre
   */
  setFilterType(type: BiquadFilterType): void {
    if (this.filterNode) {
      this.filterNode.type = type;
    }
  }

  /**
   * Définit la fréquence de coupure du filtre (Hz)
   */
  setFilterFrequency(frequency: number): void {
    if (this.filterNode) {
      this.filterNode.frequency.value = frequency;
    }
  }

  /**
   * Active/désactive le delay
   */
  setDelayEnabled(enabled: boolean): void {
    this.delayEnabled = enabled;
  }

  /**
   * Définit le temps de delay (secondes)
   */
  setDelayTime(time: number): void {
    if (this.delayNode) {
      this.delayNode.delayTime.value = time;
    }
  }

  /**
   * Définit le feedback du delay (0-1)
   */
  setDelayFeedback(feedback: number): void {
    if (this.delayGainNode) {
      this.delayGainNode.gain.value = Math.max(0, Math.min(1, feedback));
    }
  }

  /**
   * Active/désactive la reverb
   */
  setReverbEnabled(enabled: boolean): void {
    this.reverbEnabled = enabled;
  }

  /**
   * Retourne l'état des effets
   */
  getEffectsState() {
    return {
      filterEnabled: this.filterEnabled,
      delayEnabled: this.delayEnabled,
      reverbEnabled: this.reverbEnabled,
      filterFrequency: this.filterNode?.frequency.value || 20000,
      filterType: this.filterNode?.type || 'lowpass',
      delayTime: this.delayNode?.delayTime.value || 0.3,
      delayFeedback: this.delayGainNode?.gain.value || 0.5
    };
  }

  /**
   * Définit le volume master (0 à 1)
   */
  setMasterVolume(volume: number): void {
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Obtient le volume master actuel
   */
  getMasterVolume(): number {
    return this.masterGainNode?.gain.value || 0.7;
  }

  /**
   * Récupère l'AudioContext
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Arrête tous les sons en cours de lecture
   */
  stopAllSounds(): void {
    // Arrêter toutes les sources actives
    this.activeSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Ignorer les erreurs si la source est déjà arrêtée
      }
    });
    
    // Vider le tableau des sources actives
    this.activeSources = [];
  }

  /**
   * Retourne le nombre de sons en cours de lecture
   */
  getActiveSourcesCount(): number {
    return this.activeSources.length;
  }
}

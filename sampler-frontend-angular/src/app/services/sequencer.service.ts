import { Injectable } from '@angular/core';
import { AudioService } from './audio.service';

export interface SequenceNote {
  padIndex: number;
  time: number; // Temps relatif en millisecondes depuis le debut
}

export interface Pattern {
  id?: string;
  name: string;
  notes: SequenceNote[];
  duration: number; // Duree totale du pattern en ms
  bpm: number;
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SequencerService {
  private recording = false;
  private playing = false;
  private paused = false;
  private pattern: Pattern | null = null;
  private recordStartTime = 0;
  private playbackStartTime = 0;
  private pauseTime = 0;
  private scheduledNotes: number[] = []; // IDs des timeouts
  private loopTimer: any = null;
  
  bpm = 120; // BPM par defaut
  isRecording = false;
  isPlaying = false;
  isPaused = false;
  
  // Liste des patterns sauvegardes
  savedPatterns: Pattern[] = [];
  currentPatternIndex: number | null = null;

  constructor(private audioService: AudioService) {
    this.loadPatternsFromStorage();
  }

  // Demarrer l'enregistrement
  startRecording() {
    this.recording = true;
    this.isRecording = true;
    this.pattern = {
      id: this.generateId(),
      name: `Sequence ${this.savedPatterns.length + 1}`,
      notes: [],
      duration: 0,
      bpm: this.bpm,
      createdAt: new Date()
    };
    this.recordStartTime = Date.now();
  }

  // Enregistrer une note jouee
  recordNote(padIndex: number) {
    if (!this.recording || !this.pattern) return;
    
    const currentTime = Date.now() - this.recordStartTime;
    this.pattern.notes.push({
      padIndex,
      time: currentTime
    });
  }

  // Arreter l'enregistrement
  stopRecording() {
    if (!this.recording || !this.pattern) return;
    
    this.recording = false;
    this.isRecording = false;
    this.pattern.duration = Date.now() - this.recordStartTime;
  }

  // Demarrer la lecture en boucle
  startPlayback() {
    if (!this.pattern || this.pattern.notes.length === 0) {
      return;
    }

    this.playing = true;
    this.isPlaying = true;
    this.paused = false;
    this.isPaused = false;
    this.playbackStartTime = Date.now();
    this.playPattern();
  }

  // Mettre en pause
  pausePlayback() {
    if (!this.playing || this.paused) return;
    
    this.paused = true;
    this.isPaused = true;
    this.pauseTime = Date.now();
    
    // Annuler tous les timeouts programmes
    this.clearScheduledNotes();
  }

  // Reprendre la lecture
  resumePlayback() {
    if (!this.paused || !this.pattern) return;
    
    this.paused = false;
    this.isPaused = false;
    
    // Calculer le temps ecoule avant la pause
    const elapsedBeforePause = this.pauseTime - this.playbackStartTime;
    const pauseDuration = Date.now() - this.pauseTime;
    
    // Ajuster le temps de depart pour reprendre ou on etait
    this.playbackStartTime = Date.now() - elapsedBeforePause;
    
    // Reprendre la lecture
    this.playPatternFromTime(elapsedBeforePause % this.pattern.duration);
  }

  // Jouer le pattern une fois
  private playPattern() {
    if (!this.pattern || !this.playing || this.paused) return;

    this.clearScheduledNotes();

    // Programmer toutes les notes du pattern avec un timing precis
    this.pattern.notes.forEach(note => {
      const timeoutId = window.setTimeout(() => {
        if (this.playing && !this.paused) {
          this.audioService.playSample(note.padIndex);
        }
      }, note.time);
      
      this.scheduledNotes.push(timeoutId);
    });

    // Programmer la prochaine iteration du loop
    this.loopTimer = setTimeout(() => {
      if (this.playing && !this.paused) {
        this.playbackStartTime = Date.now();
        this.playPattern();
      }
    }, this.pattern.duration);
  }

  // Jouer le pattern a partir d'un certain temps (pour resume)
  private playPatternFromTime(startTime: number) {
    if (!this.pattern || !this.playing || this.paused) return;

    this.clearScheduledNotes();

    // Programmer uniquement les notes qui n'ont pas encore ete jouees
    this.pattern.notes.forEach(note => {
      if (note.time >= startTime) {
        const delay = note.time - startTime;
        const timeoutId = window.setTimeout(() => {
          if (this.playing && !this.paused) {
            this.audioService.playSample(note.padIndex);
          }
        }, delay);
        
        this.scheduledNotes.push(timeoutId);
      }
    });

    // Programmer la prochaine iteration
    const remainingTime = this.pattern.duration - startTime;
    this.loopTimer = setTimeout(() => {
      if (this.playing && !this.paused) {
        this.playbackStartTime = Date.now();
        this.playPattern();
      }
    }, remainingTime);
  }

  // Annuler tous les timeouts programmes
  private clearScheduledNotes() {
    this.scheduledNotes.forEach(id => clearTimeout(id));
    this.scheduledNotes = [];
    
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  // Arreter la lecture
  stopPlayback() {
    this.playing = false;
    this.isPlaying = false;
    this.paused = false;
    this.isPaused = false;
    
    this.clearScheduledNotes();
  }

  // Effacer le pattern
  clearPattern() {
    this.stopPlayback();
    this.pattern = null;
    this.currentPatternIndex = null;
  }

  // Sauvegarder le pattern actuel
  saveCurrentPattern(name?: string) {
    if (!this.pattern) {
      return;
    }

    if (name) {
      this.pattern.name = name;
    }

    // Verifier si le pattern existe deja
    const existingIndex = this.savedPatterns.findIndex(p => p.id === this.pattern!.id);
    
    if (existingIndex >= 0) {
      // Mettre a jour le pattern existant
      this.savedPatterns[existingIndex] = { ...this.pattern };
      this.currentPatternIndex = existingIndex;
    } else {
      // Ajouter un nouveau pattern
      this.savedPatterns.push({ ...this.pattern });
      this.currentPatternIndex = this.savedPatterns.length - 1;
    }

    this.savePatternsToStorage();
  }

  // Charger un pattern sauvegarde
  loadPattern(index: number) {
    if (index < 0 || index >= this.savedPatterns.length) {
      return;
    }

    this.stopPlayback();
    this.pattern = { ...this.savedPatterns[index] };
    this.currentPatternIndex = index;
    this.bpm = this.pattern.bpm;
  }

  // Supprimer un pattern sauvegarde
  deletePattern(index: number) {
    if (index < 0 || index >= this.savedPatterns.length) return;

    this.savedPatterns.splice(index, 1);
    
    if (this.currentPatternIndex === index) {
      this.pattern = null;
      this.currentPatternIndex = null;
    } else if (this.currentPatternIndex !== null && this.currentPatternIndex > index) {
      this.currentPatternIndex--;
    }

    this.savePatternsToStorage();
  }

  // Sauvegarder dans localStorage
  private savePatternsToStorage() {
    try {
      localStorage.setItem('sequencer-patterns', JSON.stringify(this.savedPatterns));
    } catch (error) {
      console.error('Erreur sauvegarde localStorage:', error);
    }
  }

  // Charger depuis localStorage
  private loadPatternsFromStorage() {
    try {
      const stored = localStorage.getItem('sequencer-patterns');
      if (stored) {
        this.savedPatterns = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erreur chargement localStorage:', error);
      this.savedPatterns = [];
    }
  }

  // Generer un ID unique
  private generateId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Changer le BPM (pour référence, pas utilisé dans le playback actuel)
  setBPM(bpm: number) {
    this.bpm = Math.max(60, Math.min(240, bpm)); // Limiter entre 60-240 BPM
    if (this.pattern) {
      this.pattern.bpm = this.bpm;
    }
  }

  // Obtenir les infos du pattern actuel
  getPatternInfo(): { noteCount: number; duration: number } | null {
    if (!this.pattern) return null;
    
    return {
      noteCount: this.pattern.notes.length,
      duration: Math.round(this.pattern.duration / 1000) // en secondes
    };
  }

  // Exporter le pattern (pour sauvegarde future)
  exportPattern(): Pattern | null {
    return this.pattern;
  }

  // Importer un pattern
  importPattern(pattern: Pattern) {
    this.stopPlayback();
    this.pattern = pattern;
    this.bpm = pattern.bpm;
  }
}

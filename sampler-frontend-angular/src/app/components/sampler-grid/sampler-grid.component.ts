import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sample } from '../../models/preset.model';
import { AudioService } from '../../services/audio.service';
import { SequencerService } from '../../services/sequencer.service';

/**
 * Composant représentant un pad de sampler
 */
interface Pad {
  index: number;
  sample: Sample | null;
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  keyBinding: string;
}

@Component({
  selector: 'app-sampler-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sampler-grid.component.html',
  styleUrls: ['./sampler-grid.component.css']
})
export class SamplerGridComponent {
  @Input() samples: Sample[] = [];
  @Output() padClicked = new EventEmitter<number>();
  
  pads: Pad[] = [];
  baseUrl = 'http://localhost:5000/presets/';

  // Mapping clavier QWERTY (4x4)
  private keyMap: { [key: string]: number } = {
    'q': 0, 'w': 1, 'e': 2, 'r': 3,
    'a': 4, 's': 5, 'd': 6, 'f': 7,
    'z': 8, 'x': 9, 'c': 10, 'v': 11,
    't': 12, 'g': 13, 'b': 14, 'n': 15
  };

  constructor(
    private audioService: AudioService,
    private sequencerService: SequencerService
  ) {
    this.initPads();
  }

  /**
   * Initialise les 16 pads
   */
  private initPads(): void {
    const keys = Object.keys(this.keyMap);
    for (let i = 0; i < 16; i++) {
      this.pads.push({
        index: i,
        sample: null,
        audioBuffer: null,
        isPlaying: false,
        keyBinding: keys[i].toUpperCase()
      });
    }
  }

  /**
   * Met à jour les pads avec les samples chargés
   */
  ngOnChanges(): void {
    if (this.samples && this.samples.length > 0) {
      this.loadSamples();
    }
  }

  /**
   * Charge tous les samples dans les pads correspondants
   */
  private async loadSamples(): Promise<void> {
    for (const sample of this.samples) {
      const padIndex = sample.padIndex !== null ? sample.padIndex : this.samples.indexOf(sample);
      
      if (padIndex >= 0 && padIndex < 16) {
        this.pads[padIndex].sample = sample;
        
        try {
          let url = sample.url;
          
          // Si c'est une URL externe, utiliser le proxy pour contourner CORS
          if (url.startsWith('http') && !url.includes('localhost')) {
            url = `http://localhost:5000/api/proxy-audio?url=${encodeURIComponent(url)}`;
          } else if (url.startsWith('./')) {
            // URLs relatives : ./808/Kick.wav -> http://localhost:5000/presets/808/Kick.wav
            url = `http://localhost:5000/presets/${url.substring(2)}`;
          } else if (!url.startsWith('http')) {
            // URLs sans protocole : 808/Kick.wav -> http://localhost:5000/presets/808/Kick.wav
            url = `http://localhost:5000/presets/${url}`;
          }
          
          console.log('Chargement du sample:', url);
          const buffer = await this.audioService.loadAudioBuffer(url);
          this.pads[padIndex].audioBuffer = buffer;
          
          // Enregistrer le buffer dans le service pour le sequencer
          this.audioService.setPadBuffer(padIndex, buffer);
          
          console.log('Sample chargé avec succès:', sample.name);
        } catch (error) {
          console.error(`Erreur chargement sample ${sample.name}:`, error);
        }
      }
    }
  }

  /**
   * Joue le sample d'un pad
   */
  playPad(padIndex: number): void {
    const pad = this.pads[padIndex];
    
    // Initialiser l'AudioContext au premier clic
    this.audioService.initAudioContext();
    
    console.log(`===== PLAYPAD ${padIndex} =====`);
    console.log('Pad:', pad);
    console.log('AudioBuffer:', pad.audioBuffer);
    console.log('Sample:', pad.sample);
    
    if (!pad.audioBuffer) {
      console.warn(`Pad ${padIndex} n'a pas de sample chargé`);
      return;
    }

    // Animation visuelle
    pad.isPlaying = true;
    setTimeout(() => pad.isPlaying = false, 200);

    console.log('Lecture du pad:', padIndex, pad.sample?.name);
    console.log('Buffer duration:', pad.audioBuffer.duration, 'seconds');
    
    // Lecture audio
    this.audioService.playBuffer(pad.audioBuffer);
    this.padClicked.emit(padIndex);
    
    // Enregistrer la note si le sequencer est en mode enregistrement
    if (this.sequencerService.isRecording) {
      this.sequencerService.recordNote(padIndex);
    }
  }



  /**
   * Retourne la classe CSS pour un pad
   */
  getPadClass(pad: Pad): string {
    let classes = 'pad';
    if (pad.sample) classes += ' has-sample';
    if (pad.isPlaying) classes += ' playing';
    return classes;
  }

  /**
   * Retourne le nom à afficher pour un pad
   */
  getPadLabel(pad: Pad): string {
    return pad.sample ? pad.sample.name : `Pad ${pad.index + 1}`;
  }
}

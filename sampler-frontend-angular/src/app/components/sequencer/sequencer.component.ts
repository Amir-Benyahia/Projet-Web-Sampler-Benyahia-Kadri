import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SequencerService, Pattern } from '../../services/sequencer.service';
import { AudioEffectsComponent } from '../audio-effects/audio-effects.component';

@Component({
  selector: 'app-sequencer',
  standalone: true,
  imports: [CommonModule, FormsModule, AudioEffectsComponent],
  templateUrl: './sequencer.component.html',
  styleUrls: ['./sequencer.component.css']
})
export class SequencerComponent {
  bpm = 120;
  showSaveDialog = false;
  newPatternName = '';
  showPatternsList = false;

  constructor(public sequencerService: SequencerService) {
    this.bpm = this.sequencerService.bpm;
  }

  onRecord() {
    if (this.sequencerService.isRecording) {
      this.sequencerService.stopRecording();
      // Proposer de sauvegarder automatiquement
      this.showSaveDialog = true;
      this.newPatternName = `Sequence ${this.sequencerService.savedPatterns.length + 1}`;
    } else {
      this.sequencerService.startRecording();
    }
  }

  onPlay() {
    if (this.sequencerService.isPlaying) {
      if (this.sequencerService.isPaused) {
        this.sequencerService.resumePlayback();
      } else {
        this.sequencerService.stopPlayback();
      }
    } else {
      this.sequencerService.startPlayback();
    }
  }

  onPause() {
    if (this.sequencerService.isPlaying && !this.sequencerService.isPaused) {
      this.sequencerService.pausePlayback();
    }
  }

  onClear() {
    if (confirm('Effacer le pattern enregistre ?')) {
      this.sequencerService.clearPattern();
    }
  }

  onSavePattern() {
    if (this.newPatternName.trim()) {
      this.sequencerService.saveCurrentPattern(this.newPatternName.trim());
      this.showSaveDialog = false;
      this.newPatternName = '';
    }
  }

  onCancelSave() {
    this.showSaveDialog = false;
    this.newPatternName = '';
  }

  togglePatternsList() {
    this.showPatternsList = !this.showPatternsList;
  }

  loadPattern(index: number) {
    this.sequencerService.loadPattern(index);
    this.bpm = this.sequencerService.bpm;
  }

  deletePattern(index: number, event: Event) {
    event.stopPropagation();
    if (confirm('Supprimer cette sequence ?')) {
      this.sequencerService.deletePattern(index);
    }
  }

  onBPMChange(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value);
    this.bpm = value;
    this.sequencerService.setBPM(value);
  }

  get patternInfo() {
    return this.sequencerService.getPatternInfo();
  }

  get hasPattern(): boolean {
    const info = this.patternInfo;
    return info !== null && info.noteCount > 0;
  }

  get savedPatterns(): Pattern[] {
    return this.sequencerService.savedPatterns;
  }

  get currentPatternIndex(): number | null {
    return this.sequencerService.currentPatternIndex;
  }
}

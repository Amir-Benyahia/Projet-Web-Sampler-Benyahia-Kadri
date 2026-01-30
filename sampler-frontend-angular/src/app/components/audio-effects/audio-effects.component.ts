import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioService } from '../../services/audio.service';

@Component({
  selector: 'app-audio-effects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audio-effects.component.html',
  styleUrls: ['./audio-effects.component.css']
})
export class AudioEffectsComponent {
  // État des effets
  filterEnabled = false;
  filterType: BiquadFilterType = 'lowpass';
  filterFrequency = 20000;

  delayEnabled = false;
  delayTime = 0.3;
  delayFeedback = 0.5;

  reverbEnabled = false;

  filterTypes: BiquadFilterType[] = ['lowpass', 'highpass', 'bandpass'];

  constructor(private audioService: AudioService) {}

  // ========== FILTRE ==========
  
  onFilterToggle(): void {
    this.filterEnabled = !this.filterEnabled;
    this.audioService.setFilterEnabled(this.filterEnabled);
  }

  onFilterTypeChange(): void {
    this.audioService.setFilterType(this.filterType);
  }

  onFilterFrequencyChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.filterFrequency = parseInt(target.value, 10);
    this.audioService.setFilterFrequency(this.filterFrequency);
  }

  // ========== DELAY ==========

  onDelayToggle(): void {
    this.delayEnabled = !this.delayEnabled;
    this.audioService.setDelayEnabled(this.delayEnabled);
  }

  onDelayTimeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.delayTime = parseFloat(target.value);
    this.audioService.setDelayTime(this.delayTime);
  }

  onDelayFeedbackChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.delayFeedback = parseFloat(target.value);
    this.audioService.setDelayFeedback(this.delayFeedback);
  }

  // ========== REVERB ==========

  onReverbToggle(): void {
    this.reverbEnabled = !this.reverbEnabled;
    this.audioService.setReverbEnabled(this.reverbEnabled);
  }
}

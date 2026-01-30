import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appPresetHighlight]',
  standalone: true
})
export class PresetHighlightDirective {
  constructor(el: ElementRef) {
    // Colore la bordure gauche en bleu
    el.nativeElement.style.borderLeft = '4px solid #3b82f6';
  }
}

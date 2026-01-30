import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[appSampleStatus]',
  standalone: true
})
export class SampleStatusDirective implements OnChanges {
  @Input() isValid: boolean | undefined = undefined;

  constructor(private el: ElementRef) {}

  ngOnChanges() {
    if (this.isValid === true) {
      this.el.nativeElement.style.backgroundColor = '#d1fae5';
      this.el.nativeElement.style.border = '1px solid #10b981';
    } else if (this.isValid === false) {
      this.el.nativeElement.style.backgroundColor = '#fee2e2';
      this.el.nativeElement.style.border = '1px solid #ef4444';
    } else {
      this.el.nativeElement.style.backgroundColor = 'white';
      this.el.nativeElement.style.border = '1px solid #d1d5db';
    }
    this.el.nativeElement.style.transition = 'all 0.2s ease';
  }
}

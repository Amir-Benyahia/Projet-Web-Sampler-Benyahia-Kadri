// Web Component pour encapsuler le sampler
// Permet d'utiliser le sampler comme un element HTML personnalise : <sampler-component></sampler-component>

class SamplerComponent extends HTMLElement {
  constructor() {
    super();
    
    // Utilisation du Shadow DOM pour isolation complete du CSS et du HTML
    // Le contenu interne ne sera pas affecte par les styles externes
    this.attachShadow({ mode: 'open' });
  }
  
  // Methode appelee quand l'element est ajoute au DOM
  connectedCallback() {
    // Creation du template HTML
    this.shadowRoot.innerHTML = `
      <style>
        /* Import des styles du sampler */
        @import url('./css/styles.css');
        
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }
      </style>
      
      <!-- Canvas de fond -->
      <canvas id="bgCanvas"></canvas>
      
      <div id="app">
        <iframe src="index.html" style="width: 100%; height: 100vh; border: none;"></iframe>
      </div>
    `;
    
    // Note pedagogique : 
    // Dans un projet reel, on importerait tous les modules JS (SamplerEngine, SamplerGUI, etc.)
    // et on reconstruirait l'interface complete dans le Shadow DOM.
    // Pour simplifier, on utilise ici une iframe qui charge index.html
    // Cela preserve toute la logique existante sans dupliquer le code.
  }
  
  // Methodes publiques pour interagir avec le sampler depuis l'exterieur
  
  // Charge un preset par son nom
  loadPreset(presetName) {
    const iframe = this.shadowRoot.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      // Communication avec l'iframe via postMessage
      iframe.contentWindow.postMessage({
        type: 'loadPreset',
        preset: presetName
      }, '*');
    }
  }
  
  // Joue un pad par son index (0-15)
  playPad(index) {
    const iframe = this.shadowRoot.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'playPad',
        index: index
      }, '*');
    }
  }
  
  // Arrete tous les sons
  stopAll() {
    const iframe = this.shadowRoot.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'stopAll'
      }, '*');
    }
  }
}

// Enregistrement du custom element
// Apres cela, on peut utiliser <sampler-component></sampler-component> dans n'importe quel HTML
customElements.define('sampler-component', SamplerComponent);

// Export pour utilisation en module
export default SamplerComponent;

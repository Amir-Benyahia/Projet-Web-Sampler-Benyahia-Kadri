// Classe gerant l'interface graphique du sampler
// SEPARATION DES RESPONSABILITES : cette classe s'occupe uniquement de l'affichage
// Le moteur audio (SamplerEngine) est totalement independant
// Cela permet de tester le moteur en mode headless (voir headless.html)
export default class SamplerGUI {
  constructor(engine, container) {
    // Reference au moteur audio (SamplerEngine)
    this.engine = engine;
    
    // Conteneur HTML dans lequel on va creer les boutons de pads
    this.container = container;
    
    // Tableau pour stocker les elements DOM de chaque pad
    // Permet de les retrouver facilement pour les mettre a jour
    this.slotEls = [];
    
    // Creation des 16 boutons de pads au demarrage
    this.createButtons();
  }

  // Selectionne visuellement un pad en le mettant en surbrillance
  // Deselectionne tous les autres pads
  selectPad(i) {
    // Desactivation visuelle de tous les pads
    this.slotEls.forEach(s => {
      if (!s) return;
      s.pad.style.backgroundColor = "#1f2937";  // Couleur gris fonce
      s.pad.style.color = "#fff";
    });

    // Activation visuelle du pad selectionne
    const slot = this.slotEls[i];
    if (!slot) return;
    slot.pad.style.backgroundColor = "#3b82f6";  // Couleur bleue
    slot.pad.style.color = "#fff";
  }


  // Cree les 16 boutons de pads avec leur barre de progression
  // IMPORTANT : disposition spatiale conforme au cahier des charges
  // Pad 0 (kick) en bas a gauche, pad 15 en haut a droite
  createButtons() {
    // Recuperation de l'etat des slots depuis le moteur
    const slots = this.engine.getSlots();
    
    // Configuration de la grille 4x4
    const N = 16;      // Nombre total de pads
    const cols = 4;    // Nombre de colonnes
    const rows = 4;    // Nombre de lignes

    // Nettoyage du conteneur
    this.container.innerHTML = "";
    
    // Initialisation du tableau de references DOM
    this.slotEls = new Array(N);

    // Tableau temporaire pour gerer la disposition spatiale
    // L'ordre de creation != ordre d'affichage
    const cells = new Array(N);

    for (let i = 0; i < N; i++) {
      const slot = slots[i] || { name: "", empty: true };

      const wrapper = document.createElement("div");
      wrapper.className = "padWrap";

      const pad = document.createElement("button");
      pad.className = "soundButton";

      pad.innerHTML = `
        <span class="keyCorner"></span>
        <span class="padLabel">${slot.name || ""}</span>
      `;
      const keyCorner = pad.querySelector(".keyCorner");

      if (slot.empty) {
        pad.disabled = true;
        pad.style.opacity = "0.35";
        pad.style.cursor = "not-allowed";
      }

      const prog = document.createElement("div");
      prog.className = "progress";
      const bar = document.createElement("div");
      bar.className = "bar";
      prog.appendChild(bar);

      pad.onclick = () => {
        if (slot.empty) return;

        this.onPadSelected?.(i, true);
        this.selectPad(i);
      };

      wrapper.appendChild(pad);
      wrapper.appendChild(prog);

      // Stockage des references DOM pour ce pad
      this.slotEls[i] = { pad, prog, bar, keyCorner };

      // CALCUL DE LA POSITION D'AFFICHAGE
      // Par defaut, pad 0 serait en haut a gauche
      // On veut pad 0 en bas a gauche (comme une MPC ou batterie electronique)
      const row = Math.floor(i / cols);       // Ligne logique (0-3)
      const col = i % cols;                    // Colonne (0-3)
      const displayRow = (rows - 1) - row;     // Inversion verticale
      const displayIndex = displayRow * cols + col;  // Position finale
      cells[displayIndex] = wrapper;
    }

    cells.forEach(cell => this.container.appendChild(cell));
  }

  // Met a jour le statut visuel d'un pad (loading/ready/error)
  // Appelee par le moteur via le callback onStatus
  // Ceci illustre le pattern Observer entre moteur et GUI
  updateStatus(index, { phase, message }) {
    const slot = this.slotEls[index];
    if (!slot) return;

    // Gestion des differentes phases de chargement
    if (phase === "loading") {
      slot.prog.classList.add("loading");  // Animation CSS
      slot.bar.style.width = "0%";
    } else if (phase === "ready") {
      slot.prog.classList.remove("loading");
      slot.bar.style.width = "100%";  // Barre complete
    } else if (phase === "error") {
      slot.prog.classList.remove("loading");
      slot.bar.style.width = "0%";
    }

    // Message affiche au survol du pad
    slot.pad.title = message || "";
  }

  // Met a jour la barre de progression du telechargement
  // Appelee progressivement pendant le fetch du fichier audio
  // recvd : octets recus, total : taille totale du fichier
  updateProgress(index, recvd, total) {
    const slot = this.slotEls[index];
    if (!slot) return;

    // Si on connait la taille totale, affichage en pourcentage
    if (total && total > 0) {
      const pct = Math.min(100, Math.round((recvd / total) * 100));
      slot.bar.style.width = pct + "%";
      slot.prog.classList.remove("loading");
    } else {
      // Sinon, animation indeterminee
      slot.prog.classList.add("loading");
    }
  }

  // Animation visuelle quand un pad est joue
  // Effet de "pression" du bouton
  // Appelee par le moteur via le callback onPlay
  playPadAnimation(index) {
    const slot = this.slotEls[index];
    if (!slot) return;

    const pad = slot.pad;
    // Reduction temporaire de la taille (effet "press")
    pad.style.transform = "scale(0.95)";
    // Retour a la taille normale apres 150ms
    setTimeout(() => (pad.style.transform = ""), 150);
  }
}

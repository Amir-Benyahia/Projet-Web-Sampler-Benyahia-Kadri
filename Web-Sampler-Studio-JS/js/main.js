// Script principal du sampler
// Gere le chargement des presets et l'initialisation de l'interface

import SamplerEngine from './SamplerEngine.js';
import SamplerGUI from './SamplerGui.js';

// Variables globales pour le contexte audio, le moteur et l'interface
let ctx, engine, gui;

// URL du serveur backend qui fournit l'API des presets
const baseURL = "https://back-end-nodejs-api-presets-for-sounds.onrender.com";

// Fonction executee au chargement de la page
window.onload = async function() {
    // Creation du contexte audio Web Audio API
    ctx = new AudioContext();
    
    // Initialisation du moteur de sampler
    engine = new SamplerEngine(ctx);

    // Selection des elements DOM necessaires
    const canvas = document.querySelector("#myCanvas");
    const canvasOverlay = document.querySelector("#myCanvasOverlay");
    const buttonsContainer = document.querySelector("#buttonsContainer");
    const playButton = document.querySelector("#playButton");
    const presetSelect = document.querySelector("#presetSelect");

    // Recuperation de la liste des presets depuis le serveur
    // fetch est asynchrone et retourne une Promise
    let presets = [];
    try {
        // Envoi de la requete HTTP GET vers l'API
        const response = await fetch(`${baseURL}/api/presets`);
        // Decodage de la reponse JSON en objet JavaScript
        presets = await response.json();
    } catch (err) { 
        console.error(err); 
        return; 
    }

    // Construction dynamique du menu deroulant de presets
    // Pour chaque preset, on cree un element option
    presets.forEach((preset, i) => {
        const option = document.createElement("option");
        option.value = i;  // Index du preset comme valeur
        option.textContent = preset.name;  // Nom du preset affiche
        presetSelect.appendChild(option);
    });

    // Fonction pour charger un preset specifique
    const loadPreset = async index => {
        const preset = presets[index];
        if (!preset) return;

        // Construction des URLs completes pour chaque sample
        // On retire le ./ au debut du chemin relatif
        const urls = preset.samples.map(s => `${baseURL}/presets/${s.url.replace(/^\.\//,'')}`);
        
        // Chargement des sons dans le moteur
        await engine.loadSounds(urls);

        // Creation de l'interface graphique
        gui = new SamplerGUI(engine, canvas, canvasOverlay, buttonsContainer, playButton);
        await gui.createButtons();
    };

    // Chargement automatique du premier preset au demarrage
    if (presets.length > 0) await loadPreset(0);

    // Gestion du changement de preset dans le menu deroulant
    presetSelect.onchange = e => loadPreset(parseInt(e.target.value));
};

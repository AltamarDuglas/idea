/**
 * SERVICIO: WebAudioSynthesizer
 * Principio SOLID: Responsabilidad Única (SRP).
 * Genera el sonido procedural en tiempo real usando la Web Audio API nativa.
 * Demuestra la paradoja directamente en los altavoces:
 * - Sin observador: Cero sonido (silencio absoluto en el bosque).
 * - Con persona: Golpe grave realista con reverberación sorda.
 */

import { OBSERVER_TYPES } from '../models/AcousticPhysics';

class WebAudioSynthesizerService {
  constructor() {
    this.ctx = null;
    this.isEnabled = true; // Por defecto activado para que sea interactivo de inmediato
  }

  /**
   * Inicializa o reanuda el contexto de audio.
   */
  initContext() {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!this.ctx && AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Activa o silencia el sonido procedural.
   * @param {boolean} enabled - Estado activado/desactivado.
   */
  setAudioEnabled(enabled) {
    this.isEnabled = enabled;
    if (enabled) {
      this.initContext();
    }
  }

  /**
   * Reproduce el impacto acústico.
   *
   * @param {string} observerType - Tipo de observador (NONE o PERSON).
   * @param {number} volumeFactor - Factor de volumen entre 0.2 y 1.0 según la distancia.
   */
  playTreeCollapse(observerType, volumeFactor = 1.0) {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    // Si no hay nadie en el bosque: ¡Silencio absoluto!
    if (observerType === OBSERVER_TYPES.NONE) {
      return;
    }

    const now = this.ctx.currentTime;
    const vol = Math.min(1.0, Math.max(0.1, volumeFactor));

    // Oscilador grave de impacto (el golpe del tronco)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.5);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.5 * vol, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);

    // Crujido suave de ramas y hojas
    this._playFoliageCrack(now, vol);
  }

  /**
   * Ruido filtrado de follaje y hojas que tocan el suelo.
   * @private
   */
  _playFoliageCrack(now, vol) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2 * vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.38);
  }
}

export const webAudioSynthesizer = new WebAudioSynthesizerService();

/**
 * CLASE SensoryFilter (Modelo de Dominio)
 * Principio SOLID: Responsabilidad Única (SRP).
 * Modela la física perceptual del Umwelt propuesta por Jakob von Uexküll.
 * Transforma una escala continua de 0 a 100% entre la percepción humana (60 Hz)
 * y la visión hiperfrecuente de Drosophila (250 Hz).
 */
export class SensoryFilter {
  /**
   * @param {number} percentage - Nivel de inmersión en el Umwelt de la mosca (0 a 100)
   */
  constructor(percentage = 0) {
    this.percentage = Math.max(0, Math.min(100, percentage));
  }

  /**
   * Frecuencia crítica de fusión de destellos (Flicker Fusion Rate en Hz).
   * Humanos: ~60 Hz.
   * Drosophila: ~250 Hz.
   * @returns {number}
   */
  get flickerFrequencyHz() {
    return Math.round(60 + (this.percentage / 100) * 190);
  }

  /**
   * Factor de dilatación temporal subjetiva (cámara lenta).
   * Cuanto más alta la frecuencia visual, más lento percibe los eventos externos.
   * @returns {number}
   */
  get slowMotionFactor() {
    return Number((this.flickerFrequencyHz / 60).toFixed(1));
  }

  /**
   * Ratio de velocidad de animación para renderizado en Canvas / SVG.
   * @returns {number}
   */
  get speedRatio() {
    return 60 / this.flickerFrequencyHz;
  }

  /**
   * Indica si predomina la visión compuesta hexagonal por omatidios.
   * @returns {boolean}
   */
  isOmmatidiaDominant() {
    return this.percentage >= 40;
  }
}

/**
 * CLASE Neurochemistry (Modelo de Dominio)
 * Principio SOLID: Responsabilidad Única (SRP).
 * Encapsula las variables neuroquímicas cuantificables del sistema nervioso de Drosophila:
 * - Arousal defensivo (Octopamina / Dopamina)
 * - Nivel de recompensa cerebral (Neuropéptido F, homólogo al NPY humano)
 * - Iniciativa motora y escape.
 */
export class Neurochemistry {
  /**
   * @param {number} arousal - Nivel de alerta defensiva e hipervigilancia (0 a 100)
   * @param {number} npf - Neuropéptido F cerebral (0 a 100)
   * @param {number} motorInitiative - Capacidad o predisposición de escape motor (0 a 100)
   */
  constructor(arousal = 15, npf = 85, motorInitiative = 80) {
    this.arousal = Math.max(0, Math.min(100, arousal));
    this.npf = Math.max(0, Math.min(100, npf));
    this.motorInitiative = Math.max(0, Math.min(100, motorInitiative));
  }

  /**
   * Determina si el estado actual corresponde a una condición de trauma persistente.
   * @returns {boolean}
   */
  isTraumatized() {
    return this.arousal > 60 || this.npf < 30 || this.motorInitiative < 30;
  }

  /**
   * Clonación inmutable con valores actualizados.
   * @param {Partial<{arousal: number, npf: number, motorInitiative: number}>} changes
   * @returns {Neurochemistry}
   */
  withChanges(changes) {
    return new Neurochemistry(
      changes.arousal !== undefined ? changes.arousal : this.arousal,
      changes.npf !== undefined ? changes.npf : this.npf,
      changes.motorInitiative !== undefined ? changes.motorInitiative : this.motorInitiative
    );
  }
}

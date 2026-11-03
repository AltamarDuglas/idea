/**
 * MODELO: AcousticPhysics
 * Principio SOLID: Responsabilidad Única (SRP).
 * Modela la física acústica y la percepción del sonido en la paradoja del árbol en el bosque.
 * Enfoque: Lenguaje cotidiano, directo y claro.
 */

export const OBSERVER_TYPES = {
  NONE: 'NONE',
  PERSON: 'PERSON',
};

export class AcousticPhysics {
  /**
   * Constante gravitacional para la caída del árbol.
   */
  static GRAVITY_ACCELERATION = 0.005;

  /**
   * Calcula la física de la onda según la distancia al observador.
   *
   * @param {number} radius - Radio de propagación en píxeles.
   * @param {number} distance - Distancia en píxeles hasta el oyente.
   * @returns {Object} Información física sencilla.
   */
  static calculateWaveField(radius, distance) {
    const isWaveNear = Math.abs(radius - distance) < 30;
    const isWavePast = radius >= distance;

    return {
      isWaveNear,
      isWavePast,
      airVibrating: radius > 0,
    };
  }

  /**
   * Devuelve el resultado en palabras sencillas y directas.
   *
   * @param {string} observerType - Tipo de observador (NONE o PERSON).
   * @param {boolean} waveReached - Si la onda llegó al oyente.
   * @returns {Object} Respuesta simple en español cotidiano.
   */
  static evaluatePerception(observerType, waveReached) {
    if (!waveReached) {
      return {
        airStatus: 'El aire está tranquilo',
        soundStatus: 'Esperando que caiga el árbol...',
        isHeard: false,
        themeColor: 'var(--text-muted)',
      };
    }

    if (observerType === OBSERVER_TYPES.PERSON) {
      return {
        airStatus: 'Sí, el aire empuja con fuerza',
        soundStatus: '¡SÍ! La persona escucha un golpe fuerte',
        isHeard: true,
        themeColor: 'var(--accent-amber)',
        simpleExplanation:
          'El aire golpea el oído de la persona. Su tímpano vibra y su cerebro transforma ese movimiento en la sensación de RUIDO.',
      };
    }

    // Sin observador
    return {
      airStatus: 'Sí, el aire se mueve y choca',
      soundStatus: 'NO, nadie escucha nada (silencio total)',
      isHeard: false,
      themeColor: 'var(--accent-cyan)',
      simpleExplanation:
        'El árbol empuja el aire al caer, pero no hay ningún oído ni cerebro en el bosque. El movimiento del aire ocurre, pero el sonido como experiencia no existe.',
    };
  }
}

import { Neurochemistry } from '../models/Neurochemistry';

/**
 * SERVICIO TraumaPredictionService
 * Principio SOLID: Responsabilidad Única (SRP) y Abierto/Cerrado (OCP).
 * Permite predecir y retornar la telemetría neuroquímica, citas científicas
 * y directrices cinemáticas de Drosophila bajo protocolos de condicionamiento adverso.
 */
export class TraumaPredictionService {
  /**
   * Registros de protocolos soportados por la literatura experimental.
   */
  static PROTOCOLS = {
    baseline: {
      id: 'baseline',
      name: '0. Estado Basal',
      kicker: 'Grupo Control',
      citation: 'Control Basal',
      prompt: 'Exploración normal hacia glucosa.',
      stimulusAction: 'Reiniciar Mosca',
      predictionText: 'Sin trauma previo, predecimos que la mosca explorará la arena con calma y acudirá al comedero de glucosa normal (izquierda), ignorando el alcohol.',
      neurochemistry: new Neurochemistry(15, 85, 80),
      feedPreference: 'glucose', // Preferencia alimentaria
    },
    shadow: {
      id: 'shadow',
      name: '1. Sombra (TEPT)',
      kicker: 'Caltech (2015)',
      citation: 'Gibson et al., 2015',
      prompt: 'Sombra repetida activa hipervigilancia defensiva.',
      stimulusAction: 'Barrer Sombra Aérea',
      predictionText: 'PREDICCIÓN: Tras pasar la sombra, el circuito defensivo queda encendido. Predecimos saltos erráticos en zigzag y abandono total del alimento aunque la sombra ya no esté.',
      neurochemistry: new Neurochemistry(95, 55, 96),
      feedPreference: 'erratic_flight',
    },
    heat: {
      id: 'heat',
      name: '2. Calor Sin Salida',
      kicker: 'Heisenberg (2013)',
      citation: 'Yang & Heisenberg, 2013',
      prompt: 'Calor incontrolable induce pasividad motora.',
      stimulusAction: 'Pulso de Calor (40°C)',
      predictionText: 'PREDICCIÓN: Tras aprender que ningún movimiento detiene el calor (indefensión aprendida), predecimos que la mosca quedará paralizada y no cruzará la salida abierta arriba.',
      neurochemistry: new Neurochemistry(75, 25, 10),
      feedPreference: 'paralyzed',
    },
    rejection: {
      id: 'rejection',
      name: '3. Rechazo + Alcohol',
      kicker: 'Science (2012)',
      citation: 'Shohat-Ophir et al., 2012',
      prompt: 'Caída de Neuropéptido F por rechazo social continuado.',
      stimulusAction: 'Simular Rechazo',
      predictionText: 'PREDICCIÓN: El déficit neuroquímico de NPF nos permite predecir con certeza que la mosca ignorará el azúcar normal e irá directo al alimento con etanol al 15% (derecha).',
      neurochemistry: new Neurochemistry(45, 12, 75),
      feedPreference: 'ethanol',
    },
  };

  /**
   * Obtiene la definición completa de un protocolo experimental.
   * @param {string} protocolId - 'baseline' | 'shadow' | 'heat' | 'rejection'
   */
  static getProtocol(protocolId) {
    return this.PROTOCOLS[protocolId] || this.PROTOCOLS.baseline;
  }

  /**
   * Retorna la lista de todos los protocolos para renderizar botones/pestañas.
   */
  static getAllProtocols() {
    return Object.values(this.PROTOCOLS);
  }
}

/**
 * SERVICIO EvolutionaryContinuityService
 * Principio SOLID: Responsabilidad Única (SRP).
 * Gestiona las interpretaciones epistemológicas y filogenéticas entre
 * el sistema nervioso de insectos (140.000 neuronas) y el cerebro de mamíferos (86.000 millones).
 */
export class EvolutionaryContinuityService {
  /**
   * Evalúa la postura elegida por el usuario en el espectro del 0 al 100%.
   * @param {number} stance - 0 a 100
   */
  static evaluateStance(stance) {
    const val = Math.max(0, Math.min(100, stance));

    if (val < 35) {
      return {
        category: 'mirada_mecanicista',
        label: `${val}% • Mirada Mecanicista`,
        title: 'Postura Mecanicista:',
        text: 'Consideras que hablar de "trauma" en moscas es antropomorfismo. La mosca solo ejecuta algoritmos bioquímicos predecibles de escape y saciedad sin vivencia subjetiva de sufrimiento.',
        flyColor: '#06B6D4',
        bridgeOpacity: 0.2,
      };
    }

    if (val > 65) {
      return {
        category: 'continuidad_empatica',
        label: `${val}% • Continuidad Empática`,
        title: 'Postura Evolutiva:',
        text: 'Reconoces que la herida invisible que deja el entorno adverso en el sistema nervioso de una mosca es la misma raíz biológica ancestral de nuestro propio dolor psicológico.',
        flyColor: '#F59E0B',
        bridgeOpacity: 0.95,
      };
    }

    return {
      category: 'equilibrio_evolutivo',
      label: `${val}% • Equilibrio Evolutivo`,
      title: 'Síntesis (Equilibrio):',
      text: 'No sabemos qué siente la mosca desde dentro de su Umwelt, pero su vulnerabilidad neuroquímica demuestra que los ladrillos biológicos del trauma son cientos de millones de años más antiguos que la humanidad.',
      flyColor: '#10B981',
      bridgeOpacity: 0.55,
    };
  }
}

export function evolve(genomes = [], llmResult) {
  // simple mutation simulation
  return genomes.map(g => ({
    ...g,
    fitness: (g.fitness || 0) + (llmResult.confidence * 0.1)
  }));
}

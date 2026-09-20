import type { JourneyContent } from './types'

// Experiências trazidas do outro portfólio, na mesma ordem em que estavam lá.
// Para acrescentar um lugar, some um item (3 a 5 funciona melhor).
export const journey: JourneyContent = {
  lead: 'Os lugares por onde passei e o que fiz em cada um.',
  milestones: [
    {
      period: 'UFU · GRVA',
      title: 'GRVA — Grupo de Realidade Virtual e Aumentada',
      organization: 'Pesquisa e desenvolvimento · desde 2026',
      summary:
        'Treinamento de agentes de robótica com aprendizado de máquina, Python e bibliotecas de IA aplicadas a simulação, apoio a novos integrantes e documentação técnica.',
    },
    {
      period: 'IBI',
      title: 'Instituto Brasileiro de Infraestrutura',
      organization: 'Projeto · abril de 2026 · São Paulo, SP',
      summary:
        'Simulação da terceira via para o transporte rodoviário por Cubatão e Santos, concluída em um mês e apresentada na Câmara dos Deputados Federais de São Paulo.',
    },
    {
      period: 'LAB2COD',
      title: 'LAB2COD',
      organization: 'Processos e inovação para o setor público · Brasília',
      summary:
        'Colaborador em projetos e pesquisas para o setor elétrico e em problemas de instituições e agências nacionais.',
    },
  ],
}

// Copy compartilhado pelas 3 direções de landing (mesmo conteúdo, muda só a direção visual).
// Preços são placeholders configuráveis no admin (escopo.md §13.0).

export const howItWorks = [
  {
    step: "01",
    title: "Cadastro",
    description: "Você cria sua conta e escolhe o plano de acompanhamento que faz mais sentido para você.",
  },
  {
    step: "02",
    title: "Anamnese",
    description:
      "Você responde um formulário completo sobre sua saúde, alimentação, rotina e treinos. Também conta quais são seus objetivos, preferências e desafios. Essas informações ajudam a criar um plano realmente personalizado para você.",
  },
  {
    step: "03",
    title: "Análise profissional",
    description:
      "Um profissional da nossa equipe analisa todas as informações e monta a estratégia mais adequada para o seu momento. Nenhuma decisão clínica é tomada automaticamente.",
  },
  {
    step: "04",
    title: "Acompanhamento contínuo",
    description:
      "Seu plano alimentar e seu treino ficam disponíveis na plataforma. Ao longo do acompanhamento, fazemos revisões periódicas, enviamos check-ins e ajustamos o que for necessário conforme a sua evolução.",
  },
] as const;

export const differentiators = [
  {
    title: "Você sabe exatamente o que fazer",
    description: "Receba um plano alimentar e um treino pensados para o seu objetivo, sua rotina e suas preferências.",
  },
  {
    title: "Você acompanha sua evolução",
    description: "Veja sua evolução ao longo do tempo e entenda como pequenas mudanças geram grandes resultados.",
  },
  {
    title: "Você não faz isso sozinho",
    description: "Sempre que necessário, revisamos o plano e fazemos ajustes para que ele continue funcionando para você.",
  },
] as const;

// Depoimentos reais (casos) enviados pelo cliente. O embed do Instagram não está disponível
// (posts retornam 404 no endpoint público), então usamos as imagens baixadas + texto colado pelo cliente.
export const testimonials = [
  {
    quote: "…",
    name: "Rodrigo",
    role: "Caso de sucesso",
    image: "/case-rodrigo.jpg",
  },
  {
    quote: "…",
    name: "Luis",
    role: "Caso de sucesso",
    image: "/case-luis.jpg",
  },
] as const;

export interface PlanCopy {
  id: "essencial" | "plus" | "elite";
  name: string;
  tagline: string;
  monthlyPrice: number;
  features: string[];
  ctaLabel: string;
}

export const plans: PlanCopy[] = [
  {
    id: "essencial",
    name: "Essencial",
    tagline: "Comece a cuidar da sua saúde com um plano feito para você.",
    monthlyPrice: 149,
    features: [
      "Plano alimentar personalizado",
      "Treino personalizado",
      "Mensagens de acompanhamento",
      "Check-ins regulares",
      "Revisão do plano 1 vez por mês",
    ],
    ctaLabel: "Começar agora",
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "Mais acompanhamento para quem quer evoluir de forma consistente.",
    monthlyPrice: 249,
    features: [
      "Tudo do Essencial",
      "Revisão do plano a cada 15 dias",
      "Ajustes do plano sempre que necessário",
      "Check-ins mais frequentes",
      "Acompanhamento mais próximo",
    ],
    ctaLabel: "Quero esse plano",
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "O acompanhamento mais completo da COUT.",
    monthlyPrice: 349,
    features: [
      "Tudo do Plus",
      "1 teleconsulta por mês (até 1 hora)",
      "Revisão completa durante a consulta",
      "Definição das metas do próximo ciclo",
    ],
    ctaLabel: "Falar com a equipe",
  },
];

export const faq = [
  {
    question: "A CoutHealth gera minha dieta e treino automaticamente?",
    answer:
      "Não. A tecnologia organiza seus dados, mas toda dieta e treino são montados e publicados por um profissional humano — nunca por um algoritmo.",
  },
  {
    question: "Preciso ter experiência com treino ou dieta pra começar?",
    answer: "Não. A anamnese inicial capta seu nível atual, rotina e restrições para montar um plano adequado ao seu ponto de partida.",
  },
  {
    question: "Como funciona a revisão periódica?",
    answer:
      "De acordo com seu plano, o Rafael revisa sua evolução e ajusta plano/treino a cada 15 ou 30 dias, com base nos check-ins e nas medidas registradas.",
  },
  {
    question: "Posso mudar de plano depois?",
    answer: "Sim, a qualquer momento pelo painel — o ajuste de cobrança é proporcional ao período restante.",
  },
  {
    question: "Meus dados de saúde estão seguros?",
    answer:
      "Sim. Dados de saúde são tratados como sensíveis: consentimento explícito, criptografia em trânsito e controle de acesso por papel, conforme a LGPD.",
  },
] as const;

export const heroCopy = {
  cinematic: {
    eyebrow: "",
    headline: "Um plano feito para a sua realidade.",
    subheadline:
      "Cada pessoa tem um objetivo. Seu plano também deveria ser único. Você recebe um plano alimentar e um treino pensados para a sua rotina. Conforme você evolui, a gente ajusta o que for preciso para continuar fazendo sentido no seu dia a dia.",
  },
  clinical: {
    eyebrow: "Um ciclo, não um evento único",
    headline: "Cadastro. Anamnese. Análise profissional. Acompanhamento. Sempre girando.",
    subheadline: "Cada etapa do seu cuidado é acompanhada de perto — com método, confiança e revisão constante.",
  },
  editorial: {
    eyebrow: "Nutrição e treino, com acompanhamento de verdade",
    headline: "Seu método. Seu profissional. Sua continuidade.",
    subheadline: "Um único lugar para nutrição, treino e evolução — conduzido por quem entende do seu caso.",
  },
} as const;

export const footerLinks = {
  legal: [
    { label: "Política de Privacidade", href: "/politica-de-privacidade" },
    { label: "Termos de Uso", href: "/termos-de-uso" },
  ],
};

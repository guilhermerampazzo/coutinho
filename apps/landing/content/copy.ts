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
// Descrições baseadas no que aparece nos posts (transformação -14 kg / ganho de força e consistência).
export const testimonials = [
  {
    quote:
      "Emagreci 14 kg com saúde e músculo, de agosto de 2025 a março de 2026. Meu plano evoluiu junto comigo e, ao longo do caminho, sempre houve quem revisasse e ajustasse o que fosse preciso.",
    name: "Rodrigo",
    role: "Caso de sucesso",
    image: "/case-rodrigo.jpg",
    href: "https://www.instagram.com/3coutinho/p/DWkATcijIjM/",
  },
  {
    quote:
      "Ganhei força, definição e consistência nos treinos. Ter um plano feito para a minha realidade — com acompanhamento de verdade, não só uma dieta genérica — fez toda a diferença.",
    name: "Luis",
    role: "Caso de sucesso",
    image: "/case-luis.jpg",
    href: "https://www.instagram.com/3coutinho/p/DVzHbTDiUbf/",
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
    question: "Como funciona o acompanhamento?",
    answer:
      "Depois de criar sua conta, você responde uma anamnese completa sobre sua saúde, alimentação, rotina, treinos e objetivos. Com essas informações, eu desenvolvo seu plano alimentar e seu treino, sempre de acordo com a sua realidade e com o que você deseja alcançar. A partir daí, você acompanha tudo pela plataforma e eu faço as revisões conforme o plano contratado.",
  },
  {
    question: "O plano alimentar e o treino são realmente personalizados?",
    answer:
      "Sim. Cada plano é desenvolvido por mim com base nas informações que você compartilha durante a anamnese. Levo em consideração sua rotina, preferências, objetivos e histórico para criar um acompanhamento que realmente faça sentido para você.",
  },
  {
    question: "A plataforma cria a dieta e o treino automaticamente?",
    answer:
      "Não. A plataforma organiza as informações e facilita todo o acompanhamento, mas sou eu quem desenvolve seu plano alimentar e seu treino. Nenhuma decisão clínica é tomada automaticamente.",
  },
  {
    question: "Preciso ter experiência com dieta ou treino para começar?",
    answer:
      "Não. A COUT foi criada tanto para quem está começando quanto para quem já treina ou segue um plano alimentar. Meu objetivo é tornar esse processo mais simples, organizado e fácil de seguir.",
  },
  {
    question: "Posso mudar de plano depois?",
    answer:
      "Pode. Se em algum momento outro plano fizer mais sentido para você, basta solicitar a mudança. Assim seu acompanhamento continua alinhado às suas necessidades.",
  },
  {
    question: "Como funcionam as revisões do plano?",
    answer:
      "Seu acompanhamento não termina quando o plano é publicado. Ao longo do processo, acompanho sua evolução e faço os ajustes necessários conforme o plano contratado. A ideia é que seu plano evolua junto com você.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "Sim. Suas informações são armazenadas em ambiente protegido e utilizadas apenas para o seu acompanhamento. Elas são tratadas com confidencialidade e usadas exclusivamente para desenvolver um plano alimentar e um treino personalizados.",
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

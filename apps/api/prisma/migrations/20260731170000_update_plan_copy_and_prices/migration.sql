-- Atualiza copy e preços dos planos conforme revisão do cliente (jul/2026).
-- Precisa ser migration, e não seed: o seed usa `upsert ... update: {}` de propósito (para não
-- sobrescrever edições feitas pelo profissional no admin a cada boot do container), então em
-- bancos já existentes (produção) ele nunca atualizaria estes valores. Roda uma única vez.
-- Só altera as linhas que ainda estão com o texto/preço antigo — se o admin já editou, preserva.

UPDATE "Plan"
SET tagline = 'Comece a cuidar da sua saúde com um plano feito para você.',
    features = '["Plano alimentar personalizado","Treino personalizado","Mensagens de acompanhamento","Check-ins regulares","Revisão do plano 1 vez por mês"]'::jsonb
WHERE code = 'ESSENCIAL' AND tagline = 'Acompanhamento contínuo com revisão mensal.';

UPDATE "Plan"
SET tagline = 'Mais acompanhamento para quem quer evoluir de forma consistente.',
    "monthlyPrice" = 249,
    features = '["Tudo do Essencial","Revisão do plano a cada 15 dias","Ajustes do plano sempre que necessário","Check-ins mais frequentes","Acompanhamento mais próximo"]'::jsonb
WHERE code = 'PLUS' AND tagline = 'Mais frequência e prioridade no atendimento.';

UPDATE "Plan"
SET tagline = 'O acompanhamento mais completo da COUT.',
    features = '["Tudo do Plus","1 teleconsulta por mês (até 1 hora)","Revisão completa durante a consulta","Definição das metas do próximo ciclo"]'::jsonb
WHERE code = 'ELITE' AND tagline = 'O acompanhamento mais próximo, com teleconsulta.';

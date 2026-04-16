🚀 Escopo e Plano de Implementação Master: Synapze CRM (Final)
Este documento descreve a visão completa, a arquitetura e as estratégias de implementação para o CRM Synapze. Com base nos seus apontamentos, a stack, a interface e a modelagem do produto foram definidas para entregar uma solução Premium, sem atritos e de altíssima performance.

1. Visão Arquitetural e "Zero Atrito" (A Nova Premissa UX/UI)
Sua exigência sobre ser super simples para leigos e tecnicamente impecável no visual forma a fundação do desenvolvimento.

Estética Visual ("Linear" / Next-Gen SaaS): Como não há um brand book restrito, construiremos uma interface ultra-moderna (Dark mode de alto contraste, bordas sutis, glassmorphism e sombras elegantes), inspirada no topo do mercado SaaS B2B moderno.
Optimistic UI: O usuário move um cartão no Kanban e ele move instantaneamente, garantindo sensação de performance máxima enquanto salva no banco de dados "por baixo dos panos".
Error Boundaries (Sentry): Total mapeamento e captura de exceções para garantir que telas nunca "fiquem em branco", mascarando erros momentâneos.
State-Driven Design: Uso de Skeleton loaders, micro-animações táteis e tipografia universalmente acessível.
2. A Evolução das Funcionalidades Core
2.1 Hub Omnichannel Híbrido (Agnóstico de WhatsApp)
Para garantir que o CRM atenda empresas em todos os cenários (inclusive empresas que fogem das altíssimas taxas da API Oficial):

Gestão de WhatsApp Universal:
Suporte tanto para API Oficial (Meta).
Suporte extenso nativo para conexões via QR Code usando APIs como Evolution API, Z-API, Meow, etc.
A sua VPS Hostinger (plano intermediário) será utilizada estrategicamente como host e orquestradora containerizada das sessões locais (Puppeteer/Baileys) no caso de clientes que demandarem instâncias Evolution isoladas, fugindo do custo dos serviços Cloud-only de APIs.
Email Powered By Resend:
Envio inteligente através de domínios cadastrados via API. Templates super clean feitos em React Email maximizando a taxa de open-rate na caixa de entrada e respostas nativas anexadas aos contatos do cliente.
2.2 CRM e Gestão Inteligente com IA
Kanban drag & drop com pipelines customizáveis por tenant (empresa).
Formulários públicos com agendamento integrado (Booking).
Integração Synapze x Pinecone: Todo histórico (conversas de Zap, E-mails) será vetorizado no Pinecone, municiando nosso AI Agent para dar sumários da ficha do paciente/cliente antes do parceiro apertar 1 único botão.
3. A Tech Stack Definitiva
Arquitetura desenhada e solidificada para o produto:

Frontend & Framework: Next.js + React (TailwindCSS e Framer Motion).
Backend, Relacional e Autenticação (A Base Inteira): Supabase (Venceu a concorrência). Usaremos o PostgreSQL potente dele, junto com o Supabase Auth para a criação das barreiras nativas de segurança e separação entre empresas (RLS - Row Level Security), garantindo que dados de pacientes nunca se unam nos servidores. Além do Storage e WebSockets no mesmo ecossistema.
Ambiente de Deploy (App Principal): Vercel para escala inicial infinita e edge caching.
Domínio + DNS: Namecheap + Cloudflare (Segurança, rotas curtas e SSL).
Comunicação Disparos: Resend.
Analytics & Monitoramentos: PostHog (Gestão de produto B2B e tracking) e Sentry (Erros).
SaaS Pagamentos: Stripe nativo gerindo subscriptions (caso adote formato B2B self-service depois).
Serverless Extra / IA Fila: Upstash (Filas e Cache rápido) + Pinecone (Vetorial).
4. Fases de Execução no Código
Tudo aprovado. As Tasks de execução se desenrolarão nesta métrica inicial, baseada na construção modular de fora (Database) para dentro (UI):

🚀 Fase 1: MVP Estrutural & UI Foundation (ATUAL)
Setup do Repositório Next.js e Vercel (Configurações base de linter).
Criação das tabelas centrais no Supabase: Usuários, "Workspaces" (As contas do CRM da clínica/empresa) e Perfis. Configuração rígida de segregação via RLS e configuração oficial do Supabase Auth.
Protótipo Funcional de Componentes Premium de UI (Dark mode switch, Menus e Loaders).
🚀 Fase 2: CRUD de Contato, Kanban
Montagem do Banco de dados dos Contatos/Leads.
Grid Principal e Tela interna (Modal expansível "360-degree view") com a aba vazia do Omnichannel.
Montagem visual e manipulação de estado otimizado do Kanban por status.
🚀 Fase 3: Omnichannel Completo
Motor de Disparo via Resend (Envio e Recebimento webhooks).
Criação dos Endpoints e Handlers de WhatsApp na Vercel (para integração Oficial).
Containerização paralela na Hostinger para suporte ao Evolution API via WebHooks de subida e descida.
🚀 Fase 4: O Céu é o Limite (SynapzeAI Agent)
Sincronização dos contatos recém construídos para o Pinecone gerando embeddings.
Chatbots e auto-resumos.
Automação dos fluxos / Workflow.


Decisões Arquiteturais: Synapze CRM (Grill-Me Sessions)
Este documento registra todas as 18 decisões fundamentais tomadas durante o processo de design estrutural da aplicação (metodologia "grill-me"). Estas definições direcionam todo o MVP e as próximas fases do produto.

1. Multi-Tenancy e Isolamento de Dados
Decisão: O sistema terá permissões em duas dimensões (Role e Escopo). As 4 roles principais serão: owner (acesso global), professional (acessa só os próprios dados), manager (acessa dados de múltiplos profissionais designados) e assistant (suporte atrelado a profissionais específicos). Tudo isso é guiado por uma tabela member_assignments que gerencia esse vínculo.

2. O Conceito de "Workspace" vs "Sub-Workspace"
Decisão: Utilizaremos um único Workspace por clínica / escritório. O isolamento será 100% lógico, guiado por políticas fortes de Row Level Security (RLS) do Supabase. Um owner vê os dados do workspace e seus profissionais apenas vêm a própria fatia.

3. O Modelo de Contato (Propriedade e Compartilhamento)
Decisão: Contato Único com múltiplos vínculos (Assignments). Um lead/paciente (Ex: João) só tem um registro central por workspace, evitando cadastros e telefones duplicados. Caso João consulte com dois médicos do mesmo workspace, cada médico gerenciará o mesmo "João" dentro do seu próprio Kanban e com notas privadas, separadamente.

4. Pipelines do Kanban
Decisão: Pipeline customizado por profissional. Cada médico/advogado estrutura o seu próprio funil de Kanban e seus respectivos "Stages", adaptando ao seu fluxo de trabalho pessoal.

5. WhatsApp (Provider Pattern)
Decisão: Iniciaremos o MVP já suportando tanto APIs não-oficiais (ex: Evolution) para clientes que buscam baixo custo e setup rápido com QR Code, quanto a Meta Cloud API (Oficial). Tudo funcionará perfeitamente "plug-and-play" pelo backend ser desenhado em um formato de Provider Pattern Agnóstico.

6. Conexões de WhatsApp simultâneas
Decisão: Cenário Misto. Um mesmo Workspace pode deter um número "Central" da recepção (atribuído às assistentes) e números diretos/pessoais alocados individualmente para cada profissional, tudo através da tabela channel_assignments.

7. Onboarding e Auth
Decisão: Para o MVP, a equipe do Synapze fará o onboarding "white-glove" (configura conta, pipelines, e acessos). O self-service ficará para depois. O login suportará E-mail/Senha + Google OAuth de forma simplificada via Supabase Auth.

8. Agendamento (Booking)
Decisão: Nível Híbrido (2 + 3). O sistema combinará a agenda interna controlada pelos staffs e páginas web públicas exclusivas (Ex: tipo Calendly). O paciente pode agendar online sozinho e esse horário já refletirá imediatamente bloqueado no painel interno sem atritos.

9. Modal "Visão 360°"
Decisão: Todas as abas estarão presentes desde o MVP na abertura da "Ficha" de um Contato: Dados, Kanban Atual, Chat Integrado Omnichannel, Agendamentos, Notas Privadas, Gestão de Arquivos de Nuvem e Resumos com IA.

10. IA & Vetorização de Documentos
Decisão: Não usaremos Pinecone; todo o Embedding dos contatos/mensagens vai residir diretamente no banco de dados através da extensão pgvector do Supabase. Usaremos LLMs eficientes/baratos (como K2.5 / MiMo v2) tanto "Sob Demanda" acionados pelo usuário quanto "Periódicos", visando gerar Sumários contextuais úteis antes de o médico atender o paciente.

11. Modelo de Monetização
Decisão: Cobrança Baseada em Planos/Tiers. As tabelas vão prever pacotes de limites separados (Plano Starter, Pro, Enterprise baseados no número de seats, mensagens ou funcionalidades adicionais).

12. Email com Resend
Decisão: O Email funcionará nas extremidades: Ele vai ser usado Transacionalmente para avisos e notificações, E como Canal Omnichannel, onde respostas do paciente caem listadas lindamente junto com as mensagens de Whatsapp daquele contato.

13. Real-Time & Notificações
Decisão: As tabelas de Mensagens e Agendamentos consumirão Supabase Realtime WebSockets para atualizações espontâneas na interface (Zero Refresh). Notificações internas vão engatilhar um Sininho in-app semelhante ao padrão em grandes plataformas (Youtube, Trello).

14. Custom Fields (Flexibilização do Produto)
Decisão: Para abraçar segmentos de Imobiliárias a Dentistas perfeitamente, os formulários terão alguns campos globais limitados fixados e o resto dos atributos usará a abordagem EAV (Entity-Attribute-Value) onde os owners compõe dinamicamente quantos atributos customizados seu negócio exigir no cadastro.

15. Formulários de Captura vs Páginas de Booking
Decisão: Essas duas instâncias serão Desacopladas mas Linkáveis. Poderá existir fluxos que solicitam um formulário completo (Avaliação de processo jurídico) que no submit redireciona para a marcação do Calendário do Advogado.

16. O Dashboard Inicial
Decisão: Todos usarão o mesmo Dashboard flexível, mas a perspectiva se alterará através da lente do Role. Owners verão balanços da empresa, assistentes verão agendas aglomeradas de vários médicos que ajudam e profissionais verão apenas a lista exclusiva do seu dia.

17. Infraestrutura de Mensagens no DB
Decisão: Para suportar alta escabilidade em leitura, haverá apenas uma única tabela mãe messages. O tipo de provider, metadata e anexos vão habitar colunas compartilhadas ou JSONB para que a query do feed de chat seja instantânea e a Optimistic UI possa desenhar na tela com um clique.

18. Frontend State & Optimistic UI
Decisão: Optou-se pela Option B. Emprego massivo do TanStack Query (React Query) combinado ao Client do Supabase. A mutação complexa acontecerá primeiro no Cache local do Browser para falsificar visualmente mudanças como "Arrastar cards e Envio de Chats", criando sensação de 0 atrito, confirmando com o BD por debaixo dos panos.
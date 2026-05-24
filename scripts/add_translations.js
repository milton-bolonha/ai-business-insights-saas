const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'messages', 'en.json');
const ptPath = path.join(__dirname, 'messages', 'pt.json');

const newEnKeys = {
    "admin": {
        "checkout": {
            "preparingTitle": "Preparing Checkout",
            "preparingDescription": "Please wait while we redirect you to our secure payment processor...",
            "failedTitle": "Checkout failed",
            "failedDescription": "Please try again"
        },
        "modals": {
            "paymentConfirmationTitle": "Payment Confirmation",
            "paymentConfirmationDescription": "Please enter your email address to receive payment confirmation and access instructions.",
            "emailAddressLabel": "Email Address",
            "emailPlaceholder": "your@email.com",
            "cancel": "Cancel",
            "sending": "Sending...",
            "sendConfirmation": "Send Confirmation",
            "upgradeToProTitle": "Upgrade to Pro",
            "walletBuffer": "Your Wallet Buffer",
            "creditsUsed": "Credits Used:",
            "needMoreCredits": "You need more credits to perform this action.",
            "proPlanBenefits": "Pro Plan Benefits",
            "benefitUnlimitedWorkspaces": "Unlimited workspaces",
            "benefitUnlimitedContacts": "Unlimited contacts",
            "benefitAiChat": "AI chat with insights",
            "benefitAdvancedAi": "Advanced AI models",
            "benefitCloudStorage": "Cloud storage",
            "processing": "Processing...",
            "upgradeToPro": "Upgrade to Pro",
            "markAsPaid": "Already a member? Mark as paid",
            "reachedLimit": "You've reached your free limit for {action}.",
            "actions": {
                "createWorkspace": "creating workspaces",
                "createContact": "adding contacts",
                "tileChat": "chatting with insights",
                "regenerate": "regenerating content",
                "default": "using this feature"
            },
            "featureLocked": "Feature Locked",
            "usageLimits": "Usage Limits",
            "paymentHistory": "Payment History",
            "usageHistory": "Usage History",
            "featureLockedDescription": "This feature is available exclusively for <strong>Pro</strong> members. Upgrade your plan to unlock it immediately.",
            "currentBalance": "Current Balance",
            "credits": "Credits",
            "costTable": "Cost Table",
            "needMoreResources": "Need more resources?",
            "loading": "Loading...",
            "buyCredits": "Buy Credits",
            "loadingHistory": "Loading history...",
            "noTransactionHistory": "No transaction history found.",
            "actionLabels": {
                "buy_credits": "Credit Purchase",
                "createWorkspace": "Created Workspace",
                "createTile": "Generated Insight (Arc)",
                "createContact": "New Character",
                "tileChat": "Insight Map Chat",
                "contactChat": "Character Chat",
                "regenerate": "AI Regeneration",
                "bookGenerationsCount": "Book Chapter",
                "imageGenerationsCount": "AI Book Image",
                "marketEnrichmentCount": "Market Enrichment",
                "assetsCount": "Asset Upload"
            },
            "costs": {
                "generateInsight": "Generate Insight (Arc)",
                "newCharacter": "New Character",
                "createWorkspace": "Create Workspace",
                "sendMessage": "Send Message",
                "bookChapter": "Book Chapter / Arc",
                "marketEnrichment": "Market Enrichment",
                "aiBookImage": "AI Book Image"
            }
        },
        "header": {
            "notifications": "Announcements & Notifications",
            "messagesAndNotices": "Messages & Notices",
            "newMessages": "{count} new",
            "markAllRead": "Mark all read",
            "noNotifications": "No notifications for now.",
            "from": "From:",
            "superAdmin": "Super Admin",
            "mentor": "Mentor",
            "currentDashboard": "Current Dashboard",
            "switchDashboard": "Switch Dashboard",
            "newDashboard": "New Dashboard",
            "wallet": "Wallet",
            "presets": "Presets",
            "customColor": "Custom Color"
        }
    }
};

const newPtKeys = {
    "admin": {
        "checkout": {
            "preparingTitle": "Preparando o Checkout",
            "preparingDescription": "Por favor, aguarde enquanto redirecionamos você para nosso processador de pagamentos seguro...",
            "failedTitle": "Falha no checkout",
            "failedDescription": "Por favor, tente novamente"
        },
        "modals": {
            "paymentConfirmationTitle": "Confirmação de Pagamento",
            "paymentConfirmationDescription": "Por favor, insira seu endereço de e-mail para receber a confirmação do pagamento e instruções de acesso.",
            "emailAddressLabel": "Endereço de E-mail",
            "emailPlaceholder": "seu@email.com",
            "cancel": "Cancelar",
            "sending": "Enviando...",
            "sendConfirmation": "Enviar Confirmação",
            "upgradeToProTitle": "Fazer Upgrade para Pro",
            "walletBuffer": "Saldo da Carteira",
            "creditsUsed": "Créditos Usados:",
            "needMoreCredits": "Você precisa de mais créditos para realizar esta ação.",
            "proPlanBenefits": "Benefícios do Plano Pro",
            "benefitUnlimitedWorkspaces": "Workspaces ilimitados",
            "benefitUnlimitedContacts": "Contatos ilimitados",
            "benefitAiChat": "Chat com IA com insights",
            "benefitAdvancedAi": "Modelos avançados de IA",
            "benefitCloudStorage": "Armazenamento em nuvem",
            "processing": "Processando...",
            "upgradeToPro": "Fazer Upgrade para Pro",
            "markAsPaid": "Já é um membro? Marcar como pago",
            "reachedLimit": "Você atingiu seu limite gratuito para {action}.",
            "actions": {
                "createWorkspace": "criar workspaces",
                "createContact": "adicionar contatos",
                "tileChat": "conversar com insights",
                "regenerate": "regenerar conteúdo",
                "default": "usar esta funcionalidade"
            },
            "featureLocked": "Funcionalidade Bloqueada",
            "usageLimits": "Limites de Uso",
            "paymentHistory": "Histórico de Pagamentos",
            "usageHistory": "Histórico de Uso",
            "featureLockedDescription": "Esta funcionalidade está disponível exclusivamente para membros <strong>Pro</strong>. Faça upgrade do seu plano para desbloqueá-la imediatamente.",
            "currentBalance": "Saldo Atual",
            "credits": "Créditos",
            "costTable": "Tabela de Custos",
            "needMoreResources": "Precisa de mais recursos?",
            "loading": "Carregando...",
            "buyCredits": "Comprar Créditos",
            "loadingHistory": "Carregando histórico...",
            "noTransactionHistory": "Nenhum histórico de transações encontrado.",
            "actionLabels": {
                "buy_credits": "Compra de Créditos",
                "createWorkspace": "Workspace Criado",
                "createTile": "Insight Gerado (Arc)",
                "createContact": "Novo Personagem",
                "tileChat": "Chat do Mapa de Insights",
                "contactChat": "Chat do Personagem",
                "regenerate": "Regeneração de IA",
                "bookGenerationsCount": "Capítulo do Livro",
                "imageGenerationsCount": "Imagem do Livro com IA",
                "marketEnrichmentCount": "Enriquecimento de Mercado",
                "assetsCount": "Upload de Ativo"
            },
            "costs": {
                "generateInsight": "Gerar Insight (Arc)",
                "newCharacter": "Novo Personagem",
                "createWorkspace": "Criar Workspace",
                "sendMessage": "Enviar Mensagem",
                "bookChapter": "Capítulo do Livro / Arc",
                "marketEnrichment": "Enriquecimento de Mercado",
                "aiBookImage": "Imagem de Livro com IA"
            }
        },
        "header": {
            "notifications": "Anúncios & Notificações",
            "messagesAndNotices": "Mensagens & Avisos",
            "newMessages": "{count} novos",
            "markAllRead": "Marcar todas lidas",
            "noNotifications": "Nenhuma notificação por enquanto.",
            "from": "De:",
            "superAdmin": "Super Admin",
            "mentor": "Mentor",
            "currentDashboard": "Dashboard Atual",
            "switchDashboard": "Trocar de Dashboard",
            "newDashboard": "Novo Dashboard",
            "wallet": "Carteira",
            "presets": "Predefinições",
            "customColor": "Cor Personalizada"
        }
    }
};

function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ptData = JSON.parse(fs.readFileSync(ptPath, 'utf8'));

deepMerge(enData, newEnKeys);
deepMerge(ptData, newPtKeys);

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(ptPath, JSON.stringify(ptData, null, 2));

console.log('Translations merged successfully.');

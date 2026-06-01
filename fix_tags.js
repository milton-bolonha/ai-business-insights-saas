const fs = require('fs');
const pt = JSON.parse(fs.readFileSync('messages/pt.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));

pt.appTags.ai_blog = { label: "I/O - Blog Automático", subtitle: "Criação de artigos, otimização de SEO e publicação automatizada." };
pt.appTags.os_system = { label: "I/O - OS System", subtitle: "Sistema de triagem, orçamento e produção de ordens de serviço." };

en.appTags.ai_blog = { label: "I/O - AI Blog", subtitle: "Article creation, SEO optimization and automated publishing." };
en.appTags.os_system = { label: "I/O - OS System", subtitle: "Intake, quoting, and production of service orders." };

pt.attributes.blog_name = { label: "Nome do Blog", placeholder: "Qual será o nome do blog?" };
pt.attributes.blog_description = { label: "Descrição do Blog", placeholder: "Sobre o que é o blog?" };
pt.attributes.blog_topics = { label: "Tópicos Principais", placeholder: "Ex: Tecnologia, Negócios..." };
pt.attributes.blog_author = { label: "Autor Principal", placeholder: "Qual o nome do autor principal?" };

en.attributes.blog_name = { label: "Blog Name", placeholder: "What will be the name of the blog?" };
en.attributes.blog_description = { label: "Blog Description", placeholder: "What is the blog about?" };
en.attributes.blog_topics = { label: "Main Topics", placeholder: "E.g., Technology, Business..." };
en.attributes.blog_author = { label: "Main Author", placeholder: "What is the main author's name?" };

fs.writeFileSync('messages/pt.json', JSON.stringify(pt, null, 2), 'utf8');
fs.writeFileSync('messages/en.json', JSON.stringify(en, null, 2), 'utf8');

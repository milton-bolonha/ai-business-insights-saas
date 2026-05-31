import React from "react";

export type AppTagId = "home" | "business_insights" | "love_writers" | "trade_ranking" | "furniture_logistics" | "furniture_layout" | "furniture_store" | "io_mentoring" | "smart_survey" | "ai_blog";

export interface AppTag {
  id: AppTagId;
  label: string; // Static PT/EN fallback
  labelKey: string; // Dynamic i18n key
  color: string; // Hex color for borders/accents
  icon?: React.ReactNode;
}

export interface AppAttribute {
  id: string;
  label: string; // Static PT/EN fallback
  labelKey: string; // Dynamic i18n key
  description?: string;
  appTagId: AppTagId;
  placeholder?: string; // Static PT/EN fallback
  placeholderKey?: string; // Dynamic i18n key
}

export const APP_TAGS: AppTag[] = [
  {
    id: "home",
    label: "Home",
    labelKey: "common.logoText",
    color: "#000000", // Default/Neutral
  },
  {
    id: "business_insights",
    label: "I/O - Business Insights",
    labelKey: "appTags.business_insights.label",
    color: "#2563eb", // Blue-600
  },
  {
    id: "love_writers",
    label: "I/O - Love Writers",
    labelKey: "appTags.love_writers.label",
    color: "#e11d48", // Rose-600
  },
  {
    id: "trade_ranking",
    label: "I/O - Ranking Product",
    labelKey: "appTags.trade_ranking.label",
    color: "#10b981", // Emerald-500
  },
  {
    id: "furniture_logistics",
    label: "I/O - Furniture Logistics",
    labelKey: "appTags.furniture_logistics.label",
    color: "#0ea5e9", // Sky-500
  },
  {
    id: "furniture_layout",
    label: "I/O - Store Layout",
    labelKey: "appTags.furniture_layout.label",
    color: "#6366f1", // Indigo-500
  },
  {
    id: "furniture_store",
    label: "I/O - Store",
    labelKey: "appTags.furniture_store.label",
    color: "#f59e0b", // Amber-500
  },
  {
    id: "io_mentoring",
    label: "I/O - Mentoring",
    labelKey: "appTags.io_mentoring.label",
    color: "#4f46e5", // Indigo-600
  },
  {
    id: "smart_survey",
    label: "I/O - Smart Survey",
    labelKey: "appTags.smart_survey.label",
    color: "#10b981", // Emerald-500
  },
  {
    id: "ai_blog",
    label: "I/O - Automatic Blog",
    labelKey: "appTags.ai_blog.label",
    color: "#8b5cf6", // Violet-500
  },
];

export const APP_ATTRIBUTES: AppAttribute[] = [
  // Business Insights Attributes (Legacy Form Fields)
  {
    id: "company",
    label: "Sales Rep Company",
    labelKey: "attributes.company.label",
    appTagId: "business_insights",
    placeholder: "Which company do you represent?",
    placeholderKey: "attributes.company.placeholder",
  },
  {
    id: "companyWebsite",
    label: "My Website",
    labelKey: "attributes.companyWebsite.label",
    appTagId: "business_insights",
    placeholder: "e.g., www.microsoft.com",
    placeholderKey: "attributes.companyWebsite.placeholder",
  },
  {
    id: "solution",
    label: "Solution",
    labelKey: "attributes.solution.label",
    appTagId: "business_insights",
    placeholder: "What are you selling?",
    placeholderKey: "attributes.solution.placeholder",
  },
  {
    id: "researchTarget",
    label: "Target Company",
    labelKey: "attributes.researchTarget.label",
    appTagId: "business_insights",
    placeholder: "Who do you want to research?",
    placeholderKey: "attributes.researchTarget.placeholder",
  },
  {
    id: "researchWebsite",
    label: "Target Website",
    labelKey: "attributes.researchWebsite.label",
    appTagId: "business_insights",
    placeholder: "e.g., www.tesla.com",
    placeholderKey: "attributes.researchWebsite.placeholder",
  },

  // Love Writers Attributes (New Book Builder)
  {
    id: "user_name",
    label: "Your Name",
    labelKey: "attributes.user_name.label",
    appTagId: "love_writers",
    placeholder: "What is your name?",
    placeholderKey: "attributes.user_name.placeholder",
  },
  {
    id: "partner_name",
    label: "Partner's Name",
    labelKey: "attributes.partner_name.label",
    appTagId: "love_writers",
    placeholder: "What is your partner's name?",
    placeholderKey: "attributes.partner_name.placeholder",
  },
  {
    id: "meeting_story",
    label: "Meeting Story",
    labelKey: "attributes.meeting_story.label",
    appTagId: "love_writers",
    placeholder: "How did you two meet?",
    placeholderKey: "attributes.meeting_story.placeholder",
  },

  // Trade Ranking Attributes (Trader Algorithm)
  {
    id: "product_category",
    label: "Product Category",
    labelKey: "attributes.product_category.label",
    appTagId: "trade_ranking",
    placeholder: "e.g., Refrigerator, Smartphone",
    placeholderKey: "attributes.product_category.placeholder",
  },
  {
    id: "product_condition",
    label: "Condition",
    labelKey: "attributes.product_condition.label",
    appTagId: "trade_ranking",
    placeholder: "Novo, Semi-novo, Usado, Ruim",
    placeholderKey: "attributes.product_condition.placeholder",
  },
  {
    id: "catDeprec",
    label: "Depreciation Cat",
    labelKey: "attributes.catDeprec.label",
    appTagId: "trade_ranking",
    placeholder: "Smartphone, Notebook, Console, Eletro, Generico",
    placeholderKey: "attributes.catDeprec.placeholder",
  },
  {
    id: "mes",
    label: "Referencing Month",
    labelKey: "attributes.mes.label",
    appTagId: "trade_ranking",
    placeholder: "0 (Jan) to 11 (Dec)",
    placeholderKey: "attributes.mes.placeholder",
  },
  {
    id: "product_repair_cost",
    label: "Repair Cost (R$)",
    labelKey: "attributes.product_repair_cost.label",
    appTagId: "trade_ranking",
    placeholder: "Estimate repair costs (e.g. 200)",
    placeholderKey: "attributes.product_repair_cost.placeholder",
  },
  {
    id: "market_value_new",
    label: "New Price (R$)",
    labelKey: "attributes.market_value_new.label",
    appTagId: "trade_ranking",
    placeholder: "Market price for a brand new item",
    placeholderKey: "attributes.market_value_new.placeholder",
  },
  {
    id: "market_value_used_avg",
    label: "Average Used Price (R$)",
    labelKey: "attributes.market_value_used_avg.label",
    appTagId: "trade_ranking",
    placeholder: "Common price in marketplace/OLX",
    placeholderKey: "attributes.market_value_used_avg.placeholder",
  },
  {
    id: "market_demand",
    label: "Market Demand (0-1)",
    labelKey: "attributes.market_demand.label",
    appTagId: "trade_ranking",
    placeholder: "Interest level (0.8 = High)",
    placeholderKey: "attributes.market_demand.placeholder",
  },
  {
    id: "market_time_to_sell",
    label: "Avg Days to Sell",
    labelKey: "attributes.market_time_to_sell.label",
    appTagId: "trade_ranking",
    placeholder: "e.g. 7, 15, 30 days",
    placeholderKey: "attributes.market_time_to_sell.placeholder",
  },
  {
    id: "trader_mode",
    label: "Trader Mode",
    labelKey: "attributes.trader_mode.label",
    appTagId: "trade_ranking",
    placeholder: "Giro, Margem, Agressivo",
    placeholderKey: "attributes.trader_mode.placeholder",
  },
  {
    id: "trader_risk",
    label: "Risk Tolerance (0-1)",
    labelKey: "attributes.trader_risk.label",
    appTagId: "trade_ranking",
    placeholder: "0.2 = Conservative, 0.9 = Risk Taker",
    placeholderKey: "attributes.trader_risk.placeholder",
  },
  {
    id: "market_pricing_power",
    label: "Pricing Power (0-1)",
    labelKey: "attributes.market_pricing_power.label",
    appTagId: "trade_ranking",
    placeholder: "How much control do you have over price?",
    placeholderKey: "attributes.market_pricing_power.placeholder",
  },

  // Furniture Logistics Attributes
  {
    id: "store_name",
    label: "Store Name",
    labelKey: "attributes.store_name.label",
    appTagId: "furniture_logistics",
    placeholder: "What is your store name?",
    placeholderKey: "attributes.store_name.placeholder",
  },
  {
    id: "product_category",
    label: "Main Category",
    labelKey: "attributes.product_category.label",
    appTagId: "furniture_logistics",
    placeholder: "e.g., Kitchens, Modular Furniture, Office",
    placeholderKey: "attributes.product_category.placeholder",
  },
  {
    id: "staff_count",
    label: "Assembly Team Size",
    labelKey: "attributes.staff_count.label",
    appTagId: "furniture_logistics",
    placeholder: "How many assemblers do you have?",
    placeholderKey: "attributes.staff_count.placeholder",
  },

  // Furniture Layout Attributes
  {
    id: "layout_store_name",
    label: "Store Name",
    labelKey: "attributes.layout_store_name.label",
    appTagId: "furniture_layout",
    placeholder: "What is your store name?",
    placeholderKey: "attributes.layout_store_name.placeholder",
  },
  {
    id: "store_size",
    label: "Store Size (sqm)",
    labelKey: "attributes.store_size.label",
    appTagId: "furniture_layout",
    placeholder: "e.g., 200, 500, 1000",
    placeholderKey: "attributes.store_size.placeholder",
  },
  {
    id: "aisle_count",
    label: "Number of Aisles",
    labelKey: "attributes.aisle_count.label",
    appTagId: "furniture_layout",
    placeholder: "e.g., 4, 8, 12",
    placeholderKey: "attributes.aisle_count.placeholder",
  },

  // Furniture Store Attributes
  {
    id: "vitrine_name",
    label: "Store Name",
    labelKey: "attributes.vitrine_name.label",
    appTagId: "furniture_store",
    placeholder: "Ex: Bolonha Furniture - 2024 Collection",
    placeholderKey: "attributes.vitrine_name.placeholder",
  },
  {
    id: "primary_niche",
    label: "Niche",
    labelKey: "attributes.primary_niche.label",
    appTagId: "furniture_store",
    placeholder: "Ex: Rustic Furniture, Modern, Decoration",
    placeholderKey: "attributes.primary_niche.placeholder",
  },
  
  // I/O Mentoring Attributes
  {
    id: "mentor_name",
    label: "Nome do Instituto",
    labelKey: "attributes.mentor_name.label",
    appTagId: "io_mentoring",
    placeholder: "Qual o nome do instituto/empresa?",
    placeholderKey: "attributes.mentor_name.placeholder",
  },
  {
    id: "student_name",
    label: "Nome do Mentor",
    labelKey: "attributes.student_name.label",
    appTagId: "io_mentoring",
    placeholder: "Quem será o mentor?",
    placeholderKey: "attributes.student_name.placeholder",
  },
  {
    id: "mentoring_goal",
    label: "Objetivo da Mentoria",
    labelKey: "attributes.mentoring_goal.label",
    appTagId: "io_mentoring",
    placeholder: "Qual o foco principal dessa mentoria?",
    placeholderKey: "attributes.mentoring_goal.placeholder",
  },

  // I/O Smart Survey Attributes
  {
    id: "survey_company",
    label: "Organização",
    labelKey: "attributes.survey_company.label",
    appTagId: "smart_survey",
    placeholder: "Qual a Organização pesquisada?",
    placeholderKey: "attributes.survey_company.placeholder",
  },

  // AI Blog Attributes
  {
    id: "blog_name",
    label: "Nome do Blog",
    labelKey: "attributes.blog_name.label",
    appTagId: "ai_blog",
    placeholder: "Como você quer chamar o seu blog?",
    placeholderKey: "attributes.blog_name.placeholder",
  },
  {
    id: "blog_description",
    label: "Descrição",
    labelKey: "attributes.blog_description.label",
    appTagId: "ai_blog",
    placeholder: "Sobre o que é o seu blog?",
    placeholderKey: "attributes.blog_description.placeholder",
  },
  {
    id: "blog_topics",
    label: "Temas / Assuntos",
    labelKey: "attributes.blog_topics.label",
    appTagId: "ai_blog",
    placeholder: "Quais os principais temas abordados?",
    placeholderKey: "attributes.blog_topics.placeholder",
  },
  {
    id: "blog_author",
    label: "Autor",
    labelKey: "attributes.blog_author.label",
    appTagId: "ai_blog",
    placeholder: "Qual o nome do autor principal?",
    placeholderKey: "attributes.blog_author.placeholder",
  },
];

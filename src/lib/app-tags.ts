export type AppTagId = "home" | "business_insights" | "love_writers" | "trade_ranking" | "furniture_logistics" | "furniture_layout" | "furniture_store";

export interface AppTag {
  id: AppTagId;
  label: string;
  color: string; // Hex color for borders/accents
  icon?: React.ReactNode;
}

export interface AppAttribute {
  id: string;
  label: string;
  description?: string;
  appTagId: AppTagId;
  placeholder?: string;
}

export const APP_TAGS: AppTag[] = [
  {
    id: "home",
    label: "Home",
    color: "#000000", // Default/Neutral
  },
  {
    id: "business_insights",
    label: "Business Insights",
    color: "#2563eb", // Blue-600
  },
  {
    id: "love_writers",
    label: "Love Writers",
    color: "#e11d48", // Rose-600
  },
  {
    id: "trade_ranking",
    label: "Trade Ranking",
    color: "#10b981", // Emerald-500
  },
  {
    id: "furniture_logistics",
    label: "Furniture Logistics",
    color: "#0ea5e9", // Sky-500
  },
  {
    id: "furniture_layout",
    label: "Store Layout",
    color: "#6366f1", // Indigo-500
  },
  {
    id: "furniture_store",
    label: "Virtual Store",
    color: "#f59e0b", // Amber-500
  },
];

export const APP_ATTRIBUTES: AppAttribute[] = [
  // Business Insights Attributes (Legacy Form Fields)
  {
    id: "company",
    label: "Sales Rep Company",
    appTagId: "business_insights",
    placeholder: "Which company do you represent?",
  },
  {
    id: "companyWebsite",
    label: "My Website",
    appTagId: "business_insights",
    placeholder: "e.g., www.microsoft.com",
  },
  {
    id: "solution",
    label: "Solution",
    appTagId: "business_insights",
    placeholder: "What are you selling?",
  },
  {
    id: "researchTarget",
    label: "Target Company",
    appTagId: "business_insights",
    placeholder: "Who do you want to research?",
  },
  {
    id: "researchWebsite",
    label: "Target Website",
    appTagId: "business_insights",
    placeholder: "e.g., www.tesla.com",
  },

  // Love Writers Attributes (New Book Builder)
  {
    id: "user_name",
    label: "Your Name",
    appTagId: "love_writers",
    placeholder: "What is your name?",
  },
  {
    id: "partner_name",
    label: "Partner's Name",
    appTagId: "love_writers",
    placeholder: "What is your partner's name?",
  },
  {
    id: "meeting_story",
    label: "Meeting Story",
    appTagId: "love_writers",
    placeholder: "How did you two meet?",
  },

  // Trade Ranking Attributes (Trader Algorithm)
  {
    id: "product_category",
    label: "Product Category",
    appTagId: "trade_ranking",
    placeholder: "e.g., Refrigerator, Smartphone",
  },
  {
    id: "product_condition",
    label: "Condition",
    appTagId: "trade_ranking",
    placeholder: "Novo, Semi-novo, Usado, Ruim",
  },
  {
    id: "catDeprec",
    label: "Depreciation Cat",
    appTagId: "trade_ranking",
    placeholder: "Smartphone, Notebook, Console, Eletro, Generico",
  },
  {
    id: "mes",
    label: "Referencing Month",
    appTagId: "trade_ranking",
    placeholder: "0 (Jan) to 11 (Dec)",
  },
  {
    id: "product_repair_cost",
    label: "Repair Cost (R$)",
    appTagId: "trade_ranking",
    placeholder: "Estimate repair costs (e.g. 200)",
  },
  {
    id: "market_value_new",
    label: "New Price (R$)",
    appTagId: "trade_ranking",
    placeholder: "Market price for a brand new item",
  },
  {
    id: "market_value_used_avg",
    label: "Average Used Price (R$)",
    appTagId: "trade_ranking",
    placeholder: "Common price in marketplace/OLX",
  },
  {
    id: "market_demand",
    label: "Market Demand (0-1)",
    appTagId: "trade_ranking",
    placeholder: "Interest level (0.8 = High)",
  },
  {
    id: "market_time_to_sell",
    label: "Avg Days to Sell",
    appTagId: "trade_ranking",
    placeholder: "e.g. 7, 15, 30 days",
  },
  {
    id: "trader_mode",
    label: "Trader Mode",
    appTagId: "trade_ranking",
    placeholder: "Giro, Margem, Agressivo",
  },
  {
    id: "trader_risk",
    label: "Risk Tolerance (0-1)",
    appTagId: "trade_ranking",
    placeholder: "0.2 = Conservative, 0.9 = Risk Taker",
  },
  {
    id: "market_pricing_power",
    label: "Pricing Power (0-1)",
    appTagId: "trade_ranking",
    placeholder: "How much control do you have over price?",
  },

  // Furniture Logistics Attributes
  {
    id: "store_name",
    label: "Store Name",
    appTagId: "furniture_logistics",
    placeholder: "What is your store name?",
  },
  {
    id: "product_category",
    label: "Main Category",
    appTagId: "furniture_logistics",
    placeholder: "e.g., Kitchens, Modular Furniture, Office",
  },
  {
    id: "staff_count",
    label: "Assembly Team Size",
    appTagId: "furniture_logistics",
    placeholder: "How many assemblers do you have?",
  },

  // Furniture Layout Attributes
  {
    id: "layout_store_name",
    label: "Store Name",
    appTagId: "furniture_layout",
    placeholder: "What is your store name?",
  },
  {
    id: "store_size",
    label: "Store Size (sqm)",
    appTagId: "furniture_layout",
    placeholder: "e.g., 200, 500, 1000",
  },
  {
    id: "aisle_count",
    label: "Number of Aisles",
    appTagId: "furniture_layout",
    placeholder: "e.g., 4, 8, 12",
  },

  // Furniture Store Attributes
  {
    id: "vitrine_name",
    label: "Store Name",
    appTagId: "furniture_store",
    placeholder: "Ex: Bolonha Furniture - 2024 Collection",
  },
  {
    id: "primary_niche",
    label: "Niche",
    appTagId: "furniture_store",
    placeholder: "Ex: Rustic Furniture, Modern, Decoration",
  },
];

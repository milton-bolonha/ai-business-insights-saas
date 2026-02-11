export type AppTagId = "home" | "business_insights" | "love_writers";

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
];

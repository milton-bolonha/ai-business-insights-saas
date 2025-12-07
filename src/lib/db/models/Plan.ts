import type { Document } from "mongodb";
import type { UsageLimits } from "@/lib/saas/usage-service";

export interface PlanDocument extends Document {
  _id?: string;
  planId: "guest" | "member" | "business";
  limits: UsageLimits;
  updatedAt?: Date;
  createdAt?: Date;
}

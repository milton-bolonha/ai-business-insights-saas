import { ObjectId } from "mongodb";

export interface PurchaseDocument {
    _id?: ObjectId;
    userId: string; // Clerk ID or Guest ID
    stripeSessionId: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    amount: number;
    currency: string;
    plan: string;
    status: string; // paid, open, etc
    createdAt: Date;
}

import { ObjectId } from "mongodb";

export interface UserDocument {
    _id?: ObjectId;
    userId: string; // Clerk ID or Stripe ID
    clerkId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    imageUrl?: string;

    // Subscription
    stripeCustomerId?: string;
    subscriptionStatus?: string;
    subscriptionId?: string;
    plan?: "guest" | "member" | "business";
    isMember?: boolean;
    membershipStartedAt?: Date;

    // System
    createdAt: Date;
    updatedAt: Date;
    migrationNeeded?: boolean;
}

export function userDocumenttoSnapshot(doc: UserDocument) {
    return {
        id: doc.userId,
        email: doc.email,
        name: doc.fullName || `${doc.firstName || ''} ${doc.lastName || ''}`.trim(),
        role: doc.plan || 'guest',
        plan: doc.plan,
        isMember: doc.isMember,
        imageUrl: doc.imageUrl
    };
}

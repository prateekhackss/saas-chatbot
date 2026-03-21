export type PlanTier = "starter" | "pro" | "business";

export const PLAN_LIMITS: Record<
  PlanTier,
  {
    maxMessages: number;
    maxDocs: number;
    maxBots: number;
    features: {
      removeBranding: boolean;
      apiAccess: boolean;
      slackIntegration: boolean;
      humanHandoff: boolean;
      prioritySupport: boolean;
      leadCapture: boolean;
    };
  }
> = {
  starter: {
    maxMessages: 2000,
    maxDocs: 20,
    maxBots: 1,
    features: {
      removeBranding: false,
      apiAccess: false,
      slackIntegration: false,
      humanHandoff: false,
      prioritySupport: false,
      leadCapture: false,
    },
  },
  pro: {
    maxMessages: 10000,
    maxDocs: 100,
    maxBots: 3,
    features: {
      removeBranding: true,
      apiAccess: false,
      slackIntegration: true,
      humanHandoff: true,
      prioritySupport: false,
      leadCapture: true,
    },
  },
  business: {
    maxMessages: 50000,
    maxDocs: 999999, // Unlimited
    maxBots: 10,
    features: {
      removeBranding: true,
      apiAccess: true,
      slackIntegration: true,
      humanHandoff: true,
      prioritySupport: true,
      leadCapture: true,
    },
  },
};

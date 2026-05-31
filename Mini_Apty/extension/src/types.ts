export interface WalkthroughStepTarget {
  id?: string;
  selector?: string;
  text?: string;
  role?: string;
  attributes?: Record<string, string>;
}

export interface WalkthroughStep {
  title: string;
  description: string;
  trigger: "click" | "next" | "manual";
  target: WalkthroughStepTarget;
}

export interface Walkthrough {
  id: number;
  ownerId: number;
  title: string;
  origin: string;
  pathPattern: string;
  steps: WalkthroughStep[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaybackProgress {
  walkthroughId: number;
  userId: number;
  stepIndex: number;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
  };
}

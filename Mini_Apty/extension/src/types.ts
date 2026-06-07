export interface WalkthroughStepTarget {
  id?: string;
  selector?: string;
  text?: string;
  value?: string;
  role?: string;
  attributes?: Record<string, string>;
  pageUrl?: string;
  // Accessibility / semantic hints captured during authoring
  ariaLabel?: string;
  name?: string;
  title?: string;
  alt?: string;
  href?: string;
  // Fallback hints for contextual matching
  anchorText?: string;
  contextSelector?: string;
  pathSignature?: string;
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

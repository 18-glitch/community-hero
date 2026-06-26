/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IssueCategory = 'pothole' | 'water_leakage' | 'streetlight' | 'waste_garbage' | 'other';

export type IssueStatus = 'Reported' | 'Verified' | 'In Progress' | 'Pending Verification' | 'Resolved';

export type IssueSeverity = 'low' | 'medium' | 'critical';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
  locality?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  points: number;
  trustScore: number; // starts at 100, goes up or down based on verified/duplicate issues
  locality: string;
}

export interface VerificationDetails {
  verifiedAt?: string;
  verifiedBy?: string;
  proofBeforeUrl?: string;
  proofAfterUrl?: string; // photo proving the resolution
  aiConfidence?: number;  // verification confidence score from Gemini (0 - 100)
  aiExplanation?: string; // Gemini explanation of comparison
  resolvedByUid?: string;
  resolvedByName?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  location: Location;
  imageUrl?: string;
  audioUrl?: string; // voice clip / spoken description
  reportedBy: {
    uid: string;
    name: string;
    photoURL?: string;
  };
  createdAt: string;
  updatedAt: string;
  upvotes: string[]; // List of user UIDs
  duplicateOf?: string; // merges duplicates to point to master issue ID
  verification?: VerificationDetails;
  comments?: Comment[];
  firestoreId?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: string;
}

export interface LocalityScore {
  locality: string;
  points: number;
  resolvedCount: number;
  reportCount: number;
}

export interface PredictiveInsight {
  locality: string;
  riskFactor: 'low' | 'medium' | 'high' | 'critical';
  predictedCategory: IssueCategory;
  explanation: string;
  recommendation: string;
}

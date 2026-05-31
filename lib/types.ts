export type ProgramCategory =
  | "activity"
  | "adventure"
  | "sports"
  | "recreation"
  | "ai-creative";

export type ProgramIconKey =
  | "laser-survival"
  | "sky-swing"
  | "sports-climbing"
  | "sports-day"
  | "ai-homepage"
  | "ai-diary";

export interface Program {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: ProgramCategory;
  icon: ProgramIconKey;
  iconKey?: ProgramIconKey;
  tags: string[];
  targetAudience: string;
  targetGrades: string[];
  duration: string;
  locationType: string;
  recommendedFor: string[];
  requirements: string[];
  processSteps: string[];
  safetyNotes: string[];
  expectedEffects: string[];
  basePrice: number;
  priceNote: string;
  imageUrl: string;
  imageAlt: string;
  fallbackGradient: string;
  isPublished: boolean;
  sortOrder: number;
}

export type InquiryStatus = "draft" | "submitted";

export interface Inquiry {
  schoolName: string;
  managerName: string;
  phone: string;
  email: string;
  selectedProgram: string;
  preferredDate: string;
  expectedStudents: string;
  targetGrade: string;
  location: string;
  message: string;
  status: InquiryStatus;
}

export type InquiryLifecycleStatus =
  | "new"
  | "contacted"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface InquiryRecord {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  organizationName: string;
  programInterest: string;
  preferredDate: string | null;
  expectedStudents: string | null;
  message: string;
  status: InquiryLifecycleStatus;
  adminMemo: string | null;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  imageUrl: string;
  isPublished: boolean;
  sortOrder: number;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  programName: string | null;
  organizationName: string | null;
  location: string | null;
  status: string;
  memo: string | null;
  isPublic: boolean;
  createdAt: string;
}

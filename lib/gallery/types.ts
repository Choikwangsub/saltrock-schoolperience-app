export const REQUIRED_PROGRAM_SLUGS = [
  "laser-survival",
  "sky-swing",
  "sports-climbing",
  "sports-day",
  "ai-homepage",
  "ai-diary",
] as const;

export type ProgramSlug = (typeof REQUIRED_PROGRAM_SLUGS)[number];

export type SyncStatus = "pending" | "synced" | "failed";

export interface GalleryProgramFolder {
  slug: ProgramSlug;
  title: string;
  description: string;
  coverImageUrl: string;
  publicAlbumCount: number;
}

export interface GalleryAlbumRecord {
  id: string;
  title: string;
  programSlug: ProgramSlug;
  eventDate: string | null;
  location: string | null;
  description: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
  notionPageId: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  createdAt: string;
  updatedAt: string;
  photoCount: number;
}

export interface GalleryPhotoRecord {
  id: string;
  albumId: string;
  programSlug: ProgramSlug;
  imageUrl: string;
  title: string | null;
  description: string | null;
  takenAt: string | null;
  sortOrder: number;
  isPublic: boolean;
  notionPageId: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryQueryResult<T> {
  items: T[];
  usedFallback: boolean;
  errorMessage: string | null;
}

// Domain types matching the live `tomouh_project` Supabase schema.
// Kept hand-written (rather than `supabase gen types`) so the file stays
// readable, but the shapes below are an exact match for the database.

export type UserRole = 'student' | 'admin' | 'super_admin';
export type RequestType = 'book' | 'notebook_bundle';
export type RequestStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'approved'
  | 'rejected'
  | 'shipped'
  | 'disbursed';
export type BookCondition = 'new' | 'good' | 'fair';
export type CatalogType = 'book' | 'notebook_bundle';
export type MediaType = 'audio' | 'video';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  parent_phone: string | null;
  role: UserRole;
  wilaya: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_indigent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wilaya {
  id: number;
  name_ar: string;
  name_fr: string;
  code: string;
}

export interface Book {
  id: string;
  title_ar: string;
  title_fr: string | null;
  subject: string;
  school_level: string;
  type: CatalogType;
  cover_image_url: string | null;
  stock_quantity: number;
  pickup_location: string;
  wilaya_id: number | null;
  condition: BookCondition;
  is_available: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  wilayas?: Wilaya | null;
}

export interface RequestedItem {
  book_id?: string;
  title: string;
  quantity: number;
}

export interface BookRequest {
  id: string;
  request_number: string;
  user_id: string | null;
  student_full_name: string;
  parent_phone: string;
  wilaya: string;
  commune: string | null;
  detailed_address: string;
  proof_of_need_description: string;
  national_id_card_url: string;
  family_civil_status_card_url: string | null;
  request_type: RequestType;
  requested_items: RequestedItem[];
  status: RequestStatus;
  admin_notes: string | null;
  rejection_reason: string | null;
  assigned_to: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  shipped_at: string | null;
  tracking_number: string | null;
  book_id: string | null;
  book_title: string | null;
  bundle_name: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestStatusHistoryEntry {
  id: string;
  request_id: string;
  old_status: RequestStatus | null;
  new_status: RequestStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Podcast {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: MediaType;
  thumbnail_url: string | null;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

// Minimal Supabase `Database` typing — enough for the generated client to
// type `.from('table')` calls used throughout the app.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      wilayas: { Row: Wilaya; Insert: Partial<Wilaya>; Update: Partial<Wilaya> };
      books: { Row: Book; Insert: Partial<Book>; Update: Partial<Book> };
      book_requests: { Row: BookRequest; Insert: Partial<BookRequest>; Update: Partial<BookRequest> };
      request_status_history: {
        Row: RequestStatusHistoryEntry;
        Insert: Partial<RequestStatusHistoryEntry>;
        Update: Partial<RequestStatusHistoryEntry>;
      };
      podcasts: { Row: Podcast; Insert: Partial<Podcast>; Update: Partial<Podcast> };
      notifications: { Row: NotificationRow; Insert: Partial<NotificationRow>; Update: Partial<NotificationRow> };
    };
  };
}

import type { RequestStatus, BookCondition, CatalogType } from './types';

/** Ordered pipeline used to render the request-status stepper. */
export const STATUS_ORDER: RequestStatus[] = [
  'pending',
  'under_review',
  'verified',
  'approved',
  'shipped',
  'disbursed',
];

/** `rejected` is a terminal branch rather than a pipeline step. */
export const TERMINAL_REJECTED: RequestStatus = 'rejected';

export const STATUS_COLOR: Record<RequestStatus, { text: string; bg: string }> = {
  pending: { text: 'text-status-pending', bg: 'bg-status-pending-bg' },
  under_review: { text: 'text-status-review', bg: 'bg-status-review-bg' },
  verified: { text: 'text-status-verified', bg: 'bg-status-verified-bg' },
  approved: { text: 'text-status-approved', bg: 'bg-status-approved-bg' },
  rejected: { text: 'text-status-rejected', bg: 'bg-status-rejected-bg' },
  shipped: { text: 'text-status-shipped', bg: 'bg-status-shipped-bg' },
  disbursed: { text: 'text-status-disbursed', bg: 'bg-status-disbursed-bg' },
};

/** Valid forward transitions an admin can apply from the request detail screen. */
export const NEXT_STATUS_OPTIONS: Record<RequestStatus, RequestStatus[]> = {
  pending: ['under_review', 'rejected'],
  under_review: ['verified', 'rejected'],
  verified: ['approved', 'rejected'],
  approved: ['shipped', 'rejected'],
  shipped: ['disbursed'],
  disbursed: [],
  rejected: [],
};

export const CONDITION_LABEL_KEY: Record<BookCondition, 'conditionNew' | 'conditionGood' | 'conditionFair'> = {
  new: 'conditionNew',
  good: 'conditionGood',
  fair: 'conditionFair',
};

export const CATALOG_TYPE_LABEL_KEY: Record<CatalogType, 'typeBook' | 'typeBundle'> = {
  book: 'typeBook',
  notebook_bundle: 'typeBundle',
};

export const SUBJECTS = [
  'Mathématiques',
  'Physique',
  'Sciences Naturelles',
  'Français',
  'Arabe',
  'Anglais',
  'Philosophie',
  'Histoire-Géographie',
  'Éducation Islamique',
  'Informatique',
] as const;

export const SCHOOL_LEVELS = [
  '1AM',
  '2AM',
  '3AM',
  '4AM',
  '1AS',
  '2AS',
  '3AS',
] as const;

export const BOOK_LOAN_DAYS = 15;

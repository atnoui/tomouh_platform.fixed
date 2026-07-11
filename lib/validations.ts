import { z } from 'zod';
import { isValidAlgerianPhone } from './utils';

const algerianPhone = z
  .string()
  .min(1, 'required')
  .refine((v) => isValidAlgerianPhone(v), { message: 'invalidPhone' });

export const signupSchema = z.object({
  fullName: z.string().min(3).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  phone: algerianPhone,
  parentPhone: algerianPhone,
  wilaya: z.string().min(1),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const adminSignupSchema = z.object({
  fullName: z.string().min(3).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  phone: algerianPhone,
  adminKey: z.string().min(1),
});
export type AdminSignupInput = z.infer<typeof adminSignupSchema>;

export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'invalidCode'),
});

export const requestFormSchema = z.object({
  studentFullName: z.string().min(3).max(120),
  parentPhone: algerianPhone,
  wilaya: z.string().min(1),
  commune: z.string().min(1).max(120),
  detailedAddress: z.string().min(5).max(500),
  proofOfNeedDescription: z.string().min(10).max(1000),
  bookId: z.string().uuid().optional(),
});
export type RequestFormInput = z.infer<typeof requestFormSchema>;

export const bookFormSchema = z.object({
  titleAr: z.string().min(1).max(200),
  titleFr: z.string().max(200).optional().or(z.literal('')),
  subject: z.string().min(1).max(120),
  schoolLevel: z.string().min(1).max(120),
  type: z.enum(['book', 'notebook_bundle']),
  condition: z.enum(['new', 'good', 'fair']),
  stockQuantity: z.coerce.number().int().min(0),
  pickupLocation: z.string().min(1).max(200),
  wilayaId: z.coerce.number().int().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  isAvailable: z.boolean().default(true),
});
export type BookFormInput = z.infer<typeof bookFormSchema>;

export const podcastFormSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  mediaUrl: z.string().url(),
  mediaType: z.enum(['audio', 'video']),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().default(true),
});
export type PodcastFormInput = z.infer<typeof podcastFormSchema>;

export const profileUpdateSchema = z.object({
  fullName: z.string().min(3).max(120),
  parentPhone: algerianPhone.optional(),
  wilaya: z.string().min(1).optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

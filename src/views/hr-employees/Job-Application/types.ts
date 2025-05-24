// src/views/hiring/types.ts

export type ApplicationStatus =
  | "new"
  | "screening"
  | "interviewing"
  | "offer_extended"
  | "hired"
  | "rejected"
  | "withdrawn";

export type JobApplicationItem = {
  id: string; // Assuming ID is always a string from your backend
  status: ApplicationStatus;
  jobId: string | null;
  jobTitle?: string;
  department: string;
  name: string;
  email: string;
  mobileNo: string | null;
  workExperience: string;
  applicationDate: Date; // Keep as Date for form, can be string from API
  resumeUrl?: string | null;
  coverLetter?: string | null;
  notes?: string | null;
  jobApplicationLink?: string | null;
  // For dummy data or if your API returns it
  avatar?: string;
  requirement?: string;
};

// Zod schema for the application form (used by Add and Edit pages)
import { z } from 'zod';
export const applicationFormSchemaObject = {
  name: z.string().min(1, "Applicant name is required."),
  email: z.string().email("Invalid email address."),
  mobileNo: z.string().nullable().optional().transform(val => val === "" ? null : val), // Handle empty string as null
  department: z.string().min(1, "Department is required."),
  jobId: z.string().nullable().optional().transform(val => val === "" ? null : val),
  jobTitle: z.string().optional(),
  workExperience: z.string().min(1, "Work experience is required."),
  applicationDate: z.date({ required_error: "Application date is required." }),
  status: z.enum([
    "new", "screening", "interviewing", "offer_extended",
    "hired", "rejected", "withdrawn",
  ]),
  resumeUrl: z.string().url("Invalid URL for resume").or(z.literal("")).nullable().optional().transform(val => val === "" ? null : val),
  coverLetter: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  jobApplicationLink: z.string().url("Invalid URL for job link").or(z.literal("")).nullable().optional().transform(val => val === "" ? null : val),
};
export const applicationFormSchema = z.object(applicationFormSchemaObject);
export type ApplicationFormData = z.infer<typeof applicationFormSchema>;

// Application Status Options (can also be here)
export const applicationStatusOptions: { value: ApplicationStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "screening", label: "Screening" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer_extended", label: "Offer Extended" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];
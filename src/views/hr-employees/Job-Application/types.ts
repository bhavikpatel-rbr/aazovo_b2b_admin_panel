// src/views/hiring/types.ts (or ../types if AddJobApplicationPage is in a subfolder)
import { z } from 'zod';
import dayjs from 'dayjs'; // If using dayjs for date transformations

// --- Enums and Options (Example) ---
export type ApplicationStatus = "new" | "screening" | "interviewing" | "offer_extended" | "hired" | "rejected" | "withdrawn";
export const applicationStatusOptions: { value: ApplicationStatus; label: string }[] = [
    { value: "new", label: "New" }, { value: "screening", label: "Screening" }, /* ... more */
];

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export const genderOptions: { value: Gender; label: string }[] = [
    { value: "male", label: "Male" }, { value: "female", label: "Female" },
    { value: "other", label: "Other" }, { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export type MaritalStatus = "single" | "married" | "divorced" | "widowed";
export const maritalStatusOptions: { value: MaritalStatus; label: string }[] = [
    { value: "single", label: "Single" }, { value: "married", label: "Married" }, /* ... more */
];

// (Add more options for Nationality, Blood Group, Country, State, City etc. as needed)
export const countryOptions = [ { value: 'us', label: 'United States'}, { value: 'in', label: 'India'} ];
export const stateOptions = [ { value: 'ny', label: 'New York'}, { value: 'ca', label: 'California'} ];
export const cityOptions = [ { value: 'nyc', label: 'New York City'}, { value: 'la', label: 'Los Angeles'} ];
export const bloodGroupOptions = [ {value: 'A+', label: 'A+'}, {value: 'O-', label: 'O-'}];
export const nationalityOptions = [ {value: 'american', label: 'American'}, {value: 'indian', label: 'Indian'}];


// --- Zod Schemas for Dynamic Array Fields ---
const familyMemberSchema = z.object({
    id: z.string().optional(), // For potential updates if using unique IDs from backend
    familyName: z.string().min(1, "Name is required"),
    familyRelation: z.string().min(1, "Relation is required"),
    familyOccupation: z.string().optional(),
    familyDateOfBirth: z.date().nullable().optional(),
});

const educationDetailSchema = z.object({
    id: z.string().optional(),
    degree: z.string().min(1, "Degree is required"),
    university: z.string().min(1, "University is required"),
    percentageGrade: z.string().min(1, "Percentage/Grade is required"),
    educationFromDate: z.date({ required_error: "Start date is required" }),
    educationToDate: z.date({ required_error: "End date is required" }), // Assuming 'To' date is also needed
    specialization: z.string().optional(),
}).refine(data => !data.educationToDate || !data.educationFromDate || dayjs(data.educationToDate).isAfter(dayjs(data.educationFromDate)), {
    message: "End date must be after start date",
    path: ["educationToDate"],
});


const employmentDetailSchema = z.object({
    id: z.string().optional(),
    organization: z.string().min(1, "Organization is required"),
    designation: z.string().min(1, "Designation is required"),
    annualCTC: z.string().optional(), // Or z.number() if you want to enforce numeric input
    periodServiceFrom: z.date({ required_error: "Start date is required" }),
    periodServiceTo: z.date({ required_error: "End date is required" }),
}).refine(data => !data.periodServiceTo || !data.periodServiceFrom || dayjs(data.periodServiceTo).isAfter(dayjs(data.periodServiceFrom)), {
    message: "End date must be after start date",
    path: ["periodServiceTo"],
});


// --- Main Application Form Schema ---
export const applicationFormSchema = z.object({
    // Personal Details
    department: z.string().min(1, "Department is required."), // From original form
    name: z.string().min(1, "Applicant name is required."), // From original form
    email: z.string().email("Invalid email address."), // From original form
    mobileNo: z.string().nullable().optional().transform(val => val === "" ? null : val), // From original form
    gender: z.string().optional(),
    dateOfBirth: z.date().nullable().optional(),
    age: z.number().positive("Age must be positive").nullable().optional()
        .or(z.string().regex(/^\d+$/, "Age must be a number").transform(Number).nullable().optional()), // Allow string input, transform to number
    nationality: z.string().optional(),
    maritalStatus: z.string().optional(),
    bloodGroup: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    localAddress: z.string().optional(),
    permanentAddress: z.string().optional(),
    workExperienceType: z.enum(["fresher", "experienced"], { required_error: "Work experience type is required." }),
    // Fields from original form, keep or remove as needed
    jobId: z.string().nullable().optional().transform(val => val === "" ? null : val),
    jobTitle: z.string().optional(),
    applicationDate: z.date({ required_error: "Application date is required." }),
    status: z.enum([ "new", "screening", "interviewing", "offer_extended", "hired", "rejected", "withdrawn", ]),
    resumeUrl: z.string().url("Invalid URL for resume").or(z.literal("")).nullable().optional().transform(val => val === "" ? null : val),
    coverLetter: z.string().nullable().optional(), // Notes from original can be merged here or kept separate
    notes: z.string().nullable().optional(),
    jobApplicationLink: z.string().url("Invalid URL for job link").or(z.literal("")).nullable().optional().transform(val => val === "" ? null : val),

    // Family Details (Array)
    familyDetails: z.array(familyMemberSchema).optional(),

    // Emergency Contact Details
    emergencyRelation: z.string().min(1, "Emergency contact relation is required"),
    emergencyMobileNo: z.string().min(1, "Emergency contact mobile number is required").regex(/^\+?[0-9\s-()]+$/, "Invalid mobile number format"),

    // Educational Details (Array)
    educationalDetails: z.array(educationDetailSchema).optional(),

    // Employment Details (Array) - Only if 'experienced'
    employmentDetails: z.array(employmentDetailSchema).optional(),
    
}).superRefine((data, ctx) => {
    if (data.workExperienceType === "experienced" && (!data.employmentDetails || data.employmentDetails.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Employment details are required for experienced candidates.",
            path: ["employmentDetails"],
        });
    }
    if (data.dateOfBirth) {
        const today = dayjs();
        const dob = dayjs(data.dateOfBirth);
        const calculatedAge = today.diff(dob, 'year');
        if (data.age !== null && data.age !== undefined && data.age !== calculatedAge) {
             // Can add an issue or just use calculated age. For now, let's assume age is manually entered or auto-calculated.
        }
    }
});

export type ApplicationFormData = z.infer<typeof applicationFormSchema>;
export type FamilyMemberData = z.infer<typeof familyMemberSchema>;
export type EducationDetailData = z.infer<typeof educationDetailSchema>;
export type EmploymentDetailData = z.infer<typeof employmentDetailSchema>;
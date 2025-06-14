// src/views/hiring/types.ts (or ../types if AddJobApplicationPage is in a subfolder)
import { z } from 'zod';
import dayjs from 'dayjs'; // If using dayjs for date transformations

// --- Enums and Options (Example) ---
export type ApplicationStatus =
    | 'New'
    | 'In Review'
    | 'Shortlisted'
    | 'Hired'
    | 'Rejected'

export const applicationStatusOptions: { value: ApplicationStatus; label: string }[] = [
    { value: "New", label: "New" },
    { value: "In Review", label: "In Review" }, /* ... more */
    { value: "Shortlisted", label: "Shortlisted" }, /* ... more */
    { value: "Hired", label: "Hired" }, /* ... more */
    { value: "Rejected", label: "Rejected" }, /* ... more */
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
export const countryOptions = [{ value: 'us', label: 'United States' }, { value: 'in', label: 'India' }];
export const stateOptions = [{ value: 'ny', label: 'New York' }, { value: 'ca', label: 'California' }];
export const cityOptions = [{ value: 'nyc', label: 'New York City' }, { value: 'la', label: 'Los Angeles' }];
export const bloodGroupOptions = [{ value: 'A+', label: 'A+' }, { value: 'O-', label: 'O-' }];
export const nationalityOptions = [
    { value: 'afghan', label: 'Afghan' },
    { value: 'albanian', label: 'Albanian' },
    { value: 'algerian', label: 'Algerian' },
    { value: 'american', label: 'American' },
    { value: 'andorran', label: 'Andorran' },
    { value: 'angolan', label: 'Angolan' },
    { value: 'antiguan', label: 'Antiguan or Barbudan' },
    { value: 'argentine', label: 'Argentine' },
    { value: 'armenian', label: 'Armenian' },
    { value: 'australian', label: 'Australian' },
    { value: 'austrian', label: 'Austrian' },
    { value: 'azerbaijani', label: 'Azerbaijani' },
    { value: 'bahamian', label: 'Bahamian' },
    { value: 'bahraini', label: 'Bahraini' },
    { value: 'bangladeshi', label: 'Bangladeshi' },
    { value: 'barbadian', label: 'Barbadian' },
    { value: 'belarusian', label: 'Belarusian' },
    { value: 'belgian', label: 'Belgian' },
    { value: 'belizean', label: 'Belizean' },
    { value: 'beninese', label: 'Beninese' },
    { value: 'bhutanese', label: 'Bhutanese' },
    { value: 'bolivian', label: 'Bolivian' },
    { value: 'bosnian', label: 'Bosnian or Herzegovinian' },
    { value: 'botswanan', label: 'Motswana' },
    { value: 'brazilian', label: 'Brazilian' },
    { value: 'british', label: 'British' },
    { value: 'bruneian', label: 'Bruneian' },
    { value: 'bulgarian', label: 'Bulgarian' },
    { value: 'burkinabe', label: 'Burkinabé' },
    { value: 'burmese', label: 'Burmese' },
    { value: 'burundian', label: 'Burundian' },
    { value: 'cambodian', label: 'Cambodian' },
    { value: 'cameroonian', label: 'Cameroonian' },
    { value: 'canadian', label: 'Canadian' },
    { value: 'cape_verdean', label: 'Cape Verdean' },
    { value: 'central_african', label: 'Central African' },
    { value: 'chadian', label: 'Chadian' },
    { value: 'chilean', label: 'Chilean' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'colombian', label: 'Colombian' },
    { value: 'comoran', label: 'Comoran' },
    { value: 'congolese', label: 'Congolese' },
    { value: 'costa_rican', label: 'Costa Rican' },
    { value: 'croatian', label: 'Croatian' },
    { value: 'cuban', label: 'Cuban' },
    { value: 'cypriot', label: 'Cypriot' },
    { value: 'czech', label: 'Czech' },
    { value: 'danish', label: 'Danish' },
    { value: 'djiboutian', label: 'Djiboutian' },
    { value: 'dominican', label: 'Dominican' },
    { value: 'dutch', label: 'Dutch' },
    { value: 'east_timorese', label: 'East Timorese' },
    { value: 'ecuadorean', label: 'Ecuadorean' },
    { value: 'egyptian', label: 'Egyptian' },
    { value: 'emirati', label: 'Emirati' },
    { value: 'equatorial_guinean', label: 'Equatorial Guinean' },
    { value: 'eritrean', label: 'Eritrean' },
    { value: 'estonian', label: 'Estonian' },
    { value: 'ethiopian', label: 'Ethiopian' },
    { value: 'fijian', label: 'Fijian' },
    { value: 'finnish', label: 'Finnish' },
    { value: 'french', label: 'French' },
    { value: 'gabonese', label: 'Gabonese' },
    { value: 'gambian', label: 'Gambian' },
    { value: 'georgian', label: 'Georgian' },
    { value: 'german', label: 'German' },
    { value: 'ghanaian', label: 'Ghanaian' },
    { value: 'greek', label: 'Greek' },
    { value: 'grenadian', label: 'Grenadian' },
    { value: 'guatemalan', label: 'Guatemalan' },
    { value: 'guinean', label: 'Guinean' },
    { value: 'guinea_bissauan', label: 'Guinea-Bissauan' },
    { value: 'guyanese', label: 'Guyanese' },
    { value: 'haitian', label: 'Haitian' },
    { value: 'honduran', label: 'Honduran' },
    { value: 'hungarian', label: 'Hungarian' },
    { value: 'icelandic', label: 'Icelandic' },
    { value: 'indian', label: 'Indian' },
    { value: 'indonesian', label: 'Indonesian' },
    { value: 'iranian', label: 'Iranian' },
    { value: 'iraqi', label: 'Iraqi' },
    { value: 'irish', label: 'Irish' },
    { value: 'israeli', label: 'Israeli' },
    { value: 'italian', label: 'Italian' },
    { value: 'ivorian', label: 'Ivorian' },
    { value: 'jamaican', label: 'Jamaican' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'jordanian', label: 'Jordanian' },
    { value: 'kazakh', label: 'Kazakh' },
    { value: 'kenyan', label: 'Kenyan' },
    { value: 'kiribati', label: 'I-Kiribati' },
    { value: 'kittitian', label: 'Kittitian or Nevisian' },
    { value: 'kuwaiti', label: 'Kuwaiti' },
    { value: 'kyrgyz', label: 'Kyrgyz' },
    { value: 'laotian', label: 'Laotian' },
    { value: 'latvian', label: 'Latvian' },
    { value: 'lebanese', label: 'Lebanese' },
    { value: 'liberian', label: 'Liberian' },
    { value: 'libyan', label: 'Libyan' },
    { value: 'liechtensteiner', label: 'Liechtensteiner' },
    { value: 'lithuanian', label: 'Lithuanian' },
    { value: 'luxembourgish', label: 'Luxembourgish' },
    { value: 'macedonian', label: 'Macedonian' },
    { value: 'malagasy', label: 'Malagasy' },
    { value: 'malawian', label: 'Malawian' },
    { value: 'malaysian', label: 'Malaysian' },
    { value: 'maldivian', label: 'Maldivian' },
    { value: 'malian', label: 'Malian' },
    { value: 'maltese', label: 'Maltese' },
    { value: 'marshallese', label: 'Marshallese' },
    { value: 'mauritanian', label: 'Mauritanian' },
    { value: 'mauritian', label: 'Mauritian' },
    { value: 'mexican', label: 'Mexican' },
    { value: 'micronesian', label: 'Micronesian' },
    { value: 'moldovan', label: 'Moldovan' },
    { value: 'monacan', label: 'Monégasque' },
    { value: 'mongolian', label: 'Mongolian' },
    { value: 'montenegrin', label: 'Montenegrin' },
    { value: 'moroccan', label: 'Moroccan' },
    { value: 'mozambican', label: 'Mozambican' },
    { value: 'namibian', label: 'Namibian' },
    { value: 'nauruan', label: 'Nauruan' },
    { value: 'nepalese', label: 'Nepalese' },
    { value: 'new_zealander', label: 'New Zealander' },
    { value: 'nicaraguan', label: 'Nicaraguan' },
    { value: 'nigerien', label: 'Nigerien' },
    { value: 'nigerian', label: 'Nigerian' },
    { value: 'north_korean', label: 'North Korean' },
    { value: 'norwegian', label: 'Norwegian' },
    { value: 'omani', label: 'Omani' },
    { value: 'pakistani', label: 'Pakistani' },
    { value: 'palauan', label: 'Palauan' },
    { value: 'palestinian', label: 'Palestinian' },
    { value: 'panamanian', label: 'Panamanian' },
    { value: 'papua_new_guinean', label: 'Papua New Guinean' },
    { value: 'paraguayan', label: 'Paraguayan' },
    { value: 'peruvian', label: 'Peruvian' },
    { value: 'philippine', label: 'Filipino' },
    { value: 'polish', label: 'Polish' },
    { value: 'portuguese', label: 'Portuguese' },
    { value: 'qatari', label: 'Qatari' },
    { value: 'romanian', label: 'Romanian' },
    { value: 'russian', label: 'Russian' },
    { value: 'rwandan', label: 'Rwandan' },
    { value: 'saint_lucian', label: 'Saint Lucian' },
    { value: 'salvadoran', label: 'Salvadoran' },
    { value: 'samoan', label: 'Samoan' },
    { value: 'san_marinese', label: 'San Marinese' },
    { value: 'sao_tomean', label: 'São Toméan' },
    { value: 'saudi', label: 'Saudi' },
    { value: 'scottish', label: 'Scottish' },
    { value: 'senegalese', label: 'Senegalese' },
    { value: 'serbian', label: 'Serbian' },
    { value: 'seychellois', label: 'Seychellois' },
    { value: 'sierra_leonean', label: 'Sierra Leonean' },
    { value: 'singaporean', label: 'Singaporean' },
    { value: 'slovak', label: 'Slovak' },
    { value: 'slovenian', label: 'Slovenian' },
    { value: 'solomon_islander', label: 'Solomon Islander' },
    { value: 'somali', label: 'Somali' },
    { value: 'south_african', label: 'South African' },
    { value: 'south_korean', label: 'South Korean' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'sri_lankan', label: 'Sri Lankan' },
    { value: 'sudanese', label: 'Sudanese' },
    { value: 'surinamese', label: 'Surinamese' },
    { value: 'swazi', label: 'Swazi' },
    { value: 'swedish', label: 'Swedish' },
    { value: 'swiss', label: 'Swiss' },
    { value: 'syrian', label: 'Syrian' },
    { value: 'taiwanese', label: 'Taiwanese' },
    { value: 'tajik', label: 'Tajik' },
    { value: 'tanzanian', label: 'Tanzanian' },
    { value: 'thai', label: 'Thai' },
    { value: 'togolese', label: 'Togolese' },
    { value: 'tongan', label: 'Tongan' },
    { value: 'trinidadian', label: 'Trinidadian or Tobagonian' },
    { value: 'tunisian', label: 'Tunisian' },
    { value: 'turkish', label: 'Turkish' },
    { value: 'turkmen', label: 'Turkmen' },
    { value: 'tuvaluan', label: 'Tuvaluan' },
    { value: 'ugandan', label: 'Ugandan' },
    { value: 'ukrainian', label: 'Ukrainian' },
    { value: 'uruguayan', label: 'Uruguayan' },
    { value: 'uzbek', label: 'Uzbek' },
    { value: 'vanuatuan', label: 'Vanuatuan' },
    { value: 'venezuelan', label: 'Venezuelan' },
    { value: 'vietnamese', label: 'Vietnamese' },
    { value: 'welsh', label: 'Welsh' },
    { value: 'yemeni', label: 'Yemeni' },
    { value: 'zambian', label: 'Zambian' },
    { value: 'zimbabwean', label: 'Zimbabwean' }
];


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
    status: z.enum(["new", "screening", "interviewing", "offer_extended", "hired", "rejected", "withdrawn",]),
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
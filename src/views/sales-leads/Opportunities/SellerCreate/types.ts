import type { Control, FieldErrors } from 'react-hook-form'

// --- Core Opportunities Field Types ---
export type OpportunitiesFormFields = {
    status: 'pending' | 'active' | 'on_hold' | 'closed'
  
    opportunity_id: string // Unique identifier for the opportunity record.
    buy_listing_id: string // Listing ID of the Buy intent product.
    sell_listing_id: string // Listing ID of the Sell intent product.
    product_name: string // Common product name matched between listings.
    product_category: string // Product category.
    product_subcategory: string // Product subcategory.
    brand: string // Brand name matched between listings.
    price_match_type: 'Exact' | 'Range' | 'Not Matched' // Price Range Match.
    quantity_match: 'Sufficient' | 'Partial' | 'Not Matched' // Quantity Match.
    location_match?: 'Local' | 'National' | 'Not Matched' // Location Match (optional).
    match_score: number // Match Score (%).
    opportunity_status: 'New' | 'Shortlisted' | 'Converted' | 'Rejected' // Opportunity Status.
    created_date: string // ISO date string for when the opportunity was created.
    last_updated: string // ISO date string for last update.
    assigned_to: string // Team or person managing this opportunity.
    notes?: string // Notes or remarks (optional).
}

// --- Main Schema ---
export type OpportunitiesFormSchema = OpportunitiesFormFields

// --- Reusable Props for Form Sections ---
export type FormSectionBaseProps = {
    control: Control<OpportunitiesFormSchema>
    errors: FieldErrors<OpportunitiesFormSchema>
}

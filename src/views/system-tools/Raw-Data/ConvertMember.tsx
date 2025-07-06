import { useAppDispatch } from "@/reduxtool/store";
import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  useFieldArray,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { shallowEqual, useSelector } from "react-redux";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

// UI Components
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import {
  Card,
  Form,
  FormItem,
  Input,
  Radio,
} from "@/components/ui";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Notification from "@/components/ui/Notification";
import Select from "@/components/ui/Select";
import toast from "@/components/ui/toast";

// Icons
import { BiChevronRight } from "react-icons/bi";
import { HiPlus } from "react-icons/hi";
import { TbTrash } from "react-icons/tb";

// Redux Actions & Selectors
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addMemberAction,
  editMemberAction,
  getAllProductsAction,
  getBrandAction,
  getCategoriesAction,
  getCompanyAction,
  getContinentsAction,
  getCountriesAction,
  getEmployeesAction,
  getMemberByIdAction,
  getMemberTypeAction,
} from "@/reduxtool/master/middleware";

// Types
import type { RowDataItem } from '@/views/raw-data/RowDataListing'; // Adjust this path if your file structure is different

// --- Type Definitions (Member Form) ---
export interface MemberFormSchema {
  id?: string | number;
  rowdata_id?: string | number;
  name?: string;
  email?: string;
  password?: string;
  contact_country_code?: { label: string; value: string };
  mobile_no?: string;
  city?: string;
  state?: string;
  country_id?: { label: string; value: string };
  continent_id?: { label: string; value: string };
  pincode?: string;
  status?: { label: string; value: string };
  company_name?: string;
  company_name_temp?: string;
  address?: string;
  whatsapp_number?: string;
  whatsapp_country_code?: { label: string; value: string };
  alternate_contact_country_code?: { label: string; value: string };
  alternate_contact_number?: string;
  landline_number?: string;
  fax_number?: string;
  alternate_email?: string;
  botim_id?: string;
  skype_id?: string;
  we_chat?: string;
  website?: string;
  business_type?: { label: string; value: string };
  product_upload_permission?: boolean;
  wall_enquiry_permission?: boolean;
  enquiry_permission?: boolean;
  trade_inquiry_allowed?: { label: string; value: string };
  membership_plan_text?: string;
  upgrade_plan?: { label: string; value: string };
  favourite_product_id?: Array<{ label: string; value: string }>;
  business_opportunity?: { label: string; value: string };
  member_grade?: { label: string; value: string };
  relationship_manager?: { label: string; value: string };
  remarks?: string;
  linkedin_profile?: string;
  facebook_profile?: string;
  instagram_handle?: string;
  is_blacklisted?: boolean;
  dealing_in_bulk?: "Yes" | "No";
  interested_in?: { label: string; value: string };
  member_profiles?: {
    db_id?: number;
    member_type?: { label: string; value: string | number };
    brands?: Array<{ label: string; value: string | number }>;
    categories?: Array<{ label:string; value: string | number }>;
    sub_categories?: Array<{ label: string; value: string | number }>;
  }[];
}
export interface FormSectionBaseProps {
  control: Control<MemberFormSchema>;
  errors: FieldErrors<MemberFormSchema>;
  formMethods: UseFormReturn<MemberFormSchema>;
  isEditMode: boolean;
}
interface ApiSingleCustomerItem {
  id: number;
  rowdata_id?: any;
  name?: string;
  email?: string;
  number?: string;
  number_code?: string;
  company_temp?: string;
  company_actual?: string;
  status?: string;
  continent?: { id: number; name: string };
  country?: { id: number; name: string };
  state?: string;
  city?: string;
  pincode?: string;
  address?: string;
  whatsApp_no?: string;
  alternate_contact_number?: string;
  alternate_contact_number_code?: string;
  landline_number?: string;
  fax_number?: string;
  alternate_email?: string;
  botim_id?: string;
  skype_id?: string;
  wechat_id?: string;
  linkedIn_profile?: string;
  facebook_profile?: string;
  instagram_handle?: string;
  website?: string;
  business_opportunity?: string;
  business_type?: string;
  favourite_products_list?: { id: number, name: string }[];
  interested_in?: string;
  member_grade?: string;
  relationship_manager?: { id: number, name: string };
  dealing_in_bulk?: "Yes" | "No";
  remarks?: string;
  dynamic_member_profiles?: any[];
  product_upload_permission?: "0" | "1";
  wall_enquiry_permission?: "0" | "1";
  enquiry_permission?: "0" | "1";
  trade_inquiry_allowed?: "0" | "1";
  membership_plan_current?: string;
  upgrade_your_plan?: string;
  is_blacklisted?: "0" | "1";
}

// --- Helper Functions ---
const transformApiToFormSchema = (formData: ApiSingleCustomerItem): Partial<MemberFormSchema> => {
    const toSelectOption = (value: string | undefined | null) => value ? { value, label: value } : undefined;
    const createCountryCodeOption = (code: string | undefined | null) => code ? { value: code, label: code } : undefined;

    return {
        id: formData.id,
        rowdata_id: formData.rowdata_id,
        name: formData.name || "",
        email: formData.email || "",
        mobile_no: formData.number || "",
        contact_country_code: createCountryCodeOption(formData.number_code),
        company_name_temp: formData.company_temp || "",
        company_name: formData.company_actual || "",
        status: toSelectOption(formData.status),
        continent_id: formData.continent ? { value: String(formData.continent.id), label: formData.continent.name } : undefined,
        country_id: formData.country ? { value: String(formData.country.id), label: formData.country.name } : undefined,
        state: formData.state || "",
        city: formData.city || "",
        pincode: formData.pincode || "",
        address: formData.address || "",
        whatsapp_number: formData.whatsApp_no || "",
        alternate_contact_number: formData.alternate_contact_number || "",
        landline_number: formData.landline_number || "",
        fax_number: formData.fax_number || "",
        alternate_email: formData.alternate_email || "",
        botim_id: formData.botim_id || "",
        skype_id: formData.skype_id || "",
        we_chat: formData.wechat_id || "",
        linkedin_profile: formData.linkedIn_profile || "",
        facebook_profile: formData.facebook_profile || "",
        instagram_handle: formData.instagram_handle || "",
        website: formData.website || "",
        business_opportunity: toSelectOption(formData.business_opportunity),
        business_type: toSelectOption(formData.business_type),
        favourite_product_id: formData.favourite_products_list?.map((p) => ({ value: String(p.id), label: p.name })) || [],
        interested_in: toSelectOption(formData.interested_in),
        member_grade: toSelectOption(formData.member_grade),
        relationship_manager: formData.relationship_manager ? { value: String(formData.relationship_manager.id), label: formData.relationship_manager.name } : undefined,
        dealing_in_bulk: formData.dealing_in_bulk || "No",
        remarks: formData.remarks || "",
        member_profiles: formData.dynamic_member_profiles?.map((apiProfile: any) => {
            const createSelectOptions = (idJsonString: string, names: string[]) => {
                try {
                    if (typeof idJsonString !== 'string' || !idJsonString.startsWith('[')) return [];
                    const ids: (string | number)[] = JSON.parse(idJsonString);
                    const safeNames = Array.isArray(names) ? names : [];
                    if (!Array.isArray(ids) || ids.length !== safeNames.length) return [];
                    return ids.map((id, index) => ({ value: String(id), label: safeNames[index] }));
                } catch { return []; }
            };
            return {
                db_id: apiProfile.id,
                member_type: { value: apiProfile.member_type.id, label: apiProfile.member_type.name },
                brands: createSelectOptions(apiProfile.brand_id, apiProfile.brand_names),
                categories: createSelectOptions(apiProfile.category_id, apiProfile.category_names),
                sub_categories: createSelectOptions(apiProfile.sub_category_id, apiProfile.sub_category_names),
            };
        }) || [],
        product_upload_permission: formData.product_upload_permission === "1",
        wall_enquiry_permission: formData.wall_enquiry_permission === "1",
        enquiry_permission: formData.enquiry_permission === "1",
        trade_inquiry_allowed: formData.trade_inquiry_allowed === "1" ? { value: "1", label: "Yes" } : { value: "0", label: "No" },
        membership_plan_text: formData.membership_plan_current || "",
        upgrade_plan: toSelectOption(formData.upgrade_your_plan),
        is_blacklisted: formData.is_blacklisted === "1",
    };
};
const preparePayloadForApi = (formData: Partial<MemberFormSchema>, isEditMode: boolean): any => {
    const getValue = (field: any) => (typeof field === 'object' && field !== null && 'value' in field ? field.value : field);

    const payload: any = {
        id: isEditMode ? formData.id : 0,
        rowdata_id: formData.rowdata_id,
        name: formData.name || "",
        number: formData.mobile_no || "",
        number_code: getValue(formData.contact_country_code) || null,
        email: formData.email || "",
        company_temp: formData.company_name_temp || "",
        company_actual: formData.company_name || "",
        status: getValue(formData.status) || null,
        continent_id: getValue(formData.continent_id) || null,
        country_id: getValue(formData.country_id) || null,
        state: formData.state || "",
        city: formData.city || "",
        pincode: formData.pincode || "",
        address: formData.address || "",
        whatsApp_no: formData.whatsapp_number || "",
        alternate_contact_number: formData.alternate_contact_number || "",
        alternate_contact_number_code: getValue(formData.alternate_contact_country_code) || null,
        landline_number: formData.landline_number || "",
        fax_number: formData.fax_number || "",
        alternate_email: formData.alternate_email || "",
        botim_id: formData.botim_id || "",
        skype_id: formData.skype_id || "",
        wechat_id: formData.we_chat || "",
        linkedIn_profile: formData.linkedin_profile || "",
        facebook_profile: formData.facebook_profile || "",
        instagram_handle: formData.instagram_handle || "",
        website: formData.website || "",
        business_opportunity: getValue(formData.business_opportunity) || null,
        business_type: getValue(formData.business_type) || null,
        favourite_product_id: formData.favourite_product_id?.map(p => getValue(p)) || [],
        interested_in: getValue(formData.interested_in) || null,
        member_grade: getValue(formData.member_grade) || null,
        relationship_manager_id: getValue(formData.relationship_manager) || null,
        dealing_in_bulk: formData.dealing_in_bulk || "No",
        remarks: formData.remarks || "",
        product_upload_permission: formData.product_upload_permission ? "1" : "0",
        wall_enquiry_permission: formData.wall_enquiry_permission ? "1" : "0",
        enquiry_permission: formData.enquiry_permission ? "1" : "0",
        trade_inquiry_allowed: getValue(formData.trade_inquiry_allowed) === "1" ? "1" : "0",
        membership_plan_current: formData.membership_plan_text || "",
        upgrade_your_plan: getValue(formData.upgrade_plan) || null,
        is_blacklisted: formData.is_blacklisted ? "1" : "0",
    };

    if (formData.member_profiles) {
        payload.dynamic_member_profiles = formData.member_profiles.map(formProfile => {
            const apiProfile: any = {
                id: formProfile.db_id,
                member_type_id: getValue(formProfile.member_type),
                brand_id: formProfile.brands?.map(b => getValue(b)) || [],
                category_id: formProfile.categories?.map(c => getValue(c)) || [],
                sub_category_id: formProfile.sub_categories?.map(sc => getValue(sc)) || [],
            };
            if (apiProfile.id === undefined) delete apiProfile.id;
            return apiProfile;
        });
    }

    if ((isEditMode || !isEditMode) && formData.password) {
        payload.password = formData.password;
    }

    return payload;
};

// --- Form Section Components ---
const PersonalDetailsComponent = ({ control, errors }: FormSectionBaseProps) => {
    const { CountriesData = [], ContinentsData = [] } = useSelector(masterSelector, shallowEqual);
    const countryOptions = CountriesData.map((c: any) => ({ value: String(c.id), label: c.name }));
    const countryCodeOptions = CountriesData.map((c: any) => ({ value: `+${c.phone_code}`, label: `${c.iso_code} (+${c.phone_code})` })).filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i);
    const continentOptions = ContinentsData.map((c: any) => ({ value: String(c.id), label: c.name }));

    return (
        <Card id="personalDetails">
            <h4 className="mb-6">Personal Details</h4>
            <div className="grid md:grid-cols-3 gap-4">
                <FormItem label={<div>Full Name<span className="text-red-500"> * </span></div>} invalid={!!errors.name} errorMessage={errors.name?.message}>
                    <Controller name="name" control={control} render={({ field }) => (<Input placeholder="Member’s full name" {...field} />)} />
                </FormItem>
                <FormItem label={<div>Mobile Number<span className="text-red-500"> * </span></div>} invalid={!!errors.mobile_no || !!errors.contact_country_code} errorMessage={errors.mobile_no?.message || (errors.contact_country_code as any)?.message}>
                    <div className="flex items-center gap-2">
                        <Controller name="contact_country_code" control={control} render={({ field }) => (<Select placeholder="Code" className="w-32" options={countryCodeOptions} {...field} />)} />
                        <Controller name="mobile_no" control={control} render={({ field }) => (<Input placeholder="Primary contact number" {...field} />)} />
                    </div>
                </FormItem>
                <FormItem label={<div>Email<span className="text-red-500"> * </span></div>} invalid={!!errors.email} errorMessage={errors.email?.message}>
                    <Controller name="email" control={control} render={({ field }) => (<Input type="email" placeholder="Primary email address" {...field} />)} />
                </FormItem>
                <FormItem label={<div>Password<span className="text-red-500"> * </span></div>} invalid={!!errors.password} errorMessage={errors.password?.message}>
                    <Controller name="password" control={control} render={({ field }) => (<Input type="password" placeholder={"Enter new password"} {...field} />)} />
                </FormItem>
                <FormItem label="Company Name (Temp)">
                    <Controller name="company_name_temp" control={control} render={({ field }) => (<Input placeholder="Enter temporary company" {...field} />)} />
                </FormItem>
                <FormItem label="Company Name (Actual)">
                    <Controller name="company_name" control={control} render={({ field }) => (<Input placeholder="Enter company name" {...field} />)} />
                </FormItem>
                <FormItem label={<div>Status<span className="text-red-500"> * </span></div>} invalid={!!errors.status} errorMessage={errors.status?.message as string}>
                    <Controller name="status" control={control} render={({ field }) => (<Select {...field} placeholder="Please Select" options={[{ label: "Active", value: "Active" }, { label: "Unregistered", value: "Unregistered" }, { label: "Disabled", value: "Disabled" }]} />)} />
                </FormItem>
                <FormItem label={<div>Continent<span className="text-red-500"> * </span></div>} invalid={!!errors.continent_id} errorMessage={errors.continent_id?.message as string}>
                    <Controller name="continent_id" control={control} render={({ field }) => (<Select placeholder="Select Continent" options={continentOptions} {...field} isClearable />)} />
                </FormItem>
                <FormItem label={<div>Country<span className="text-red-500"> * </span></div>} invalid={!!errors.country_id} errorMessage={errors.country_id?.message as string}>
                    <Controller name="country_id" control={control} render={({ field }) => (<Select placeholder="Select Country" options={countryOptions} {...field} isClearable />)} />
                </FormItem>
                <FormItem label={<div>State<span className="text-red-500"> * </span></div>} invalid={!!errors.state} errorMessage={errors.state?.message}>
                    <Controller name="state" control={control} render={({ field }) => (<Input placeholder="Enter state" {...field} />)} />
                </FormItem>
                <FormItem label={ <div>City<span className="text-red-500"> * </span></div>} invalid={!!errors.city} errorMessage={errors.city?.message}>
                    <Controller name="city" control={control} render={({ field }) => (<Input placeholder="Enter city" {...field} />)} />
                </FormItem>
                <FormItem label="Pincode">
                    <Controller name="pincode" control={control} render={({ field }) => (<Input placeholder="Enter pincode" {...field} />)} />
                </FormItem>
                <FormItem label="Address" className="md:col-span-3">
                    <Controller name="address" control={control} render={({ field }) => (<Input placeholder="Full Address" {...field} />)} />
                </FormItem>
            </div>
        </Card>
    );
};
const ContactDetailsComponent = ({ control }: FormSectionBaseProps) => {
    const { CountriesData = [] } = useSelector(masterSelector, shallowEqual);
    const countryCodeOptions = CountriesData.map((c: any) => ({ value: `+${c.phone_code}`, label: `${c.iso_code} (${c.phone_code})` })).filter((v, i, a) => a.findIndex((t) => t.value === v.value) === i);
    return (
        <Card id="socialContactInformation">
            <h4 className="mb-6">Social & Contact Information</h4>
            <div className="grid md:grid-cols-3 gap-4">
                <FormItem label="WhatsApp No.">
                    <div className="flex items-center gap-2">
                        <Controller name="whatsapp_country_code" control={control} render={({ field }) => (<Select placeholder="Code" className="w-28" options={countryCodeOptions} {...field} />)} />
                        <Controller name="whatsapp_number" control={control} render={({ field }) => (<Input placeholder="Enter WhatsApp number" {...field} />)} />
                    </div>
                </FormItem>
                <FormItem label="Alternate Contact Number">
                    <div className="flex items-center gap-2">
                        <Controller name="alternate_contact_country_code" control={control} render={({ field }) => (<Select {...field} placeholder="Code" className="w-28" options={countryCodeOptions} />)} />
                        <Controller name="alternate_contact_number" control={control} render={({ field }) => (<Input placeholder="Alternate contact" {...field} />)} />
                    </div>
                </FormItem>
                <FormItem label="Landline Number"><Controller name="landline_number" control={control} render={({ field }) => (<Input type="tel" placeholder="Landline" {...field} />)} /></FormItem>
                <FormItem label="Fax Number"><Controller name="fax_number" control={control} render={({ field }) => (<Input type="tel" placeholder="Fax" {...field} />)} /></FormItem>
                <FormItem label="Alternate Email"><Controller name="alternate_email" control={control} render={({ field }) => (<Input type="email" placeholder="Alternate email" {...field} />)} /></FormItem>
                <FormItem label="Botim ID"><Controller name="botim_id" control={control} render={({ field }) => <Input {...field} placeholder="Botim ID" />} /></FormItem>
                <FormItem label="Skype ID"><Controller name="skype_id" control={control} render={({ field }) => <Input {...field} placeholder="Skype ID" />} /></FormItem>
                <FormItem label="WeChat ID"><Controller name="we_chat" control={control} render={({ field }) => <Input {...field} placeholder="WeChat ID" />} /></FormItem>
                <FormItem label="LinkedIn Profile"><Controller name="linkedin_profile" control={control} render={({ field }) => (<Input {...field} placeholder="LinkedIn URL" />)} /></FormItem>
                <FormItem label="Facebook Profile"><Controller name="facebook_profile" control={control} render={({ field }) => (<Input {...field} placeholder="Facebook URL" />)} /></FormItem>
                <FormItem label="Instagram Handle"><Controller name="instagram_handle" control={control} render={({ field }) => (<Input {...field} placeholder="@instagram" />)} /></FormItem>
                <FormItem label="Website"><Controller name="website" control={control} render={({ field }) => (<Input type="url" placeholder="https://example.com" {...field} />)} /></FormItem>
            </div>
        </Card>
    );
};
const MemberAccessibilityComponent = ({ control }: FormSectionBaseProps) => (
    <Card id="memberAccessibility">
        <h4 className="mb-6">Member Accessibility</h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <FormItem label="Product Upload Permission"><Controller name="product_upload_permission" control={control} render={({ field }) => (<Checkbox checked={!!field.value} onChange={(checked) => field.onChange(checked)}>Enabled</Checkbox>)} /></FormItem>
            <FormItem label="Wall Enquiry Permission"><Controller name="wall_enquiry_permission" control={control} render={({ field }) => (<Checkbox checked={!!field.value} onChange={(checked) => field.onChange(checked)}>Enabled</Checkbox>)} /></FormItem>
            <FormItem label="Enquiry Permission"><Controller name="enquiry_permission" control={control} render={({ field }) => (<Checkbox checked={!!field.value} onChange={(checked) => field.onChange(checked)}>Enabled</Checkbox>)} /></FormItem>
            <FormItem label="Trade Inquiry Allowed"><Controller name="trade_inquiry_allowed" control={control} render={({ field }) => (<Select {...field} placeholder="Select" options={[{ value: "1", label: "Yes" }, { value: "0", label: "No" }]} isClearable />)} /></FormItem>
        </div>
    </Card>
);
const MembershipPlanComponent = ({ control }: FormSectionBaseProps) => (
    <Card id="membershipPlanDetails">
        <h4 className="mb-6">Membership Plan Details</h4>
        <div className="grid md:grid-cols-2 gap-4">
            <FormItem label="Membership Plan (Current)"><Controller name="membership_plan_text" control={control} render={({ field }) => (<Input placeholder="e.g., Premium Plan" {...field} />)} /></FormItem>
            <FormItem label="Upgrade Your Plan"><Controller name="upgrade_plan" control={control} render={({ field }) => (<Select placeholder="Select New Plan" options={[{ value: "Basic", label: "Basic" }, { value: "Premium", label: "Premium" }]} {...field} isClearable />)} /></FormItem>
        </div>
    </Card>
);
const MemberProfileComponent = ({ control, errors }: FormSectionBaseProps) => {
    const { BrandData = [], CategoriesData = [], Employees = [], AllProducts = [], MemberTypeData = [] } = useSelector(masterSelector, shallowEqual);
    const { fields, append, remove } = useFieldArray({ control, name: "member_profiles" });
    const brandOptions = BrandData.map((b: any) => ({ value: String(b.id), label: b.name }));
    const categoryOptions = CategoriesData.map((c: any) => ({ value: String(c.id), label: c.name }));
    const allproductOptions = AllProducts.map((p: any) => ({ value: p.id, label: p.name }));
    const managerOptions = Employees.map((m: any) => ({ value: String(m.id), label: m.name }));
    const memberTypeOptions = MemberTypeData.map((m: any) => ({ value: m.id, label: m.name }));

    return (
        <Card id="memberProfile">
            <h4 className="mb-6">Additional Member Profile</h4>
            <div className="grid md:grid-cols-3 gap-4">
                <FormItem label="Business Opportunity"><Controller name="business_opportunity" control={control} render={({ field }) => (<Select {...field} placeholder="Select opportunity" options={[{ value: "Indian Buyer", label: "Indian Buyer" }, { value: "Indian Supplier", label: "Indian Supplier" }]} isClearable />)} /></FormItem>
                <FormItem label="Business Type"><Controller name="business_type" control={control} render={({ field }) => (<Select {...field} placeholder="Select Business Type" options={[{ label: "Manufacturer", value: "Manufacturer" }]} isClearable />)} /></FormItem>
                <FormItem label="Favourite Product(s)"><Controller name="favourite_product_id" control={control} render={({ field }) => (<Select {...field} isMulti placeholder="Select favourite products" options={allproductOptions} isClearable />)} /></FormItem>
                <FormItem label="Interested In"><Controller name="interested_in" control={control} render={({ field }) => (<Select {...field} placeholder="Select interest" options={[{ value: "For Sell", label: "For Sell" }, { value: "For Buy", label: "For Buy" }]} isClearable />)} /></FormItem>
                <FormItem label="Member Grade"><Controller name="member_grade" control={control} render={({ field }) => (<Select {...field} placeholder="Select grade" options={[{ value: "A", label: "A" }]} isClearable />)} /></FormItem>
                <FormItem label="Relationship Manager"><Controller name="relationship_manager" control={control} render={({ field }) => (<Select {...field} placeholder="Select RM" options={managerOptions} isClearable />)} /></FormItem>
                <FormItem label="Dealing in Bulk"><Controller name="dealing_in_bulk" control={control} render={({ field }) => (<Radio.Group {...field} className="flex gap-4 mt-2"><Radio value="Yes">Yes</Radio><Radio value="No">No</Radio></Radio.Group>)} /></FormItem>
                <FormItem label="Remarks" className="md:col-span-3"><Controller name="remarks" control={control} render={({ field }) => (<Input {...field} placeholder="Enter internal remarks" />)} /></FormItem>
            </div>
            <hr className="my-6" />
            <div className="flex justify-between items-center mb-4">
                <h4 className="mb-0">Dynamic Member Profiles</h4>
                <Button type="button" icon={<HiPlus />} size="sm" onClick={() => append({ member_type: undefined, brands: [], categories: [], sub_categories: [] })}>Add Profile</Button>
            </div>
            <div className="flex flex-col gap-y-6">
                {fields.map((item, index) => (
                    <Card key={item.id} className="border rounded-md" bodyClass="relative">
                        <div className="absolute top-2 right-2 z-10"><Button type="button" variant="plain" size="sm" className="text-xs" icon={<TbTrash size={16} />} onClick={() => remove(index)}>Remove</Button></div>
                        <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
                            <FormItem label={<div>Member Type {index + 1}<span className="text-red-500"> *</span></div>} invalid={!!errors.member_profiles?.[index]?.member_type} errorMessage={(errors.member_profiles?.[index]?.member_type as any)?.message}>
                                <Controller name={`member_profiles.${index}.member_type`} control={control} render={({ field }) => (<Select {...field} placeholder="Select Member Type" options={memberTypeOptions} isClearable />)} />
                            </FormItem>
                            <FormItem label="Select Brand(s)"><Controller name={`member_profiles.${index}.brands`} control={control} render={({ field }) => (<Select {...field} isMulti placeholder="Select brands" options={brandOptions} isClearable />)} /></FormItem>
                            <FormItem label="Select Category(s)"><Controller name={`member_profiles.${index}.categories`} control={control} render={({ field }) => (<Select {...field} isMulti placeholder="Select categories" options={categoryOptions} isClearable />)} /></FormItem>
                        </div>
                    </Card>
                ))}
            </div>
        </Card>
    );
};

// --- Dynamic Zod Schema ---
const createMemberSchema = (isEditMode: boolean) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const passwordErrorMessage = "Min 8 characters, with one uppercase, one lowercase, one digit, and one special character.";

    const baseSchema = z.object({
        name: z.string().trim().min(1, "Name is required."),
        email: z.string().trim().min(1, "Email is required.").email("Invalid email format."),
        mobile_no: z.string().trim().regex(/^\d{6,20}$/, "Mobile must be 6 to 20 digits."),
        contact_country_code: z.object({ value: z.string().min(1), label: z.string() }, { required_error: "Country code is required." }),
        country_id: z.object({ value: z.string().min(1), label: z.string() }, { required_error: "Country is required." }),
        continent_id: z.object({ value: z.string().min(1), label: z.string() }, { required_error: "Continent is required." }),
        state: z.string().trim().min(1, "State is required."),
        city: z.string().trim().min(1, "City is required."),
        member_profiles: z.array(z.object({
            member_type: z.object({ value: z.union([z.string(), z.number()]).refine(v => v !== '', 'Member Type is required'), label: z.string() }, { required_error: "Member Type is required." })
        })).min(1, "At least one member profile is required."),
    });

    const withPassword = isEditMode
        ? baseSchema.extend({
            password: z.string().optional().refine((val) => !val || passwordRegex.test(val), { message: passwordErrorMessage }),
        })
        : baseSchema.extend({
            password: z.string().min(1, "Password is required.").regex(passwordRegex, passwordErrorMessage),
        });

    return withPassword.passthrough();
};

const memberNavigationList = [
    { label: "Personal Details", link: "personalDetails" },
    { label: "Contact Info", link: "socialContactInformation" },
    { label: "Member Profile", link: "memberProfile" },
    { label: "Accessibilities", link: "memberAccessibility" },
    { label: "Membership Details", link: "membershipPlanDetails" },
];
const NavigatorComponent = ({ activeSection, onNavigate }: { activeSection: string; onNavigate: (sectionKey: string) => void; }) => (
    <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
        {memberNavigationList.map((nav) => (
            <button type="button" key={nav.link} className={classNames("cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max", "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none", { "bg-indigo-50 dark:bg-indigo-700/60 text-[#00baf2] dark:text-indigo-200 font-semibold": activeSection === nav.link, "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200": activeSection !== nav.link })} onClick={() => onNavigate(nav.link)} title={nav.label}>
                <span className="font-medium text-[10px] xxs:text-xs sm:text-sm truncate">{nav.label}</span>
            </button>
        ))}
    </div>
);

const MemberFormComponent = ({ onFormSubmit, defaultValues, isEditMode, onDiscard, isSubmitting }: { onFormSubmit: (values: MemberFormSchema, formMethods: UseFormReturn<MemberFormSchema>) => void; defaultValues: Partial<MemberFormSchema>; isEditMode: boolean; onDiscard?: () => void; isSubmitting?: boolean; }) => {
    const [activeSection, setActiveSection] = useState<string>(memberNavigationList[0].link);
    const memberSchema = useMemo(() => createMemberSchema(isEditMode), [isEditMode]);
    const formMethods = useForm<MemberFormSchema>({ defaultValues, resolver: zodResolver(memberSchema), mode: 'onChange' });
    const { handleSubmit, reset, formState: { errors }, control } = formMethods;

    useEffect(() => { if (defaultValues) { reset(defaultValues); } }, [defaultValues, reset]);

    const internalFormSubmit = (values: MemberFormSchema) => { onFormSubmit?.(values, formMethods); };

    const navigationKeys = memberNavigationList.map((item) => item.link);
    const handleNext = () => { const currentIndex = navigationKeys.indexOf(activeSection); if (currentIndex < navigationKeys.length - 1) setActiveSection(navigationKeys[currentIndex + 1]); };
    const handlePrevious = () => { const currentIndex = navigationKeys.indexOf(activeSection); if (currentIndex > 0) setActiveSection(navigationKeys[currentIndex - 1]); };

    const renderActiveSection = () => {
        const sectionProps = { errors, control, formMethods, isEditMode };
        switch (activeSection) {
            case "personalDetails": return <PersonalDetailsComponent {...sectionProps} />;
            case "socialContactInformation": return <ContactDetailsComponent {...sectionProps} />;
            case "memberAccessibility": return <MemberAccessibilityComponent {...sectionProps} />;
            case "membershipPlanDetails": return <MembershipPlanComponent {...sectionProps} />;
            case "memberProfile": return <MemberProfileComponent {...sectionProps} />;
            default: return <PersonalDetailsComponent {...sectionProps} />;
        }
    };

    return (
        <>
            <div className="flex gap-1 items-center mb-3">
                <NavLink to="/system-tools/raw-data"><h6 className="font-semibold hover:text-primary-600">Raw Data</h6></NavLink>
                <BiChevronRight size={22} />
                <h6 className="font-semibold text-primary flex items-center gap-2">{isEditMode ? "Edit Member" : "Create New Member"}</h6>
            </div>
            <Card className="mb-6" bodyClass="px-4 py-2 md:px-6"><NavigatorComponent activeSection={activeSection} onNavigate={setActiveSection} /></Card>
            <div className="flex flex-col gap-4 pb-20">{renderActiveSection()}</div>
            <Card className="mt-auto sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center p-4">
                    <div>{onDiscard && (<Button type="button" onClick={onDiscard} disabled={isSubmitting}>Discard</Button>)}</div>
                    <div className="flex items-center gap-2">
                        <Button type="button" onClick={handlePrevious} disabled={isSubmitting || navigationKeys.indexOf(activeSection) === 0}>Previous</Button>
                        <Button type="button" onClick={handleNext} disabled={isSubmitting || navigationKeys.indexOf(activeSection) === navigationKeys.length - 1}>Next</Button>
                        <Button variant="solid" type="button" loading={isSubmitting} onClick={handleSubmit(internalFormSubmit)}>{isEditMode ? "Update" : "Create"}</Button>
                    </div>
                </div>
            </Card>
        </>
    );
};

const MemberCreate = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { id } = useParams<{ id?: string }>();
    const { state } = useLocation();

    const isEditMode = !!id;
    const { rowData } = (state || {}) as { rowData?: RowDataItem };

    const [initialData, setInitialData] = useState<Partial<MemberFormSchema> | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { CountriesData = [], CategoriesData = [], BrandData = [] } = useSelector(masterSelector, shallowEqual);

    const countryOptions = useMemo(() => CountriesData.map((c: any) => ({ value: String(c.id), label: c.name })), [CountriesData]);
    const categoryOptions = useMemo(() => CategoriesData.map((c: any) => ({ value: String(c.id), label: c.name })), [CategoriesData]);
    const brandOptions = useMemo(() => BrandData.map((b: any) => ({ value: String(b.id), label: b.name })), [BrandData]);

    const getEmptyFormValues = useCallback((): Partial<MemberFormSchema> => ({
        name: "", email: "", password: "", mobile_no: "", company_name_temp: "",
        status: { label: "Active", value: "Active" }, address: "", whatsapp_number: "",
        is_blacklisted: false, dealing_in_bulk: "No",
        product_upload_permission: false, wall_enquiry_permission: false,
        enquiry_permission: false, trade_inquiry_allowed: { label: "No", value: "0" },
        member_profiles: [],
    }), []);

    const transformRowDataToMemberForm = useCallback((data: RowDataItem, countries: any[]): Partial<MemberFormSchema> => {
        const country = countryOptions.find(c => c.value === String(data.country_id));
        const category = categoryOptions.find(c => c.value === String(data.category_id));
        const brand = brandOptions.find(b => b.value === String(data.brand_id));

        const fullMobileString = data.mobile_no || '';
        const phoneCodes = countries.map(c => c.phone_code).filter(Boolean).sort((a, b) => b.length - a.length);
        let countryCode: string | null = null;
        let localNumber: string = fullMobileString;

        for (const code of phoneCodes) {
            const prefix = `+${code}`;
            if (fullMobileString.startsWith(prefix)) {
                countryCode = prefix;
                localNumber = fullMobileString.substring(prefix.length);
                break;
            }
        }

        return {
            rowdata_id: data.id, // Capture the raw data ID
            name: data.name,
            email: data.email || '',
            mobile_no: localNumber,
            contact_country_code: countryCode ? { value: countryCode, label: countryCode } : undefined,
            company_name_temp: data.company_name || '',
            country_id: country,
            city: data.city || '',
            remarks: `Converted from Raw Data.`,
            member_profiles: [{
                member_type: undefined,
                categories: category ? [category] : [],
                brands: brand ? [brand] : [],
                sub_categories: [],
            }]
        };
    }, [countryOptions, categoryOptions, brandOptions]);

    useEffect(() => {
        dispatch(getCountriesAction());
        dispatch(getContinentsAction());
        dispatch(getBrandAction());
        dispatch(getCategoriesAction());
        dispatch(getEmployeesAction());
        dispatch(getAllProductsAction());
        dispatch(getMemberTypeAction());
    }, [dispatch]);

    useEffect(() => {
        const emptyForm = getEmptyFormValues();
        if (isEditMode && id) {
            const fetchMemberData = async () => {
                setPageLoading(true);
                try {
                    const response = await dispatch(getMemberByIdAction(id)).unwrap();
                    if (response) {
                        setInitialData({ ...emptyForm, ...transformApiToFormSchema(response) });
                    }
                } catch (e) {
                    toast.push(<Notification type="danger" title="Error">Failed to fetch member data.</Notification>);
                } finally {
                    setPageLoading(false);
                }
            };
            fetchMemberData();
        } else {
            if (rowData && CountriesData.length > 0) {
                setInitialData({ ...emptyForm, ...transformRowDataToMemberForm(rowData, CountriesData) });
            } else {
                setInitialData(emptyForm);
            }
            if (!rowData || (rowData && CountriesData.length > 0)) {
                setPageLoading(false);
            }
        }
    }, [id, isEditMode, dispatch, rowData, getEmptyFormValues, transformRowDataToMemberForm, CountriesData]);

    const handleFormSubmit = async (formValues: MemberFormSchema, formMethods: UseFormReturn<MemberFormSchema>) => {
        setIsSubmitting(true);
        const payload = preparePayloadForApi(formValues, isEditMode);
        try {
            if (isEditMode) {
                await dispatch(editMemberAction(payload)).unwrap();
                toast.push(<Notification type="success" title="Member Updated" />);
            } else {
                await dispatch(addMemberAction(payload)).unwrap();
                toast.push(<Notification type="success" title="Member Created" />);
            }
            navigate("/system-tools/raw-data");
        } catch (error: any) {
            const errorMessage = error?.message || `Failed to ${isEditMode ? 'update' : 'create'} member.`;
            if (error?.errors && typeof error.errors === 'object') {
                Object.entries(error.errors).forEach(([key, value]) => {
                    formMethods.setError(key as keyof MemberFormSchema, { type: 'server', message: Array.isArray(value) ? value.join(', ') : String(value) });
                });
                toast.push(<Notification type="danger" title="Validation Error">Please check the form fields.</Notification>);
            } else {
                toast.push(<Notification type="danger" title={`${isEditMode ? 'Update' : 'Creation'} Failed`}>{errorMessage}</Notification>);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (pageLoading || !initialData) {
        return <Container className="h-full flex justify-center items-center"><p>Loading...</p></Container>;
    }

    return (
        <Container className="h-full">
            <Form onSubmit={(e) => e.preventDefault()} className="flex flex-col min-h-screen">
                <div className="flex-grow">
                    <MemberFormComponent onFormSubmit={handleFormSubmit} defaultValues={initialData} isEditMode={isEditMode} onDiscard={() => setDiscardConfirmationOpen(true)} isSubmitting={isSubmitting} />
                </div>
                <ConfirmDialog isOpen={discardConfirmationOpen} type="danger" title="Discard Changes" onClose={() => setDiscardConfirmationOpen(false)} onConfirm={() => { setDiscardConfirmationOpen(false); navigate("/system-tools/raw-data"); }}>
                    <p>Are you sure you want to discard changes?</p>
                </ConfirmDialog>
            </Form>
        </Container>
    );
};

export default MemberCreate;
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types' // Assuming this path is correct
import { getAllProductsAction, getBrandAction, getCategoriesAction, getCountriesAction, getDepartmentsAction, getDesignationsAction, getMemberAction, getRolesAction, getSubcategoriesByIdAction } from '@/reduxtool/master/middleware'
import { useSelector } from 'react-redux'
import { useEffect, useMemo } from 'react'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { useAppDispatch } from '@/reduxtool/store'

// --- Mock Options Data (Replace with real data or fetch from API as needed) ---

const reportingPersonnelOptions = [ // Example list of employees/managers
    { value: 'emp001', label: 'John Smith (Manager)' },
    { value: 'emp002', label: 'Alice Johnson (HR Head)' },
    { value: 'emp003', label: 'Bob Williams (Director)' },
    { value: 'emp004', label: 'Sarah Miller (Lead)' },
    // ... other personnel
]
// --- End Mock Options Data ---

interface RoleResponsibilityFormValues {
    role?: string;
    department?: string;
    designation?: string;
    country?: string;
    category?: string;
    subCategory?: string;
    brand?: string;
    product?: string;
    reportingHR?: string;
    reportingHead?: string;
}

// Extend FormSectionBaseProps to include errors for roleResponsibility
interface RoleResponsibilitySectionProps extends FormSectionBaseProps {
    errors: FormSectionBaseProps['errors'] & {
        roleResponsibility?: {
            [K in keyof RoleResponsibilityFormValues]?: { message?: string }
        }
    };
}

const RoleResponsibilitySection = ({
    control,
    errors,
}: RoleResponsibilitySectionProps) => {
    const dispatch = useAppDispatch();

    const { Roles = [], departmentsData = [], designationsData = [], CountriesData = [],
        BrandData = [],
        CategoriesData = [],
        subCategoriesData = [],
        AllProducts = [],
        memberData=[],

    } = useSelector(masterSelector);

    useEffect(() => {
        dispatch(getRolesAction());
        dispatch(getDepartmentsAction());
        dispatch(getDesignationsAction());
        dispatch(getCountriesAction());
        dispatch(getBrandAction());
        dispatch(getCategoriesAction());
        dispatch(getSubcategoriesByIdAction('0'));
        dispatch(getAllProductsAction());
        dispatch(getMemberAction());
    }, [dispatch])

    const countryOptions = useMemo(() => Array.isArray(CountriesData) ? CountriesData.map((country: any) => ({ value: String(country.id), label: country.name })) : [], [Roles]);
    const roleOptions = useMemo(() => Array.isArray(Roles) ? Roles.map((r: any) => ({ value: String(r.id), label: r.display_name })) : [], [Roles]);
    const departmentOptions = useMemo(() => Array.isArray(departmentsData?.data) ? departmentsData?.data.map((d: any) => ({ value: String(d.id), label: d.name })) : [], [departmentsData?.data]);
    const designationOptions = useMemo(() => Array.isArray(designationsData?.data) ? designationsData?.data.map((d: any) => ({ value: String(d.id), label: d.name })) : [], [designationsData?.data]);
    const brandOptions = BrandData.map((b: any) => ({ value: b.id, label: b.name, }));
    const categoryOptions = CategoriesData.map((c: any) => ({ value: c.id, label: c.name, }));
    const subCategoryOptions = subCategoriesData.map((sc: any) => ({ value: sc.id, label: sc.name, }));
    const productOptions = AllProducts.map((sc: any) => ({
        value: parseInt(sc.id),
        label: sc.name,
    }));
  const reportingPersonnelOptions = useMemo(() => {
    const data = memberData?.data?.data || memberData;
    return Array.isArray(data)
      ? data.map((m: any) => ({
        value: String(m.id),
        label: `${m.name} (ID:${m.id})`,
      }))
      : [];
  }, [memberData]);
    return (
        <Card id="roleResponsibility">
            <h4 className="mb-6">Role & Responsibility</h4>
            <div className="flex flex-col gap-6">
                {/* Using a 2 or 3 column layout for medium screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                    {/* Role */}
                    <FormItem
                        label={<div>Role<span className="text-red-500"> * </span></div>}
                        invalid={Boolean(errors.roleResponsibility?.role)}
                        errorMessage={errors.roleResponsibility?.role?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.role`}
                            control={control}
                            rules={{ required: 'Role is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Role"
                                    options={roleOptions}
                                    value={roleOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Department */}
                    <FormItem
                        label="Department"
                        invalid={Boolean(errors.roleResponsibility?.department)}
                        errorMessage={errors.roleResponsibility?.department?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.department`}
                            control={control}
                            rules={{ required: 'Department is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Department"
                                    options={departmentOptions}
                                    value={departmentOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Designation */}
                    <FormItem
                        label="Designation"
                        invalid={Boolean(errors.roleResponsibility?.designation)}
                        errorMessage={errors.roleResponsibility?.designation?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.designation`}
                            control={control}
                            rules={{ required: 'Designation is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Designation"
                                    options={designationOptions}
                                    value={designationOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Country */}
                    <FormItem
                        label="Country (Operational)"
                        invalid={Boolean(errors.roleResponsibility?.country)}
                        errorMessage={errors.roleResponsibility?.country?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.country`}
                            control={control}
                            rules={{ required: 'Country is required' }}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select Country"
                                    options={countryOptions}
                                    value={countryOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Category */}
                    <FormItem
                        label="Category (Focus Area)"
                        invalid={Boolean(errors.roleResponsibility?.category)}
                        errorMessage={errors.roleResponsibility?.category?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.category`}
                            control={control}
                            // rules={{ required: 'Category is required' }} // Make optional if not always applicable
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select Category"
                                    options={categoryOptions}
                                    value={categoryOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Subcategory */}
                    <FormItem
                        label="Subcategory"
                        invalid={Boolean(errors.roleResponsibility?.subCategory)}
                        errorMessage={errors.roleResponsibility?.subCategory?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.subCategory`}
                            control={control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select Subcategory"
                                    options={subCategoryOptions} // Ideally, filter based on selected category
                                    value={subCategoryOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Brand */}
                    <FormItem
                        label="Brand (Responsibility)"
                        invalid={Boolean(errors.roleResponsibility?.brand)}
                        errorMessage={errors.roleResponsibility?.brand?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.brand`}
                            control={control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select Brand"
                                    options={brandOptions}
                                    value={brandOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Product */}
                    <FormItem
                        label="Product/Service (Focus)"
                        invalid={Boolean(errors.roleResponsibility?.product)}
                        errorMessage={errors.roleResponsibility?.product?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.product`}
                            control={control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select Product/Service"
                                    options={productOptions}
                                    value={productOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Reporting HR */}
                    <FormItem
                        label="Reporting HR"
                        invalid={Boolean(errors.roleResponsibility?.reportingHR)}
                        errorMessage={errors.roleResponsibility?.reportingHR?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.reportingHR`}
                            control={control}
                            rules={{ required: 'Reporting HR is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Reporting HR"
                                    options={reportingPersonnelOptions} // Use a list of HR personnel
                                    value={reportingPersonnelOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* Reporting Head */}
                    <FormItem
                        label="Reporting Head (Manager)"
                        invalid={Boolean(errors.roleResponsibility?.reportingHead)}
                        errorMessage={errors.roleResponsibility?.reportingHead?.message as string}
                    >
                        <Controller
                            name={`roleResponsibility.reportingHead`}
                            control={control}
                            rules={{ required: 'Reporting Head is required' }}
                            render={({ field }) => (
                                <Select
                                    placeholder="Select Reporting Head"
                                    options={reportingPersonnelOptions} // Use a list of managers/supervisors
                                    value={reportingPersonnelOptions.find(option => option.value === field.value)}
                                    onChange={option => field.onChange(option?.value)}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>
            </div>
            {/* Add any relevant buttons here if needed */}
        </Card>
    )
}

export default RoleResponsibilitySection
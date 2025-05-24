import Card from '@/components/ui/Card'
import Radio from '@/components/ui/Radio' // Assuming Radio component path
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types' // Assuming this path is correct

// Define the structure of the form values for this section
// Values can be 'yes', 'no', or potentially undefined/null if not yet selected.
interface EquipmentsAssetsFormValues {
    companyPCLaptop?: 'yes' | 'no';
    companyLaptopCharger?: 'yes' | 'no';
    companyMobileSim?: 'yes' | 'no';
    companyMobileCharger?: 'yes' | 'no';
    companyKeyboardMouse?: 'yes' | 'no';
    emailForPortalLogin?: 'yes' | 'no'; // Or "provided" / "not_provided"
}

// Extend FormSectionBaseProps to include errors for equipmentsAssets
interface EquipmentsAssetsSectionProps extends FormSectionBaseProps {
    errors: FormSectionBaseProps['errors'] & {
        equipmentsAssets?: { // Assuming form data is nested under 'equipmentsAssets'
            [K in keyof EquipmentsAssetsFormValues]?: { message?: string }
        }
    };
}

const EquipmentsAssetsSection = ({
    control,
    errors,
}: EquipmentsAssetsSectionProps) => {
    const equipmentItems: Array<{ name: keyof EquipmentsAssetsFormValues; label: string; options?: {yes: string, no: string} }> = [
        { name: 'companyPCLaptop', label: 'Company PC/Laptop Issued' },
        { name: 'companyLaptopCharger', label: 'Company Laptop Charger Issued' },
        { name: 'companyMobileSim', label: 'Company Mobile + SIM Issued' },
        { name: 'companyMobileCharger', label: 'Company Mobile Charger Issued' },
        { name: 'companyKeyboardMouse', label: 'Company Keyboard + Mouse Issued' },
        { name: 'emailForPortalLogin', label: 'Email For Portal Login Provided', options: {yes: "Provided", no: "Not Provided"} },
    ];

    return (
        <Card id="equipmentsAssets">
            <h4 className="mb-6">Equipments & Assets Issued</h4>
            <div className="flex flex-col gap-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 items-start">
                    {equipmentItems.map((item) => (
                        <FormItem
                            key={item.name}
                            label={item.label}
                            invalid={Boolean(errors.equipmentsAssets?.[item.name])}
                            errorMessage={errors.equipmentsAssets?.[item.name]?.message as string}
                            className="mb-0" // Remove default bottom margin from FormItem if it has one, as gap-y handles it
                        >
                            <Controller
                                name={`equipmentsAssets.${item.name}`}
                                control={control}
                                rules={{ required: `${item.label.replace(" Issued", "").replace(" Provided", "")} status is required` }}
                                render={({ field }) => (
                                    <div className="flex gap-x-4 items-center pt-2"> {/* pt-2 to align with label */}
                                        <Radio
                                            name={field.name} // RHF's field name, acts as group name for HTML radios
                                            value="yes"
                                            checked={field.value === 'yes'}
                                            onChange={() => field.onChange('yes')}
                                            onBlur={field.onBlur} // Important for RHF validation triggers
                                        >
                                            {item.options?.yes || 'Yes'}
                                        </Radio>
                                        <Radio
                                            name={field.name} // RHF's field name, acts as group name for HTML radios
                                            value="no"
                                            checked={field.value === 'no'}
                                            onChange={() => field.onChange('no')}
                                            onBlur={field.onBlur} // Important for RHF validation triggers
                                        >
                                            {item.options?.no || 'No'}
                                        </Radio>
                                    </div>
                                )}
                            />
                        </FormItem>
                    ))}
                </div>
            </div>
            {/* Add any relevant buttons here if needed */}
        </Card>
    )
}

export default EquipmentsAssetsSection
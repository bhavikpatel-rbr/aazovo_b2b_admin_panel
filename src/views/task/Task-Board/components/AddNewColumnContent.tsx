import { useState, useEffect } from 'react';
import Checkbox from '@/components/ui/Checkbox';
import Radio from '@/components/ui/Radio';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useScrumBoardStore } from '../store/scrumBoardStore';
import sleep from '@/utils/sleep';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { Form, FormItem, Input } from '@/components/ui'; // Removed Drawer, UiSelect if not used elsewhere
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import cloneDeep from 'lodash/cloneDeep';
import type { ZodType } from 'zod';
import type { Columns } from '../types';

// --- Type Definitions ---
export type EntityType = 'company' | 'member' | 'partner' | 'lead' | 'wall_listing';

type FormSchema = {
    title: string;
    // entityType: EntityType;
    // selectedEntityId?: string;
    // selectedOptions?: string[]; // This will effectively not be used if checkboxes are removed
};

const validationSchema: ZodType<FormSchema> = z.object({
    title: z.string().min(1, 'Column title is required!'),
    // entityType: z.enum(['company', 'member', 'partner', 'lead', 'wall_listing'], {
    //     required_error: 'Please select an entity type.',
    // }),
    // selectedEntityId: z.string().optional(), // Make optional, then refine
    // selectedOptions: z.array(z.string()).optional(), // Will be unused but keep in schema for now
})
// .refine(data => {
//     if (data.entityType && !data.selectedEntityId) {
//         return false; // selectedEntityId is required if entityType is chosen
//     }
//     return true;
// }, {
//     message: "Please select an item from the list.",
//     path: ["selectedEntityId"], // Error applies to selectedEntityId
// });
// --- End Type Definitions ---

// --- Mock Options Data ---
const entityTypeOptions = [
    { value: 'company', label: 'Company' },
    { value: 'member', label: 'Member' },
    { value: 'partner', label: 'Partner' },
    { value: 'lead', label: 'Lead' },
    { value: 'wall_listing', label: 'Wall Listing' },
];

const selectOptionsMap: Record<EntityType, Array<{ value: string; label: string }>> = {
    company: [
        { value: 'compA', label: 'Company Alpha' },
        { value: 'compB', label: 'Company Beta' },
    ],
    member: [
        { value: 'mem1', label: 'Member John' },
        { value: 'mem2', label: 'Member Jane' },
    ],
    partner: [ /* ... partner options ... */ ],
    lead: [ /* ... lead options ... */ ],
    wall_listing: [ /* ... wall_listing options ... */ ],
};

// checkboxOptionsMap is no longer needed if we remove the checkboxes entirely
// const checkboxOptionsMap: Record<string, Array<{ value: string; label: string }>> = { ... };
// --- End Mock Options Data ---

const AddNewColumnContent = () => {
    const {
        columns,
        ordered,
        closeDialog,
        updateColumns,
        resetView,
        updateOrdered,
    } = useScrumBoardStore();

    const {
        control,
        formState: { errors },
        handleSubmit,
        watch,
        resetField,
        setValue, // Still useful for resetting selectedEntityId
    } = useForm<FormSchema>({
        defaultValues: {
            title: '',
            // selectedEntityId: undefined,
            // selectedOptions: [], // Keep for schema, will be empty
        },
        resolver: zodResolver(validationSchema),
    });

    // const watchedEntityType = watch('entityType');
    // const watchedSelectedEntityId = watch('selectedEntityId'); // Not directly needed for checkbox visibility anymore

    // Reset selectedEntityId (and selectedOptions implicitly as it's not rendered) when entityType changes
    // useEffect(() => {
    //     if (watchedEntityType) {
    //         // When entityType changes, clear the selectedEntityId.
    //         // selectedOptions is not rendered, so no direct reset needed here,
    //         // but ensure it's empty in defaultValues and onFormSubmit if it matters.
    //         setValue('selectedEntityId', undefined, { shouldValidate: true });
    //         // setValue('selectedOptions', [], { shouldValidate: false }); // Ensure it's always empty
    //     }
    // }, [watchedEntityType, setValue]);


    // const currentSelectOptions = watchedEntityType ? selectOptionsMap[watchedEntityType] : [];
    const currentSelectOptions =  [];

    const onFormSubmit = async (data: FormSchema) => {
        console.log('Form Data:', data); // data.selectedOptions will be an empty array

        const newColumnTitle = data.title || 'Untitled Board';
        const currentColumns = cloneDeep(columns);
        
        // Since there are no selectedOptions (checkboxes), the tasks array will be empty.
        // You might want to add a default task or some placeholder content based on selectedEntityId.
        let tasks: any[] = [];
        // if (data.selectedEntityId) {
        //     const entityTypeLabel = entityTypeOptions.find(opt => opt.value === data.entityType)?.label;
        //     const selectedItemLabel = currentSelectOptions.find(opt => opt.value === data.selectedEntityId)?.label;
        //     tasks.push({
        //         id: `item-${Date.now()}`,
        //         // content: `Selected: ${entityTypeLabel} - ${selectedItemLabel}`
        //     });
        // }


        currentColumns[newColumnTitle] = tasks;
        
        const newOrdered = [...ordered, newColumnTitle];
        const newColumnsState: Columns = {};
        newOrdered.forEach((elm) => {
            newColumnsState[elm] = currentColumns[elm];
        });

        updateColumns(newColumnsState);
        updateOrdered(newOrdered);
        closeDialog();
        await sleep(500);
        resetView();
    };

    return (
        <div>
            <h5>Add New Column</h5>
            <div className="mt-4">
                <Form layout="vertical" onSubmit={handleSubmit(onFormSubmit)}>
                    <FormItem
                        label="Column title"
                        invalid={Boolean(errors.title)}
                        errorMessage={errors.title?.message}
                        className="mb-4"
                    >
                        <Controller
                            name="title"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Enter column title"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    {/* <FormItem
                        label="Select Type"
                        invalid={Boolean(errors.entityType)}
                        errorMessage={errors.entityType?.message}
                        className="mb-4"
                    >
                        <Controller
                            name="entityType"
                            control={control}
                            render={({ field }) => (
                                <Radio.Group
                                    value={field.value}
                                    onChange={(val) => {
                                        field.onChange(val);
                                        // When radio changes, reset selectedEntityId
                                        setValue('selectedEntityId', undefined, { shouldValidate: true });
                                        // selectedOptions is not rendered, so no need to explicitly reset here for UI
                                    }}
                                >
                                    {entityTypeOptions.map((option) => (
                                        <Radio key={option.value} value={option.value}>
                                            {option.label}
                                        </Radio>
                                    ))}
                                </Radio.Group>
                            )}
                        />
                    </FormItem> */}

                    {/* Select dropdown is shown if an entityType is selected */}
                    {/* {watchedEntityType && (
                        <FormItem
                            label={`Select ${entityTypeOptions.find(opt => opt.value === watchedEntityType)?.label || 'Item'}`}
                            invalid={Boolean(errors.selectedEntityId)}
                            errorMessage={errors.selectedEntityId?.message}
                            className="mb-4"
                        >
                            <Controller
                                name="selectedEntityId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        placeholder={`Select a ${watchedEntityType}...`}
                                        options={currentSelectOptions}
                                        value={currentSelectOptions.find(option => option.value === field.value)}
                                        onChange={(option) => {
                                            field.onChange(option?.value);
                                            // No selectedOptions to reset as they are removed
                                        }}
                                    />
                                )}
                            />
                        </FormItem>
                    )} */}

                    {/* Checkbox section is completely removed */}
                    {/* 
                    {watchedEntityType && watchedSelectedEntityId && currentCheckboxOptions && currentCheckboxOptions.length > 0 && (
                        <FormItem ... > ... </FormItem>
                    )} 
                    */}

                    <FormItem>
                        <Button variant="solid" type="submit" className="mt-4">
                            Add Status
                        </Button>
                    </FormItem>
                </Form>
            </div>
        </div>
    );
};

export default AddNewColumnContent;
import classNames from 'classnames'
import { FC, useEffect, useState } from 'react'
import { Control, Controller, useForm } from 'react-hook-form'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/reduxtool/store'
import { useSelector } from 'react-redux'
import { getFillUpFormAction, submitFillUpFormAction } from '@/reduxtool/master/middleware'

// UI Components
import Card from '@/components/ui/Card'
import Checkbox from '@/components/ui/Checkbox'
import { FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { DatePicker, Drawer, Spinner } from '@/components/ui'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { masterSelector } from '@/reduxtool/master/masterSlice'

// Mock data for document images, replace with real data if available
const MOCK_DOCUMENT_IMAGES = [
    '/img/documents/invoice.avif',
    '/img/documents/invoice.avif',
];

// --- Type Definitions for the UI-friendly Form Structure ---
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'file' | 'date' | 'checkbox' | 'multi_checkbox';
  options?: { label: string, name: string }[]; // For multi-checkbox questions
  required: boolean;
}
interface FormSection {
  id: string; // e.g., 'pi_section'
  label: string; // e.g., 'PI SECTION'
  fields: FormField[];
}
interface FormStructure {
  form_title: string;
  sections: FormSection[];
}


// --- Helper function to create safe names for form fields ---
const sanitizeForName = (str: string): string => {
    return str.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/_$/, '');
}

// --- NEW: API Data Transformer ---
// This function converts the API response into the UI-friendly FormStructure
const transformApiDataToFormStructure = (apiData: any): FormStructure | null => {
    if (!apiData || !apiData.section) {
        return null;
    }

    const transformedSections: FormSection[] = apiData.section.map((apiSection: any, sectionIndex: number) => {
        const sectionId = sanitizeForName(apiSection.title || `section_${sectionIndex}`);

        const transformedFields: FormField[] = apiSection.questions.flatMap((question: any) => {
            const baseFieldName = sanitizeForName(question.question);
            
            // Handle multi-checkbox questions
            if (question.question_type === 'checkbox' && question.question_label) {
                const labels = question.question_label.split(',');
                return [{
                    name: `${sectionId}.${baseFieldName}`,
                    label: question.question,
                    type: 'multi_checkbox',
                    required: question.required,
                    options: labels.map((label: string) => ({
                        label: label.trim(),
                        name: `${sectionId}.${baseFieldName}.${sanitizeForName(label)}`
                    }))
                }] as FormField;
            }
            
            // Handle single checkbox or other simple types
            return [{
                name: `${sectionId}.${baseFieldName}`,
                label: question.question,
                type: question.question_type, // 'file', 'textarea', 'text', 'date', 'checkbox'
                required: question.required,
            }] as FormField;
        });

        return {
            id: sectionId,
            label: apiSection.title,
            fields: transformedFields,
        };
    });

    return {
        form_title: apiData.form_name || 'Dynamic Form',
        sections: transformedSections,
    };
};


// --- Reusable Field Components ---
const MultiCheckboxField: FC<{ control: Control<any>, field: FormField }> = ({ control, field }) => (
    <FormItem label={field.label} className="md:col-span-2 lg:col-span-3">
        <div className="flex flex-col gap-2">
            {field.options?.map(option => (
                <div key={option.name} className="flex items-center gap-2">
                    <Controller
                        name={option.name}
                        control={control}
                        render={({ field: controllerField }) => (
                            <Checkbox {...controllerField} checked={!!controllerField.value} />
                        )}
                    />
                    <label className="font-semibold text-gray-700 dark:text-gray-300">{option.label}</label>
                </div>
            ))}
        </div>
    </FormItem>
);

// --- Dynamic Field Renderer ---
const renderField = (field: FormField, control: Control<any>) => {
    const commonProps = {
        key: field.name,
        label: field.label,
        invalid: false, // Add error handling from react-hook-form if needed
    };

    switch (field.type) {
        case 'multi_checkbox':
            return <MultiCheckboxField key={field.name} control={control} field={field} />;
        
        case 'checkbox':
            return (
                <FormItem {...commonProps}>
                    <Controller name={field.name} control={control} render={({ field: controllerField }) => (
                         <Checkbox {...controllerField} checked={!!controllerField.value}>{field.label}</Checkbox>
                    )} />
                </FormItem>
            );

        case 'file':
            return (
                <FormItem {...commonProps} className="md:col-span-2 lg:col-span-3">
                    <Controller name={field.name} control={control} render={({ field: { onChange, ...rest } }) => (
                        <Input type="file" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
                    )} />
                </FormItem>
            );
        case 'textarea':
            return (
                <FormItem {...commonProps} className="md:col-span-2 lg:col-span-3">
                    <Controller name={field.name} control={control} render={({ field: controllerField }) => (
                        <Input textArea placeholder={`Enter ${field.label}...`} {...controllerField} />
                    )} />
                </FormItem>
            );
        case 'date':
             return (
                <FormItem {...commonProps}>
                    <Controller name={field.name} control={control} render={({ field: controllerField }) => <DatePicker {...controllerField} />} />
                </FormItem>
            );
        case 'text':
        default:
            return (
                <FormItem {...commonProps}>
                    <Controller name={field.name} control={control} render={({ field: controllerField }) => <Input {...controllerField} placeholder={`Enter ${field.label}`} />} />
                </FormItem>
            );
    }
}


// --- Navigator ---
const NavigatorComponent: FC<{ sections: FormSection[]; activeSection: string; onNavigate: (sectionId: string) => void }> = ({ sections, activeSection, onNavigate }) => (
    <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
    {sections.map((nav) => (
        <button
            type="button"
            key={nav.id}
            className={classNames('cursor-pointer px-2 md:px-3 py-2 rounded-md text-center transition-colors duration-150 flex-1 basis-0 min-w-max', {
                'bg-indigo-50 dark:bg-indigo-700/60 text-[#00baf2] dark:text-indigo-200 font-semibold': activeSection === nav.id,
                'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200': activeSection !== nav.id,
            })}
            onClick={() => onNavigate(nav.id)}
            title={nav.label}
        >
            <span className="font-medium text-[10px] xxs:text-xs sm:text-sm truncate">{nav.label}</span>
        </button>
    ))}
    </div>
);


const FillUpForm = () => {
    const { documentId, formId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Get the raw API response from the Redux store
    // const { formResponse = [], loading, error } = useSelector((state) => state.master.getFillUpFormData);
    const {
        formResponse = [],
        loading, error
      } = useSelector(masterSelector);

    // Local state to hold the UI-friendly transformed form structure
    const [formStructure, setFormStructure] = useState<FormStructure | null>(null);

    const [activeSection, setActiveSection] = useState<string>('');
    const [isImageDrawerOpen, setIsImageDrawerOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const { handleSubmit, control, formState: { isSubmitting } } = useForm({ defaultValues: {} });

    // Effect to fetch form data when formId changes
    useEffect(() => {
        if (formId) {          
            dispatch(getFillUpFormAction(formId)).unwrap();
        }
    }, [formId, dispatch]);

    // Effect to transform the API data once it's fetched
    useEffect(() => {
        if (formResponse) {
            const transformedData = transformApiDataToFormStructure(formResponse);
            setFormStructure(transformedData);
            // Set the first section as active by default
            if (transformedData && transformedData.sections.length > 0) {
                setActiveSection(transformedData.sections[0].id);
            }
        }
    }, [formResponse]);

    const onFormSubmit = async (values: any) => {
        const payload = {
            document_id: documentId,
            form_id: formId,
            submitted_data: values,
        };
        console.log('Submitting Form Data:', payload);
        
        try {
            await dispatch(submitFillUpFormAction(payload)).unwrap();
            toast.push(<Notification type="success" title="Form Submitted Successfully!" />);
            navigate('/account-document');
        } catch (err: any) {
            toast.push(<Notification type="danger" title="Submission Failed" children={err?.message || 'An unknown error occurred.'} />);
        }
    }
  
    const handleImageClick = (imageUrl: string) => {
        setSelectedImage(imageUrl);
        setIsImageDrawerOpen(true);
    };
  
    const closeImageDrawer = () => {
        setIsImageDrawerOpen(false);
        setSelectedImage(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-60">
                <Spinner size="40px" />
                <span className="ml-4">Loading Form...</span>
            </div>
        );
    }

    if (error || !formStructure) {
      return <div className="p-8 text-center text-red-500">Failed to load form structure. Please try again.</div>;
    }
  
    const currentSectionData = formStructure.sections.find(s => s.id === activeSection);

    return (
        <>
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Column: Document Images */}
                <div className="w-full md:w-48 flex-shrink-0">
                    <Card className="sticky top-0">
                        <h5 className="mb-4">Documents</h5>
                        <div className="max-h-[80vh] overflow-y-auto pr-2">
                            <div className="space-y-4">
                            {MOCK_DOCUMENT_IMAGES.map((img, index) => (
                                <div key={index} className="cursor-pointer border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-200 rounded-md overflow-hidden" onClick={() => handleImageClick(img)}>
                                    <img src={img} alt={`Document ${index + 1}`} className="w-full h-auto object-cover" />
                                </div>
                            ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Main Form */}
                <div className="flex-grow">
                    <h3 className="mb-4">{formStructure.form_title}</h3>
                    <Card className="mb-6" bodyClass="px-4 py-2 md:px-6">
                        <NavigatorComponent
                            sections={formStructure.sections}
                            activeSection={activeSection}
                            onNavigate={setActiveSection}
                        />
                    </Card>
                    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
                        {currentSectionData && (
                            <Card id={currentSectionData.id}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 mt-2">
                                    {currentSectionData.fields.map(field => renderField(field, control))}
                                </div>
                            </Card>
                        )}
                    </form>
                </div>
            </div>
      
            {/* Footer and Drawer */}
            <Card className="mt-6 sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-end items-center gap-2">
                    <Button onClick={() => navigate(-1)} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="solid" type="submit" onClick={handleSubmit(onFormSubmit)} loading={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </Card>
      
            <Drawer
                title="Document Viewer"
                isOpen={isImageDrawerOpen}
                onClose={closeImageDrawer}
                onRequestClose={closeImageDrawer}
                placement="left"
                width={500}
            >
                <div className="p-4 h-full overflow-y-auto">
                    {selectedImage && (
                        <img src={selectedImage} alt="Selected Document" className="w-full h-auto border border-indigo-200 rounded-md" />
                    )}
                </div>
            </Drawer>
        </>
    )
}

export default FillUpForm;
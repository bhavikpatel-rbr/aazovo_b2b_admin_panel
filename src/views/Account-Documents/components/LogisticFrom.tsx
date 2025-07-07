import classNames from 'classnames'
import { FC, useEffect, useRef, useState } from 'react'
import { Control, Controller, useForm } from 'react-hook-form'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/reduxtool/store'
import { useSelector } from 'react-redux'
import { 
    getFillUpFormAction, 
    submitFillUpFormAction,
    getAccountDocByIdAction,
    getFilledFormAction,
} from '@/reduxtool/master/middleware'

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

// --- Type Definitions for the UI-friendly Form Structure ---
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'file' | 'date' | 'checkbox' | 'multi_checkbox';
  options?: { label: string, name: string }[]; 
  required: boolean;
}
interface FormSection {
  id: string; 
  label: string; 
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

// --- API Data Transformer ---
const transformApiDataToFormStructure = (apiData: any): FormStructure | null => {
    if (!apiData || !apiData.section) {
        return null;
    }

    const transformedSections: FormSection[] = apiData.section.map((apiSection: any, sectionIndex: number) => {
        const sectionId = sanitizeForName(apiSection.title || `section_${sectionIndex}`);

        const transformedFields: FormField[] = apiSection.questions.flatMap((question: any) => {
            const baseFieldName = sanitizeForName(question.question);
            
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
            
            return [{
                name: `${sectionId}.${baseFieldName}`,
                label: question.question,
                type: question.question_type,
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

// --- Helper: Prepares form default values for react-hook-form ---
const prepareDefaultValues = (structure: FormStructure, savedData: any): any => {
    if (!structure || !savedData) return {};
    
    const defaultValues: { [key: string]: any } = {};

    structure.sections.forEach(section => {
        defaultValues[section.id] = {};
        const sectionData = savedData[section.id];
        if (!sectionData) return;

        section.fields.forEach(field => {
            const questionKey = field.name.split('.').pop() as string;
            const savedValue = sectionData[questionKey];

            if (savedValue !== undefined && savedValue !== null) {
                if (field.type === 'multi_checkbox' && Array.isArray(savedValue)) {
                    const checkboxGroup: { [key: string]: boolean } = {};
                    field.options?.forEach(option => {
                        const optionKey = sanitizeForName(option.label);
                        checkboxGroup[optionKey] = savedValue.includes(option.label);
                    });
                    defaultValues[section.id][questionKey] = checkboxGroup;
                } else if (field.type === 'date' && savedValue) {
                    defaultValues[section.id][questionKey] = new Date(savedValue);
                } else {
                    // For files, the saved value is a URL string, not a File object.
                    // react-hook-form will hold the new File object if changed, or this string if not.
                    defaultValues[section.id][questionKey] = savedValue;
                }
            }
        });
    });

    return defaultValues;
};


// --- Reusable Field Components ---
const MultiCheckboxField: FC<{ control: Control<any>, field: FormField }> = ({ control, field }) => {
    return (
        // The container for the checkbox group will span the full width on medium and large screens.
        // On a 3-column grid (lg), this means it takes up 3 columns.
        <FormItem label={field.label} className="md:col-span-2 lg:col-span-3">
            {/* The options themselves are laid out in a responsive grid, up to 3 columns */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2`}>
                {field.options?.map(option => (
                    <div key={option.name} className="flex items-center gap-2">
                        <Controller
                            name={option.name}
                            control={control}
                            render={({ field: controllerField }) => (
                                <Checkbox {...controllerField} checked={!!controllerField.value} />
                            )}
                        />
                        <label className="font-semibold text-gray-700 dark:text-gray-300">
                            {option.label}
                        </label>
                    </div>
                ))}
            </div>
        </FormItem>
    );
};


// --- Dynamic Field Renderer ---
const renderField = (
    field: FormField, 
    control: Control<any>,
    handleFileChange: (fieldName: string, file: File | null) => void // New handler for preview
) => {
    const commonProps = {
        key: field.name,
        label: field.label,
        invalid: false,
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
              // This field will span 2 columns on medium screens and up
              <FormItem {...commonProps} className="col-span-2 md:col-span-1">
                  <Controller 
                      name={field.name} 
                      control={control} 
                      render={({ field: { onChange, ...rest } }) => (
                          <Input
                              type="file"
                              onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  onChange(file); // Update react-hook-form state
                                  handleFileChange(field.name, file); // Update visual preview state
                              }}
                          />
                      )} 
                  />
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
    const { id, formId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const {
        formResponse = null,
        filledFormData = null,
        loading: isReduxLoading,
        error
    } = useSelector(masterSelector);

    const [isLoading, setIsLoading] = useState(true);
    const [formStructure, setFormStructure] = useState<FormStructure | null>(null);
    const [activeSection, setActiveSection] = useState<string>('');
    
    // State for image previews and drawer
    const [imagePreviews, setImagePreviews] = useState<{ [fieldName: string]: string }>({});
    const [isImageDrawerOpen, setIsImageDrawerOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
    const previousBlobUrls = useRef<{ [key: string]: string }>({});

    const { handleSubmit, control, formState: { isSubmitting }, reset } = useForm({ defaultValues: {} });

    // Effect for cleaning up blob URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            Object.values(imagePreviews).forEach(url => {
                if (url && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
            Object.values(previousBlobUrls.current).forEach(url => {
                if (url && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, []); 

    useEffect(() => {
        const urlsToRevoke = { ...previousBlobUrls.current };
        previousBlobUrls.current = {}; 
        Object.values(urlsToRevoke).forEach(url => {
            if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
    }, [imagePreviews]); 


    // --- Data fetching and initialization logic ---
    useEffect(() => {
        const initializeForm = async () => {
            if (!id || !formId) {
                toast.push(<Notification type="danger" title="Missing Information" children="Account or Form ID is missing from the URL." />);
                setIsLoading(false);
                return;
            }
            try {
                // Determine if form is already filled to decide which data to fetch
                const accountDoc = await dispatch(getAccountDocByIdAction(id)).unwrap();
                await Promise.all([
                    dispatch(getFillUpFormAction(formId)),
                    dispatch(getFilledFormAction(id))
                ]);
            } catch (err: any) {
                toast.push(<Notification type="danger" title="Error" children={err?.message} />);
            } finally {
                setIsLoading(false);
            }
        };
        initializeForm();
    }, [id, formId, dispatch]);


    // Effect to process data and populate the form AND previews
    useEffect(() => {
        if (isLoading || !formResponse) return;

        const uiStructure = transformApiDataToFormStructure(formResponse);
        if (uiStructure) {
            setFormStructure(uiStructure);
            
            if (uiStructure.sections.length > 0) {
                setActiveSection(uiStructure.sections[0].id);
            }
            
            const initialPreviews: { [fieldName: string]: string } = {};

            if (filledFormData) {
                const savedAnswers = filledFormData?.form_data;
                if (savedAnswers) {
                    const defaultValues = prepareDefaultValues(uiStructure, savedAnswers);
                    reset(defaultValues);

                    // Populate image previews from already saved data
                    uiStructure.sections.forEach(section => {
                        const sectionData = savedAnswers[section.id];
                        if (!sectionData) return;

                        section.fields.forEach(field => {
                            if (field.type === 'file') {
                                const questionKey = field.name.split('.').pop() as string;
                                const savedUrl = sectionData[questionKey];
                                if (savedUrl && typeof savedUrl === 'string') {
                                    initialPreviews[field.name] = savedUrl;
                                }
                            }
                        });
                    });
                }
            }
            setImagePreviews(initialPreviews);
        }
    }, [formResponse, filledFormData, isLoading, reset]);

    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const onFormSubmit = async (values: any) => {
        const getProcessedFormData = async (data: any, structure: FormStructure | null) => {
            if (!structure) return data;
    
            const processedData = JSON.parse(JSON.stringify(data));
    
            for (const section of structure.sections) {
                const sectionId = section.id;
    
                for (const field of section.fields) {
                    const questionKey = field.name.split('.').pop() as string;
    
                    if (field.type === 'multi_checkbox') {
                        const checkboxGroupData = processedData[sectionId]?.[questionKey];
                        if (checkboxGroupData && typeof checkboxGroupData === 'object') {
                            const selectedLabels = field.options
                                ?.filter(option => checkboxGroupData[sanitizeForName(option.label)])
                                .map(option => option.label);
                            if (processedData[sectionId]) {
                                processedData[sectionId][questionKey] = selectedLabels || [];
                            }
                        }
                    }
    
                    if (field.type === 'file') {
                        const fileOrUrl: File | string | null = data?.[sectionId]?.[questionKey];
                        if (fileOrUrl instanceof File) {
                            const base64 = await fileToBase64(fileOrUrl);
                            processedData[sectionId][questionKey] = base64;
                        } else {
                            processedData[sectionId][questionKey] = fileOrUrl;
                        }
                    }
                }
            }
            return processedData;
        };

        try {
            const processedValues = await getProcessedFormData(values, formStructure);
            const payload = {
                accountdoc_id: Number(id),
                form_id: Number(formId),
                form_data: processedValues,
            };

            await dispatch(submitFillUpFormAction(payload)).unwrap();
            toast.push(<Notification type="success" title="Form Submitted Successfully!" />);
            navigate('/account-document');

        } catch (err: any) {
            toast.push(
                <Notification type="danger" title="Submission Failed">
                    {err?.message || 'An unknown error occurred.'}
                </Notification>
            );
        }
    };
    
    // Handler to update image previews on file selection
    const handleFileChange = (fieldName: string, file: File | null) => {
        setImagePreviews(prev => {
            const newPreviews = { ...prev };
            const oldUrl = newPreviews[fieldName];

            if (oldUrl && oldUrl.startsWith('blob:')) {
                previousBlobUrls.current[fieldName] = oldUrl;
            }

            if (file) {
                newPreviews[fieldName] = URL.createObjectURL(file);
            } else {
                delete newPreviews[fieldName];
            }

            return newPreviews;
        });
    };

    // Handlers for the image viewer drawer
    const handleImageClick = (imageUrl: string, fieldName: string) => {
        setSelectedImage(imageUrl);
        setSelectedLabel(fieldName)
        setIsImageDrawerOpen(true);
    };
    const closeImageDrawer = () => {
        setIsImageDrawerOpen(false);
        setSelectedImage(null);
    };

    // Navigation Logic
    const sectionIds = formStructure?.sections.map(s => s.id) || [];
    const activeIndex = sectionIds.indexOf(activeSection);

    const handleNext = () => {
        if (activeIndex < sectionIds.length - 1) {
            setActiveSection(sectionIds[activeIndex + 1]);
        }
    };

    const handlePrevious = () => {
        if (activeIndex > 0) {
            setActiveSection(sectionIds[activeIndex - 1]);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-60">
                <Spinner size="40px" />
                <span className="ml-4">Initializing Form...</span>
            </div>
        );
    }

    if (error || !formStructure) {
      return <div className="p-8 text-center text-red-500">Failed to load form structure. Please try again.</div>;
    }
  
    const currentSectionData = formStructure.sections.find(s => s.id === activeSection);

    return (
        <>
            {/* Form Title */}
            <h3 className="mb-4">{formStructure.form_title}</h3>
            
            {/* Section Tabs (Full Width) */}
            <Card className="mb-6" bodyClass="px-4 py-2 md:px-6">
                <NavigatorComponent
                    sections={formStructure.sections}
                    activeSection={activeSection}
                    onNavigate={setActiveSection}
                />
            </Card>

            {/* Main Content Area: Document Previews and Form Fields */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* MODIFIED: Left Column for Image Previews (40% width on medium screens) */}
                <div className="w-full md:w-2/5 flex-shrink-0 pr-3">
                    <Card className="sticky top-20"> {/* Adjust sticky top if needed */}
                        <h5 className="mb-4">Documents</h5>
                        <div className="max-h-[70vh] overflow-y-auto pr-2">
                            <div className="space-y-4">
                            {Object.keys(imagePreviews).length > 0 ? (
                                Object.entries(imagePreviews).map(([fieldName, imageUrl]) => (
                                    <>
                                    <span>
                                        {fieldName
                                            .split('.')
                                            .pop()
                                            ?.replace(/_/g, ' ')
                                            .replace(/\b\w/g, c => c.toUpperCase())}
                                    </span>
                                    <div 
                                        key={fieldName}
                                        className="cursor-pointer border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-md overflow-hidden transition-colors" 
                                        onClick={() => handleImageClick(imageUrl, fieldName)}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={`Preview for ${fieldName}`}
                                            className="w-full h-auto object-cover"
                                        />
                                    </div>
                                    </>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                    No images to preview.
                                </p>
                            )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Main Form (will take remaining width) */}
                <div className="flex-grow">
                    <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
                        {currentSectionData && (
                            <Card id={currentSectionData.id}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 mt-2">
                                    {currentSectionData.fields.map(field => renderField(field, control, handleFileChange))}
                                </div>
                            </Card>
                        )}
                    </form>
                </div>
            </div>
      
            {/* Footer and Drawer */}
            <Card className="mt-auto sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center p-4">
                    <div>
                        <Button 
                            type="button" 
                            customColorClass={() => "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"}
                            onClick={() => navigate(-1)} 
                            disabled={isSubmitting}
                        >
                            Discard
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" onClick={handlePrevious} disabled={isSubmitting || activeIndex === 0}>
                            Previous
                        </Button>
                        <Button type="button" onClick={handleNext} disabled={isSubmitting || activeIndex === sectionIds.length - 1}>
                            Next
                        </Button>
                        <Button variant="solid" type="button" onClick={handleSubmit(onFormSubmit)} loading={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Submit'}
                        </Button>
                    </div>
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
                    {selectedImage && selectedLabel &&  (
                        <>
                        <span>
                            {selectedLabel
                                .split('.')
                                .pop()
                                ?.replace(/_/g, ' ')
                                .replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <img src={selectedImage} alt="Selected Document" className="w-full h-auto border border-indigo-200 rounded-md" />
                        </>
                    )}
                </div>
            </Drawer>
        </>
    )
}

export default FillUpForm;
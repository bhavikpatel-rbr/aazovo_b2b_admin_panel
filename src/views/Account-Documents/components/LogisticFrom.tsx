import classNames from 'classnames'
import { FC, useEffect, useRef, useState } from 'react'
import { Control, Controller, useForm } from 'react-hook-form'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
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
import { DatePicker, Spinner } from '@/components/ui'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { BiChevronRight, BiChevronLeft } from 'react-icons/bi'

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
        <FormItem label={field.label} className="md:col-span-2 lg:col-span-3">
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
    handleFileChange: (fieldName: string, file: File | null) => void
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
                <FormItem {...commonProps} className="col-span-2 md:col-span-1">
                    <Controller
                        name={field.name}
                        control={control}
                        render={({ field: { onChange, ...rest } }) => (
                            <Input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    onChange(file);
                                    handleFileChange(field.name, file);
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

    // State for image previews and full-screen viewer
    const [imagePreviews, setImagePreviews] = useState<{ [fieldName: string]: string }>({});
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const previousBlobUrls = useRef<{ [key: string]: string }>({});

    const { handleSubmit, control, formState: { isSubmitting }, reset } = useForm({ defaultValues: {} });

    // --- Side Effects ---
    useEffect(() => {
        // Cleanup for blob URLs
        const currentUrls = imagePreviews;
        const prevUrls = previousBlobUrls.current;
        return () => {
            Object.values(currentUrls).forEach(url => {
                if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
            });
            Object.values(prevUrls).forEach(url => {
                if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
            });
        };
    }, []);

    useEffect(() => {
        const urlsToRevoke = { ...previousBlobUrls.current };
        previousBlobUrls.current = {};
        Object.values(urlsToRevoke).forEach(url => {
            if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
        });
    }, [imagePreviews]);

    const previewEntries = Object.entries(imagePreviews);

    const handleNextPreview = () => {
        if (currentPreviewIndex < previewEntries.length - 1) {
            setCurrentPreviewIndex(currentPreviewIndex + 1);
        }
    };

    const handlePreviousPreview = () => {
        if (currentPreviewIndex > 0) {
            setCurrentPreviewIndex(currentPreviewIndex - 1);
        }
    };

    useEffect(() => {
        // Keyboard listener for full-screen viewer
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeFullScreen();
            if (event.key === 'ArrowRight') handleNextPreview();
            if (event.key === 'ArrowLeft') handlePreviousPreview();
        };
        if (isFullScreen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFullScreen, currentPreviewIndex, previewEntries.length]);

    // --- Data fetching and initialization ---
    useEffect(() => {
        const initializeForm = async () => {
            if (!id || !formId) {
                toast.push(<Notification type="danger" title="Missing Information" children="Account or Form ID is missing from the URL." />);
                setIsLoading(false);
                return;
            }
            try {
                await dispatch(getAccountDocByIdAction(id)).unwrap();
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

    // Effect to reset preview index when images change
    useEffect(() => {
        setCurrentPreviewIndex(0);
    }, [Object.keys(imagePreviews).length]);

    // --- Handlers ---
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
                for (const field of section.fields) {
                    const sectionId = section.id;
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
                            processedData[sectionId][questionKey] = await fileToBase64(fileOrUrl);
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

    const sectionIds = formStructure?.sections.map(s => s.id) || [];
    const activeIndex = sectionIds.indexOf(activeSection);

    const handleNextSection = () => {
        if (activeIndex < sectionIds.length - 1) setActiveSection(sectionIds[activeIndex + 1]);
    };

    const handlePreviousSection = () => {
        if (activeIndex > 0) setActiveSection(sectionIds[activeIndex - 1]);
    };

    const openFullScreen = () => {
        if (previewEntries.length > 0) {
            setIsFullScreen(true);
        }
    };

    const closeFullScreen = () => {
        setIsFullScreen(false);
    };

    // --- Render Logic ---
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
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





        <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900/50">
            {/* Header Area */}
            <header className="flex-shrink-0 p-6 pb-0">
                <div className="flex gap-1 items-end mb-3">
                    <NavLink to="/account-document">
                        <h6 className="font-semibold hover:text-primary-600">Account Documents</h6>
                    </NavLink>
                    <BiChevronRight size={22} />
                    <h6 className="font-semibold text-primary-600 dark:text-primary-300">
                        {formStructure.form_title}
                    </h6>
                </div>

                <Card bodyClass="px-4 py-2 md:px-6">
                    <NavigatorComponent
                        sections={formStructure.sections}
                        activeSection={activeSection}
                        onNavigate={setActiveSection}
                    />
                </Card>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex flex-col md:flex-row gap-6 p-6 overflow-hidden">
                {/* Left Column: Document Preview */}
                <div className="w-full md:w-2/5 flex">
                    <Card className="w-full" bodyClass="h-full flex flex-col">
                        <div className="flex justify-between items-center flex-shrink-0">
                            <h5 className="mb-0">Documents</h5>
                            {previewEntries.length > 0 && (
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {currentPreviewIndex + 1} / {previewEntries.length}
                                </span>
                            )}
                        </div>

                        <div className="flex-grow flex flex-col justify-center items-center min-h-0">
                            {previewEntries.length > 0 ? (
                                <div className="w-full h-full flex flex-col">
                                    <div
                                        className="flex-grow relative w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex justify-center items-center overflow-hidden cursor-pointer"
                                        onClick={openFullScreen}
                                    >
                                        {/* This wrapper constrains the image's maximum size */}
                                        <div className="relative w-full h-full max-h-[500px]">
                                            <img
                                                src={previewEntries[currentPreviewIndex][1]}
                                                alt={`Preview for ${previewEntries[currentPreviewIndex][0]}`}
                                                className="absolute top-0 left-0 w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-center font-semibold text-gray-700 dark:text-gray-200 truncate" title={previewEntries[currentPreviewIndex][0]}>
                                            {previewEntries[currentPreviewIndex][0].split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex justify-center items-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No documents to preview.</p>
                                </div>
                            )}
                        </div>

                        {previewEntries.length > 0 && (
                            <div className="flex-shrink-0 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex gap-3 overflow-x-auto pb-1">
                                    {previewEntries.map(([fieldName, imageUrl], index) => (
                                        <button
                                            key={fieldName}
                                            type="button"
                                            className={classNames('w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500', {
                                                'border-indigo-500': currentPreviewIndex === index,
                                                'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500': currentPreviewIndex !== index
                                            })}
                                            onClick={() => setCurrentPreviewIndex(index)}
                                        >
                                            <img src={imageUrl} alt={`Thumbnail for ${fieldName}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column: Form Fields */}
                <div className="w-full md:w-3/5 flex">
                    <Card className="w-full" bodyClass="h-full flex flex-col">
                        <form onSubmit={handleSubmit(onFormSubmit)} className="h-full flex flex-col">
                            {currentSectionData && (
                                <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                                    <div id={currentSectionData.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4">
                                        {currentSectionData.fields.map(field => renderField(field, control, handleFileChange))}
                                    </div>
                                </div>
                            )}
                        </form>
                    </Card>
                </div>
            </main>

            {/* Footer */}
            <footer className="flex-shrink-0 p-6 pt-0">
                <Card>
                    <div className="flex justify-between items-center">
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
                            <Button type="button" onClick={handlePreviousSection} disabled={isSubmitting || activeIndex === 0}>Previous</Button>
                            <Button type="button" onClick={handleNextSection} disabled={isSubmitting || activeIndex === sectionIds.length - 1}>Next</Button>
                            <Button variant="solid" type="button" onClick={handleSubmit(onFormSubmit)} loading={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Submit'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </footer>

            {/* Full-Screen Image Viewer with Navigation */}
            {isFullScreen && previewEntries.length > 0 && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={closeFullScreen}
                >
                    {/* Close Button */}
                    <button
                        className="absolute top-4 right-6 text-white text-5xl font-light hover:text-gray-300 transition-colors z-50"
                        onClick={closeFullScreen}
                        aria-label="Close full-screen view"
                    >
                        ×
                    </button>

                    {/* Previous Button */}
                    {previewEntries.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handlePreviousPreview(); }}
                            disabled={currentPreviewIndex === 0}
                            className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 disabled:opacity-0 disabled:cursor-not-allowed rounded-full p-2 transition-all z-50"
                            aria-label="Previous image"
                        >
                            <BiChevronLeft className="text-white h-8 w-8" />
                        </button>
                    )}

                    {/* Image */}

                    <div
                        className="relative max-w-full max-h-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img src={previewEntries[currentPreviewIndex][1]} alt="Full-screen preview" className="object-contain" style={{
                            maxHeight: '90vh',
                            maxWidth: 'min(90vw, 1400px)'
                        }} />
                        <div className="absolute bottom-5 text-center bg-black/50 text-white py-1.5 px-4 rounded-md text-sm">
                            <strong>{previewEntries[currentPreviewIndex][0].split('.').pop()?.replace(/_/g, ' ')}</strong>
                            ({currentPreviewIndex + 1} / {previewEntries.length})
                        </div>
                    </div>

                    {/* Next Button */}
                    {previewEntries.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleNextPreview(); }}
                            disabled={currentPreviewIndex >= previewEntries.length - 1}
                            className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 disabled:opacity-0 disabled:cursor-not-allowed rounded-full p-2 transition-all z-50"
                            aria-label="Next image"
                        >
                            <BiChevronRight className="text-white h-8 w-8" />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default FillUpForm;



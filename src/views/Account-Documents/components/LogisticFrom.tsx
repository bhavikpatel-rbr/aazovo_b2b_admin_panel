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

// --- Type Definitions ---
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

// --- Helper & Transformer Functions ---
const sanitizeForName = (str: string): string => str.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/_$/, '');

const transformApiDataToFormStructure = (apiData: any): FormStructure | null => {
    if (!apiData || !apiData.section) return null;
    const transformedSections: FormSection[] = apiData.section.map((apiSection: any, sectionIndex: number) => {
        const sectionId = sanitizeForName(apiSection.title || `section_${sectionIndex}`);
        const transformedFields: FormField[] = apiSection.questions.flatMap((question: any) => {
            const baseFieldName = sanitizeForName(question.question);
            if (question.question_type === 'checkbox' && question.question_label) {
                const labels = question.question_label.split(',');
                return [{ name: `${sectionId}.${baseFieldName}`, label: question.question, type: 'multi_checkbox', required: question.required, options: labels.map((label: string) => ({ label: label.trim(), name: `${sectionId}.${baseFieldName}.${sanitizeForName(label)}` })) }] as FormField;
            }
            return [{ name: `${sectionId}.${baseFieldName}`, label: question.question, type: question.question_type, required: question.required }] as FormField;
        });
        return { id: sectionId, label: apiSection.title, fields: transformedFields };
    });
    return { form_title: apiData.form_name || 'Dynamic Form', sections: transformedSections };
};

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
                    field.options?.forEach(option => { checkboxGroup[sanitizeForName(option.label)] = savedValue.includes(option.label); });
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

// --- Reusable Field & Navigator Components ---
const MultiCheckboxField: FC<{ control: Control<any>, field: FormField }> = ({ control, field }) => (
    <FormItem label={field.label} className="sm:col-span-2">
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2`}>
            {field.options?.map(option => (
                <div key={option.name} className="flex items-center gap-2">
                    <Controller name={option.name} control={control} render={({ field: controllerField }) => <Checkbox {...controllerField} checked={!!controllerField.value} />} />
                    <label className="font-semibold text-gray-700 dark:text-gray-300">{option.label}</label>
                </div>
            ))}
        </div>
    </FormItem>
);

const renderField = (field: FormField, control: Control<any>, handleFileChange: (fieldName: string, file: File | null) => void) => {
    const commonProps = { key: field.name, label: field.label, invalid: false };
    switch (field.type) {
        case 'multi_checkbox': return <MultiCheckboxField key={field.name} control={control} field={field} />;
        case 'checkbox': return (<FormItem {...commonProps}><Controller name={field.name} control={control} render={({ field: controllerField }) => <Checkbox {...controllerField} checked={!!controllerField.value}>{field.label}</Checkbox>} /></FormItem>);
        case 'file': return (<FormItem {...commonProps}><Controller name={field.name} control={control} render={({ field: { onChange } }) => <Input type="file" onChange={(e) => { const file = e.target.files?.[0] || null; onChange(file); handleFileChange(field.name, file); }} />} /></FormItem>);
        case 'textarea': return (<FormItem {...commonProps} className="sm:col-span-2"><Controller name={field.name} control={control} render={({ field: controllerField }) => <Input textArea placeholder={`Enter ${field.label}...`} {...controllerField} />} /></FormItem>);
        case 'date': return (<FormItem {...commonProps}><Controller name={field.name} control={control} render={({ field: controllerField }) => <DatePicker {...controllerField} />} /></FormItem>);
        case 'text': default: return (<FormItem {...commonProps}><Controller name={field.name} control={control} render={({ field: controllerField }) => <Input {...controllerField} placeholder={`Enter ${field.label}`} />} /></FormItem>);
    }
}

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

    const { formResponse = null, filledFormData = null, error } = useSelector(masterSelector);
    
    const [isLoading, setIsLoading] = useState(true);
    const [formStructure, setFormStructure] = useState<FormStructure | null>(null);
    const [activeSection, setActiveSection] = useState<string>('');
    const [imagePreviews, setImagePreviews] = useState<{ [fieldName: string]: string }>({});
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const formContainerRef = useRef<HTMLDivElement | null>(null);
    const previousBlobUrls = useRef<{ [key: string]: string }>({});

    const { handleSubmit, control, formState: { isSubmitting }, reset } = useForm({ defaultValues: {} });

    // --- Side Effects ---
    useEffect(() => {
        // Cleanup for blob URLs to prevent memory leaks
        const currentUrls = imagePreviews;
        const prevUrls = previousBlobUrls.current;
        return () => {
            Object.values(currentUrls).forEach(url => { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url); });
            Object.values(prevUrls).forEach(url => { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url); });
        };
    }, []);

    useEffect(() => {
        const urlsToRevoke = { ...previousBlobUrls.current };
        previousBlobUrls.current = {};
        Object.values(urlsToRevoke).forEach(url => { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url); });
    }, [imagePreviews]);

    // --- Data fetching and initialization ---
    useEffect(() => {
        const initializeForm = async () => {
            if (!id || !formId) return;
            try {
                await dispatch(getAccountDocByIdAction(id)).unwrap();
                await Promise.all([dispatch(getFillUpFormAction(formId)), dispatch(getFilledFormAction(id))]);
            } catch (err: any) {
                toast.push(<Notification type="danger" title="Error" children={err?.message} />);
            } finally {
                setIsLoading(false);
            }
        };
        initializeForm();
    }, [id, formId, dispatch]);

    useEffect(() => {
        if (isLoading || !formResponse) return;
        const uiStructure = transformApiDataToFormStructure(formResponse);
        if (uiStructure) {
            setFormStructure(uiStructure);
            if (uiStructure.sections.length > 0) {
                setActiveSection(uiStructure.sections[0].id);
            }
            if (filledFormData?.form_data) {
                const defaultValues = prepareDefaultValues(uiStructure, filledFormData.form_data);
                reset(defaultValues);
                const initialPreviews: { [fieldName: string]: string } = {};
                uiStructure.sections.forEach(section => {
                    const sectionData = filledFormData.form_data[section.id];
                    if (!sectionData) return;
                    section.fields.forEach(field => {
                        if (field.type === 'file') {
                            const savedUrl = sectionData[field.name.split('.').pop() as string];
                            if (savedUrl && typeof savedUrl === 'string') {
                                initialPreviews[field.name] = savedUrl;
                            }
                        }
                    });
                });
                setImagePreviews(initialPreviews);
            }
        }
    }, [formResponse, filledFormData, isLoading, reset]);


    // --- Intersection Observer for active section highlighting ---
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { 
                root: formContainerRef.current,
                rootMargin: '0px 0px -50% 0px',
                threshold: 0.1 
            }
        );

        const currentRefs = sectionRefs.current;
        Object.values(currentRefs).forEach((ref) => { if (ref) observer.observe(ref); });
        return () => { Object.values(currentRefs).forEach((ref) => { if (ref) observer.unobserve(ref); }); };
    }, [formStructure]);


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
    
    const handleSectionNavigation = (sectionId: string) => {
        sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const previewEntries = Object.entries(imagePreviews);
    const openFullScreen = () => previewEntries.length > 0 && setIsFullScreen(true);
    const closeFullScreen = () => setIsFullScreen(false);
    const handleNextPreview = () => setCurrentPreviewIndex(i => Math.min(i + 1, previewEntries.length - 1));
    const handlePreviousPreview = () => setCurrentPreviewIndex(i => Math.max(i - 1, 0));

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeFullScreen();
            if (event.key === 'ArrowRight') handleNextPreview();
            if (event.key === 'ArrowLeft') handlePreviousPreview();
        };
        if (isFullScreen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isFullScreen, currentPreviewIndex, previewEntries.length]);


    // --- Render Logic ---
    if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner size="40px" /><span className="ml-4">Initializing Form...</span></div>;
    if (error || !formStructure) return <div className="p-8 text-center text-red-500">Failed to load form structure. Please try again.</div>;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-800">
            {/* Header Area */}
            <header className="flex-shrink-0 p-1 pb-0">
                <div className="flex gap-1 items-end mb-3">
                    <NavLink to="/account-document"><h6 className="font-semibold hover:text-primary-600">Account Documents</h6></NavLink>
                    <BiChevronRight size={22} />
                    <h6 className="font-semibold text-primary-600 dark:text-primary-300">{formStructure.form_title}</h6>
                </div>
                <Card bodyClass="px-4 py-2 md:px-6">
                    <NavigatorComponent sections={formStructure.sections} activeSection={activeSection} onNavigate={handleSectionNavigation} />
                </Card>
            </header>

            {/* Main Content Grid */}
            <main className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-6 p-1 overflow-hidden">
                {/* Left Column: STICKY Document Viewer */}
                <div className="lg:col-span-3 lg:sticky lg:top-6 h-[75vh]">
                     <Card className="w-full h-full" bodyClass="h-full p-0 relative group overflow-hidden">
                        {previewEntries.length > 0 ? (
                            <>
                                <img src={previewEntries[currentPreviewIndex][1]} alt={`Preview for ${previewEntries[currentPreviewIndex][0]}`} className="w-full h-full object-contain cursor-pointer" onClick={openFullScreen} />
                                <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                                    <h5 className="mb-0 text-white">Documents ({currentPreviewIndex + 1}/{previewEntries.length})</h5>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 z-10 p-3 bg-black/70 backdrop-blur-sm">
                                    <div className="flex gap-3 overflow-x-auto pb-1">
                                        {previewEntries.map(([fieldName, imageUrl], index) => (
                                            <button key={fieldName} type="button" className={classNames('w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500', { 'border-indigo-400': currentPreviewIndex === index, 'border-transparent hover:border-indigo-400': currentPreviewIndex !== index })} onClick={() => setCurrentPreviewIndex(index)} >
                                                <img src={imageUrl} alt={`Thumbnail for ${fieldName}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex justify-center items-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                                <p className="text-sm text-gray-500 dark:text-gray-400">No documents to preview.</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Column: SCROLLING Form */}
                <div className="lg:col-span-2">
                    <Card className="w-full">
                        <form onSubmit={handleSubmit(onFormSubmit)}>
                             <h4 className="text-xl font-bold mb-4">{formStructure.form_title}</h4>
                             <div ref={formContainerRef} className="space-y-10 max-h-[calc(75vh-80px)] overflow-y-auto pr-4 -mr-4">
                                {formStructure.sections.map(section => (
                                    <div
                                        key={section.id}
                                        id={section.id}
                                        ref={(el) => (sectionRefs.current[section.id] = el)}
                                    >
                                        <div className="mb-6 pb-2 border-b border-gray-200 dark:border-gray-600">
                                            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{section.label}</h5>
                                            <p className="text-sm text-gray-500">Please fill out all the fields in this section.</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                                            {section.fields.map(field => renderField(field, control, handleFileChange))}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </form>
                    </Card>
                </div>
            </main>

            {/* Simplified Footer */}
            <footer className="flex-shrink-0 p-6 pt-0 sticky bottom-0 z-10">
                <Card>
                    <div className="flex justify-between items-center">
                        <Button type="button" onClick={() => navigate(-1)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button variant="solid" type="button" onClick={handleSubmit(onFormSubmit)} loading={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Submit Form'}
                        </Button>
                    </div>
                </Card>
            </footer>

            {/* Full-Screen Image Viewer with Navigation */}
            {isFullScreen && previewEntries.length > 0 && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={closeFullScreen}
                >
                    <button className="absolute top-4 right-6 text-white text-5xl font-light hover:text-gray-300 transition-colors z-50" onClick={closeFullScreen} aria-label="Close full-screen view">
                        ×
                    </button>
                    {previewEntries.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); handlePreviousPreview(); }} disabled={currentPreviewIndex === 0} className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 disabled:opacity-20 disabled:cursor-not-allowed rounded-full p-2 transition-all z-50" aria-label="Previous image">
                            <BiChevronLeft className="text-white h-8 w-8" />
                        </button>
                    )}
                    <div className="relative max-w-full max-h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <img src={previewEntries[currentPreviewIndex][1]} alt="Full-screen preview" className="block object-contain" style={{ maxHeight: 'calc(90vh - 4rem)', maxWidth: '90vw' }} />
                        <div className="mt-4 text-center bg-black/50 text-white py-1.5 px-4 rounded-md text-sm">
                            <strong>{previewEntries[currentPreviewIndex][0].split('.').pop()?.replace(/_/g, ' ')}</strong>
                            {' '}({currentPreviewIndex + 1} / {previewEntries.length})
                        </div>
                    </div>
                    {previewEntries.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); handleNextPreview(); }} disabled={currentPreviewIndex >= previewEntries.length - 1} className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 disabled:opacity-20 disabled:cursor-not-allowed rounded-full p-2 transition-all z-50" aria-label="Next image">
                            <BiChevronRight className="text-white h-8 w-8" />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default FillUpForm;
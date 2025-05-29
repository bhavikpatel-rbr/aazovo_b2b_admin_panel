import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm, Controller, useFieldArray, Control } from 'react-hook-form';
// Remove zodResolver and z from here if not using for the main page form
// Zod could be used for individual field validation if desired, but the overall structure is complex
import { useNavigate, useParams, NavLink } from 'react-router-dom';
import cloneDeep from 'lodash/cloneDeep';
import classNames from 'classnames';

// UI Components ( reusing from FormBuilder.tsx)
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import Button from '@/components/ui/Button';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import StickyFooter from '@/components/shared/StickyFooter';
import Select from '@/components/ui/Select';
import { Drawer, Form, FormItem, Input, Card, Switcher, Tooltip } from '@/components/ui';

// Icons
import {
    TbPencil, TbPlus, TbTrash, TbLoader, TbLayoutList, BiChevronRight, TbX
} from 'react-icons/tb'; // Assuming BiChevronRight is available or use similar

// Constants from FormBuilder.tsx (ensure paths are correct or redefine/import)
const FORM_STATUS_OPTIONS = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "archived", label: "Archived" },
];
const DEPARTMENT_OPTIONS = [ /* ...from FormBuilder.tsx... */ ];
const CATEGORY_OPTIONS = [ /* ...from FormBuilder.tsx... */ ];
const QUESTION_TYPE_OPTIONS = [ /* ...from FormBuilder.tsx... */ ];

// Types defined above: FormPageQuestionOption, FormPageQuestion, FormPageSection, FormBuilderPageFormData, BackendFormItem
// (Paste the type definitions here from the thought block if not in a shared file)
// For brevity in the final code, I'll assume they are defined above or imported.

// --- Helper: Generate unique IDs for field arrays ---
const generateId = (prefix = 'id_') => `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// --- Data Transformation Utilities ---

// Parses "YES,NO" or similar string into FormPageQuestionOption[]
const parseQuestionOptionString = (optionString: string | null): FormPageQuestionOption[] => {
    if (!optionString || typeof optionString !== 'string') return [];
    return optionString.split(',').map(opt => ({
        id: generateId('opt_'),
        value: opt.trim(),
        label: opt.trim(),
    }));
};

// Serializes FormPageQuestionOption[] to "value1,value2" string
const serializeQuestionOptionsArray = (options: FormPageQuestionOption[]): string | null => {
    if (!options || options.length === 0) return null;
    return options.map(opt => opt.value).join(',');
};

// Parses the backend 'section' JSON string
const parseBackendSections = (sectionJsonString: string): FormPageSection[] => {
    if (!sectionJsonString) return [];
    try {
        // Attempt to fix single quotes and make it valid JSON
        const validJsonString = sectionJsonString
            .replace(/\\?"'{/g, '{') // Fix opening single quotes for objects
            .replace(/}'\\?"/g, '}') // Fix closing single quotes for objects
            .replace(/\\?"':\\?"/g, '":"') // Fix single quotes around keys/values
            .replace(/\\?",\\?"/g, '","') // Fix single quotes in commas
            .replace(/\\?"'\[/g, '[')
            .replace(/\]'\\?"/g, ']')
            .replace(/null'\\?"/g, 'null') // handle null
            .replace(/:(\w+)}/g, ':"$1"}') // ensure values in objects are quoted if not
            .replace(/:(\w+),/g, ':"$1",')
            // A more robust solution might involve a dedicated parser if regex becomes too complex
            // For the given example:
            // "[{\"'title'\":\"DEBIT NOTE\",\"'questions'\":{\"0\":...}}]"
            // First, replace all ' with " ONLY if they are part of the structure, not data
            // This is very tricky with regex. A simpler approach IF the outer structure is always [{...}, {...}]
            // and inner keys/values are problematic:
            let somewhatCleanedString = sectionJsonString;
            try {
                 // This is a common pattern for Python dicts stringified.
                 somewhatCleanedString = sectionJsonString.replace(/'/g, '"');
            } catch (e) { /* ignore, try direct parse */ }


        const backendSections = JSON.parse(somewhatCleanedString);

        return backendSections.map((bs: any) => {
            const questionsObject = bs.questions || bs["'questions'"]; // Handle both key formats
            const frontendQuestions: FormPageQuestion[] = [];
            if (typeof questionsObject === 'object' && questionsObject !== null) {
                Object.values(questionsObject).forEach((bq: any) => {
                    frontendQuestions.push({
                        id: generateId('q_'),
                        questionText: bq.question || bq["'question'"],
                        questionType: bq.question_type || bq["'question_type'"],
                        options: parseQuestionOptionString(bq.question_option || bq["'question_option'"]),
                        isRequired: bq.is_required || false, // Assuming is_required field
                    });
                });
            }

            return {
                id: generateId('s_'),
                sectionTitle: bs.title || bs["'title'"],
                sectionDescription: bs.description || bs["'description'"] || '',
                questions: frontendQuestions,
            };
        });
    } catch (error) {
        console.error("Error parsing backend sections:", error, "Original string:", sectionJsonString);
        toast.push(<Notification title="Error" type="danger">Could not parse form structure from backend.</Notification>);
        return [{ // Return a default structure on error to prevent crashes
            id: generateId('s_'),
            sectionTitle: 'Default Section (Parsing Error)',
            questions: [{
                id: generateId('q_'),
                questionText: '',
                questionType: QUESTION_TYPE_OPTIONS[0].value,
                options: [],
                isRequired: false
            }]
        }];
    }
};

// Serializes frontend sections array to backend JSON string
const serializeSectionsToBackend = (sections: FormPageSection[]): string => {
    const backendSections = sections.map(fs => {
        const backendQuestions: { [key: string]: any } = {};
        fs.questions.forEach((fq, index) => {
            backendQuestions[String(index)] = { // Using numeric string keys as in backend example
                "'question'": fq.questionText,
                "'question_type'": fq.questionType,
                "'question_option'": serializeQuestionOptionsArray(fq.options),
                "'is_required'": fq.isRequired, // Assuming
            };
        });
        return {
            "'title'": fs.sectionTitle,
            "'description'": fs.sectionDescription || '',
            "'questions'": backendQuestions,
        };
    });
    return JSON.stringify(backendSections);
};


// --- Question Options Component ---
type QuestionOptionsEditorProps = {
    control: Control<FormBuilderPageFormData>;
    sectionIndex: number;
    questionIndex: number;
};
const QuestionOptionsEditor: React.FC<QuestionOptionsEditorProps> = ({ control, sectionIndex, questionIndex }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `sections.${sectionIndex}.questions.${questionIndex}.options`
    });

    return (
        <div className="pl-4 mt-2 space-y-2 border-l-2 border-gray-200 dark:border-gray-600">
            {fields.map((optionField, optionIndex) => (
                <Card key={optionField.id} bodyClass="p-2 bg-gray-50 dark:bg-gray-700/60">
                    <div className="flex items-center gap-2">
                        <Controller
                            name={`sections.${sectionIndex}.questions.${questionIndex}.options.${optionIndex}.label`}
                            control={control}
                            defaultValue={optionField.label}
                            render={({ field }) => <Input {...field} size="sm" placeholder="Option Label" className="flex-grow" />}
                        />
                        <Controller
                            name={`sections.${sectionIndex}.questions.${questionIndex}.options.${optionIndex}.value`}
                            control={control}
                            defaultValue={optionField.value}
                            render={({ field }) => <Input {...field} size="sm" placeholder="Option Value" className="flex-grow" />}
                        />
                        <Tooltip title="Remove Option">
                            <Button shape="circle" size="sm" icon={<TbX />} onClick={() => remove(optionIndex)} variant="twoTone" color="red-600" />
                        </Tooltip>
                    </div>
                </Card>
            ))}
            <Button
                type="button"
                variant="dashed"
                size="sm"
                icon={<TbPlus />}
                onClick={() => append({ id: generateId('opt_'), label: '', value: '' })}
            >
                Add Option
            </Button>
        </div>
    );
};


// --- Question Component ---
type QuestionItemProps = {
    sectionIndex: number;
    questionIndex: number;
    control: Control<FormBuilderPageFormData>;
    removeQuestion: (questionIndex: number) => void;
    watch: any; // RHF's watch function
};
const QuestionItem: React.FC<QuestionItemProps> = ({ sectionIndex, questionIndex, control, removeQuestion, watch }) => {
    const questionPath = `sections.${sectionIndex}.questions.${questionIndex}` as const;
    const currentQuestionType = watch(`${questionPath}.questionType`);
    const showOptionsEditor = ['checkbox', 'radio', 'select'].includes(currentQuestionType);

    return (
        <Card className="mt-3 bg-gray-100 dark:bg-gray-700/30" bodyClass="p-4">
            <div className="flex justify-between items-start mb-2">
                <h6 className="font-semibold">Question {questionIndex + 1}</h6>
                <Tooltip title="Remove Question">
                    <Button shape="circle" size="sm" icon={<TbTrash />} onClick={() => removeQuestion(questionIndex)} variant="twoTone" color="red-600" />
                </Tooltip>
            </div>

            <FormItem
                label="Question Text"
                // Add error handling if needed: invalid={!!errors.sections?.[sectionIndex]?.questions?.[questionIndex]?.questionText}
            >
                <Controller
                    name={`${questionPath}.questionText`}
                    control={control}
                    rules={{ required: "Question text is required" }}
                    render={({ field }) => <Input {...field} textArea rows={2} placeholder="Enter your question" />}
                />
            </FormItem>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <FormItem label="Question Type">
                    <Controller
                        name={`${questionPath}.questionType`}
                        control={control}
                        rules={{ required: "Question type is required" }}
                        render={({ field }) => (
                            <Select
                                placeholder="Select type"
                                options={QUESTION_TYPE_OPTIONS}
                                value={QUESTION_TYPE_OPTIONS.find(o => o.value === field.value)}
                                onChange={(opt) => field.onChange(opt?.value)}
                            />
                        )}
                    />
                </FormItem>
                <FormItem label="Required Field" className="flex items-center mt-auto mb-[9px]">
                     <Controller
                        name={`${questionPath}.isRequired`}
                        control={control}
                        render={({ field }) => (
                            <Switcher checked={field.value} onChange={field.onChange} />
                        )}
                    />
                </FormItem>
            </div>

            {showOptionsEditor && (
                <div className="mt-3">
                    <h6 className="text-sm font-medium mb-1">Options:</h6>
                    <QuestionOptionsEditor control={control} sectionIndex={sectionIndex} questionIndex={questionIndex} />
                </div>
            )}
        </Card>
    );
};

// --- Section Component ---
type SectionItemProps = {
    sectionIndex: number;
    control: Control<FormBuilderPageFormData>;
    removeSection: (sectionIndex: number) => void;
    watch: any; // RHF's watch function
};
const SectionItem: React.FC<SectionItemProps> = ({ sectionIndex, control, removeSection, watch }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `sections.${sectionIndex}.questions`
    });

    const addQuestionToSection = () => {
        append({
            id: generateId('q_'),
            questionText: '',
            questionType: QUESTION_TYPE_OPTIONS[0].value, // Default to first type
            options: [],
            isRequired: false,
        });
    };

    return (
        <Card className="mb-6 border border-gray-300 dark:border-gray-600" bodyClass="p-5">
            <div className="flex justify-between items-center mb-3">
                <h5 className="text-lg font-semibold">Section {sectionIndex + 1}</h5>
                <Tooltip title="Remove Section">
                    <Button shape="circle" icon={<TbTrash />} onClick={() => removeSection(sectionIndex)} variant="twoTone" color="red-600" />
                </Tooltip>
            </div>

            <FormItem label="Section Title">
                <Controller
                    name={`sections.${sectionIndex}.sectionTitle`}
                    control={control}
                    rules={{ required: "Section title is required" }}
                    render={({ field }) => <Input {...field} placeholder="Enter section title" />}
                />
            </FormItem>
            <FormItem label="Section Description (Optional)" className="mt-3">
                <Controller
                    name={`sections.${sectionIndex}.sectionDescription`}
                    control={control}
                    render={({ field }) => <Input {...field} textArea rows={2} placeholder="Enter section description" />}
                />
            </FormItem>

            <div className="mt-4">
                {fields.map((questionField, qIndex) => (
                    <QuestionItem
                        key={questionField.id}
                        sectionIndex={sectionIndex}
                        questionIndex={qIndex}
                        control={control}
                        removeQuestion={() => remove(qIndex)}
                        watch={watch}
                    />
                ))}
            </div>

            <Button
                type="button"
                variant="outline"
                icon={<TbPlus />}
                onClick={addQuestionToSection}
                className="mt-4"
            >
                Add Question to Section
            </Button>
        </Card>
    );
};


// --- Main Form Page Component ---
const FormBuilderFormPage = () => {
    const navigate = useNavigate();
    const { formId } = useParams<{ formId?: string }>();
    const isEditMode = !!formId;

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Simulated backend data store
    const [simulatedDb, setSimulatedDb] = useState<BackendFormItem[]>([
        {
            id: 6,
            form_name: "CRM DNW STOCK 1.0.1",
            section: "[{\"'title'\":\"DEBIT NOTE\",\"'questions'\":{\"0\":{\"'question'\":\"COMPANY NAME\",\"'question_type'\":\"radio\",\"'question_option'\":\"YES,NO\"},\"1\":{\"'question'\":\"VOUCHER NUMBER\",\"'question_type'\":\"text\",\"'question_option'\":\"YES,NO\"},\"2\":{\"'question'\":\"VOUCHER DATE\",\"'question_type'\":\"radio\",\"'question_option'\":\"YES,NO\"},\"4\":{\"'question'\":\"DOCUMENT NUMBER\",\"'question_type'\":\"text\",\"'question_option'\":\"YES,NO\"},\"3\":{\"'question'\":\"DOCUMENT DATE\",\"'question_type'\":\"radio\",\"'question_option'\":\"YES,NO\"},\"5\":{\"'question'\":\"ORIGINAL INVOICE NO.\",\"'question_type'\":\"text\",\"'question_option'\":\"YES,NO\"},\"6\":{\"'question'\":\"ORIGINAL INVOICE DATE\",\"'question_type'\":\"radio\",\"'question_option'\":\"YES,NO\"},\"7\":{\"'question'\":\"PRODUCT NAME\",\"'question_type'\":\"radio\",\"'question_option'\":\"YES,NO\"},\"8\":{\"'question'\":\"DAMAGE QUANTITY\",\"'question_type'\":\"radio\",\"'question_option'\":\"YES,NO\"},\"9\":{\"'question'\":\"PRICE\",\"'question_type'\":\"radio\",\"'question_option'\":\"YES,NO\"},\"10\":{\"'question'\":\"CN WITH STAMP AND SIGN\",\"'question_type'\":\"file\",\"'question_option'\":null},\"11\":{\"'question'\":\"NO\",\"'question_type'\":\"text\",\"'question_option'\":null},\"12\":{\"'question'\":\"REMARK\",\"'question_type'\":\"text\",\"'question_option'\":null}}},{\"'title'\":\"RETURN\",\"'questions'\":[{\"'question'\":\"STOCK RETURN\",\"'question_type'\":\"radio\",\"'question_option'\":\"YES,NO\"}]}]",
            status: "Disabled", // Maps to 'archived' or 'draft'
            department_ids: "eng,hr", // Assuming slugs "eng,hr" for example, actual "4,5" needs mapping for labels
            category_ids: "survey",  // Assuming slug "survey", actual "1" needs mapping for labels
        }
    ]);


    const defaultSection: FormPageSection = {
        id: generateId('s_'),
        sectionTitle: 'Section 1',
        sectionDescription: '',
        questions: [{
            id: generateId('q_'),
            questionText: '',
            questionType: QUESTION_TYPE_OPTIONS[0].value,
            options: [],
            isRequired: false,
        }]
    };

    const rhfMethods = useForm<FormBuilderPageFormData>({
        defaultValues: {
            formName: '',
            status: FORM_STATUS_OPTIONS[0].value, // Default to 'draft'
            departmentValues: [],
            categoryValues: [],
            sections: [defaultSection],
        }
    });
    const { control, handleSubmit, reset, watch, formState: { errors, isDirty } } = rhfMethods;

    const { fields: sectionFields, append: appendSection, remove: removeSection, replace: replaceSections } = useFieldArray({
        control,
        name: "sections"
    });

    // --- Fetch data for Edit Mode ---
    useEffect(() => {
        if (isEditMode && formId) {
            setIsLoading(true);
            // Simulate API call
            setTimeout(() => {
                const numericFormId = parseInt(formId, 10);
                const formDataFromDb = simulatedDb.find(f => f.id === numericFormId);

                if (formDataFromDb) {
                    // Map backend status to frontend status
                    let frontendStatus = FORM_STATUS_OPTIONS[0].value; // Default to draft
                    if (formDataFromDb.status === "Active") frontendStatus = "published";
                    else if (formDataFromDb.status === "Disabled") frontendStatus = "archived";

                    reset({
                        id: formDataFromDb.id,
                        formName: formDataFromDb.form_name,
                        status: frontendStatus,
                        // Assuming department_ids and category_ids are comma-separated slugs for now
                        departmentValues: formDataFromDb.department_ids ? formDataFromDb.department_ids.split(',') : [],
                        categoryValues: formDataFromDb.category_ids ? formDataFromDb.category_ids.split(',') : [],
                        sections: parseBackendSections(formDataFromDb.section),
                    });
                } else {
                    toast.push(<Notification title="Error" type="danger">Form not found.</Notification>);
                    navigate('/system-tools/form-builder'); // Adjust to your listing page route
                }
                setIsLoading(false);
            }, 1000);
        }
    }, [isEditMode, formId, reset, navigate, simulatedDb]);


    const onFormSubmit = async (data: FormBuilderPageFormData) => {
        setIsSubmitting(true);
        console.log("Submitting Frontend Data:", data);

        // Map frontend status to backend status
        let backendStatus = "Disabled"; // Default
        if (data.status === "published") backendStatus = "Active";
        else if (data.status === "draft") backendStatus = "Pending"; // Or map as needed
        else if (data.status === "archived") backendStatus = "Disabled";


        const payloadToBackend = {
            id: data.id,
            form_name: data.formName,
            status: backendStatus,
            // Join array of slugs into comma-separated string
            department_ids: data.departmentValues.join(','),
            category_ids: data.categoryValues.join(','),
            section: serializeSectionsToBackend(data.sections),
        };
        console.log("Payload to Backend:", payloadToBackend);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (isEditMode && data.id) {
            // Update in simulated DB
            setSimulatedDb(prevDb => prevDb.map(item => item.id === data.id ? { ...item, ...payloadToBackend, id: data.id! } : item));
            toast.push(<Notification title="Success" type="success">Form updated successfully!</Notification>);
        } else {
            // Add to simulated DB
            const newId = Math.max(0, ...simulatedDb.map(f => f.id)) + 1;
            setSimulatedDb(prevDb => [{ ...payloadToBackend, id: newId }, ...prevDb]);
            toast.push(<Notification title="Success" type="success">Form created successfully!</Notification>);
        }
        setIsSubmitting(false);
        navigate('/system-tools/form-builder'); // Adjust to your listing page route
    };

    const addNewSection = () => {
        appendSection(cloneDeep(defaultSection)); // Use cloneDeep for a new object instance
    };

    if (isLoading && isEditMode) {
        return (
            <Container className="h-full flex items-center justify-center">
                <TbLoader className="animate-spin text-4xl text-primary-500" />
            </Container>
        );
    }

    return (
        <Container className="h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">
                    {isEditMode ? 'Edit Form' : 'Create New Form'}
                </h3>
                <Button onClick={() => navigate('/system-tools/form-builder')} variant="default">
                    Back to List
                </Button>
            </div>

            <Form onSubmit={handleSubmit(onFormSubmit)}>
                <AdaptiveCard>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <FormItem label="Form Name" invalid={!!errors.formName} errorMessage={errors.formName?.message as string}>
                            <Controller name="formName" control={control} rules={{ required: "Form name is required" }}
                                render={({ field }) => <Input {...field} placeholder="Enter form name" />} />
                        </FormItem>
                        <FormItem label="Status" invalid={!!errors.status} errorMessage={errors.status?.message as string}>
                            <Controller name="status" control={control} rules={{ required: "Status is required" }}
                                render={({ field }) => (
                                    <Select placeholder="Select status" options={FORM_STATUS_OPTIONS}
                                        value={FORM_STATUS_OPTIONS.find(o => o.value === field.value)}
                                        onChange={(opt) => field.onChange(opt?.value)} />
                                )} />
                        </FormItem>
                        <FormItem label="Departments" invalid={!!errors.departmentValues} errorMessage={errors.departmentValues?.message as string}>
                            <Controller name="departmentValues" control={control}
                                render={({ field }) => (
                                    <Select isMulti placeholder="Select department(s)" options={DEPARTMENT_OPTIONS}
                                        value={DEPARTMENT_OPTIONS.filter(o => field.value?.includes(o.value))}
                                        onChange={(opts) => field.onChange(opts?.map(o => o.value) || [])} />
                                )} />
                        </FormItem>
                        <FormItem label="Categories" invalid={!!errors.categoryValues} errorMessage={errors.categoryValues?.message as string}>
                            <Controller name="categoryValues" control={control}
                                render={({ field }) => (
                                    <Select isMulti placeholder="Select category(ies)" options={CATEGORY_OPTIONS}
                                        value={CATEGORY_OPTIONS.filter(o => field.value?.includes(o.value))}
                                        onChange={(opts) => field.onChange(opts?.map(o => o.value) || [])} />
                                )} />
                        </FormItem>
                    </div>

                    <h4 className="text-lg font-semibold mb-4 mt-8 pt-4 border-t dark:border-gray-600">
                        Form Sections & Questions
                    </h4>
                    {sectionFields.map((sectionField, index) => (
                        <SectionItem
                            key={sectionField.id}
                            sectionIndex={index}
                            control={control}
                            removeSection={() => sectionFields.length > 1 ? removeSection(index) : toast.push(<Notification type="warning" title="Cannot remove the last section." />)}
                            watch={watch}
                        />
                    ))}
                    <Button type="button" variant="solid" icon={<TbLayoutList />} onClick={addNewSection} className="mt-4">
                        Add New Section
                    </Button>
                </AdaptiveCard>

                <StickyFooter
                    className="flex items-center justify-end py-4 px-8 gap-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
                    stickyClass="-mx-8"
                >
                    <Button type="button" onClick={() => navigate('/system-tools/form-builder')}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="solid" loading={isSubmitting} disabled={isSubmitting || (isEditMode && !isDirty)}>
                        {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Form' : 'Create Form')}
                    </Button>
                </StickyFooter>
            </Form>
        </Container>
    );
};

export default FormBuilderFormPage;
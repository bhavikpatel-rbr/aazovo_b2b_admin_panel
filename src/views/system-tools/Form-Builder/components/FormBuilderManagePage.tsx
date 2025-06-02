// src/views/your-path/FormBuilderManagePage.tsx

import React, { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray, Control } from 'react-hook-form';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import classNames from 'classnames';

// UI Components
import { Form, FormItem } from '@/components/ui/Form';
import Card from '@/components/ui/Card';
import Container from '@/components/shared/Container';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import Button from '@/components/ui/Button';
import Notification from '@/components/ui/Notification';
import toast from '@/components/ui/toast';
import { DatePicker, Radio, Switcher, Tooltip } from '@/components/ui';
import { BiChevronRight } from 'react-icons/bi';
import { TbCirclePlus, TbCopy, TbLayoutList, TbPlus, TbTrash } from 'react-icons/tb';

// Import types and constants from FormBuilder.tsx or a shared file
// IMPORTANT: Assume DEPARTMENT_OPTIONS and CATEGORY_OPTIONS are arrays of objects like:
// { id: number; value: string; label: string; } for the ID mapping to work.
import { 
    FormBuilderItem, 
    // QuestionItem, // Not directly used in this page's form data, but conceptually related
    FORM_STATUS_OPTIONS, 
    DEPARTMENT_OPTIONS, 
    CATEGORY_OPTIONS,
    // QUESTION_TYPE_OPTIONS as MainQuestionTypeOptions // Not directly used for schema validation here
} from '../FormBuilder'; // Adjust path

// Import store actions
import { getFormByIdFromStore /*, addFormToStore, updateFormInStore */ } from '../formBuilderStore'; // Adjust path. add/update removed from onSubmit.

import {
editFormBuilderAction, addFormBuilderAction
} from '@/reduxtool/master/middleware'; // Adjust path
import { useAppDispatch } from '@/reduxtool/store'; // Adjust path

// --- Types and Schemas for this Page's Form Structure ---

const PAGE_QUESTION_TYPE_OPTIONS = [
    { value: "Text", label: "Text" },
    { value: "Number", label: "Number" },
    { value: "Textarea", label: "Textarea" },
    { value: "Radio", label: "Radio Buttons" },
    { value: "Checkbox", label: "Checkboxes" },
    { value: "FileUpload", label: "File Upload" },
    { value: "Date", label: "Date" },
    { value: "Time", label: "Time" },
    { value: "DateRange", label: "Date Range" },
    { value: "SingleChoiceDropdown", label: "Single-Choice Dropdown" },
    { value: "MultiChoiceDropdown", label: "Multi-Choice Dropdown" },
    { value: "Rating", label: "Rating" },
];
const pageQuestionTypeValues = PAGE_QUESTION_TYPE_OPTIONS.map(opt => opt.value) as [string, ...string[]];

const pageOptionSchema = z.object({
    id: z.string().optional(),
    label: z.string().min(1, "Option label is required"),
    value: z.string().min(1, "Option value is required"),
});

const pageQuestionSchema = z.object({
    id: z.string().optional(),
    question_text: z.string().min(1, "Question text is required").max(500),
    question_type: z.enum(pageQuestionTypeValues, { errorMap: () => ({ message: "Select a question type."})}),
    is_required: z.boolean().default(false),
    options: z.array(pageOptionSchema).optional(),
});
type PageQuestionFormData = z.infer<typeof pageQuestionSchema>;

const pageSectionSchema = z.object({
    id: z.string().optional(),
    section_title: z.string().min(1, "Section title is required").max(150),
    section_description: z.string().max(500).optional().or(z.literal("")),
    questions: z.array(pageQuestionSchema).min(1, "At least one question is required in a section."),
});
type PageSectionFormData = z.infer<typeof pageSectionSchema>;

const pageFormBuilderSchema = z.object({
    form_name: z.string().min(1, "Form name is required").max(150),
    status: z.string().min(1, "Status is required"),
    department_name: z.string().min(1, "Department is required"), // This will hold the 'value' of the selected department
    category_name: z.string().min(1, "Category is required"),   // This will hold the 'value' of the selected category
    form_title: z.string().min(1, "Form title is required").max(200),
    form_description: z.string().max(1000).optional().or(z.literal("")),
    sections: z.array(pageSectionSchema).min(1, "At least one section is required."),
});
type PageFormBuilderFormData = z.infer<typeof pageFormBuilderSchema>;

// Helper for mapping question types
const mapPageTypeToMainType = (pageType: string): string => {
    switch (pageType) {
        case "Text": return "text";
        case "Number": return "number";
        case "Textarea": return "textarea";
        case "Radio": return "radio";
        case "Checkbox": return "checkbox";
        case "FileUpload": return "file"; // Corresponds to "file" in main types
        case "Date": return "date";
        case "Time": return "time";
        case "DateRange": return "daterange";
        case "SingleChoiceDropdown": return "select";
        case "MultiChoiceDropdown": return "multiselect";
        case "Rating": return "rating";
        default: return "text";
    }
};

const mapMainTypeToPageType = (mainType: string): string => {
    switch (mainType) {
        case "text": return "Text";
        case "number": return "Number";
        case "textarea": return "Textarea";
        case "radio": return "Radio";
        case "checkbox": return "Checkbox";
        case "file": return "FileUpload";
        case "date": return "Date";
        case "time": return "Time";
        case "daterange": return "DateRange";
        case "select": return "SingleChoiceDropdown";
        case "multiselect": return "MultiChoiceDropdown";
        case "rating": return "Rating";
        default: return "Text";
    }
};

// --- QuestionOption Component ---
type QuestionOptionProps = {
    nestIndex: [number, number];
    optionIndex: number;
    control: Control<PageFormBuilderFormData>;
    removeOption: (index: number) => void;
};
const QuestionOptionItem: React.FC<QuestionOptionProps> = ({ nestIndex, optionIndex, control, removeOption }) => {
    const [sectionIdx, questionIdx] = nestIndex;
    return (
        <div className="flex gap-2 items-center mb-2">
            <FormItem className="flex-grow mb-0" label={`Opt ${optionIndex + 1} Label`} invalid={!!(control.getFieldState(`sections.${sectionIdx}.questions.${questionIdx}.options.${optionIndex}.label`).error)}>
                <Controller
                    control={control}
                    name={`sections.${sectionIdx}.questions.${questionIdx}.options.${optionIndex}.label`}
                    render={({ field }) => <Input {...field} placeholder="Label" />}
                />
            </FormItem>
             <FormItem className="flex-grow mb-0" label={`Opt ${optionIndex + 1} Value`} invalid={!!(control.getFieldState(`sections.${sectionIdx}.questions.${questionIdx}.options.${optionIndex}.value`).error)}>
                <Controller
                    control={control}
                    name={`sections.${sectionIdx}.questions.${questionIdx}.options.${optionIndex}.value`}
                    render={({ field }) => <Input {...field} placeholder="Value" />}
                />
            </FormItem>
            <Button type="button" shape="circle" size="sm" icon={<TbTrash />} onClick={() => removeOption(optionIndex)} className="mt-6" />
        </div>
    );
};

// --- Question Component ---
type QuestionComponentProps = {
  sectionIndex: number;
  questionIndex: number;
  control: Control<PageFormBuilderFormData>;
  removeQuestion: (index: number) => void;
  cloneQuestion: (questionData: PageQuestionFormData) => void;
  watch: any;
};

const QuestionComponent: React.FC<QuestionComponentProps> = ({ sectionIndex, questionIndex, control, removeQuestion, cloneQuestion, watch }) => {
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.questions.${questionIndex}.options`
  });

  const currentQuestionType = watch(`sections.${sectionIndex}.questions.${questionIndex}.question_type`);
  const showOptionsEditor = ["Radio", "Checkbox", "SingleChoiceDropdown", "MultiChoiceDropdown"].includes(currentQuestionType);

  return (
    <Card className="mt-2" bodyClass="p-4 flex flex-col gap-4 bg-gray-50 dark:bg-gray-700/50">
      <div className="flex justify-between items-start">
        <h6 className="text-sm font-semibold">Question {questionIndex + 1}</h6>
        <div className="flex gap-1">
            <Tooltip title="Clone Question">
                <Button type='button' size="xs" icon={<TbCopy />} onClick={() => cloneQuestion(watch(`sections.${sectionIndex}.questions.${questionIndex}`))} />
            </Tooltip>
            <Tooltip title="Delete Question">
                <Button type='button' size="xs" icon={<TbTrash />} onClick={() => removeQuestion(questionIndex)} />
            </Tooltip>
        </div>
      </div>
      
      <FormItem label="Question Text" invalid={!!(control.getFieldState(`sections.${sectionIndex}.questions.${questionIndex}.question_text`).error)} errorMessage={control.getFieldState(`sections.${sectionIndex}.questions.${questionIndex}.question_text`).error?.message}>
        <Controller
          control={control}
          name={`sections.${sectionIndex}.questions.${questionIndex}.question_text`}
          render={({ field }) => <Input {...field} textArea rows={2} placeholder="Write Question" />}
        />
      </FormItem>
      <div className="grid md:grid-cols-2 gap-4">
        <FormItem label="Answer Type" invalid={!!(control.getFieldState(`sections.${sectionIndex}.questions.${questionIndex}.question_type`).error)} errorMessage={control.getFieldState(`sections.${sectionIndex}.questions.${questionIndex}.question_type`).error?.message}>
          <Controller
            control={control}
            name={`sections.${sectionIndex}.questions.${questionIndex}.question_type`}
            render={({ field }) => (
              <Select
                placeholder="Select Answer Type"
                options={PAGE_QUESTION_TYPE_OPTIONS}
                value={PAGE_QUESTION_TYPE_OPTIONS.find(opt => opt.value === field.value)}
                onChange={(opt) => field.onChange(opt?.value)}
              />
            )}
          />
        </FormItem>
        <FormItem label=" " className="flex items-center pt-6">
            <Controller
                name={`sections.${sectionIndex}.questions.${questionIndex}.is_required`}
                control={control}
                render={({ field }) => (
                    <Checkbox checked={field.value} onChange={field.onChange}>
                        Required
                    </Checkbox>
                )}
            />
        </FormItem>
      </div>

      {showOptionsEditor && (
        <Card bodyClass="p-3 bg-gray-100 dark:bg-gray-800 rounded">
          <h6 className="text-xs font-semibold mb-2">Options:</h6>
          {optionFields.map((optField, optIndex) => (
            <QuestionOptionItem 
                key={optField.id} 
                nestIndex={[sectionIndex, questionIndex]} 
                optionIndex={optIndex} 
                control={control} 
                removeOption={removeOption} 
            />
          ))}
          <Button type="button" variant="outline" size="sm" icon={<TbPlus />} onClick={() => appendOption({ label: "", value: "" })}>Add Option</Button>
        </Card>
      )}
      {currentQuestionType === 'Text' && <Input type="text" placeholder="Preview: Text Input" disabled />}
      {currentQuestionType === 'Number' && <Input type="number" placeholder="Preview: Number Input" disabled />}
      {currentQuestionType === 'Textarea' && <Input textArea placeholder="Preview: Text Area" disabled />}
      {currentQuestionType === 'FileUpload' && <Input type="file" disabled />}
      {currentQuestionType === 'Date' && <DatePicker placeholder="Preview: Date Picker" disabled />}
    </Card>
  );
};

// --- Section Component ---
type SectionComponentProps = {
  sectionIndex: number;
  control: Control<PageFormBuilderFormData>;
  removeSection: (index: number) => void;
  watch: any;
};
const SectionComponent: React.FC<SectionComponentProps> = ({ sectionIndex, control, removeSection, watch }) => {
  const { fields, append, remove } = useFieldArray({ // `move` was unused
    control,
    name: `sections.${sectionIndex}.questions`
  });

  const cloneQuestion = (questionData: PageQuestionFormData) => { // `sIndex` was unused
    append(JSON.parse(JSON.stringify(questionData))); // Deep clone
  };

  return (
    <Card className="mt-4" bodyClass="p-4">
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-base font-semibold">Section {sectionIndex + 1}</h5>
        <div className="flex gap-2">
            <Button type="button" size="sm" icon={<TbCirclePlus />} onClick={() => append({ question_text: "", question_type: pageQuestionTypeValues[0], is_required: false, options: [] })}>Add Question</Button>
            {sectionIndex > 0 && ( 
                <Tooltip title="Delete Section">
                    <Button type="button" size="sm" icon={<TbTrash />} onClick={() => removeSection(sectionIndex)} />
                </Tooltip>
            )}
        </div>
      </div>
      <FormItem label="Section Title" invalid={!!(control.getFieldState(`sections.${sectionIndex}.section_title`).error)} errorMessage={control.getFieldState(`sections.${sectionIndex}.section_title`).error?.message}>
        <Controller
          control={control}
          name={`sections.${sectionIndex}.section_title`}
          render={({ field }) => <Input {...field} placeholder="Enter Section Title" />}
        />
      </FormItem>
      <FormItem label="Section Description (Optional)" invalid={!!(control.getFieldState(`sections.${sectionIndex}.section_description`).error)} errorMessage={control.getFieldState(`sections.${sectionIndex}.section_description`).error?.message}>
        <Controller
          control={control}
          name={`sections.${sectionIndex}.section_description`}
          render={({ field }) => <Input {...field} textArea rows={2} placeholder="Enter Section Description" />}
        />
      </FormItem>
      
      {fields.map((questionField, questionIndex) => (
        <QuestionComponent
          key={questionField.id}
          sectionIndex={sectionIndex}
          questionIndex={questionIndex}
          control={control}
          removeQuestion={remove}
          cloneQuestion={cloneQuestion}
          watch={watch}
        />
      ))}
       {control.getFieldState(`sections.${sectionIndex}.questions`).error && !Array.isArray(control.getFieldState(`sections.${sectionIndex}.questions`).error) && (
            <p className="text-red-500 text-xs mt-1">{(control.getFieldState(`sections.${sectionIndex}.questions`) as any).message}</p>
        )}
    </Card>
  );
};


// --- Main Form Builder Page (Create/Edit) ---
const FormBuilderManagePage = () => {
  const { formId } = useParams<{ formId?: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isEditMode = !!formId;
  const [isLoading, setIsLoading] = useState(false);

  const formMethods = useForm<PageFormBuilderFormData>({
    resolver: zodResolver(pageFormBuilderSchema),
    defaultValues: {
      form_name: "",
      status: FORM_STATUS_OPTIONS.length > 0 ? FORM_STATUS_OPTIONS[0].value : "",
      department_name: DEPARTMENT_OPTIONS.length > 0 ? DEPARTMENT_OPTIONS[0].value : "",
      category_name: CATEGORY_OPTIONS.length > 0 ? CATEGORY_OPTIONS[0].value : "",
      form_title: "",
      form_description: "",
      sections: [{ section_title: "Section 1", section_description: "", questions: [{ question_text: "", question_type: pageQuestionTypeValues[0], is_required: false, options: [] }] }],
    },
     mode: "onChange",
  });
  const { control, handleSubmit, reset, watch, formState: { errors, isValid, isSubmitting } } = formMethods;

  const { fields: sectionFields, append: appendSection, remove: removeSection } = useFieldArray({
    control,
    name: "sections"
  });

  useEffect(() => {
    if (isEditMode && formId) {
      setIsLoading(true);
      const formDataFromStore = getFormByIdFromStore(formId); // This returns FormBuilderItem
      if (formDataFromStore) {
        const pageData: PageFormBuilderFormData = {
          form_name: formDataFromStore.formName,
          status: formDataFromStore.status,
          department_name: formDataFromStore.departmentName, // Stored as single string value
          category_name: formDataFromStore.categoryName,   // Stored as single string value
          form_title: formDataFromStore.formTitle || formDataFromStore.formName,
          form_description: formDataFromStore.formDescription || "",
          sections: [],
        };

        const sectionsMap: Record<string, { title: string; description?: string; questions: PageQuestionFormData[] }> = {};
        formDataFromStore.questions.forEach(q => {
            const sectionKey = q.questionSectionTitle || "Default Section";
            if (!sectionsMap[sectionKey]) {
                sectionsMap[sectionKey] = { 
                    title: sectionKey, 
                    description: q.questionSectionDescription || "",
                    questions: [] 
                };
            }
            sectionsMap[sectionKey].questions.push({
                question_text: q.questionText,
                question_type: mapMainTypeToPageType(q.questionType),
                is_required: q.isRequired || false,
                options: q.options?.map(opt => ({ label: opt.label, value: opt.value })) || []
            });
        });
        
        pageData.sections = Object.values(sectionsMap).map(s => ({
            section_title: s.title,
            section_description: s.description,
            questions: s.questions,
        }));
        
        if(pageData.sections.length === 0) {
            pageData.sections.push({ section_title: "Section 1", section_description: "", questions: [{ question_text: "", question_type: pageQuestionTypeValues[0], is_required: false, options:[] }] });
        }

        reset(pageData);
      } else {
        toast.push(<Notification title="Error" type="danger">Form not found.</Notification>);
        navigate("/system-tools/form-builder"); // Adjust path
      }
      setIsLoading(false);
    }
  }, [formId, isEditMode, navigate, reset]);

  const onSubmit = async (data: PageFormBuilderFormData) => {
    setIsLoading(true);
    
    // --- Transformation to the target JSON structure ---
    let departmentIdsArray: number[] = [];
    if (data.department_name) {
        // Assumes data.department_name is a single value from Select,
        // or a comma-separated string of values if input method allows.
        // DEPARTMENT_OPTIONS must have `id` and `value` properties.
        const departmentValues = data.department_name.split(',').map(v => v.trim());
        departmentIdsArray = departmentValues.map(value => {
            const option = DEPARTMENT_OPTIONS.find(opt => opt.value === value);
            // Use index as fallback if id is not present
            return option && 'id' in option ? (option as any).id : DEPARTMENT_OPTIONS.findIndex(opt => opt.value === value);
        }).filter(id => id !== -1) as number[];
    }
    
    let categoryIdsArray: number[] = [];
    if (data.category_name) {
        // Assumes data.category_name is a single value from Select,
        // or a comma-separated string of values.
        // CATEGORY_OPTIONS must have `id` and `value` properties.
        const categoryValues = data.category_name.split(',').map(v => v.trim());
        categoryIdsArray = categoryValues.map(value => {
            const option = CATEGORY_OPTIONS.find(opt => opt.value === value);
            // Use index as fallback if id is not present
            return option && 'id' in option ? (option as any).id : CATEGORY_OPTIONS.findIndex(opt => opt.value === value);
        }).filter(id => id !== -1) as number[];
    }

    const transformedPayload: any = { 
      form_name: data.form_name,
      status: data.status,
      department_ids: JSON.stringify(departmentIdsArray),
      category_ids: JSON.stringify(categoryIdsArray),
      form_title: data.form_title,
      form_description: data.form_description || "", // Ensure it's not undefined
      section: {}
    };

    data.sections.forEach((sectionData, sectionIndex) => {
      const sectionKey = `section_${sectionIndex + 1}`;
      transformedPayload.section[sectionKey] = {
        questionSectionTitle: sectionData.section_title,
        questionSectionDescription: sectionData.section_description || "",
      };

      sectionData.questions.forEach((questionData, questionIndex) => {
        const questionKey = `question_${questionIndex + 1}`;
        transformedPayload.section[sectionKey][questionKey] = {
          questionText: questionData.question_text,
          questionType: mapPageTypeToMainType(questionData.question_type),
          isRequired: questionData.is_required,
          options: questionData.options ? questionData.options.map(opt => opt.value) : []
        };
      });
    });
    // --- End of Transformation ---

    // For debugging:
    // console.log("Transformed Payload for API:", JSON.stringify(transformedPayload, null, 2));

    // Simulate API call (remove or replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      if (isEditMode && formId) {
        dispatch(editFormBuilderAction({id: formId, ...transformedPayload}));
        toast.push(<Notification title="Success" type="success">Form updated successfully!</Notification>);
      } else {
        dispatch(addFormBuilderAction(transformedPayload));
        toast.push(<Notification title="Success" type="success">Form created successfully!</Notification>);
      }
      navigate("/system-tools/form-builder"); // Adjust path
    } catch (error: any) {
      toast.push(<Notification title="Error" type="danger">{error.message || "Operation failed."}</Notification>);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode) {
    return <Container className="h-full"><Card><p>Loading form data...</p></Card></Container>;
  }

  return (
    <Container className="h-full">
      <div className="flex gap-1 items-end mb-3">
        <NavLink to="/system-tools/form-builder">
          <h6 className="font-semibold hover:text-primary">Form Builder</h6>
        </NavLink>
        <BiChevronRight size={22} />
        <h6 className="font-semibold text-primary">
          {isEditMode ? "Edit Form" : "Add New Form"}
        </h6>
      </div>

      <Card>
        <h5 className="mb-6 text-lg font-semibold">Form Information</h5>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <div className="md:grid grid-cols-3 gap-3">
            <FormItem
              label="Form Name*"
              className="col-span-2"
              invalid={!!errors.form_name}
              errorMessage={errors.form_name?.message}
            >
              <Controller
                control={control}
                name="form_name"
                render={({ field }) => (
                  <Input {...field} placeholder="Enter Form Name" />
                )}
              />
            </FormItem>

            <FormItem
              label="Status*"
              invalid={!!errors.status}
              errorMessage={errors.status?.message}
            >
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    {...field}
                    options={FORM_STATUS_OPTIONS}
                    placeholder="Select Status"
                    value={FORM_STATUS_OPTIONS.find(o => o.value === field.value)}
                    onChange={opt => field.onChange(opt?.value)}
                  />
                )}
              />
            </FormItem>
          </div>

          <div className="md:grid grid-cols-2 gap-3 mt-4">
            <FormItem
              label="Department Name*"
              invalid={!!errors.department_name}
              errorMessage={errors.department_name?.message}
            >
              <Controller
                control={control}
                name="department_name"
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Department"
                    options={DEPARTMENT_OPTIONS} // Assumed to be {id, value, label}[]
                    value={DEPARTMENT_OPTIONS.find(o => o.value === field.value)}
                    onChange={opt => field.onChange(opt?.value)}
                  />
                )}
              />
            </FormItem>

            <FormItem
              label="Category Name*"
              invalid={!!errors.category_name}
              errorMessage={errors.category_name?.message}
            >
              <Controller
                control={control}
                name="category_name"
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Category"
                    options={CATEGORY_OPTIONS} // Assumed to be {id, value, label}[]
                    value={CATEGORY_OPTIONS.find(o => o.value === field.value)}
                    onChange={opt => field.onChange(opt?.value)}
                  />
                )}
              />
            </FormItem>
          </div>

          <Card className="mt-6" bodyClass="p-4">
            <FormItem
              label="Form Display Title*"
              invalid={!!errors.form_title}
              errorMessage={errors.form_title?.message}
            >
              <Controller
                control={control}
                name="form_title"
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter Form Display Title (e.g., for users filling it out)"
                  />
                )}
              />
            </FormItem>

            <FormItem
              label="Form Display Description (Optional)"
              invalid={!!errors.form_description}
              errorMessage={errors.form_description?.message}
            >
              <Controller
                control={control}
                name="form_description"
                render={({ field }) => (
                  <Input
                    {...field}
                    textArea
                    rows={3}
                    placeholder="Write a brief description or instructions for the form"
                  />
                )}
              />
            </FormItem>
          </Card>

          <div className="mt-6">
            <h5 className="text-lg font-semibold mb-2">
              Form Structure (Sections & Questions)
            </h5>
            {errors.sections && !Array.isArray(errors.sections) && (
              <p className="text-red-500 text-xs mb-2">
                {(errors.sections as any).message}
              </p>
            )}
            {sectionFields.map((sectionField, index) => (
              <SectionComponent
                key={sectionField.id}
                sectionIndex={index}
                control={control}
                removeSection={removeSection}
                watch={watch}
              />
            ))}

            <div className="mt-4 text-right">
              <Button
                type="button"
                variant="solid"
                icon={<TbLayoutList />}
                onClick={() =>
                  appendSection({
                    section_title: `Section ${sectionFields.length + 1}`,
                    section_description: "",
                    questions: [
                      {
                        question_text: "",
                        question_type: pageQuestionTypeValues[0],
                        is_required: false,
                        options: [],
                      },
                    ],
                  })
                }
              >
                Add Section
              </Button>
            </div>
          </div>

          <div className="text-right mt-6">
            <Button
              type="button"
              className="mr-2 w-24"
              onClick={() => navigate("/system-tools/form-builder")} // Adjust path
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="solid"
              className="w-24"
              loading={isSubmitting || isLoading}
              disabled={!isValid || isSubmitting || isLoading}
            >
              {isEditMode ? "Save Changes" : "Create Form"}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default FormBuilderManagePage;
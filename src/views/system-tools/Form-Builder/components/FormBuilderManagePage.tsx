// src/views/your-path/FormBuilderManagePage.tsx

import React, { useEffect, useState, useMemo } from "react";
import { useForm, Controller, useFieldArray, Control } from "react-hook-form";
import { NavLink, useNavigate, useParams, useLocation } from "react-router-dom"; // Added useLocation
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import { Form, FormItem } from "@/components/ui/Form";
import Card from "@/components/ui/Card";
import Container from "@/components/shared/Container";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import { DatePicker } from "@/components/ui";
import { BiChevronRight } from "react-icons/bi";
import {
  TbCirclePlus,
  TbCopy,
  TbLayoutList,
  TbPlus,
  TbTrash,
} from "react-icons/tb";
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { FORM_STATUS_OPTIONS } from "../FormBuilder";

import {
  editFormBuilderAction,
  addFormBuilderAction,
  getDepartmentsAction,
  getCategoriesAction,
  getFormBuilderAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
// Removed react-tooltip import as Button's title prop is used for simple tooltips

// --- Types and Schemas for this Page's Form Structure ---

const PAGE_QUESTION_TYPE_OPTIONS = [
  { value: "Text", label: "Text" }, { value: "Number", label: "Number" },
  { value: "Textarea", label: "Textarea" }, { value: "Radio", label: "Radio Buttons" },
  { value: "Checkbox", label: "Checkboxes" }, { value: "FileUpload", label: "File Upload" },
  { value: "Date", label: "Date" }, { value: "Time", label: "Time" },
  { value: "DateRange", label: "Date Range" }, { value: "SingleChoiceDropdown", label: "Single-Choice Dropdown" },
  { value: "MultiChoiceDropdown", label: "Multi-Choice Dropdown" }, { value: "Rating", label: "Rating" },
];
const pageQuestionTypeValues = PAGE_QUESTION_TYPE_OPTIONS.map(opt => opt.value) as [string, ...string[]];

const pageOptionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Option label is required"),
  value: z.string().min(1, "Option value is required"),
});
type PageOptionFormData = z.infer<typeof pageOptionSchema>;

const pageQuestionSchema = z.object({
  id: z.string().optional(),
  question_text: z.string().min(1, "Question text is required").max(500),
  question_type: z.enum(pageQuestionTypeValues, { errorMap: () => ({ message: "Select a question type." }) }),
  is_required: z.boolean().default(false),
  options: z.array(pageOptionSchema).optional(),
});
type PageQuestionFormData = z.infer<typeof pageQuestionSchema>;

export type GeneralCategoryListItem = { id: string | number; name: string };
export type DepartmentListItem = { id: string | number; name: string };

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
  department_ids: z.array(z.string()).min(1, "At least one department must be selected."),
  category_ids: z.array(z.string()).min(1, "At least one category must be selected."),
  form_title: z.string().min(1, "Form title is required").max(200),
  form_description: z.string().max(1000).optional().or(z.literal("")),
  sections: z.array(pageSectionSchema).min(1, "At least one section is required."),
});
type PageFormBuilderFormData = z.infer<typeof pageFormBuilderSchema>;

// --- Mappers ---
const mapPageTypeToApiType = (pageType: string): string => {
  const map: Record<string, string> = {
    Text: "text", Number: "number", Textarea: "textarea", Radio: "radio", Checkbox: "checkbox",
    FileUpload: "file", Date: "date", Time: "time", DateRange: "daterange",
    SingleChoiceDropdown: "select", MultiChoiceDropdown: "multiselect", Rating: "rating",
  };
  return map[pageType] || "text";
};

const mapApiTypeToPageType = (apiType: string): string => {
  const map: Record<string, string> = {
    text: "Text", number: "Number", textarea: "Textarea", radio: "Radio", checkbox: "Checkbox",
    file: "FileUpload", date: "Date", time: "Time", daterange: "DateRange",
    select: "SingleChoiceDropdown", dropdown: "SingleChoiceDropdown",
    multiselect: "MultiChoiceDropdown", rating: "Rating",
  };
  return map[apiType] || "Text";
};

// --- Child Components with Preview Mode ---
type QuestionOptionProps = { nestIndex: [number, number]; optionIndex: number; control: Control<PageFormBuilderFormData>; removeOption: (index: number) => void; isPreviewMode: boolean; };
const QuestionOptionItem: React.FC<QuestionOptionProps> = ({ nestIndex, optionIndex, control, removeOption, isPreviewMode }) => {
  const [sectionIdx, questionIdx] = nestIndex;
  return (
    <div className="flex gap-2 items-center mb-2">
      <FormItem className="flex-grow mb-0" label={`Opt ${optionIndex + 1} Label`} invalid={!!control.getFieldState(`sections.${sectionIdx}.questions.${questionIdx}.options.${optionIndex}.label`).error}>
        <Controller control={control} name={`sections.${sectionIdx}.questions.${questionIdx}.options.${optionIndex}.label`} render={({ field }) => <Input {...field} placeholder="Label" disabled={isPreviewMode} />} />
      </FormItem>
      <FormItem className="flex-grow mb-0" label={`Opt ${optionIndex + 1} Value`} invalid={!!control.getFieldState(`sections.${sectionIdx}.questions.${questionIdx}.options.${optionIndex}.value`).error}>
        <Controller control={control} name={`sections.${sectionIdx}.questions.${questionIdx}.options.${optionIndex}.value`} render={({ field }) => <Input {...field} placeholder="Value" disabled={isPreviewMode} />} />
      </FormItem>
      <Button type="button" shape="circle" size="sm" icon={<TbTrash />} onClick={() => removeOption(optionIndex)} className="mt-6" disabled={isPreviewMode} />
    </div>
  );
};

type QuestionComponentProps = { sectionIndex: number; questionIndex: number; control: Control<PageFormBuilderFormData>; removeQuestion: (index: number) => void; cloneQuestion: (questionData: PageQuestionFormData) => void; watch: any; isPreviewMode: boolean; };
const QuestionComponent: React.FC<QuestionComponentProps> = ({ sectionIndex, questionIndex, control, removeQuestion, cloneQuestion, watch, isPreviewMode }) => {
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({ control, name: `sections.${sectionIndex}.questions.${questionIndex}.options` });
  const currentQuestionType = watch(`sections.${sectionIndex}.questions.${questionIndex}.question_type`);
  const showOptionsEditor = ["Radio", "Checkbox", "SingleChoiceDropdown", "MultiChoiceDropdown"].includes(currentQuestionType);
  return (
    <Card className="mt-2" bodyClass="p-4 flex flex-col gap-4 bg-gray-50 dark:bg-gray-700/50">
      <div className="flex justify-between items-start">
        <h6 className="text-sm font-semibold">Question {questionIndex + 1}</h6>
        {!isPreviewMode && (
          <div className="flex gap-1">
            <Button type="button" size="xs" icon={<TbCopy />} title="Clone Question" onClick={() => cloneQuestion(watch(`sections.${sectionIndex}.questions.${questionIndex}`))} />
            <Button type="button" size="xs" icon={<TbTrash />} title="Delete Question" onClick={() => removeQuestion(questionIndex)} />
          </div>
        )}
      </div>
      <FormItem label="Question Text" invalid={!!control.getFieldState(`sections.${sectionIndex}.questions.${questionIndex}.question_text`).error} errorMessage={control.getFieldState(`sections.${sectionIndex}.questions.${questionIndex}.question_text`).error?.message}>
        <Controller control={control} name={`sections.${sectionIndex}.questions.${questionIndex}.question_text`} render={({ field }) => <Input {...field} textArea rows={2} placeholder="Write Question" disabled={isPreviewMode} />} />
      </FormItem>
      <div className="grid md:grid-cols-2 gap-4">
        <FormItem label="Answer Type" invalid={!!control.getFieldState(`sections.${sectionIndex}.questions.${questionIndex}.question_type`).error} errorMessage={control.getFieldState(`sections.${sectionIndex}.questions.${questionIndex}.question_type`).error?.message}>
          <Controller control={control} name={`sections.${sectionIndex}.questions.${questionIndex}.question_type`} render={({ field }) => <Select placeholder="Select Answer Type" options={PAGE_QUESTION_TYPE_OPTIONS} value={PAGE_QUESTION_TYPE_OPTIONS.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} isDisabled={isPreviewMode} />} />
        </FormItem>
        <FormItem label=" " className="flex items-center pt-6"><Controller name={`sections.${sectionIndex}.questions.${questionIndex}.is_required`} control={control} render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} disabled={isPreviewMode}>Required</Checkbox>} /></FormItem>
      </div>
      {showOptionsEditor && (
        <Card bodyClass="p-3 bg-gray-100 dark:bg-gray-800 rounded">
          <h6 className="text-xs font-semibold mb-2">Options:</h6>
          {optionFields.map((optField, optIndex) => <QuestionOptionItem key={optField.id} nestIndex={[sectionIndex, questionIndex]} optionIndex={optIndex} control={control} removeOption={removeOption} isPreviewMode={isPreviewMode} />)}
          {!isPreviewMode && <Button type="button" size="sm" icon={<TbPlus />} onClick={() => appendOption({ label: "", value: "" })}>Add Option</Button>}
        </Card>
      )}
      {/* Previews of input types */}
      {currentQuestionType === "Text" && <Input type="text" placeholder="Preview: Text Input" disabled />}
      {currentQuestionType === "Number" && <Input type="number" placeholder="Preview: Number Input" disabled />}
      {currentQuestionType === "Textarea" && <Input textArea placeholder="Preview: Text Area" disabled />}
      {currentQuestionType === "FileUpload" && <Input type="file" disabled />}
      {currentQuestionType === "Date" && <DatePicker placeholder="Preview: Date Picker" disabled />}
    </Card>
  );
};

type SectionComponentProps = { sectionIndex: number; control: Control<PageFormBuilderFormData>; removeSection: (index: number) => void; watch: any; isPreviewMode: boolean; };
const SectionComponent: React.FC<SectionComponentProps> = ({ sectionIndex, control, removeSection, watch, isPreviewMode }) => {
  const { fields, append, remove } = useFieldArray({ control, name: `sections.${sectionIndex}.questions` });
  const cloneQuestion = (questionData: PageQuestionFormData) => append(JSON.parse(JSON.stringify(questionData)));
  return (
    <Card className="mt-4" bodyClass="p-4">
      <div className="flex justify-between items-center mb-2">
        <h5 className="text-base font-semibold">Section {sectionIndex + 1}</h5>
        {!isPreviewMode && (
          <div className="flex gap-2">
            <Button type="button" size="sm" icon={<TbCirclePlus />} onClick={() => append({ question_text: "", question_type: pageQuestionTypeValues[0], is_required: false, options: [] })}>Add Question</Button>
            {sectionIndex > 0 && <Button type="button" size="sm" icon={<TbTrash />} title="Delete Section" onClick={() => removeSection(sectionIndex)} />}
          </div>
        )}
      </div>
      <FormItem label="Section Title" invalid={!!control.getFieldState(`sections.${sectionIndex}.section_title`).error} errorMessage={control.getFieldState(`sections.${sectionIndex}.section_title`).error?.message}><Controller control={control} name={`sections.${sectionIndex}.section_title`} render={({ field }) => <Input {...field} placeholder="Enter Section Title" disabled={isPreviewMode} />} /></FormItem>
      <FormItem label="Section Description (Optional)" invalid={!!control.getFieldState(`sections.${sectionIndex}.section_description`).error} errorMessage={control.getFieldState(`sections.${sectionIndex}.section_description`).error?.message}><Controller control={control} name={`sections.${sectionIndex}.section_description`} render={({ field }) => <Input {...field} textArea rows={2} placeholder="Enter Section Description" disabled={isPreviewMode} />} /></FormItem>
      {fields.map((questionField, questionIndex) => <QuestionComponent key={questionField.id} sectionIndex={sectionIndex} questionIndex={questionIndex} control={control} removeQuestion={remove} cloneQuestion={cloneQuestion} watch={watch} isPreviewMode={isPreviewMode} />)}
      {control.getFieldState(`sections.${sectionIndex}.questions`).error && !Array.isArray(control.getFieldState(`sections.${sectionIndex}.questions`).error) && <p className="text-red-500 text-xs mt-1">{(control.getFieldState(`sections.${sectionIndex}.questions`) as any).message}</p>}
    </Card>
  );
};

// --- Main Form Builder Page (Create/Edit/Preview/Clone) ---
const FormBuilderManagePage = () => {
  const { id: formIdFromParams } = useParams<{ id?: string }>(); // For /edit/:id route
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Derived states from URL
  const isPreviewMode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("preview") === "true";
  }, [location.search]);

  const cloneFromId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("cloneFrom"); // string (ID) or null
  }, [location.search]);

  // True edit mode is when formIdFromParams exists AND we are NOT cloning
  const isEditMode = !!formIdFromParams && !cloneFromId;
  const [isLoading, setIsLoading] = useState(false);

  const {
    formsData = [],
    CategoriesData = [],
    departmentsData = [],
  } = useSelector(masterSelector);

  const departmentOptionsForSelect = useMemo(() => departmentsData?.data.map((d: DepartmentListItem) => ({ value: String(d.id), label: d.name })), [departmentsData]);
  const categoryOptionsForSelect = useMemo(() => CategoriesData.map((c: GeneralCategoryListItem) => ({ value: String(c.id), label: c.name })), [CategoriesData]);

  const formMethods = useForm<PageFormBuilderFormData>({
    resolver: zodResolver(pageFormBuilderSchema),
    defaultValues: {
      form_name: "", status: FORM_STATUS_OPTIONS[0]?.value || "Draft",
      department_ids: [], category_ids: [],
      form_title: "", form_description: "",
      sections: [{ section_title: "Section 1", section_description: "", questions: [{ question_text: "", question_type: pageQuestionTypeValues[0], is_required: false, options: [] }] }],
    },
    mode: "onChange",
  });
  const { control, handleSubmit, reset, watch, formState: { errors, isValid, isSubmitting } } = formMethods;
  const { fields: sectionFields, append: appendSection, remove: removeSection } = useFieldArray({ control, name: "sections" });

  useEffect(() => {
    // Fetch master data (categories, departments)
    if (!departmentsData.length) dispatch(getDepartmentsAction());
    if (!CategoriesData.length) dispatch(getCategoriesAction());

    // Fetch all forms if data is needed for edit, preview, or clone and not already loaded
    const idForLoadingCheck = formIdFromParams || cloneFromId;
    if (idForLoadingCheck && !formsData.length) {
      dispatch(getFormBuilderAction());
    }
  }, [dispatch, formIdFromParams, cloneFromId, formsData.length, departmentsData.length, CategoriesData.length]);

  const parseStringifiedArray = (str: string | null | undefined): string[] => {
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed.map(String).filter(id => id.trim() !== "") : [];
    } catch (e) {
      console.warn("Could not parse stringified array:", str, e);
      return [];
    }
  };

  useEffect(() => {
    const idToLoad = formIdFromParams || cloneFromId; // ID from path (edit/preview) or query (clone)

    if (idToLoad && formsData.length > 0) {
      setIsLoading(true);
      const formDataFromRedux = formsData.find((form: any) => String(form.id) === String(idToLoad));

      if (formDataFromRedux) {
        let parsedPageSections: PageSectionFormData[] = [];
        try {
          const backendSectionsArray: any[] = JSON.parse(formDataFromRedux.section || "[]");
          if (Array.isArray(backendSectionsArray)) {
            parsedPageSections = backendSectionsArray.map((backendSec: any) => ({
              // id: backendSec.id || String(Math.random()), // Omit ID for RHF, let RHF handle it
              section_title: backendSec.title || "",
              section_description: backendSec.description || "",
              questions: Array.isArray(backendSec.questions)
                ? backendSec.questions.map((backendQues: any) => ({
                    // id: backendQues.id || String(Math.random()), // Omit ID
                    question_text: backendQues.question || "",
                    question_type: mapApiTypeToPageType(backendQues.question_type || "text"),
                    is_required: backendQues.required || false,
                    options: (backendQues.question_option && typeof backendQues.question_option === 'string' && backendQues.question_label && typeof backendQues.question_label === 'string')
                               ? backendQues.question_option.split(',').map((val: string, index: number) => ({
                                   id: String(Math.random()), // RHF key for options
                                   label: backendQues.question_label.split(',')[index]?.trim() || val.trim(),
                                   value: val.trim()
                                 }))
                               : [],
                  }))
                : [],
            }));
          }
        } catch (e) {
          console.error("Error parsing sections from backend:", e);
          toast.push(<Notification title="Error" type="danger">Could not load form structure.</Notification>);
          parsedPageSections = [{ section_title: "Section 1 (Error Loading)", section_description: "", questions: [{ question_text: "", question_type: pageQuestionTypeValues[0], is_required: false, options: [] }] }];
        }
        
        if (parsedPageSections.length === 0) {
            parsedPageSections.push({ section_title: "Section 1", section_description: "", questions: [{ question_text: "", question_type: pageQuestionTypeValues[0], is_required: false, options: [] }] });
        }

        const baseResetData = {
          form_name: formDataFromRedux.form_name || "",
          status: formDataFromRedux.status || FORM_STATUS_OPTIONS[0]?.value,
          department_ids: parseStringifiedArray(formDataFromRedux.department_ids),
          category_ids: parseStringifiedArray(formDataFromRedux.category_ids),
          form_title: formDataFromRedux.form_title || "",
          form_description: formDataFromRedux.form_description || "",
          sections: parsedPageSections,
        };

        if (cloneFromId && !isPreviewMode) { // If cloning (and not just previewing)
          baseResetData.form_name = `${formDataFromRedux.form_name || "Form"} (Copy)`;
          // Optionally reset status for a new clone, e.g., to 'Draft'
          // baseResetData.status = FORM_STATUS_OPTIONS[0]?.value || "Draft"; 
        }
        
        reset(baseResetData);
      } else if (!isPreviewMode) { // Only show "not found" if not in preview (as data might still be loading)
        toast.push(<Notification title="Error" type="danger">Form not found for ${cloneFromId ? 'cloning' : (formIdFromParams ? 'editing' : 'viewing')}.</Notification>);
        navigate("/system-tools/form-builder");
      }
      setIsLoading(false);
    } else if (!isEditMode && !isPreviewMode && !cloneFromId) { // Pure create mode
      reset({ // Reset to default for create mode
        form_name: "", status: FORM_STATUS_OPTIONS[0]?.value || "Draft",
        department_ids: [], category_ids: [],
        form_title: "", form_description: "",
        sections: [{ section_title: "Section 1", section_description: "", questions: [{ question_text: "", question_type: pageQuestionTypeValues[0], is_required: false, options: [] }] }],
      });
    }
  }, [formIdFromParams, cloneFromId, isPreviewMode, formsData, reset, navigate]);

  const onSubmit = async (data: PageFormBuilderFormData) => {
    if (isPreviewMode) {
      toast.push(<Notification title="Info" type="info">Preview mode. No changes will be saved.</Notification>);
      return;
    }
    setIsLoading(true);

    const apiPayloadSection = data.sections.map(section => ({
      title: section.section_title,
      description: section.section_description || "",
      questions: section.questions.map(question => ({
        question: question.question_text,
        question_type: mapPageTypeToApiType(question.question_type),
        required: question.is_required,
        question_label: question.options && question.options.length > 0 ? question.options.map(opt => opt.label).join(',') : null,
        question_option: question.options && question.options.length > 0 ? question.options.map(opt => opt.value).join(',') : null,
      })),
    }));

    const finalPayload = {
      form_name: data.form_name,
      status: data.status,
      department_ids: JSON.stringify(data.department_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id))),
      category_ids: JSON.stringify(data.category_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id))),
      form_title: data.form_title,
      form_description: data.form_description,
      section: JSON.stringify(apiPayloadSection),
    };

    try {
      if (isEditMode) { // True edit mode (formIdFromParams is present, not cloning)
        await dispatch(editFormBuilderAction({ id: formIdFromParams as string, ...finalPayload })).unwrap();
        toast.push(<Notification title="Success" type="success">Form updated successfully!</Notification>);
      } else { // Create mode (either fresh create or clone-to-create)
        await dispatch(addFormBuilderAction(finalPayload)).unwrap();
        toast.push(<Notification title="Success" type="success">Form ${cloneFromId ? 'cloned and ' : ''}created successfully!</Notification>);
      }
      navigate("/system-tools/form-builder");
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || "Operation failed.";
      toast.push(<Notification title="Error" type="danger">{errorMsg}</Notification>);
      console.error("Submission Error: ", error?.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && (isEditMode || isPreviewMode || !!cloneFromId)) {
    return <Container className="h-full"><Card><p>Loading form data...</p></Card></Container>;
  }

  // Determine page title based on mode
  let pageTitleText = "Add New Form";
  if (isPreviewMode) {
    pageTitleText = "Preview Form";
  } else if (isEditMode) {
    pageTitleText = "Edit Form";
  } else if (cloneFromId) {
    pageTitleText = "Clone Form (Creating New)";
  }

  return (
    <Container className="h-full">
      <div className="flex gap-1 items-end mb-3">
        <NavLink to="/system-tools/form-builder"><h6 className="font-semibold hover:text-primary">Form Builder</h6></NavLink>
        <BiChevronRight size={22} /><h6 className="font-semibold text-primary">{pageTitleText}</h6>
      </div>
      <Card>
        <h5 className="mb-6 text-lg font-semibold">Form Information</h5>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <div className="md:grid grid-cols-3 gap-3">
            <FormItem label={<div>Form Name<span className="text-red-500"> * </span></div>} className="col-span-2" invalid={!!errors.form_name} errorMessage={errors.form_name?.message}>
              <Controller control={control} name="form_name" render={({ field }) => <Input {...field} placeholder="Enter Form Name" disabled={isPreviewMode} />} />
            </FormItem>
            <FormItem label={<div>Status<span className="text-red-500"> * </span></div>} invalid={!!errors.status} errorMessage={errors.status?.message}>
              <Controller control={control} name="status" render={({ field }) => <Select {...field} options={FORM_STATUS_OPTIONS} placeholder="Select Status" value={FORM_STATUS_OPTIONS.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isDisabled={isPreviewMode} />} />
            </FormItem>
          </div>
          <div className="md:grid grid-cols-2 gap-3 mt-4">
            <FormItem label={<div>Departments<span className="text-red-500"> * </span></div>} invalid={!!errors.department_ids} errorMessage={errors.department_ids?.message as string}>
              <Controller control={control} name="department_ids"
                render={({ field }) => (
                  <Select isMulti placeholder="Select Departments" options={departmentOptionsForSelect}
                    value={departmentOptionsForSelect.filter(opt => field.value?.includes(opt.value))}
                    onChange={opts => field.onChange(opts ? opts.map(o => o.value) : [])} 
                    isDisabled={isPreviewMode}/>
                )} />
            </FormItem>
            <FormItem label={<div>Categories<span className="text-red-500"> * </span></div>} invalid={!!errors.category_ids} errorMessage={errors.category_ids?.message as string}>
              <Controller control={control} name="category_ids"
                render={({ field }) => (
                  <Select isMulti placeholder="Select Categories" options={categoryOptionsForSelect}
                    value={categoryOptionsForSelect.filter(opt => field.value?.includes(opt.value))}
                    onChange={opts => field.onChange(opts ? opts.map(o => o.value) : [])} 
                    isDisabled={isPreviewMode}/>
                )} />
            </FormItem>
          </div>
          <Card className="mt-6" bodyClass="p-4">
            <FormItem label={<div>Form Display Title<span className="text-red-500"> * </span></div>} invalid={!!errors.form_title} errorMessage={errors.form_title?.message}>
              <Controller control={control} name="form_title" render={({ field }) => <Input {...field} placeholder="Enter Form Display Title" disabled={isPreviewMode} />} />
            </FormItem>
            <FormItem label="Form Display Description" invalid={!!errors.form_description} errorMessage={errors.form_description?.message}>
              <Controller control={control} name="form_description" render={({ field }) => <Input {...field} textArea rows={3} placeholder="Write a brief description" disabled={isPreviewMode} />} />
            </FormItem>
          </Card>
          <div className="mt-6">
            <h5 className="text-lg font-semibold mb-2">Form Structure</h5>
            {errors.sections && !Array.isArray(errors.sections) && <p className="text-red-500 text-xs mb-2">{(errors.sections as any).message}</p>}
            {sectionFields.map((sectionField, index) => <SectionComponent key={sectionField.id} sectionIndex={index} control={control} removeSection={removeSection} watch={watch} isPreviewMode={isPreviewMode} />)}
            {!isPreviewMode && (
              <div className="mt-4 text-right">
                <Button type="button" variant="solid" icon={<TbLayoutList />} onClick={() => appendSection({ section_title: `Section ${sectionFields.length + 1}`, section_description: "", questions: [{ question_text: "", question_type: pageQuestionTypeValues[0], is_required: false, options: [] }] })}>Add Section</Button>
              </div>
            )}
          </div>
          <div className="text-right mt-6">
            {isPreviewMode ? (
              <Button type="button" variant="solid" onClick={() => navigate("/system-tools/form-builder")}>Close Preview</Button>
            ) : (
              <>
                <Button type="button" className="mr-2 w-24" onClick={() => navigate("/system-tools/form-builder")}>Cancel</Button>
                <Button type="submit" variant="solid" className="w-24" loading={isSubmitting || isLoading} disabled={!isValid || isSubmitting || isLoading}>
                  {isEditMode ? "Save" : "Create"} 
                </Button>
              </>
            )}
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default FormBuilderManagePage;
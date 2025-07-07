// src/views/your-path/FormBuilderManagePage.tsx

import React, { useEffect, useState, useMemo } from "react";
import { useForm, Controller, useFieldArray, Control } from "react-hook-form";
import { NavLink, useNavigate, useParams, useLocation } from "react-router-dom";
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
import { DatePicker, Radio } from "@/components/ui";
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
import StickyFooter from "@/components/shared/StickyFooter";

import {
  editFormBuilderAction,
  addFormBuilderAction,
  getDepartmentsAction,
  getCategoriesAction,
  getFormBuilderAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";

// --- Types and Schemas for this Page's Form Structure ---
export const FORM_STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Draft", label: "Draft" },
];

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
  status: z.enum(['Active', 'Inactive', 'Draft'], { required_error: "Status is required." }),
  is_external: z.boolean({ required_error: "Form type is required." }),
  department_ids: z.array(z.string()).min(1, "At least one department must be selected."),
  category_ids: z.array(z.string()).min(1, "At least one category must be selected."),
  form_title: z.string().min(1, "Form title is required").max(200),
  form_description: z.string().max(1000).optional().or(z.literal("")),
  sections: z.array(pageSectionSchema).min(1, "At least one section is required."),
});
type PageFormBuilderFormData = z.infer<typeof pageFormBuilderSchema>;

// --- Mappers ---
const mapPageTypeToApiType = (pageType: string): string => {
  const map: Record<string, string> = { Text: "text", Number: "number", Textarea: "textarea", Radio: "radio", Checkbox: "checkbox", FileUpload: "file", Date: "date", Time: "time", DateRange: "daterange", SingleChoiceDropdown: "select", MultiChoiceDropdown: "multiselect", Rating: "rating", };
  return map[pageType] || "text";
};
const mapApiTypeToPageType = (apiType: string): string => {
  const map: Record<string, string> = { text: "Text", number: "Number", textarea: "Textarea", radio: "Radio", checkbox: "Checkbox", file: "FileUpload", date: "Date", time: "Time", daterange: "DateRange", select: "SingleChoiceDropdown", dropdown: "SingleChoiceDropdown", multiselect: "MultiChoiceDropdown", rating: "Rating", };
  return map[apiType] || "Text";
};

// --- Child Components ---
const QuestionOptionItem: React.FC<{ nestIndex: [number, number]; optionIndex: number; control: Control<PageFormBuilderFormData>; removeOption: (index: number) => void; isPreviewMode: boolean; }> = ({ nestIndex, optionIndex, control, removeOption, isPreviewMode }) => {
  const [sectionIdx, questionIdx] = nestIndex;
  return (
    <div className="flex gap-1.5 items-center mb-1.5">
      <FormItem className="flex-grow mb-0" label={<span className="text-xs">Opt {optionIndex + 1} Label</span>} invalid={!!control.getFieldState(`sections.${sectionIdx}.questions.${questionIdx}.options.${optionIndex}.label`).error}><Controller control={control} name={`sections.${sectionIdx}.questions.${questionIdx}.options.${optionIndex}.label`} render={({ field }) => <Input size="sm" {...field} placeholder="Label" disabled={isPreviewMode} />} /></FormItem>
      <FormItem className="flex-grow mb-0" label={<span className="text-xs">Opt {optionIndex + 1} Value</span>} invalid={!!control.getFieldState(`sections.${sectionIdx}.questions.${questionIdx}.options.${optionIndex}.value`).error}><Controller control={control} name={`sections.${sectionIdx}.questions.${questionIdx}.options.${optionIndex}.value`} render={({ field }) => <Input size="sm" {...field} placeholder="Value" disabled={isPreviewMode} />} /></FormItem>
      {!isPreviewMode && <Button type="button" shape="circle" size="sm" icon={<TbTrash />} onClick={() => removeOption(optionIndex)} className="mt-5" disabled={isPreviewMode} />}
    </div>
  );
};

const QuestionComponent: React.FC<{ sectionIndex: number; questionIndex: number; control: Control<PageFormBuilderFormData>; removeQuestion: (index: number) => void; cloneQuestion: (questionData: PageQuestionFormData) => void; watch: any; isPreviewMode: boolean; }> = ({ sectionIndex, questionIndex, control, removeQuestion, cloneQuestion, watch, isPreviewMode }) => {
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({ control, name: `sections.${sectionIndex}.questions.${questionIndex}.options` });
  const currentQuestionType = watch(`sections.${sectionIndex}.questions.${questionIndex}.question_type`);
  const showOptionsEditor = ["Radio", "Checkbox", "SingleChoiceDropdown", "MultiChoiceDropdown"].includes(currentQuestionType);
  
  return (
      <Card className="mt-3" bodyClass="p-2 flex flex-col gap-2 bg-gray-50 dark:bg-gray-700/50 border-gray-300 border rounded-lg">
        <div className="flex justify-between items-start"><h6 className="text-sm font-semibold">Question {questionIndex + 1}</h6>{!isPreviewMode && (<div className="flex gap-1"><Button type="button" size="xs" icon={<TbCopy />} title="Clone Question" onClick={() => cloneQuestion(watch(`sections.${sectionIndex}.questions.${questionIndex}`))} /><Button type="button" size="xs" icon={<TbTrash />} title="Delete Question" onClick={() => removeQuestion(questionIndex)} /></div>)}</div>
        <div className="grid md:grid-cols-3 gap-2">
        <FormItem className="mb-0" label="Question Text" invalid={!!control.getFieldState(`sections.${sectionIndex}.questions.${questionIndex}.question_text`).error} errorMessage={control.getFieldState(`sections.${sectionIndex}.questions.${questionIndex}.question_text`).error?.message}><Controller control={control} name={`sections.${sectionIndex}.questions.${questionIndex}.question_text`} render={({ field }) => <Input {...field} placeholder="Write Question" disabled={isPreviewMode} />} /></FormItem>
        <FormItem className="mb-0" label="Answer Type" invalid={!!control.getFieldState(`sections.${sectionIndex}.questions.${questionIndex}.question_type`).error} errorMessage={control.getFieldState(`sections.${sectionIndex}.questions.${questionIndex}.question_type`).error?.message}><Controller control={control} name={`sections.${sectionIndex}.questions.${questionIndex}.question_type`} render={({ field }) => <Select placeholder="Select Answer Type" options={PAGE_QUESTION_TYPE_OPTIONS} value={PAGE_QUESTION_TYPE_OPTIONS.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} isDisabled={isPreviewMode} />} /></FormItem><FormItem label=" " className="flex items-center pt-5 mb-0"><Controller name={`sections.${sectionIndex}.questions.${questionIndex}.is_required`} control={control} render={({ field }) => <Checkbox checked={field.value} onChange={field.onChange} disabled={isPreviewMode}>Required</Checkbox>} /></FormItem></div>
        {showOptionsEditor && (<Card bodyClass="p-2 bg-gray-100 dark:bg-gray-800 rounded"><h6 className="text-xs font-semibold mb-2">Options:</h6>{optionFields.map((optField, optIndex) => <QuestionOptionItem key={optField.id} nestIndex={[sectionIndex, questionIndex]} optionIndex={optIndex} control={control} removeOption={removeOption} isPreviewMode={isPreviewMode} />)}{!isPreviewMode && <Button type="button" size="sm" icon={<TbPlus />} onClick={() => appendOption({ label: "", value: "" })}>Add Option</Button>}</Card>)}
        {isPreviewMode && currentQuestionType === "Text" && <Input type="text" placeholder="Preview: Text Input" disabled />}
        {isPreviewMode && currentQuestionType === "Number" && <Input type="number" placeholder="Preview: Number Input" disabled />}
        {isPreviewMode && currentQuestionType === "Textarea" && <Input textArea placeholder="Preview: Text Area" disabled />}
        {isPreviewMode && currentQuestionType === "FileUpload" && <Input type="file" disabled />}
        {isPreviewMode && currentQuestionType === "Date" && <DatePicker placeholder="Preview: Date Picker" disabled />}
      </Card>
  );
};

const SectionComponent: React.FC<{ sectionIndex: number; control: Control<PageFormBuilderFormData>; removeSection: (index: number) => void; watch: any; isPreviewMode: boolean; }> = ({ sectionIndex, control, removeSection, watch, isPreviewMode }) => {
  const { fields, append, remove } = useFieldArray({ control, name: `sections.${sectionIndex}.questions` });
  const cloneQuestion = (questionData: PageQuestionFormData) => append(JSON.parse(JSON.stringify(questionData)));
  return (
    <Card className="mt-3" bodyClass="p-3">
      <div className="flex justify-between items-center mb-2"><h6 className="font-semibold">Section {sectionIndex + 1}</h6></div>
      <div className="space-y-2 grid grid-cols-2 md:grid-cols-2 gap-2">
        <FormItem label="Section Title" invalid={!!control.getFieldState(`sections.${sectionIndex}.section_title`).error} errorMessage={control.getFieldState(`sections.${sectionIndex}.section_title`).error?.message}><Controller control={control} name={`sections.${sectionIndex}.section_title`} render={({ field }) => <Input {...field} placeholder="Enter Section Title" disabled={isPreviewMode} />} /></FormItem>
        <FormItem label="Section Description (Optional)" invalid={!!control.getFieldState(`sections.${sectionIndex}.section_description`).error} errorMessage={control.getFieldState(`sections.${sectionIndex}.section_description`).error?.message}><Controller control={control} name={`sections.${sectionIndex}.section_description`} render={({ field }) => <Input {...field} placeholder="Enter Section Description" disabled={isPreviewMode} />} /></FormItem>
      </div>
      {fields.map((questionField, questionIndex) => <QuestionComponent key={questionField.id} sectionIndex={sectionIndex} questionIndex={questionIndex} control={control} removeQuestion={remove} cloneQuestion={cloneQuestion} watch={watch} isPreviewMode={isPreviewMode} />)}
      {control.getFieldState(`sections.${sectionIndex}.questions`).error && !Array.isArray(control.getFieldState(`sections.${sectionIndex}.questions`).error) && <p className="text-red-500 text-xs mt-1">{(control.getFieldState(`sections.${sectionIndex}.questions`) as any).message}</p>}
      {!isPreviewMode && (<div className="flex justify-between items-center mt-3"><Button type="button" size="sm" icon={<TbCirclePlus />} onClick={() => append({ question_text: "", question_type: pageQuestionTypeValues[0], is_required: false, options: [] })}>Add Question</Button>{sectionIndex > 0 && <Button type="button" size="sm" variant="plain" className="text-red-500" icon={<TbTrash />} title="Delete Section" onClick={() => removeSection(sectionIndex)}>Delete Section</Button>}</div>)}
    </Card>
  );
};

// --- Main Form Builder Page ---
const FormBuilderManagePage = () => {
  const { id: formIdFromParams } = useParams<{ id?: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isPreviewMode = useMemo(() => new URLSearchParams(location.search).get("preview") === "true", [location.search]);
  const cloneFromId = useMemo(() => new URLSearchParams(location.search).get("cloneFrom"), [location.search]);
  const isEditMode = !!formIdFromParams && !cloneFromId;
  const [isLoading, setIsLoading] = useState(false);

  const { formsData = [], CategoriesData = [], departmentsData = { data: [] } } = useSelector(masterSelector);

  const departmentOptionsForSelect = useMemo(() => (departmentsData?.data || []).map((d: DepartmentListItem) => ({ value: String(d.id), label: d.name })), [departmentsData?.data]);
  const categoryOptionsForSelect = useMemo(() => (CategoriesData || []).map((c: GeneralCategoryListItem) => ({ value: String(c.id), label: c.name })), [CategoriesData]);

  const formMethods = useForm<PageFormBuilderFormData>({
    resolver: zodResolver(pageFormBuilderSchema),
    defaultValues: {
      form_name: "", 
      status: "Draft",
      is_external: false,
      department_ids: [], 
      category_ids: [],
      form_title: "", 
      form_description: "",
      sections: [{ section_title: "Section 1", section_description: "", questions: [{ question_text: "", question_type: pageQuestionTypeValues[0], is_required: false, options: [] }] }],
    },
    mode: "onChange",
  });
  const { control, handleSubmit, reset, watch, formState: { errors, isValid, isSubmitting } } = formMethods;
  const { fields: sectionFields, append: appendSection, remove: removeSection } = useFieldArray({ control, name: "sections" });

  useEffect(() => {
    if (!departmentsData?.data.length) dispatch(getDepartmentsAction());
    if (!CategoriesData.length) dispatch(getCategoriesAction());
    const idForLoadingCheck = formIdFromParams || cloneFromId;
    if (idForLoadingCheck && !formsData.length) {
      dispatch(getFormBuilderAction());
    }
  }, [dispatch, formIdFromParams, cloneFromId, formsData.length, departmentsData?.data.length, CategoriesData.length]);

  const parseIdArray = (ids: any): string[] => {
    if (!ids) return [];
    if (Array.isArray(ids)) return ids.map(String);
    if (typeof ids === 'number' || typeof ids === 'string') return [String(ids)];
    if (typeof ids === 'string') { try { const parsed = JSON.parse(ids); if (Array.isArray(parsed)) return parsed.map(String); } catch (e) { return []; } }
    return [];
  };

  useEffect(() => {
    const idToLoad = formIdFromParams || cloneFromId;
    if (idToLoad && formsData.length > 0) {
      setIsLoading(true);
      const formDataFromRedux = formsData.find((form: any) => String(form.id) === String(idToLoad));
      if (formDataFromRedux) {
        let parsedPageSections: PageSectionFormData[] = [];
        try {
          const backendSectionsArray: any[] = JSON.parse(formDataFromRedux.section || "[]");
          if (Array.isArray(backendSectionsArray)) {
            parsedPageSections = backendSectionsArray.map((backendSec: any) => ({
              section_title: backendSec.title || "",
              section_description: backendSec.description || "",
              questions: Array.isArray(backendSec.questions)
                ? backendSec.questions.map((backendQues: any) => ({
                    question_text: backendQues.question || "",
                    question_type: mapApiTypeToPageType(backendQues.question_type || "text"),
                    is_required: backendQues.required || false,
                    options: (backendQues.question_option && typeof backendQues.question_option === 'string' && backendQues.question_label && typeof backendQues.question_label === 'string')
                               ? backendQues.question_option.split(',').map((val: string, index: number) => ({ id: String(Math.random()), label: backendQues.question_label.split(',')[index]?.trim() || val.trim(), value: val.trim() }))
                               : [],
                  })) : [],
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
          status: (FORM_STATUS_OPTIONS.some(o => o.value === formDataFromRedux.status) ? formDataFromRedux.status : 'Draft') as "Active" | "Inactive" | "Draft",
          is_external: formDataFromRedux.is_external || false,
          department_ids: parseIdArray(formDataFromRedux.department_ids),
          category_ids: parseIdArray(formDataFromRedux.category_ids),
          form_title: formDataFromRedux.form_title || "",
          form_description: formDataFromRedux.form_description || "",
          sections: parsedPageSections,
        };

        if (cloneFromId && !isPreviewMode) {
          baseResetData.form_name = `${formDataFromRedux.form_name || "Form"} (Copy)`;
          baseResetData.status = "Draft";
        }
        
        reset(baseResetData);
      } else if (!isPreviewMode) {
        toast.push(<Notification title="Error" type="danger">Form not found.</Notification>);
        navigate("/system-tools/form-builder");
      }
      setIsLoading(false);
    } else if (!isEditMode && !isPreviewMode && !cloneFromId) {
      reset();
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
      is_external: data.is_external ? 1: 0,
      department_ids: JSON.stringify(data.department_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id))),
      category_ids: JSON.stringify(data.category_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id))),
      form_title: data.form_title,
      form_description: data.form_description,
      section: JSON.stringify(apiPayloadSection),
    };

    try {
      if (isEditMode) {
        await dispatch(editFormBuilderAction({ id: formIdFromParams as string, ...finalPayload })).unwrap();
        toast.push(<Notification title="Success" type="success">Form updated successfully!</Notification>);
      } else {
        await dispatch(addFormBuilderAction(finalPayload)).unwrap();
        toast.push(<Notification title="Success" type="success">Form {cloneFromId ? 'cloned and ' : ''}created successfully!</Notification>);
      }
      navigate("/system-tools/form-builder");
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || "Operation failed.";
      toast.push(<Notification title="Error" type="danger">{errorMsg}</Notification>);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && (isEditMode || isPreviewMode || !!cloneFromId)) {
    return <Container className="h-full"><Card><p>Loading form data...</p></Card></Container>;
  }

  let pageTitleText = "Add New Form";
  if (isPreviewMode) pageTitleText = "Preview Form";
  else if (isEditMode) pageTitleText = "Edit Form";
  else if (cloneFromId) pageTitleText = "Clone Form (Creating New)";

  return (
    <Container className="h-full">
      <div className="flex items-center mb-3">
        <NavLink to="/system-tools/form-builder" className="flex items-center gap-1 group">
            <h5 className="font-semibold group-hover:text-primary-600">Form Builder</h5>
        </NavLink>
        <BiChevronRight size={22} />
        <h5 className="font-semibold text-gray-400">{pageTitleText}</h5>
      </div>
      <Form onSubmit={handleSubmit(onSubmit)} className="pb-20">
        <Card className="mb-3" bodyClass="p-4">
          <h6 className="font-semibold mb-3">Form Information</h6>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <FormItem label={<div>Form Name<span className="text-red-500"> *</span></div>} className="md:col-span-2" invalid={!!errors.form_name} errorMessage={errors.form_name?.message}>
              <Controller control={control} name="form_name" render={({ field }) => <Input {...field} placeholder="Enter Form Name" disabled={isPreviewMode} />} />
            </FormItem>
            <FormItem label={<div>Status<span className="text-red-500"> *</span></div>} invalid={!!errors.status} errorMessage={errors.status?.message}>
              <Controller control={control} name="status" render={({ field }) => <Select {...field} options={FORM_STATUS_OPTIONS} placeholder="Select Status" value={FORM_STATUS_OPTIONS.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isDisabled={isPreviewMode} />} />
            </FormItem>
             <FormItem label="Form Type *" invalid={!!errors.is_external} errorMessage={errors.is_external?.message as string} className="pt-2 md:pt-0">
                <Controller
                  name="is_external"
                  control={control}
                  render={({ field }) => (
                    <Radio.Group value={String(field.value)} onChange={(val) => field.onChange(val === 'true')} disabled={isPreviewMode}>
                      <Radio value="false">Internal</Radio>
                      <Radio value="true">External</Radio>
                    </Radio.Group>
                  )}
                />
            </FormItem>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2">
            <FormItem label={<div>Departments<span className="text-red-500"> *</span></div>} invalid={!!errors.department_ids} errorMessage={errors.department_ids?.message as string}>
              <Controller control={control} name="department_ids" render={({ field }) => (<Select isMulti placeholder="Select Departments" options={departmentOptionsForSelect} value={departmentOptionsForSelect.filter(opt => field.value?.includes(opt.value))} onChange={opts => field.onChange(opts ? opts.map(o => o.value) : [])} isDisabled={isPreviewMode}/>)} />
            </FormItem>
            <FormItem label={<div>Categories<span className="text-red-500"> *</span></div>} invalid={!!errors.category_ids} errorMessage={errors.category_ids?.message as string}>
              <Controller control={control} name="category_ids" render={({ field }) => (<Select isMulti placeholder="Select Categories" options={categoryOptionsForSelect} value={categoryOptionsForSelect.filter(opt => field.value?.includes(opt.value))} onChange={opts => field.onChange(opts ? opts.map(o => o.value) : [])} isDisabled={isPreviewMode}/>)} />
            </FormItem>
            <FormItem label={<div>Form Display Title<span className="text-red-500"> *</span></div>} invalid={!!errors.form_title} errorMessage={errors.form_title?.message}>
              <Controller control={control} name="form_title" render={({ field }) => <Input {...field} placeholder="Enter Form Display Title" disabled={isPreviewMode} />} />
            </FormItem>
            <FormItem className="mb-0" label="Form Display Description" invalid={!!errors.form_description} errorMessage={errors.form_description?.message}>
              <Controller control={control} name="form_description" render={({ field }) => <Input {...field}  placeholder="Write a brief description" disabled={isPreviewMode} />} />
            </FormItem>
          </div>
        </Card>

        <div className="mt-3">
          <h6 className="font-semibold mb-1 pl-2">Form Structure</h6>
          {errors.sections && !Array.isArray(errors.sections) && <p className="text-red-500 text-xs mb-2">{(errors.sections as any).message}</p>}
          {sectionFields.map((sectionField, index) => <SectionComponent key={sectionField.id} sectionIndex={index} control={control} removeSection={removeSection} watch={watch} isPreviewMode={isPreviewMode} />)}
          {!isPreviewMode && (
            <div className="mt-3 text-right">
              <Button type="button" variant="solid" icon={<TbLayoutList />} onClick={() => appendSection({ section_title: `Section ${sectionFields.length + 1}`, section_description: "", questions: [{ question_text: "", question_type: pageQuestionTypeValues[0], is_required: false, options: [] }] })}>Add Section</Button>
            </div>
          )}
        </div>
        
        {!isPreviewMode && (
            <StickyFooter
                className="py-4 px-4 flex items-center justify-end mt-3"
                stickyClass="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border rounded-lg bg-white dark:bg-gray-800 shadow-lg"
            >
                <div className="flex items-center gap-2">
                    <Button size="sm" type="button" className="w-24" onClick={() => navigate("/system-tools/form-builder")}>Cancel</Button>
                    <Button size="sm" type="submit" variant="solid" className="w-28" loading={isSubmitting || isLoading} disabled={!isValid || isSubmitting || isLoading}>
                        {isEditMode ? "Save Form" : "Create Form"} 
                    </Button>
                </div>
            </StickyFooter>
        )}
      </Form>

      {isPreviewMode && (
         <div className="mt-3 text-right">
            <Button type="button" variant="solid" onClick={() => navigate("/system-tools/form-builder")}>Close Preview</Button>
         </div>
      )}
    </Container>
  );
};

export default FormBuilderManagePage;
// src/views/companies/CompanyFormPage.tsx (or your chosen path)
import React, { useEffect, useState, ReactNode, useMemo, useCallback } from 'react'; // Added useCallback
import { useForm, Controller, Control, UseFormReturn, useFieldArray } from 'react-hook-form'; // Added useFieldArray
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import isEmpty from 'lodash/isEmpty';

// Redux
import { useAppDispatch } from '@/reduxtool/store';
import { shallowEqual, useSelector } from 'react-redux';
import { getCategoriesAction } from '@/reduxtool/master/middleware';
import { masterSelector } from '@/reduxtool/master/masterSlice';

// UI Components
import { Form, FormItem } from '@/components/ui/Form';
import Card from '@/components/ui/Card';
import Container from '@/components/shared/Container';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { BiChevronRight } from 'react-icons/bi';
import { TbCirclePlus, TbCopy, TbLayoutList, TbPlus, TbTrash, TbLoader } from 'react-icons/tb'; // Added TbLoader
import { DatePicker, Radio, Switcher, Tooltip, Checkbox, Notification, toast } from '@/components/ui'; // Added Notification, toast

// --- Define Types (Assuming these are consistent or imported from a shared types file) ---
export type CategoryListItem = { id: string | number; name: string; };
export type SelectOption = { value: string; label: string };

// Types for the dynamic form builder itself
export type FormQuestionOption = {
    // id?: string; // Optional, for backend or unique key if needed
    value: string;
    label: string;
};

export type FormQuestion = {
    id: string; // Unique ID for React key, useFieldArray
    questionText: string;
    questionType: string | null;
    options?: FormQuestionOption[]; // For Radio, Checkbox, Dropdowns
    isRequired: boolean;
};

export type FormSection = {
    id: string; // Unique ID for React key, useFieldArray
    sectionTitle: string;
    sectionDescription?: string;
    questions: FormQuestion[];
};

// Main form data structure
export type FormBuilderData = {
    id?: string; // Present in edit mode
    formName: string;
    status: string | null;
    departmentName: string | null;
    categoryId: string | null; // Storing ID
    formTitle: string;
    formDescription?: string;
    sections: FormSection[];
};


// Simulated DB for forms - in a real app, this would be your backend/API
// We'll move this to a more appropriate place (like a service file) if doing full Redux later.
let simulatedFormsDB: FormBuilderData[] = [
    {
        id: 'form123',
        formName: 'Employee Onboarding Survey',
        status: 'Active',
        departmentName: 'HR',
        categoryId: '1', // Assuming category with ID '1' is 'Electronics' from your options
        formTitle: 'Welcome to the Team!',
        formDescription: 'Please complete this survey to help us improve your onboarding experience.',
        sections: [
            {
                id: 'section_abc',
                sectionTitle: 'Personal Information',
                questions: [
                    { id: 'q_name', questionText: 'Your Full Name', questionType: 'Text', isRequired: true },
                    { id: 'q_dept', questionText: 'Your Department', questionType: 'Single-Choice Dropdown', options: [{value: 'eng', label: 'Engineering'}, {value: 'mkt', label: 'Marketing'}], isRequired: true },
                ]
            }
        ]
    }
];


// --- Question Component ---
type QuestionComponentProps = {
  sectionIndex: number;
  questionIndex: number;
  control: Control<FormBuilderData>;
  removeQuestion: (sectionIndex: number, questionIndex: number) => void;
  // createQuestion: (sectionIndex: number, queType?: string | null) => void; // For cloning inside question
};

const QuestionComponent: React.FC<QuestionComponentProps> = ({ sectionIndex, questionIndex, control, removeQuestion }) => {
  const questionTypes = [ /* ... same as before ... */ ];
  const [currentQuestionType, setCurrentQuestionType] = useState<string | null>(null); // Manage this with RHF value

  const questionPath = `sections.${sectionIndex}.questions.${questionIndex}` as const;
  const watchedQuestionType = useForm().watch(`${questionPath}.questionType`); // Use RHF's watch

  useEffect(() => {
    setCurrentQuestionType(watchedQuestionType);
  }, [watchedQuestionType]);

  const onQuestionTypeChange = (selectedOption: SelectOption | null, fieldOnChange: (value: any) => void) => {
    const newType = selectedOption ? selectedOption.value : null;
    fieldOnChange(newType); // Update RHF
    // setCurrentQuestionType(newType); // RHF watch will update this
  };

  return (
    <Card className="mt-2 bg-slate-50 dark:bg-slate-700/50" bodyClass="p-3 flex flex-col gap-3">
      <div className="md:grid grid-cols-2 gap-2">
        <Controller
          control={control}
          name={`${questionPath}.questionText`}
          defaultValue=""
          render={({ field, fieldState }) => (
            <FormItem label={`Question ${questionIndex + 1}`} invalid={fieldState.invalid} errorMessage={fieldState.error?.message}>
                <Input {...field} type="text" placeholder="Write Question" />
            </FormItem>
          )}
        />
        <div className='flex gap-2 items-end'> {/* items-end to align with FormItem label */}
          <Controller
            control={control}
            name={`${questionPath}.questionType`}
            defaultValue={null}
            render={({ field, fieldState }) => (
                <FormItem className="w-full" label="Answer Type" invalid={fieldState.invalid} errorMessage={fieldState.error?.message}>
                    <Select
                        placeholder="Select Answer Type"
                        value={questionTypes.map(type => ({ label: type, value: type })).find(opt => opt.value === field.value)}
                        onChange={(opt) => onQuestionTypeChange(opt, field.onChange)}
                        options={questionTypes.map(type => ({ label: type, value: type }))}
                    />
                </FormItem>
            )}
          />
          {/* Add More Options button - needs to interact with useFieldArray for options */}
        </div>
      </div>

      {/* ... Conditional rendering for answer previews ... */}
      {/* Text, Number, Textarea, File Upload, Date, Time, DateRange */}
      {/* Radio, Checkbox, Dropdowns will need a nested useFieldArray for their options */}

      <div className='flex gap-4 justify-end items-center mt-2 pt-2 border-t dark:border-slate-600'>
        <Controller
            name={`${questionPath}.isRequired`}
            control={control}
            defaultValue={false}
            render={({ field }) => (
                <div className='flex gap-2 items-center'>
                    <span>Required</span>
                    <Switcher checked={field.value} onChange={field.onChange} />
                </div>
            )}
        />
        {/* <Tooltip title="Clone Question">
          <Button size="xs" type='button' icon={<TbCopy />} onClick={() => {
            // Implement cloning logic - get current question data and append
          }}></Button>
        </Tooltip> */}
        <Tooltip title="Delete Question">
          <Button size="xs" type='button' variant="twoTone" color="red-600" icon={<TbTrash />} onClick={() => removeQuestion(sectionIndex, questionIndex)} ></Button>
        </Tooltip>
      </div>
    </Card>
  );
};


// --- Section Component ---
type SectionComponentProps = {
  sectionIndex: number;
  control: Control<FormBuilderData>;
  removeSection: (index: number) => void;
};

const SectionComponent: React.FC<SectionComponentProps> = ({ sectionIndex, control, removeSection }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.questions`
  });

  const addQuestionToSection = () => {
    append({
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, // More unique ID
      questionText: '',
      questionType: null,
      isRequired: false,
      options: []
    });
  };

  const removeQuestionFromSection = (qIndex: number) => {
    if (fields.length > 1) {
        remove(qIndex);
    } else {
        toast.push(<Notification type="warning" title="Cannot remove the last question in a section." duration={2000} />)
    }
  };

  return (
    <Card className="mt-4 border border-slate-200 dark:border-slate-700" bodyClass="p-4">
      <div className="flex justify-between items-center mb-3">
        <Controller
            control={control}
            name={`sections.${sectionIndex}.sectionTitle`}
            defaultValue={`Section ${sectionIndex + 1}`}
            render={({ field, fieldState }) => (
                <FormItem label={`Section ${sectionIndex + 1} Title`} invalid={fieldState.invalid} errorMessage={fieldState.error?.message} className="flex-grow mr-4">
                    <Input {...field} placeholder="Enter Section Title" className="text-lg font-semibold"/>
                </FormItem>
            )}
        />
        <div className="flex gap-2">
          <Button type="button" variant='solid' size="sm" icon={<TbPlus />} onClick={addQuestionToSection}>Add Question</Button>
          {/* Allow removing any section if there's more than one, or the only one if desired */}
          <Button type="button" variant='twoTone' size="sm" color='red-600' icon={<TbTrash />} onClick={() => removeSection(sectionIndex)} />
        </div>
      </div>
      <Controller
        control={control}
        name={`sections.${sectionIndex}.sectionDescription`}
        defaultValue=""
        render={({ field }) => (
            <FormItem label="Section Description (Optional)">
                <Input {...field} textArea rows={2} placeholder="Enter Section Description" />
            </FormItem>
        )}
      />

      <div className="mt-4 space-y-3">
        {fields.map((questionField, qIndex) => (
          <QuestionComponent
            key={questionField.id} // useFieldArray provides id
            sectionIndex={sectionIndex}
            questionIndex={qIndex}
            control={control}
            removeQuestion={removeQuestionFromSection}
          />
        ))}
        {fields.length === 0 && (
            <div className="text-center py-4 text-slate-500">
                No questions in this section yet. Click "Add Question" to start.
            </div>
        )}
      </div>
    </Card>
  );
};


// --- Main Form Page (Add/Edit) ---
const FormBuilderFormPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { formId } = useParams<{ formId?: string }>();
  const isEditMode = !!formId;

  const [isLoadingForm, setIsLoadingForm] = useState(false); // For fetching form in edit mode
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { CategoriesData = [], status: masterLoadingStatus } = useSelector(masterSelector, shallowEqual);

  const { control, handleSubmit, formState: { errors, isDirty }, reset, watch } = useForm<FormBuilderData>({
    defaultValues: {
        formName: '',
        status: null,
        departmentName: null,
        categoryId: null,
        formTitle: '',
        formDescription: '',
        sections: [{
            id: `s_${Date.now()}`,
            sectionTitle: 'Section 1',
            sectionDescription: '',
            questions: [{
                id: `q_${Date.now()}`,
                questionText: '',
                questionType: null,
                isRequired: false,
                options: []
            }]
        }]
    }
    // No Zod resolver here as the structure is complex with useFieldArray
    // Validation would be per-field or with a custom validation function if using Zod for the whole thing.
  });

  const { fields: sectionFields, append: appendSection, remove: removeSection, replace: replaceSections } = useFieldArray({
    control,
    name: "sections"
  });

  const fetchFormForEdit = useCallback(async (id: string) => {
    setIsLoadingForm(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const existingForm = simulatedFormsDB.find(f => f.id === id);
    if (existingForm) {
      reset(existingForm); // Reset the entire form with fetched data
    } else {
      toast.push(<Notification title="Error" type="danger" duration={3000}>Form not found.</Notification>);
      navigate('/system-tools/form-builder'); // Or your listing page
    }
    setIsLoadingForm(false);
  }, [reset, navigate]);

  useEffect(() => {
    dispatch(getCategoriesAction());
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && formId) {
      fetchFormForEdit(formId);
    } else {
      // Ensure form is reset for "Add" mode, especially if navigating from an edit page
      reset({ /* initial default values for add mode */
        formName: '', status: null, departmentName: null, categoryId: null, formTitle: '', formDescription: '',
        sections: [{ id: `s_${Date.now()}`, sectionTitle: 'Section 1', sectionDescription: '', questions: [{ id: `q_${Date.now()}`, questionText: '', questionType: null, isRequired: false, options: [] }] }]
      });
    }
  }, [isEditMode, formId, fetchFormForEdit, reset]);


  const categoryOptions: SelectOption[] = useMemo(() => {
    if (!Array.isArray(CategoriesData)) return [];
    return CategoriesData.map((category: CategoryListItem) => ({
      value: String(category.id),
      label: category.name,
    }));
  }, [CategoriesData]);


  const addNewSection = () => {
    appendSection({
      id: `s_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, // More unique ID
      sectionTitle: `Section ${sectionFields.length + 1}`,
      sectionDescription: '',
      questions: [{
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          questionText: '',
          questionType: null,
          isRequired: false,
          options: []
      }]
    });
  };

  const removeLastSection = (index: number) => {
    if (sectionFields.length > 1) {
        removeSection(index);
    } else {
        toast.push(<Notification type="warning" title="Cannot remove the last section." duration={2000} />)
    }
  }


  const onFormSubmit = async (data: FormBuilderData) => {
    setIsSubmitting(true);
    console.log('Form Data Submitted:', JSON.stringify(data, null, 2));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isEditMode && formId) {
      // Simulate update
      const index = simulatedFormsDB.findIndex(f => f.id === formId);
      if (index !== -1) {
        simulatedFormsDB[index] = { ...simulatedFormsDB[index], ...data, id: formId }; // Ensure ID remains
      }
      toast.push(<Notification title="Form Updated Successfully (Simulated)" type="success" duration={2000} />);
    } else {
      // Simulate create
      const newForm = { ...data, id: `form_${Date.now()}` };
      simulatedFormsDB.unshift(newForm);
      toast.push(<Notification title="Form Created Successfully (Simulated)" type="success" duration={2000} />);
    }
    setIsSubmitting(false);
    navigate('/system-tools/form-builder'); // Navigate to listing page
  };

  if (isLoadingForm && isEditMode) {
    return (
        <Container className="h-full flex flex-col items-center justify-center">
            <TbLoader className="animate-spin text-4xl text-primary-500 mb-4" />
            <p>Loading form data...</p>
        </Container>
    );
  }

  return (
    <Container className="h-full">
      <div className="flex gap-1 items-center mb-3">
        <NavLink to="/system-tools/form-builder">
          <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Form Builder</h6>
        </NavLink>
        <BiChevronRight size={22} />
        <h6 className="font-semibold text-primary-600 dark:text-primary-400">
          {isEditMode ? 'Edit Form' : 'Add New Form'}
        </h6>
      </div>
      <Card>
        <h5 className="mb-6 text-xl font-semibold">
            {isEditMode ? 'Edit Form Details' : 'Form Information'}
        </h5>
        <Form onSubmit={handleSubmit(onFormSubmit)}>
          {/* Basic Form Info */}
          <div className="md:grid grid-cols-3 gap-4">
            <Controller
              control={control} name="formName" rules={{ required: 'Form name is required' }}
              render={({ field, fieldState }) => (
                <FormItem label="Form Name" className="col-span-2" invalid={fieldState.invalid} errorMessage={fieldState.error?.message}>
                  <Input {...field} type="text" placeholder='Enter Form Name' />
                </FormItem>
              )}
            />
            <Controller
              control={control} name="status" rules={{ required: 'Status is required' }}
              render={({ field, fieldState }) => (
                <FormItem label="Status" invalid={fieldState.invalid} errorMessage={fieldState.error?.message}>
                  <Select placeholder="Select Status"
                    options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]}
                    value={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }].find(opt => opt.value === field.value)}
                    onChange={(option) => field.onChange(option ? option.value : null)}
                  />
                </FormItem>
              )}
            />
          </div>
          <div className="md:grid grid-cols-2 gap-4 mt-4">
            <Controller
              control={control} name="departmentName" rules={{ required: 'Department is required' }}
              render={({ field, fieldState }) => (
                <FormItem label="Department Name" invalid={fieldState.invalid} errorMessage={fieldState.error?.message}>
                  <Select placeholder="Select Department"
                    options={[{ label: "IT", value: "IT" }, { label: "Account", value: "Account" }, /* ... more */ ]}
                    value={[{ label: "IT", value: "IT" }, { label: "Account", value: "Account" }].find(opt => opt.value === field.value)}
                    onChange={(option) => field.onChange(option ? option.value : null)}
                  />
                </FormItem>
              )}
            />
            <Controller
              control={control} name="categoryId" rules={{ required: 'Category is required' }}
              render={({ field, fieldState }) => (
                <FormItem label="Category Name" invalid={fieldState.invalid} errorMessage={fieldState.error?.message}>
                  <Select placeholder="Select Category"
                    isLoading={masterLoadingStatus === 'loading'}
                    options={categoryOptions}
                    value={categoryOptions.find(opt => opt.value === field.value)}
                    onChange={(option) => field.onChange(option ? option.value : null)}
                  />
                </FormItem>
              )}
            />
          </div>
          <Card className="my-6" bodyClass="p-5">
            <Controller
              control={control} name="formTitle" rules={{ required: 'Form title is required' }}
              render={({ field, fieldState }) => (
                <FormItem label="Form Title" invalid={fieldState.invalid} errorMessage={fieldState.error?.message}>
                  <Input {...field} type="text" placeholder='Enter Form Title' />
                </FormItem>
              )}
            />
            <Controller
              control={control} name="formDescription"
              render={({ field, fieldState }) => (
                <FormItem label="Form Description" className="mt-4" invalid={fieldState.invalid} errorMessage={fieldState.error?.message}>
                  <Input {...field} textArea rows={3} placeholder="Write Description (Optional)" />
                </FormItem>
              )}
            />
          </Card>

          {/* Dynamic Sections and Questions */}
          <h5 className="mb-4 text-lg font-semibold">Form Structure</h5>
          <div id="dynamicFormSection" className="space-y-6">
            {sectionFields.map((sectionField, index) => (
              <SectionComponent
                key={sectionField.id} // useFieldArray provides id
                sectionIndex={index}
                control={control}
                removeSection={removeLastSection} // Pass index for removal
              />
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6 text-right">
            <Button className='min-w-[160px] h-[40px] text-sm' variant='twoTone' type="button" icon={<TbLayoutList />} onClick={addNewSection}>
              Add Section
            </Button>
          </div>

          {/* Submission Buttons */}
          <div className='text-right mt-8 flex justify-end gap-3'>
            <Button type='button' className='min-w-[100px]' onClick={() => navigate('/system-tools/form-builder')}>Cancel</Button>
            <Button type='submit' variant='solid' className='min-w-[100px]' loading={isSubmitting} disabled={isSubmitting || (isEditMode && !isDirty)}>
                {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Form' : 'Save Form')}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default FormBuilderFormPage;
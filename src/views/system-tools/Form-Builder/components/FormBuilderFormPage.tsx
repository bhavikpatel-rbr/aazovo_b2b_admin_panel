// src/views/companies/CompanyFormPage.tsx (or your chosen path)
import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller, Control, useFieldArray } from 'react-hook-form'; // Added useFieldArray
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for new items

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
// import ConfirmDialog from '@/components/shared/ConfirmDialog'; // If needed for delete
// import NumericInput from '@/components/shared/NumericInput';
import { BiChevronRight } from 'react-icons/bi';
import { TbCirclePlus, TbCopy, TbTrash, TbLayoutList } from 'react-icons/tb';
import { DatePicker, Radio, Switcher, Tooltip } from '@/components/ui';

// --- Define Types (Mirroring the conceptual structure) ---
type FormOptionType = {
  id?: string; // Use string for UUIDs
  optionText: string; // Field for inputting option text
  // value: string; // Value might be same as label or derived
};

type FormQuestionType = {
  id?: string; // Use string for UUIDs
  dbId?: number | string; // To store original DB ID if editing
  questionText: string;
  questionType: string | null;
  required: boolean;
  options: FormOptionType[];
};

type FormSectionType = {
  id?: string; // Use string for UUIDs
  dbId?: number | string; // To store original DB ID if editing
  sectionTitle: string;
  sectionDescription?: string;
  questions: FormQuestionType[];
};

type FormBuilderDataType = {
  formName: string;
  status: string;
  departmentName: string;
  category: string;
  formTitle: string;
  formDescription?: string;
  sections: FormSectionType[];
};

const questionTypes = [
  'Text', 'Number', 'Textarea', 'Radio', 'Checkbox', 'File Upload',
  'Date', 'Time', 'DateRange', 'Single-Choice Dropdown', 'Multi-Choice Dropdown', 'Rating',
];

// --- Question Component ---
type QuestionProps = {
  sectionIndex: number;
  questionIndex: number;
  control: Control<FormBuilderDataType>;
  removeQuestion: (sectionIndex: number, questionIndex: number) => void;
  // cloneQuestion: (sectionIndex: number, questionIndex: number) => void; // For cloning
  question: FormQuestionType; // Current question data from field array
};

const Question = ({ sectionIndex, questionIndex, control, removeQuestion, question }: QuestionProps) => {
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.questions.${questionIndex}.options`
  });

  // Get the current question type from react-hook-form's state
  // We need to watch this field to dynamically render UI
  const currentQuestionType = control.getValues(`sections.${sectionIndex}.questions.${questionIndex}.questionType`);

  const handleAddOption = () => {
    appendOption({ id: uuidv4(), optionText: '' });
  };

  return (
    <Card className="mt-2" bodyClass="p-4 flex flex-col gap-4">
      <div className="md:grid grid-cols-2 gap-2">
        <Controller
          control={control}
          name={`sections.${sectionIndex}.questions.${questionIndex}.questionText`}
          defaultValue=""
          render={({ field }) => (
            <Input {...field} type="text" placeholder="Write Question" />
          )}
        />
        <div className='flex gap-2'>
          <Controller
            control={control}
            name={`sections.${sectionIndex}.questions.${questionIndex}.questionType`}
            defaultValue={null}
            render={({ field }) => (
              <Select
                className='w-full'
                placeholder="Select Answer Type"
                value={questionTypes.map(type => ({ label: type, value: type })).find(opt => opt.value === field.value) || null}
                onChange={(val) => field.onChange(val?.value || null)}
                options={questionTypes.map(type => ({ label: type, value: type }))}
              />
            )}
          />
          {(currentQuestionType === 'Radio' || currentQuestionType === 'Checkbox' || currentQuestionType === 'Single-Choice Dropdown' || currentQuestionType === 'Multi-Choice Dropdown') && (
            <Button className='h-10' type='button' icon={<TbCirclePlus />} onClick={handleAddOption}>Add Option</Button>
          )}
        </div>
      </div>

      {/* --- Dynamically Rendered Input based on questionType --- */}
      {currentQuestionType === 'Text' && <Input type="text" placeholder="Preview: Text Input" disabled />}
      {currentQuestionType === 'Number' && <Input type="number" placeholder="Preview: Number Input" disabled />}
      {currentQuestionType === 'Textarea' && <Input placeholder="Preview: Textarea" textArea disabled />}
      {currentQuestionType === 'File Upload' && <Input type="file" disabled />}
      {currentQuestionType === 'Date' && <DatePicker placeholder="Preview: Date" disabled />}
      {currentQuestionType === 'DateRange' && <DatePicker.RangePicker placeholder={["Start Date", "End Date"]} disabled />}
      {currentQuestionType === 'Time' && <Input type='time' disabled />}

      {(currentQuestionType === 'Radio' || currentQuestionType === 'Checkbox' || currentQuestionType === 'Single-Choice Dropdown' || currentQuestionType === 'Multi-Choice Dropdown') && (
        <div className='flex flex-col gap-2 pl-4 mt-2 border-l-2'>
          {optionFields.map((option, optIndex) => (
            <div key={option.id} className="flex items-center gap-2">
              {currentQuestionType === 'Radio' && <Radio disabled />}
              {currentQuestionType === 'Checkbox' && <Checkbox disabled />}
              <Controller
                control={control}
                name={`sections.${sectionIndex}.questions.${questionIndex}.options.${optIndex}.optionText`}
                defaultValue=""
                render={({ field }) => (
                  <Input {...field} placeholder={`Option ${optIndex + 1}`} className="flex-grow" />
                )}
              />
              {optionFields.length > 1 && (
                <Button type='button' size="sm" variant="plain" icon={<TbTrash />} onClick={() => removeOption(optIndex)} />
              )}
            </div>
          ))}
           {/* Preview for dropdowns */}
           {currentQuestionType === 'Single-Choice Dropdown' && optionFields.length > 0 && (
                <Select
                    placeholder="Preview: Single-Choice"
                    options={optionFields.map(opt => ({ label: control.getValues(`sections.${sectionIndex}.questions.${questionIndex}.options.${optionFields.indexOf(opt)}.optionText`), value: control.getValues(`sections.${sectionIndex}.questions.${questionIndex}.options.${optionFields.indexOf(opt)}.optionText`) }))}
                    disabled
                />
            )}
            {currentQuestionType === 'Multi-Choice Dropdown' && optionFields.length > 0 && (
                <Select
                    isMulti
                    placeholder="Preview: Multi-Choice"
                    options={optionFields.map(opt => ({ label: control.getValues(`sections.${sectionIndex}.questions.${questionIndex}.options.${optionFields.indexOf(opt)}.optionText`), value: control.getValues(`sections.${sectionIndex}.questions.${questionIndex}.options.${optionFields.indexOf(opt)}.optionText`) }))}
                    disabled
                />
            )}
        </div>
      )}

      {/* --- Question Actions --- */}
      <div className='flex gap-2 justify-end items-center mt-2'>
        <div className='flex gap-1 items-center'>
          <Controller
            control={control}
            name={`sections.${sectionIndex}.questions.${questionIndex}.required`}
            defaultValue={false}
            render={({ field }) => (
              <Switcher checked={field.value} onChange={(checked) => field.onChange(checked)} />
            )}
          />
          <span>Required</span>
        </div>
        {/* <Tooltip title="Clone Question">
          <Button type='button' icon={<TbCopy />} onClick={() => cloneQuestion(sectionIndex, questionIndex)}></Button>
        </Tooltip> */}
        <Tooltip title="Delete Question">
          <Button type='button' icon={<TbTrash />} onClick={() => removeQuestion(sectionIndex, questionIndex)} ></Button>
        </Tooltip>
      </div>
    </Card>
  );
};


// --- Section Component ---
type SectionProps = {
  sectionIndex: number;
  control: Control<FormBuilderDataType>;
  removeSection: (index: number) => void;
};

const Section = ({ sectionIndex, control, removeSection }: SectionProps) => {
  const { fields: questionFields, append: appendQuestion, remove: removeQuestionFn } = useFieldArray({
    control,
    name: `sections.${sectionIndex}.questions`
  });

  const handleAddQuestion = () => {
    appendQuestion({
      id: uuidv4(),
      questionText: '',
      questionType: null, // Default to null or a specific type
      required: false,
      options: [],
    });
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (questionFields.length > 0) { // Prevent removing if it's the last one (optional rule)
        removeQuestionFn(qIndex);
    } else {
        toast.push(<Notification type="info" title="Cannot remove the last question directly. You can remove the section."/>)
    }
  };

  // const handleCloneQuestion = (sectionIdx: number, questionIdx: number) => {
  //   const questionToClone = control.getValues(`sections.${sectionIdx}.questions.${questionIdx}`);
  //   appendQuestion({ ...questionToClone, id: uuidv4(), options: questionToClone.options.map(opt => ({...opt, id: uuidv4()})) });
  // };


  return (
    <Card key={control.getValues(`sections.${sectionIndex}.id`)} className="mt-4 border p-1" bodyClass="p-4">
      <div className="text-right flex justify-between items-center mb-2">
        <h6 className="text-lg font-semibold">Section - {sectionIndex + 1}</h6>
        <div className="flex gap-2">
          <Button type="button" variant="solid" color="blue" icon={<TbCirclePlus />} onClick={handleAddQuestion}>Add Question</Button>
          {control.getValues('sections').length > 1 && ( // Allow removing if not the only section
             <Tooltip title="Remove Section">
                <Button type="button" variant='soft' color="red" icon={<TbTrash />} onClick={() => removeSection(sectionIndex)} />
             </Tooltip>
          )}
        </div>
      </div>

      {/* Section Title & Description */}
      <Card className="mt-2 bg-gray-50 dark:bg-gray-700/30" bodyClass="p-4 flex flex-col gap-4">
        <Controller
          control={control}
          name={`sections.${sectionIndex}.sectionTitle`}
          defaultValue=""
          render={({ field }) => (
            <Input {...field} type="text" placeholder="Enter Section Title" />
          )}
        />
        <Controller
          control={control}
          name={`sections.${sectionIndex}.sectionDescription`}
          defaultValue=""
          render={({ field }) => (
            <Input {...field} textArea rows={2} placeholder="Description (Optional)" />
          )}
        />
      </Card>

      {/* --- Questions --- */}
      <div className="mt-3 space-y-3">
        {questionFields.map((question, qIndex) => (
          <Question
            key={question.id} // react-hook-form's field.id
            sectionIndex={sectionIndex}
            questionIndex={qIndex}
            control={control}
            removeQuestion={handleRemoveQuestion}
            // cloneQuestion={handleCloneQuestion}
            question={question as FormQuestionType} // Cast needed because RHF field type is wider
          />
        ))}
        {questionFields.length === 0 && (
            <div className="text-center py-4 text-gray-500">
                No questions in this section. Click "Add Question" to start.
            </div>
        )}
      </div>
    </Card>
  );
};


// --- Main Form Builder Component ---
const FormBuilderForm = () => {
  const navigate = useNavigate();
  const { formId } = useParams<{ formId: string }>(); // Get formId from URL
  const isEditMode = !!formId;

  const formMethods = useForm<FormBuilderDataType>({
    defaultValues: {
      formName: '',
      status: 'Active', // Default status
      departmentName: '',
      category: '',
      formTitle: '',
      formDescription: '',
      sections: [{ id: uuidv4(), sectionTitle: '', sectionDescription: '', questions: [] }], // Start with one empty section
    }
  });

  const { control, handleSubmit, reset, watch, getValues } = formMethods;

  const { fields: sectionFields, append: appendSection, remove: removeSectionFn } = useFieldArray({
    control,
    name: "sections"
  });

  const [isLoading, setIsLoading] = useState(false); // For API calls
  const [isSubmitting, setIsSubmitting] = useState(false);


  // --- Fetch data for edit mode ---
  useEffect(() => {
    if (isEditMode && formId) {
      setIsLoading(true);
      // --- SIMULATE API CALL ---
      console.log(`Fetching form data for ID: ${formId}`);
      setTimeout(() => {
        // Replace with your actual API call
        const mockFormDataFromServer: FormBuilderDataType = { // This should match your expected API response
          formName: `Edited Form ${formId}`,
          status: 'Active',
          departmentName: 'IT',
          category: 'Electronics',
          formTitle: `My Awesome Editable Form ${formId}`,
          formDescription: 'This is a description for the editable form.',
          sections: [
            {
              id: uuidv4(), // Or use dbId if you prefer
              dbId: 'sec_db_1',
              sectionTitle: 'Personal Information (Edited)',
              sectionDescription: 'Please provide your personal details.',
              questions: [
                { id: uuidv4(), dbId: 'q_db_1', questionText: 'Your Full Name?', questionType: 'Text', required: true, options: [] },
                { id: uuidv4(), dbId: 'q_db_2', questionText: 'Your Email?', questionType: 'Text', required: true, options: [] },
                {
                  id: uuidv4(), dbId: 'q_db_3', questionText: 'Gender (Edited)', questionType: 'Radio', required: false,
                  options: [
                    { id: uuidv4(), optionText: 'Male' },
                    { id: uuidv4(), optionText: 'Female' },
                  ]
                },
              ]
            },
            {
              id: uuidv4(),
              dbId: 'sec_db_2',
              sectionTitle: 'Preferences (Edited)',
              questions: [
                { id: uuidv4(), dbId: 'q_db_4', questionText: 'Favorite Color?', questionType: 'Single-Choice Dropdown', required: false, options: [ {id: uuidv4(), optionText: "Red"}, {id: uuidv4(), optionText: "Blue"} ] },
              ]
            }
          ]
        };
        // Transform fetched data if necessary to match useFieldArray structure (e.g., ensure `id` for RHF)
        const transformedData = {
            ...mockFormDataFromServer,
            sections: mockFormDataFromServer.sections.map(s => ({
                ...s,
                id: s.id || uuidv4(), // RHF needs an id for field array items
                questions: s.questions.map(q => ({
                    ...q,
                    id: q.id || uuidv4(),
                    options: q.options?.map(o => ({...o, id: o.id || uuidv4()})) || []
                }))
            }))
        };

        reset(transformedData); // Populate the form with fetched data
        setIsLoading(false);
        toast.push(<Notification title="Form Data Loaded" type="info" duration={2000} />);
      }, 1500);
    }
  }, [formId, isEditMode, reset]);

  const handleAddSection = () => {
    appendSection({
      id: uuidv4(),
      sectionTitle: '',
      sectionDescription: '',
      questions: [], // Start new sections with no questions or one default question
    });
  };
  
  const handleRemoveSection = (index: number) => {
    if (sectionFields.length > 1) {
        removeSectionFn(index);
    } else {
        toast.push(<Notification type="info" title="Cannot remove the last section."/>)
    }
  };

  const onSubmit = async (data: FormBuilderDataType) => {
    setIsSubmitting(true);
    console.log('Form Data Submitted:', JSON.stringify(data, null, 2));

    // --- API Call Logic ---
    try {
      if (isEditMode) {
        // await apiUpdateForm(formId, data); // Your API call
        toast.push(<Notification title="Form Updated Successfully!" type="success" />);
        console.log("Simulating update API call for form ID:", formId, data);
      } else {
        // await apiCreateForm(data); // Your API call
        toast.push(<Notification title="Form Created Successfully!" type="success" />);
        console.log("Simulating create API call:", data);
      }
      setTimeout(() => navigate('/system-tools/form-builder'), 1000); // Navigate back after success
    } catch (error) {
      console.error("Submission error:", error);
      toast.push(<Notification title="Submission Failed" type="danger">{(error as Error).message || 'An error occurred.'}</Notification>);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && isEditMode) {
    return <Container><Card><h5>Loading form data...</h5></Card></Container>;
  }

  return (
    <Container className="h-full pb-16"> {/* Added padding-bottom */}
      <div className="flex gap-1 items-end mb-3">
        <NavLink to="/system-tools/form-builder">
          <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">Form Builder</h6>
        </NavLink>
        <BiChevronRight size={22} />
        <h6 className="font-semibold text-primary-600 dark:text-primary-400">{isEditMode ? 'Edit Form' : 'Add New Form'}</h6>
      </div>
      <Card>
        <h5 className="mb-6">Form Information</h5>
        <Form onSubmit={handleSubmit(onSubmit)}>
          {/* --- Main Form Fields --- */}
          <div className="md:grid grid-cols-3 gap-4">
            <FormItem label="Form Name" className="col-span-3 md:col-span-2">
              <Controller
                control={control}
                name="formName"
                rules={{ required: 'Form Name is required' }}
                render={({ field, fieldState }) => (
                    <>
                        <Input {...field} type="text" placeholder='Enter Form Name' />
                        {fieldState.error && <div className="text-red-500 text-xs mt-1">{fieldState.error.message}</div>}
                    </>
                )}
              />
            </FormItem>
            <FormItem label="Status">
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={[{ label: 'Active', value: 'Active' },{ label: 'Inactive', value: 'Inactive' }].find(opt => opt.value === field.value)}
                    onChange={(val) => field.onChange(val?.value)}
                    options={[
                      { label: 'Active', value: 'Active' },
                      { label: 'Inactive', value: 'Inactive' },
                    ]}
                    placeholder="Select Status"
                  />
                )}
              />
            </FormItem>
          </div>

          <div className="md:grid grid-cols-2 gap-4 mt-4">
            <FormItem label="Department Name">
              <Controller
                control={control}
                name="departmentName"
                render={({ field }) => <Select
                  value={[{label: "IT", value: "IT"},{label: "Account", value: "Account"}].find(opt => opt.value === field.value)}
                  onChange={(val) => field.onChange(val?.value)}
                  placeholder="Select Department"
                  options={[
                    { label: "IT", value: "IT" },
                    { label: "Account", value: "Account" },
                  ]}
                />}
              />
            </FormItem>
            <FormItem label="Category Name">
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={[{ label: 'Electronics', value: 'Electronics' },{ label: 'Engineering', value: 'Engineering' }].find(opt => opt.value === field.value)}
                    onChange={(val) => field.onChange(val?.value)}
                    options={[
                      { label: 'Electronics', value: 'Electronics' },
                      { label: 'Engineering', value: 'Engineering' },
                    ]}
                    placeholder="Select Category"
                  />
                )}
              />
            </FormItem>
          </div>

          {/* --- Form Title & Description Card --- */}
          <Card className="my-6 bg-gray-50 dark:bg-gray-700/30" bodyClass="p-4">
            <FormItem label="Form Title">
              <Controller
                control={control}
                name="formTitle"
                rules={{ required: 'Form Title is required' }}
                render={({ field, fieldState }) => (
                    <>
                        <Input {...field} type="text" placeholder='Enter Form Title' />
                        {fieldState.error && <div className="text-red-500 text-xs mt-1">{fieldState.error.message}</div>}
                    </>
                )}
              />
            </FormItem>
            <FormItem label="Form Description" className="mt-4">
              <Controller
                control={control}
                name="formDescription"
                render={({ field }) => <Input {...field} textArea rows={3} placeholder="Write a brief description for the form (optional)" />}
              />
            </FormItem>
          </Card>

          {/* --- Dynamic Sections --- */}
          <h5 className="mb-3 mt-8 text-lg font-semibold">Form Sections</h5>
          <div id="dynamicFormSection" className="space-y-6">
            {sectionFields.map((section, index) => (
              <Section
                key={section.id} // react-hook-form's field.id
                sectionIndex={index}
                control={control}
                removeSection={handleRemoveSection}
              />
            ))}
            {sectionFields.length === 0 && (
                <div className="text-center py-6 text-gray-500 border-2 border-dashed rounded-md">
                    <p>No sections defined for this form.</p>
                    <p>Click "Add Section" to begin building your form structure.</p>
                </div>
            )}
          </div>
          <div className="border-t dark:border-gray-600 mt-6 pt-6 text-right">
            <Button className='w-auto px-6 h-[40px] text-sm' variant='outline' type="button" icon={<TbLayoutList />} onClick={handleAddSection}>
              Add Section
            </Button>
          </div>

          {/* --- Form Actions --- */}
          <div className='text-right mt-8 sticky bottom-0 bg-white dark:bg-gray-800 py-4 px-0 -mx-4 md:-mx-6 shadow- ऊपर'> {/* Make buttons sticky */}
            <Button type='button' className='mr-3 w-28' onClick={() => navigate('/system-tools/form-builder')}>Cancel</Button>
            <Button type='submit' variant='solid' className='w-32' loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Form' : 'Save Form')}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default FormBuilderForm;
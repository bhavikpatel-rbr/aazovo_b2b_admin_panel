// src/views/companies/CompanyFormPage.tsx (or your chosen path)
import React, { useEffect, useState, ReactNode, useMemo } from 'react'; // Added useMemo
import { useForm, Controller, Control, FieldErrors, UseFormReturn, useWatch } from 'react-hook-form';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';
// import { useAppDispatch } from '@/reduxtool/store'; // If using Redux for company actions

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
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import NumericInput from '@/components/shared/NumericInput';
import { BiChevronRight } from 'react-icons/bi';
import { TbCancel, TbCirclePlus, TbCopy, TbFileTypeTxt, TbLayoutList, TbLetterCase, TbMovie, TbPhoto, TbPlus, TbTrash } from 'react-icons/tb';
import { DatePicker, Radio, Switcher, Tooltip } from '@/components/ui';
import { useAppDispatch } from "@/reduxtool/store";
import { getCategoriesAction, getDepartmentsAction } from '@/reduxtool/master/middleware';
import { masterSelector } from '@/reduxtool/master/masterSlice';
import { useSelector } from 'react-redux';

// Define a generic option type for Select, if not already available from your UI library
type SelectOption = {
  label: string;
  value: string; // Ensure value is string as Select components often expect this
};

// Assuming your Redux state items have these structures
// Adjust if necessary
interface DepartmentItem {
  id: number | string;
  name: string;
  // other properties...
}

interface CategoryItem {
  id: number | string;
  name: string; // Or just 'name' - adjust as per your data
  // other properties...
}


type SectionProps = {
  section: { id: number };
  control: Control<any>;
  removeSection: (id: number) => void;
};

type QuestionProps = {
  question: { id: number, queType: string | null };
  section_id: number;
  control: Control<any>;
  createQuestion: (queType: string | null) => void;
  removeQuestion: (id: number) => void;
};

const Question = ({ question, section_id, control, removeQuestion, createQuestion }: QuestionProps) => {
  const questionTypes = [
    'Text',
    'Number',
    'Textarea',
    'Radio',
    'Checkbox',
    'File Upload',
    'Date',
    'Time',
    'DateRange',
    'Single-Choice Dropdown',
    'Multi-Choice Dropdown',
    'Rating',
  ];

  const questionTextName = `section_${section_id}_question_${question.id}_text`;
  const questionTypeName = `section_${section_id}_question_${question.id}_type`;
  const questionRequiredName = `section_${section_id}_question_${question.id}_required`;

  const currentRHFQuestionType = useWatch({
    control,
    name: questionTypeName,
    defaultValue: question.queType || null,
  });

  return (
    <Card className="mt-2" bodyClass="p-4 flex flex-col gap-4">
      <div className="md:grid grid-cols-2 gap-2">
        <Controller
          control={control}
          name={questionTextName}
          defaultValue=""
          render={({ field }) => (
            <Input {...field} type="text" placeholder="Write Question" />
          )}
        />
        <div className='flex gap-2'>
          <Controller
            control={control}
            name={questionTypeName}
            defaultValue={question.queType || null}
            render={({ field: { onChange, value, name, ref } }) => (
              <Select
                ref={ref}
                name={name}
                className='w-full'
                placeholder="Select Answer Type"
                value={value ? questionTypes.map(type => ({ label: type, value: type })).find(opt => opt.value === value) : null}
                onChange={(selectedOption: SelectOption | null) => {
                  onChange(selectedOption ? selectedOption.value : null);
                }}
                options={questionTypes.map(type => ({ label: type, value: type }))}
              />
            )}
          />
          {currentRHFQuestionType === 'Radio' && <Button className='h-10' type='button' icon={<TbPlus />}>Add More</Button>}
          {currentRHFQuestionType === 'Checkbox' && <Button className='h-10' type='button' icon={<TbPlus />}>Add More</Button>}
          {currentRHFQuestionType === 'Single-Choice Dropdown' && <Button className='h-10' type='button' icon={<TbPlus />}>Add More</Button>}
          {currentRHFQuestionType === 'Multi-Choice Dropdown' && <Button className='h-10' type='button' icon={<TbPlus />}>Add More</Button>}
        </div>
      </div>

      {currentRHFQuestionType === 'Text' && <Input type="text" placeholder="Text" disabled />}
      {currentRHFQuestionType === 'Number' && <Input type="number" placeholder="Number" disabled />}
      {currentRHFQuestionType === 'Radio' && (
        <div className='md:grid grid-cols-2 gap-4'>
          <span className='flex gap-2'>
            <Radio checked={false} readOnly /><Input placeholder="Option 1" disabled />
          </span>
          <span className='flex gap-2'>
            <Radio checked={false} readOnly /><Input placeholder="Option 2" disabled />
          </span>
          <span className='flex gap-2 col-span-2'>
            <Radio checked={false} readOnly /><Input placeholder="Option 3" disabled />
            <Button type='button' className='h-10 w-10' icon={<TbTrash />}></Button>
          </span>
        </div>
      )}
      {currentRHFQuestionType === 'Checkbox' && (
        <div className='md:grid grid-cols-2 gap-4'>
          <span className='flex gap-2'>
            <Checkbox checked={false} readOnly /><Input placeholder="Option 1" disabled />
          </span>
          <span className='flex gap-2'>
            <Checkbox checked={false} readOnly /><Input placeholder="Option 2" disabled />
          </span>
          <span className='flex gap-2 col-span-2'>
            <Checkbox checked={false} readOnly /><Input placeholder="Option 3" disabled />
            <Button type='button' className='h-10 w-10' icon={<TbTrash />}></Button>
          </span>
        </div>
      )}
      {currentRHFQuestionType === 'Textarea' && <Input type="text" placeholder="Textarea" textArea disabled />}
      {currentRHFQuestionType === 'File Upload' && <Input type="file" disabled />}
      {currentRHFQuestionType === 'Date' && <DatePicker disabled />}
      {currentRHFQuestionType === 'DateRange' && <DatePicker.DatePickerRange disabled />}
      {currentRHFQuestionType === 'Time' && <Input type='time' disabled />}
      {currentRHFQuestionType === 'Single-Choice Dropdown' &&
        <div className='md:grid grid-cols-2 gap-4'>
          <Select className='col-span-2'
            placeholder="Single Choice Dropdown"
            options={[{ label: "Option-1", value: "Option-1" }, { label: "Option-2", value: "Option-2" }]}
            disabled
          />
          <span className='flex gap-2'>
            <Input placeholder="Option 1" disabled />
          </span>
          <span className='flex gap-2'>
            <Input placeholder="Option 2" disabled />
          </span>
          <span className='flex gap-2 col-span-2'>
            <Input placeholder="Option 3" disabled />
            <Button type='button' className='h-10 w-10' icon={<TbTrash />}></Button>
          </span>
        </div>
      }
      {currentRHFQuestionType === 'Multi-Choice Dropdown' &&
        <div className='md:grid grid-cols-2 gap-4'>
          <Select isMulti className='col-span-2'
            placeholder="Multi Choice Dropdown"
            options={[{ label: "Option-1", value: "Option-1" }, { label: "Option-2", value: "Option-2" }]}
            disabled
          />
          <span className='flex gap-2'>
            <Input placeholder="Option 1" disabled />
          </span>
          <span className='flex gap-2'>
            <Input placeholder="Option 2" disabled />
          </span>
          <span className='flex gap-2 col-span-2'>
            <Input placeholder="Option 3" disabled />
            <Button type='button' className='h-10 w-10' icon={<TbTrash />}></Button>
          </span>
        </div>
      }
      <div className='flex gap-2 justify-end items-center'>
        <div className='flex gap-2 items-center'>
          <span>Required</span>
          <Controller
            control={control}
            name={questionRequiredName}
            defaultValue={false}
            render={({ field: { onChange, value, ref } }) => (
              <Switcher
                ref={ref}
                checked={!!value}
                onChange={(checked) => onChange(checked)}
                className='w-4'
              />
            )}
          />
        </div>
        <Tooltip title="Clone Question">
          <Button type='button' icon={<TbCopy />} onClick={() => createQuestion(currentRHFQuestionType || null)}></Button>
        </Tooltip>
        <Tooltip title="Delete Question">
          <Button type='button' icon={<TbTrash />} onClick={() => removeQuestion(question.id)} ></Button>
        </Tooltip>
      </div>
    </Card>
  )
}

const Section = ({ section, control, removeSection }: SectionProps) => {
  const [questions, setQuestions] = useState<Array<{ id: number; queType: string | null }>>([{ id: 1, queType: null }]);

  const createQuestion = (queType?: string | null) => {
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    const typeForNewQuestion = queType === undefined ? null : queType;
    setQuestions(prev => [...prev, { id: newId, queType: typeForNewQuestion }]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter(q => q.id !== id));
    } else {
      toast.push(<Notification title="Cannot Delete" type="warning">At least one question must remain in a section.</Notification>, { placement: 'top-center' });
    }
  };
   

  return (
    <Card key={section.id} className="mt-2" bodyClass="p-4">
      <div className="text-right flex justify-between items-center">
        <h6>Section - {section.id}</h6>
        <div className="flex gap-2">
          <Button type="button" icon={<TbCirclePlus />} onClick={() => createQuestion()}>Add Question</Button>
          {section.id !== 1 && ( 
            <Button type="button" icon={<TbTrash />} onClick={() => removeSection(section.id)} />
          )}
        </div>
      </div>

      <Card className="mt-2" bodyClass="p-4 flex flex-col gap-4">
        <Controller
          control={control}
          name={`section_title_${section.id}`}
          defaultValue=""
          render={({ field }) => (
            <Input {...field} type="text" placeholder="Enter Section Title" />
          )}
        />
        <Controller
          control={control}
          name={`section_description_${section.id}`}
          defaultValue=""
          render={({ field }) => (
            <Input {...field} type="text" placeholder="Description (Optional)" />
          )}
        />
      </Card>

      {questions.map(que => (
        <Question
          key={que.id}
          question={que}
          control={control}
          createQuestion={createQuestion}
          removeQuestion={removeQuestion}
          section_id={section.id}
        />
      ))}
    </Card>
  );
};

const FormBuilderForm = () => {
  const form = useForm({
    defaultValues: {
        form_name: '',
        status: null,
        department_name: null, // Will store department ID
        category: null,        // Will store category ID
        form_title: '',
        form_description: '',
    }
  });
  const [sections, setSections] = useState([{ id: 1 }]);

  const {
      CategoriesData = [],
      departmentsData = [],
      status: masterLoadingStatus = "idle",
    } = useSelector(masterSelector);

  const dispatch = useAppDispatch();

  useEffect(() => {
     
        dispatch(getDepartmentsAction());
      
     
        dispatch(getCategoriesAction());
    
    }, []); // Add dependencies

  // Memoize options to prevent re-creation on every render
  const departmentOptions = useMemo(() => {
    return (departmentsData as DepartmentItem[])?.map(dep => ({
      label: dep.name,
      value: String(dep.id) // Ensure value is a string
    }));
  }, [departmentsData]);

  const categoryOptions = useMemo(() => {
    return (CategoriesData as CategoryItem[]).map(cat => ({
      label: cat.name, // Adjust if property name is different e.g. cat.name
      value: String(cat.id)   // Ensure value is a string
    }));
  }, [CategoriesData]);


  const createSection = () => {
    const newId = sections.length > 0 ? Math.max(...sections.map(s => s.id)) + 1 : 1;
    setSections(prev => [...prev, { id: newId }]);
  };

  const removeSection = (id: number) => {
    if (sections.length > 1) {
      setSections(prev => prev.filter(section => section.id !== id));
    } else {
        toast.push(<Notification title="Cannot Delete" type="warning">At least one section must remain.</Notification>, { placement: 'top-center' });
    }
  };

  const onFormSubmit = (data: any) => {
    // The 'department_name' and 'category' fields in 'data' will now hold the IDs.
    console.log("Form Data (with IDs):", data);
    toast.push(
        <Notification title="Form Submitted Successfully" type="success" duration={3000}>
            Form data has been logged to the console.
        </Notification>, 
        { placement: 'top-center' }
    );
  };

  const onFormError = (errors: FieldErrors) => {
    console.error("Form Errors:", errors);
    toast.push(
        <Notification title="Form Error" type="danger" duration={3000}>
            Please correct the errors in the form.
        </Notification>,
        { placement: 'top-center' }
    );
  };

  return (
    <Container className="h-full">
      <div className="flex gap-1 items-end mb-3">
        <NavLink to="/system-tools/form-builder">
          <h6 className="font-semibold hover:text-primary">Form Builder</h6>
        </NavLink>
        <BiChevronRight size={22} />
        <h6 className="font-semibold text-primary">Add New Form</h6>
      </div>
      <Card>
        <h5 className="mb-6">Form Information</h5>
        <Form onSubmit={form.handleSubmit(onFormSubmit, onFormError)}>
          <div className="md:grid grid-cols-3 gap-3">
            <FormItem label="Form Name" className="col-span-2">
              <Controller
                control={form.control}
                name="form_name"
                rules={{ required: 'Form name is required' }}
                render={({ field, fieldState: { error } }) => (
                  <>
                    <Input {...field} type="text" placeholder='Enter Form Name' />
                    {error && <span className="text-red-500 text-xs">{error.message}</span>}
                  </>
                )}
              />
            </FormItem>
            <FormItem label="Status">
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value ? [{ label: 'Active', value: 'Active' },{ label: 'Inactive', value: 'Inactive' }].find(opt => opt.value === field.value) : null}
                    onChange={(option: SelectOption | null) => field.onChange(option ? option.value : null)}
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

          <div className="md:grid grid-cols-2 gap-3">
            <FormItem label="Department Name">
              <Controller
                control={form.control}
                name="department_name" // This field will store the department ID
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value ? departmentOptions.find(opt => opt.value === field.value) : null}
                    onChange={(option: SelectOption | null) => field.onChange(option ? option.value : null)}
                    options={departmentOptions}
                    placeholder="Select Department"
                    isLoading={masterLoadingStatus === "idle" && departmentOptions.length === 0}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Category Name">
              <Controller
                control={form.control}
                name="category" // This field will store the category ID
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value ? categoryOptions.find(opt => opt.value === field.value) : null}
                    onChange={(option: SelectOption | null) => field.onChange(option ? option.value : null)}
                    options={categoryOptions}
                    placeholder="Select Category"
                    isLoading={masterLoadingStatus === "idle" && categoryOptions.length === 0}
                  />
                )}
              />
            </FormItem>
          </div>

          <Card className='my-4'>
            <FormItem label="Form Title">
              <Controller
                control={form.control}
                name="form_title"
                render={({ field }) => <Input {...field} type="text" placeholder='Enter Form Title'/>}
              />
            </FormItem>
            <FormItem label="Form Description">
              <Controller
                control={form.control}
                name="form_description"
                render={({ field }) => <Input {...field} type="text" textArea placeholder="Write Description"/>}
              />
            </FormItem>
          </Card>

          <div id="dynamicFormSection">
            {sections.map(section => (
              <Section
                key={section.id}
                section={section}
                control={form.control}
                removeSection={removeSection}
              />
            ))}
          </div>
          <div className="border-gray-100 mt-3 text-right">
            <Button className='w-[200px] h-[40px] text-sm' variant='solid' type="button" icon={<TbLayoutList />} onClick={createSection}>
              Add Section
            </Button>
          </div>
          <div className='text-right mt-2'>
            <Button type='button' className='mr-2 w-24' onClick={() => form.reset()}>Cancel</Button>
            <Button type='submit' variant='solid' className='w-24'>Save</Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default FormBuilderForm;
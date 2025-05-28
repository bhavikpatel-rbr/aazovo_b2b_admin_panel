// src/views/companies/CompanyFormPage.tsx (or your chosen path)
import React, { useEffect, useState, ReactNode } from 'react';
import { useForm, Controller, Control, FieldErrors, UseFormReturn } from 'react-hook-form';
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
import NumericInput from '@/components/shared/NumericInput'; // Added
import { BiChevronRight } from 'react-icons/bi';
import { TbCancel, TbCirclePlus, TbCopy, TbFileTypeTxt, TbLayoutList, TbLetterCase, TbMovie, TbPhoto, TbPlus, TbTrash } from 'react-icons/tb';
import { DatePicker, Radio, Switcher, Tooltip } from '@/components/ui';

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

  const [questionType, setQuestionType] = useState<string | null>(question.queType || null);

  const onQuestionTypeChange = (value: { label: string; value: string }) => {
    setQuestionType(value.value);
  };
  return (
    <Card className="mt-2" bodyClass="p-4 flex flex-col gap-4">
      <div className="md:grid grid-cols-2 gap-2">
        <Controller
          control={control}
          name={`section_${section_id}_question`}
          render={({ field }) => (
            <Input {...field} type="text" placeholder="Write Question" />
          )}
        />
        <div className='flex gap-2'>
          <Select
            className='w-full'
            placeholder="Select Answer Type"
            onChange={onQuestionTypeChange}
            options={questionTypes.map(type => ({ label: type, value: type }))}
          />
          {questionType === 'Radio' && <Button className='h-10' type='button' icon={<TbPlus />}>Add More</Button>}
          {questionType === 'Checkbox' && <Button className='h-10' type='button' icon={<TbPlus />}>Add More</Button>}
          {questionType === 'Single-Choice Dropdown' && <Button className='h-10' type='button' icon={<TbPlus />}>Add More</Button>}
          {questionType === 'Multi-Choice Dropdown' && <Button className='h-10' type='button' icon={<TbPlus />}>Add More</Button>}
        </div>
      </div>
      {questionType === 'Text' && <Input type="text" placeholder="Text" disabled />}
      {questionType === 'Number' && <Input type="number" placeholder="Number" disabled />}
      {questionType === 'Radio' && (
        <div className='md:grid grid-cols-2 gap-4'>
          <span className='flex gap-2'>
            <Radio checked /><Input placeholder="Option 1" />
          </span>
          <span className='flex gap-2'>
            <Radio checked /><Input placeholder="Option 2" />
          </span>
          <span className='flex gap-2 col-span-2'>
            <Radio checked /><Input placeholder="Option 3" />
            <Button type='button' className='h-10 w-10' icon={<TbTrash />}></Button>
          </span>
        </div>
      )}
      {questionType === 'Checkbox' && (
        <div className='md:grid grid-cols-2 gap-4'>
          <span className='flex gap-2'>
            <Checkbox checked /><Input placeholder="Option 1" />
          </span>
          <span className='flex gap-2'>
            <Checkbox checked /><Input placeholder="Option 2" />
          </span>
          <span className='flex gap-2 col-span-2'>
            <Checkbox checked /><Input placeholder="Option 3" />
            <Button type='button' className='h-10 w-10' icon={<TbTrash />}></Button>
          </span>
        </div>
      )}
      {questionType === 'Textarea' && <Input type="number" placeholder="Textarea" textArea disabled />}
      {questionType === 'File Upload' && <Input type="file" disabled />}
      {questionType === 'Date' && <DatePicker disabled />}
      {questionType === 'DateRange' && <DatePicker.DatePickerRange disabled />}
      {questionType === 'Time' && <Input type='time' disabled />}
      {
        questionType === 'Single-Choice Dropdown' &&
        <div className='md:grid grid-cols-2 gap-4'>
          <Select className='col-span-2'
            placeholder="Single Choice Dropdown"
            options={[{ label: "Option-1", value: "Option-1" }, { label: "Option-2", value: "Option-2" }]}
          />
          <span className='flex gap-2'>
            <Input placeholder="Option 1" />
          </span>
          <span className='flex gap-2'>
            <Input placeholder="Option 2" />
          </span>
          <span className='flex gap-2 col-span-2'>
            <Input placeholder="Option 3" />
            <Button type='button' className='h-10 w-10' icon={<TbTrash />}></Button>
          </span>
        </div>
      }
      {
        questionType === 'Multi-Choice Dropdown' &&
        <div className='md:grid grid-cols-2 gap-4'>
          <Select isMulti className='col-span-2'
            placeholder="Single Choice Dropdown"
            options={[{ label: "Option-1", value: "Option-1" }, { label: "Option-2", value: "Option-2" }]}
          />
          <span className='flex gap-2'>
            <Input placeholder="Option 1" />
          </span>
          <span className='flex gap-2'>
            <Input placeholder="Option 2" />
          </span>
          <span className='flex gap-2 col-span-2'>
            <Input placeholder="Option 3" />
            <Button type='button' className='h-10 w-10' icon={<TbTrash />}></Button>
          </span>
        </div>
      }
      <div className='flex gap-2 justify-end items-center'>
        <div className='flex gap-2'>
          <span>Required</span>
          <Switcher className='w-4' />
        </div>
        <Tooltip title="Clone Question">
          <Button type='button' icon={<TbCopy />} onClick={()=>createQuestion(questionType)}></Button>
        </Tooltip>
        <Tooltip title="Delete Question">
          <Button type='button' icon={<TbTrash />} onClick={()=>removeQuestion()} ></Button>
        </Tooltip>
        
      </div>
    </Card>
  )
}

const Section = ({ section, control, removeSection }: SectionProps) => {

  const [questions, setQuestions] = useState<Array<{ id: number; queType: string | null }>>([{ id: 1, queType: null }])

  const createQuestion = (queType: string) => {
    console.log("que type", queType)
    if(queType){
      setQuestions(prev => [...prev, { id: prev.length + 1, queType: queType }]);
    }else{
      setQuestions(prev => [...prev, { id: prev.length + 1, queType: null}]);
    }
  };
  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter(section => section.id !== prev.length));
    }
  };

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

  const [questionType, setQuestionType] = useState<string | null>(null);

  const onQuestionTypeChange = (value: { label: string; value: string }) => {
    setQuestionType(value.value);
  };

  return (
    <Card key={section.id} className="mt-2" bodyClass="p-4">
      <div className="text-right flex justify-between">
        <h6>Section - {section.id}</h6>
        <div className="flex gap-2">
          <Button type="button" icon={<TbCirclePlus />} onClick={()=> createQuestion()}>Add Question</Button>
          {section.id !== 1 && (
            <Button type="button" icon={<TbTrash />} onClick={() => removeSection(section.id)} />
          )}
        </div>
      </div>

      {/* Section Title */}
      <Card className="mt-2" bodyClass="p-4 flex flex-col gap-4">
        <Controller
          control={control}
          name={`section_title_${section.id}`}
          render={({ field }) => (
            <Input {...field} type="text" placeholder="Enter Section Title" />
          )}
        />
        <Controller
          control={control}
          name={`section_description_${section.id}`}
          render={({ field }) => (
            <Input {...field} type="text" placeholder="Description (Optional)" />
          )}
        />
      </Card>

      {/* Question */}
      {
        questions.map(que => (
          <Question 
            question={que} 
            control={control} 
            createQuestion={createQuestion} 
            removeQuestion={removeQuestion} 
            section_id={section.id} 
            key={que.id}
          />
        ))
      }
      {/* <Card className="mt-2" bodyClass="p-4 flex flex-col gap-4">
        <div className="md:grid grid-cols-2 gap-2">
          <Controller
            control={control}
            name={`section_${section.id}_question`}
            render={({ field }) => (
              <Input {...field} type="text" placeholder="Write Question" />
            )}
          />
          <div className='flex gap-2'>
            <Select
              className='w-full'
              placeholder="Select Answer Type"
              onChange={onQuestionTypeChange}
              options={questionTypes.map(type => ({ label: type, value: type }))}
            />
            {questionType === 'Radio' && <Button className='h-10' type='button' icon={<TbPlus />}>Add More</Button>}
            {questionType === 'Checkbox' && <Button className='h-10' type='button' icon={<TbPlus />}>Add More</Button>}
            {questionType === 'Single-Choice Dropdown' && <Button className='h-10' type='button' icon={<TbPlus />}>Add More</Button>}
            {questionType === 'Multi-Choice Dropdown' && <Button className='h-10' type='button' icon={<TbPlus />}>Add More</Button>}
          </div>
        </div>
        {questionType === 'Text' && <Input type="text" placeholder="Text" disabled />}
        {questionType === 'Number' && <Input type="number" placeholder="Number" disabled />}
        {questionType === 'Radio' && (
          <div className='md:grid grid-cols-2 gap-4'>
            <span className='flex gap-2'>
              <Radio checked /><Input placeholder="Option 1" />
            </span>
            <span className='flex gap-2'>
              <Radio checked /><Input placeholder="Option 2" />
            </span>
            <span className='flex gap-2 col-span-2'>
              <Radio checked /><Input placeholder="Option 3" />
              <Button type='button' className='h-10 w-10' icon={<TbTrash />}></Button>
            </span>
          </div>
        )}
        {questionType === 'Checkbox' && (
          <div className='md:grid grid-cols-2 gap-4'>
            <span className='flex gap-2'>
              <Checkbox checked /><Input placeholder="Option 1" />
            </span>
            <span className='flex gap-2'>
              <Checkbox checked /><Input placeholder="Option 2" />
            </span>
            <span className='flex gap-2 col-span-2'>
              <Checkbox checked /><Input placeholder="Option 3" />
              <Button type='button' className='h-10 w-10' icon={<TbTrash />}></Button>
            </span>
          </div>
        )}
        {questionType === 'Textarea' && <Input type="number" placeholder="Textarea" textArea disabled />}
        {questionType === 'File Upload' && <Input type="file" disabled />}
        {questionType === 'Date' && <DatePicker disabled />}
        {questionType === 'DateRange' && <DatePicker.DatePickerRange disabled />}
        {questionType === 'Time' && <Input type='time' disabled />}
        {
          questionType === 'Single-Choice Dropdown' &&
          <div className='md:grid grid-cols-2 gap-4'>
            <Select className='col-span-2'
              placeholder="Single Choice Dropdown"
              options={[{ label: "Option-1", value: "Option-1" }, { label: "Option-2", value: "Option-2" }]}
            />
            <span className='flex gap-2'>
              <Input placeholder="Option 1" />
            </span>
            <span className='flex gap-2'>
              <Input placeholder="Option 2" />
            </span>
            <span className='flex gap-2 col-span-2'>
              <Input placeholder="Option 3" />
              <Button type='button' className='h-10 w-10' icon={<TbTrash />}></Button>
            </span>
          </div>
        }
        {
          questionType === 'Multi-Choice Dropdown' &&
          <div className='md:grid grid-cols-2 gap-4'>
            <Select isMulti className='col-span-2'
              placeholder="Single Choice Dropdown"
              options={[{ label: "Option-1", value: "Option-1" }, { label: "Option-2", value: "Option-2" }]}
            />
            <span className='flex gap-2'>
              <Input placeholder="Option 1" />
            </span>
            <span className='flex gap-2'>
              <Input placeholder="Option 2" />
            </span>
            <span className='flex gap-2 col-span-2'>
              <Input placeholder="Option 3" />
              <Button type='button' className='h-10 w-10' icon={<TbTrash />}></Button>
            </span>
          </div>
        }
        <div className='flex gap-2 justify-end'>
          <Tooltip title="Clone Question">
            <Button type='button' icon={<TbCopy />}></Button>
          </Tooltip>
          <Tooltip title="Delete Question">
            <Button type='button' icon={<TbTrash />}></Button>
          </Tooltip>
        </div>
      </Card> */}
    </Card>
  );
};

const FormBuilderForm = () => {
  const form = useForm();
  const [sections, setSections] = useState([{ id: 1 }]);

  const createSection = () => {
    setSections(prev => [...prev, { id: prev.length + 1 }]);
  };

  const removeSection = (id: number) => {
    if (sections.length > 1) {
      setSections(prev => prev.filter(section => section.id !== prev.length));
    }
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

      <div className="border-gray-100 p-3 text-right">
        <Button icon={<TbLayoutList />} onClick={createSection}>
          Add Section
        </Button>
      </div>

      <Card>
        <h5 className="mb-6">Form Information</h5>
        <Form>
          <div className="md:grid grid-cols-3 gap-3">
            <FormItem label="Form Name" className="col-span-2">
              <Controller
                control={form.control}
                name="form_name"
                render={({ field }) => <Input {...field} type="text" placeholder='Enter Form Name'/>}
              />
            </FormItem>
            <FormItem label="Status">
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select
                    {...field}
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
                name="department_name"
                render={({ field }) => <Select 
                {...field} 
                placeholder="Select Department"
                options={[
                  {label: "IT", value: "IT"},
                  {label: "Account", value: "Account"},
                ]}
                />}
              />
            </FormItem>
            <FormItem label="Category Name">
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select
                    {...field}
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

          <Card>
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

          <div className='text-right mt-2'>
            <Button type='button' className='mr-2 w-24'>Cancel</Button>
            <Button type='button' variant='solid' className='w-24'>Save</Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default FormBuilderForm;
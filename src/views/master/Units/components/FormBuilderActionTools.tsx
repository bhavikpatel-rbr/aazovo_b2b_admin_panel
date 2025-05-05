import Button from '@/components/ui/Button'
import { TbPlus } from 'react-icons/tb'
import useCustomerList from '@/views/concepts/customers/CustomerList/hooks/useCustomerList'
import { ErrorMessage, Field, Formik } from 'formik'
import { useState } from 'react'
import { Dialog } from '@/components/ui'
import * as Yup from 'yup'
import { Form } from 'formik'
import { useAppDispatch } from '@/reduxtool/store'
import { addUnitAction, editUnitAction } from '@/reduxtool/master/middleware'
import { unwrapResult } from '@reduxjs/toolkit'

type FormDataEdit = {
    isEdit?: boolean,
    editData?: any,
    isOpenEdit?: boolean
    handleCloseEdit?: () => void
}

const FormListActionTools = ({
    isOpenEdit = false,
    isEdit,
    editData,
    handleCloseEdit
}: FormDataEdit) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false); // Add loading state, initially false
    const dispatch = useAppDispatch()
    const handleSubmit = async (values: { name: string; }) => {
        setIsLoading(true); // <-- Show loader
        try {
            if (!isEdit) {
                const actionResult = await dispatch(addUnitAction(values));
                unwrapResult(actionResult); // Check for success/failure
                console.log("Add Unit Action Successful");
                setIsOpen(false); // Close modal on success
            } else {
                const actionResult = await dispatch(editUnitAction({ name: values.name, id: editData?.id }));
                unwrapResult(actionResult); // Check for success/failure
                console.log("Edit Unit Action Successful");
                handleCloseEdit?.(); // Close edit modal on success
            }
        } catch (error) {
            // Action was rejected, error message handled in thunk
            console.error("Action Failed:", error);
            // Do NOT close the modal here
        } finally {
            setIsLoading(false); // <-- Hide loader regardless of success/failure
        }
    };
    const { customerList } = useCustomerList()

    const validationSchema = Yup.object({
        name: Yup.string().required('Name is required'),
    })

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {!isEdit && <Button
                variant="solid"
                icon={<TbPlus className="text-lg" />}
                onClick={() => setIsOpen(true)}
            >
                Add Unit
            </Button>}
            <Dialog
                isOpen={isOpen || isOpenEdit}
                onClose={() => {
                    setIsOpen(false)
                    handleCloseEdit?.()
                }}
                closable
                width={400}
            >
                <h2 className="text-xl font-semibold mb-4">Add Unit</h2>

                <Formik
                    initialValues={{ name: editData?.name || '' }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting, isValid }) => (
                        <Form className="flex flex-col gap-4">
                            <div>
                                <label className="block mb-1 font-medium" htmlFor="name">
                                    Name
                                </label>
                                <Field
                                    id="name"
                                    name="name"
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="Enter your name"
                                />
                                <ErrorMessage
                                    name="name"
                                    component="div"
                                    className="text-red-500 text-sm mt-1"
                                />
                            </div>

                            <div className="flex justify-end mt-4">
                                <button
                                    type="submit"
                                    className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                    disabled={!isValid || isSubmitting}
                                >
                                    Submit
                                </button>
                                
                            </div>
                        </Form>
                    )}
                </Formik>
            </Dialog>
        </div>
    )
}

export default FormListActionTools

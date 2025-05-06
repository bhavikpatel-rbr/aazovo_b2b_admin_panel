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
    const dispatch = useAppDispatch()
    const handleSubmit = (values: { name: string; }) => {
        if (!isEdit) {
            const result =  dispatch(addUnitAction(values))
            console.log("result",result);
            setIsOpen(false)
        } else {
            const result = dispatch(editUnitAction({ name: values.name, id: editData?.id }))
console.log(result);

            handleCloseEdit?.()
        }
    }
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

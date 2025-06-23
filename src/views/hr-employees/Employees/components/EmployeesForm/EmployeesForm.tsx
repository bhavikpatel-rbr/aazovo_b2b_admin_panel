import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { addEmployeesAction, editEmployeesAction, apiGetEmployeeById } from '@/reduxtool/master/middleware'
// import { apiGetEmployeeById } from '@/services/EmployeeService'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import Spinner from '@/components/ui/Spinner'
import Container from '@/components/shared/Container'
import EmployeeForm from './EmployeeForm'
import type { EmployeeFormSchema } from './types'

// Helper to format the flat API data into the nested structure the form expects
const formatApiDataToFormSchema = (apiData: any): Partial<EmployeeFormSchema> => {
    return {
        id: apiData.id,
        registration: {
            fullName: apiData.name,
            dateOfJoining: apiData.date_of_joining,
            mobileNumber: apiData.mobile_number,
            mobileNumberCode: apiData.mobile_number_code,
            email: apiData.email,
            experience: apiData.experience,
        },
        personalInformation: {
            status: apiData.status,
            dateOfBirth: apiData.date_of_birth,
            age: apiData.age,
            gender: apiData.gender,
            nationalityId: apiData.nationality_id,
            bloodGroup: apiData.blood_group,
            permanentAddress: apiData.permanent_address,
            localAddress: apiData.local_address,
            maritalStatus: apiData.marital_status || '',
        },
        roleResponsibility: {
            roleId: apiData.role_id,
            departmentId: apiData.department_id,
            designationId: apiData.designation_id,
            countryId: apiData.country_id,
            categoryId: apiData.category_id,
            subcategoryId: apiData.subcategory_id,
            brandId: apiData.brand_id,
            productServiceId: apiData.product_service_id,
            reportingHrId: apiData.reporting_hr_id,
            reportingHeadId: apiData.reporting_head_id,
        },
        training: {
            training_date_of_completion: apiData.training_date_of_completion,
            training_remark: apiData.training_remark,
            specific_training_date_of_completion: apiData.specific_training_date_of_completion,
            specific_training_remark: apiData.specific_training_remark,
        },
        offBoarding: {
            exit_interview_conducted: apiData.exit_interview_conducted ? 'yes' : 'no',
            exit_interview_remark: apiData.exit_interview_remark,
            resignation_letter_received: apiData.resignation_letter_received ? 'yes' : 'no',
            resignation_letter_remark: apiData.resignation_letter_remark,
            company_assets_returned: apiData.company_assets_returned,
            assets_returned_remarks: apiData.assets_returned_remarks,
            full_and_final_settlement: apiData.full_and_final_settlement ? 'yes' : 'no',
            fnf_remarks: apiData.fnf_remarks,
            notice_period_status: apiData.notice_period_status,
            notice_period_remarks: apiData.notice_period_remarks,
        },
        equipmentsAssetsProvided: {
            items: apiData.equipments_assets_issued || [],
        },
        // Document submission is not pre-filled with file objects for security reasons
        documentSubmission: {},
    }
}

const EmployeePage = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { employeeId } = useParams()
    const isEditMode = !!employeeId

    const [employeeData, setEmployeeData] = useState<Partial<EmployeeFormSchema> | null>(null)
    const [isLoading, setIsLoading] = useState(isEditMode) // Only load if in edit mode

    useEffect(() => {
        if (isEditMode) {
            apiGetEmployeeById(employeeId)
                .then((resp) => {
                    const formattedData = formatApiDataToFormSchema(resp.data)
                    setEmployeeData(formattedData)
                })
                .catch(console.error)
                .finally(() => setIsLoading(false))
        }
    }, [employeeId, isEditMode])

    const handleFormSubmit = (formData: FormData, id?: string) => {
        const action = isEditMode && id
            ? editEmployeesAction({ employeeId: id, data: formData })
            : addEmployeesAction(formData)

        // @ts-ignore
        dispatch(action).unwrap()
            .then((res) => {
                if (res.status) {
                    toast.push(<Notification title={'Success'} type="success" children={`Employee ${isEditMode ? 'updated' : 'added'} successfully.`} />)
                    navigate('/hr-employees/employees')
                } else {
                    console.log(JSON.stringify(res?.errors), "resresresres");
                    
                    toast.push(<Notification title={'error'} type="error" title={JSON.stringify(res?.errors)} />)
                }
            })
            .catch((err: any) => {
                toast.push(<Notification title={'Error'} type="danger" children={err.message || 'An error occurred.'} />)
            })
    }

    if (isLoading) {
        return (
            <Container className="h-full"><div className="h-full flex flex-col items-center justify-center"><Spinner size={40} /><h3>Loading...</h3></div></Container>
        )
    }

    return (
        <EmployeeForm
            isEdit={isEditMode}
            defaultValues={isEditMode ? employeeData : {}}
            onFormSubmit={handleFormSubmit}
        />
    )
}

export default EmployeePage
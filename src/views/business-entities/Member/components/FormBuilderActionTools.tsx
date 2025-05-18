import Button from '@/components/ui/Button'
import { TbCloudDownload, TbPlus } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import useCustomerList from '@/views/concepts/customers/CustomerList/hooks/useCustomerList'
import { CSVLink } from 'react-csv'

const FormListActionTools = () => {
    const navigate = useNavigate()

    const { customerList } = useCustomerList()

    return (
        <div className="flex flex-col md:flex-row gap-3">
            <Button
                variant="solid"
                icon={<TbPlus className="text-lg" />}
                onClick={() => navigate('/business-entities/member-create')}
            >
                Add New
            </Button>
        </div>
    )
}

export default FormListActionTools

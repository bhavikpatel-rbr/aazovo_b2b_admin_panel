import Button from '@/components/ui/Button'
import { TbCloudDownload, TbUserPlus, TbPlus } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import useCustomerList from '@/views/concepts/customers/CustomerList/hooks/useCustomerList'
import { CSVLink } from 'react-csv'

const FormListActionTools = () => {
    const navigate = useNavigate()

    const { customerList } = useCustomerList()
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)

    const { handleSubmit, control} = useForm<AddCurrencyFormSchema>({
        defaultValues: {
            symbol: '',
            code: '',
            status: '',
        },
    })

    const addCurrencySubmitHandler = async (data: AddCurrencyFormSchema) =>{
        console.log("DAta is ", data)
    }

    type AddCurrencyFormSchema = {
        symbol: string,
        code: string
        status: string
    }

    return (
        <div className="flex flex-col md:flex-row gap-3">
            <Button
                variant="solid"
                icon={<TbPlus className="text-lg" />}
                onClick={() => navigate('/concepts/customers/customer-create')}
            >
                Add New
            </Button>
        </div>
    )
}

export default FormListActionTools

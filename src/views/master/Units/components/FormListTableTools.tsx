import cloneDeep from 'lodash/cloneDeep';
import FormListSearch from './FormListSearch'; // Assuming FormListSearch uses DebouceInput correctly
import { Button } from '@/components/ui';
import { TbCloudUpload, TbFilter } from 'react-icons/tb';
import useCustomerList from '@/views/concepts/customers/CustomerList/hooks/useCustomerList';

// Define props including the search handler
type FormListTableToolsProps = {
    onSearch: (query: string) => void;
    initialQuery?: string; // Optional: If you want to pass initial query down
};

const FormListTableTools = () => {
    const { tableData, setTableData } = useCustomerList()

    const handleInputChange = (val: string) => {
        const newTableData = cloneDeep(tableData)
        newTableData.query = val
        newTableData.pageIndex = 1
        if (typeof val === 'string' && val.length > 1) {
            setTableData(newTableData)
        }

        if (typeof val === 'string' && val.length === 0) {
            setTableData(newTableData)
        }
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            {/* Pass handleInputChange to FormListSearch */}
            {/* Assuming FormListSearch calls its onInputChange prop */}
            <FormListSearch
                onInputChange={handleInputChange}
                // You might want to control the input value from parent state too if needed
                // value={initialQuery}
            />
            {/* <FormListTableFilter /> */} {/* Keep filters if you have them */}
        </div>
    )
}

export default FormListTableTools

import useCustomerList from '@/views/concepts/customers/CustomerList/hooks/useCustomerList'

import cloneDeep from 'lodash/cloneDeep'
import FormListSearch from './FormListSearch'
import FormListTableFilter from './FormListTableFilter'

import { Button } from '@/components/ui'
import {TbCloudDownload} from 'react-icons/tb'

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
            <FormListSearch onInputChange={handleInputChange} />
            {/* <FormListTableFilter /> */}
            <Button icon={<TbCloudDownload />}> Export </Button>
        </div>
    )
}

export default FormListTableTools

// import useCustomerList from '@/views/concepts/customers/CustomerList/hooks/useCustomerList'

// import cloneDeep from 'lodash/cloneDeep'
// import FormListSearch from './FormListSearch'
// import FormListTableFilter from './FormListTableFilter'
// import { Button } from '@/components/ui'
// import { TbCloudUpload, TbFilter } from 'react-icons/tb'

// const FormListTableTools = () => {
//     const { tableData, setTableData } = useCustomerList()

//     const handleInputChange = (val: string) => {
//         const newTableData = cloneDeep(tableData)
//         newTableData.query = val
//         newTableData.pageIndex = 1
//         if (typeof val === 'string' && val.length > 1) {
//             setTableData(newTableData)
//         }

//         if (typeof val === 'string' && val.length === 0) {
//             setTableData(newTableData)
//         }
//     }

//         const handleExport = () => {
//         console.log("Export clicked");
//         // Implement export functionality
//     }

//     return (
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
//             <FormListSearch onInputChange={handleInputChange} />
//             {/* <FormListTableFilter /> */}
//             <Button icon={<TbFilter />} className=''>
//                 Filter
//             </Button>
//             <Button icon={<TbCloudDownload />} onClick={handleImport}>Import</Button>
//             <Button icon={<TbCloudUpload />} onClick={handleExport}>Export</Button>
//         </div>
//     )
// }

// export default FormListTableTools

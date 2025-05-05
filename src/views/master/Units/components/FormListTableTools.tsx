import cloneDeep from 'lodash/cloneDeep';
import FormListSearch from './FormListSearch'; // Assuming FormListSearch uses DebouceInput correctly
import { Button } from '@/components/ui';
import { TbCloudUpload, TbFilter } from 'react-icons/tb';

// Define props including the search handler
type FormListTableToolsProps = {
    onSearch: (query: string) => void;
    initialQuery?: string; // Optional: If you want to pass initial query down
};

const FormListTableTools = ({ onSearch, initialQuery = '' }: FormListTableToolsProps) => {

    // Pass the onSearch handler directly to the input component
    const handleInputChange = (val: string) => {
        onSearch(val); // Call the handler passed from the parent
    };

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
            <Button icon={<TbFilter />} className=''>
                Filter
            </Button>
            <Button icon={<TbCloudUpload/>}>Export</Button>
        </div>
    );
};

export default FormListTableTools;
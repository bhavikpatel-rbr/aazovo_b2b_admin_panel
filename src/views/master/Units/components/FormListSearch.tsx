import DebouceInput from '@/components/shared/DebouceInput';
import { TbSearch } from 'react-icons/tb';
import { Ref, forwardRef } from 'react'; // Import forwardRef

type CustomerListSearchProps = {
    onInputChange: (value: string) => void;
    // Add other props like placeholder, value if needed
    placeholder?: string;
    value?: string;
};

// Use forwardRef to pass the ref to the DebouceInput if necessary
const FormListSearch = forwardRef<HTMLInputElement, CustomerListSearchProps>(
    (props, ref) => {
        const { onInputChange, placeholder = "Quick search...", value } = props;

        return (
            <DebouceInput
                ref={ref} // Pass the ref down
                placeholder={placeholder}
                suffix={<TbSearch className="text-lg" />}
                // Call the passed handler on change
                onChange={(e) => onInputChange(e.target.value)}
                // You might need to control the value from parent state
                // value={value}
                className="w-full" // Example styling
            />
        );
    }
);

FormListSearch.displayName = 'FormListSearch'; // Add display name for DevTools

export default FormListSearch;
import DebouceInput from "@/components/shared/DebouceInput";
import { TbSearch } from "react-icons/tb";
import { Ref } from "react";

type CustomerListSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};

const FormListSearch = (props: CustomerListSearchProps) => {
  const { onInputChange, ref } = props;

  return (
    <DebouceInput
      ref={ref}
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  );
};

export default FormListSearch;

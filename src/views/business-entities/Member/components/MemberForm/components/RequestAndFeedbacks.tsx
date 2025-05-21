import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { FormItem } from "@/components/ui/Form";
import { Controller } from "react-hook-form";
import type { FormSectionBaseProps } from "../types";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
type RequestAndFeedbacksDetailSectionProps = FormSectionBaseProps;
const RequestAndFeedbacksDetails = ({
  control,
  errors,
}: RequestAndFeedbacksDetailSectionProps) => {
  return (
    <Card id="requestAndFeedbacks">
      <h4 className="mb-6">Request & Feedback</h4>
      <div className=" gap-4">
        {/* Request Description */}
        <FormItem
          className="md:col-span-2"
          label="Add Feedback / Requests"
          invalid={Boolean(errors.request_description)}
          errorMessage={errors.request_description?.message}
        >
          <Controller
            name="request_description"
            control={control}
            render={({ field }) => (
              <Input
                textArea
                rows={4}
                placeholder="Describe your request in detail..."
                {...field}
              />
            )}
          />
        </FormItem>
      </div>
    </Card>
  );
};

export default RequestAndFeedbacksDetails;

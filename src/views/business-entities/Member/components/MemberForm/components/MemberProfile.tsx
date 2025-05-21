import Card from "@/components/ui/Card";
import { FormItem } from "@/components/ui/Form";
import { Controller } from "react-hook-form";
import type { FormSectionBaseProps } from "../types";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";

type MemberProfileSectionProps = FormSectionBaseProps;

const MemberProfile = ({ control, errors }: MemberProfileSectionProps) => {
  return (
    <Card id="memberProfile">
      <h4 className="mb-6">Member Profile</h4>
      <div className="grid md:grid-cols-3 gap-4">
        {/* Favourite Product */}
        <FormItem
          label="Favourite Product"
          invalid={Boolean(errors.favourite_product)}
          errorMessage={errors.favourite_product?.message}
        >
          <Controller
            name="favourite_product"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select"
                options={[
                  { value: "ProductA", label: "Product A" },
                  { value: "ProductB", label: "Product B" },
                  { value: "ProductC", label: "Product C" },
                ]}
              />
            )}
          />
        </FormItem>

        {/* Business Opportunity */}
        <FormItem
          label="Business Opportunity"
          invalid={Boolean(errors.business_opportunity)}
          errorMessage={errors.business_opportunity?.message}
        >
          <Controller
            name="business_opportunity"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select"
                options={[
                  { value: "Export", label: "Export" },
                  { value: "Import", label: "Import" },
                  { value: "Partnership", label: "Partnership" },
                ]}
              />
            )}
          />
        </FormItem>

        {/* Member Class */}
        <FormItem
          label="Member Class"
          invalid={Boolean(errors.member_class)}
          errorMessage={errors.member_class?.message}
        >
          <Controller
            name="member_class"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select"
                options={[
                  { value: "Gold", label: "Gold" },
                  { value: "Silver", label: "Silver" },
                  { value: "Bronze", label: "Bronze" },
                ]}
              />
            )}
          />
        </FormItem>

        {/* Member Grade */}
        <FormItem
          label="Member Grade"
          invalid={Boolean(errors.member_grade)}
          errorMessage={errors.member_grade?.message}
        >
          <Controller
            name="member_grade"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select"
                options={[
                  { value: "A", label: "A" },
                  { value: "B", label: "B" },
                  { value: "C", label: "C" },
                ]}
              />
            )}
          />
        </FormItem>

        {/* Relationship Manager */}
        <FormItem
          label="Relationship Manager"
          invalid={Boolean(errors.relationship_manager)}
          errorMessage={errors.relationship_manager?.message}
        >
          <Controller
            name="relationship_manager"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select"
                options={[
                  { value: "Manager1", label: "Manager 1" },
                  { value: "Manager2", label: "Manager 2" },
                  { value: "Manager3", label: "Manager 3" },
                ]}
              />
            )}
          />
        </FormItem>

        {/* Remarks */}
        <FormItem
          label="Remarks"
          invalid={Boolean(errors.remarks)}
          errorMessage={errors.remarks?.message}
        >
          <Controller
            name="remarks"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Enter remarks" />
            )}
          />
        </FormItem>
      </div>
    </Card>
  );
};

export default MemberProfile;

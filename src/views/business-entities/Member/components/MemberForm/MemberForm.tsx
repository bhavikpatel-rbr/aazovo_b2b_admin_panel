// MemberForm.tsx

import { useEffect, useState } from "react";
import { Form } from "@/components/ui/Form";
import Card from "@/components/ui/Card"; // Keep Card
import Container from "@/components/shared/Container";
import Navigator from "./components/Navigator"; // Assuming Navigator is in ./components/ relative to MemberForm
import PersonalDetails from "./components/PersonalDetails";
import ContactDetails from "./components/Contact"; // Make sure this component name is correct
import MemberAccessibility from "./components/MemberAccessibility";
import MembershipPlan from "./components/MembershipPlan";
import RequestAndFeedbacks from "./components/RequestAndFeedbacks";
import MemberProfile from "./components/MemberProfile"; // Ensure this component exists
import isEmpty from "lodash/isEmpty";
import { useForm } from "react-hook-form";
import type { ReactNode } from "react";
import type { MemberFormSchema } from "./types"; // Ensure this type exists and is correct
import type { CommonProps } from "@/@types/common";
import { BiChevronRight } from "react-icons/bi";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui";

type MemberFormProps = {
  children: ReactNode;
  onFormSubmit: (values: MemberFormSchema) => void;
  defaultValues?: MemberFormSchema;
  newMember?: boolean;
} & CommonProps;

// Define keys for form sections, matching 'link' in Navigator
type FormSectionKey =
  | "personalDetails"
  | "socialContactInformation"
  | "memberAccessibility"
  | "membershipPlanDetails"
  | "requestAndFeedbacks"
  | "memberProfile";

const MemberForm = (props: MemberFormProps) => {
  const { onFormSubmit, children, defaultValues } = props;

  const [activeSection, setActiveSection] =
    useState<FormSectionKey>("personalDetails");

  useEffect(() => {
    if (!isEmpty(defaultValues)) {
      reset(defaultValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues]);

  const onSubmit = (values: MemberFormSchema) => {
    onFormSubmit?.(values);
  };

  const {
    handleSubmit,
    reset,
    formState: { errors },
    control,
  } = useForm<MemberFormSchema>({
    defaultValues: {
      ...(defaultValues ? defaultValues : {}),
    },
  });

  const renderActiveSection = () => {
    switch (activeSection) {
      case "personalDetails":
        return <PersonalDetails errors={errors} control={control} />;
      case "socialContactInformation":
        return <ContactDetails errors={errors} control={control} />;
      case "memberAccessibility":
        return <MemberAccessibility errors={errors} control={control} />;
      case "membershipPlanDetails":
        return <MembershipPlan errors={errors} control={control} />;
      case "requestAndFeedbacks":
        return <RequestAndFeedbacks errors={errors} control={control} />;
      case "memberProfile":
        return <MemberProfile errors={errors} control={control} />;
      default:
        return <PersonalDetails errors={errors} control={control} />;
    }
  };

  return (
    <>
      <Form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
        <Container>
          {/* Horizontal Navigator within Card - Same structure as CompanyForm */}
          <div className="flex gap-1 items-end mb-3 ">
            <NavLink to="/business-entities/member">
              <h6 className="font-semibold hover:text-primary">Member</h6>
            </NavLink>
            <BiChevronRight size={22} color="black" />
            <h6 className="font-semibold text-primary">Add New Member</h6>
          </div>
          <Card
            className="mb-6"
            // Apply bodyClass for internal padding if your Card component supports it
            bodyClass="px-4 py-2 md:px-6" // Example padding
          >
            <Navigator
              activeSection={activeSection}
              onNavigate={(sectionKey) =>
                setActiveSection(sectionKey as FormSectionKey)
              }
              // If using a reusable Navigator, pass the member-specific items:
              // items={memberNavigationList}
            />
          </Card>

          {/* Form Sections Area */}
          <div className="flex flex-col gap-4">{renderActiveSection()}</div>
          {/* {children} */}
        </Container>
      </Form>
      {/* Footer with Save and Cancel buttons */}
      <Card bodyClass="flex justify-end gap-2" className="mt-4">
        <Button type="button" className="px-4 py-2">
          Cancel
        </Button>
        <Button type="button" className="px-4 py-2">
          Previous
        </Button>
        <Button type="button" className="px-4 py-2">
          Next
        </Button>
        <Button type="button" className="px-4 py-2">
          Draft
        </Button>
        <Button type="submit" className="px-4 py-2" variant="solid">
          Save
        </Button>
      </Card>
    </>
  );
};

export default MemberForm;

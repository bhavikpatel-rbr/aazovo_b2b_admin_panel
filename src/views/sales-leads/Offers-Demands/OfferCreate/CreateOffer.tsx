import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import Card from "@/components/ui/Card";
import { Input, Select as UiSelect, Button } from "@/components/ui";
import { Form, FormItem } from "@/components/ui/Form";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import Spinner from "@/components/ui/Spinner";

// Icons
import { BiChevronRight } from "react-icons/bi";
import { TbCopy } from "react-icons/tb";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import {
  addOfferAction,
  getUsersAction,
  getAllProductAction,
  getMembersAction,
} from "@/reduxtool/master/middleware";
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Zod Schema for Create Offer Form ---
const offerFormSchema = z.object({
  name: z.string().min(1, "Offer Name is required."),
  assignedUserId: z.number().min(1, "Assigned User is required.").nullable(),

  // NEW: Multi-select products
  productIds: z.array(z.number()).min(1, "At least one product is required."),

  // UPDATED: Multi-select sellers
  sellers: z.array(z.number()).min(1, "At least one seller is required."),
  groupA_notes: z.string().optional().nullable(),

  // UPDATED: Multi-select buyers
  buyers: z.array(z.number()).min(1, "At least one buyer is required."),
  groupB_notes: z.string().optional().nullable(),
});

type OfferFormData = z.infer<typeof offerFormSchema>;
type OptionType = { value: number; label: string };

const CreateOffer = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    dispatch(getUsersAction());
    dispatch(getAllProductAction());
    dispatch(getMembersAction());
  }, [dispatch]);

  const {
    usersData = [],
    productsMasterData = [],
    memberData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);

  // --- Memoized Options for Dropdowns ---
  const userOptions = useMemo(() => {
    if (!Array.isArray(usersData)) return [];
    return usersData.map((u: any) => ({
      value: u.id,
      label: u.name,
    }));
  }, [usersData]);

  const productOptions = useMemo(() => {
    if (!Array.isArray(productsMasterData)) return [];
    return productsMasterData.map((p: any) => ({
      value: p.id,
      label: p.name,
    }));
  }, [productsMasterData]);

  const memberOptions = useMemo(() => {
    if (!Array.isArray(memberData)) return [];
    return memberData.map((m: any) => ({
      value: m.id,
      label: m.name,
    }));
  }, [memberData]);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      name: "",
      assignedUserId: null,
      productIds: [],
      sellers: [],
      groupA_notes: "",
      buyers: [],
      groupB_notes: "",
    },
  });

  const onFormSubmit = useCallback(
    async (data: OfferFormData) => {
      setIsSubmitting(true);

      // --- Construct the payload for the API ---
      const apiPayload = {
        name: data.name,
        assign_user: data.assignedUserId,
        product_ids: data.productIds, // Pass the array of product IDs
        groupA: data.groupA_notes,
        groupB: data.groupB_notes,
        seller_section: data.sellers, // Pass the array of seller IDs
        buyer_section: data.buyers,   // Pass the array of buyer IDs
      };

      try {
        await dispatch(addOfferAction(apiPayload)).unwrap();

        toast.push(
          <Notification title="Offer Created" type="success" duration={2500}>
            Offer "{data.name}" has been successfully created.
          </Notification>
        );
        reset();
        navigate("/sales-leads/offers-demands");
      } catch (error: any) {
        console.error("Failed to create offer:", error);
        const errorMessage =
          error?.message ||
          error?.data?.message ||
          "Could not create offer. Please try again.";
        toast.push(
          <Notification title="Creation Failed" type="danger" duration={4000}>
            {errorMessage}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, navigate, reset]
  );

  const handleCancel = () => {
    reset();
    navigate("/sales-leads/offers-demands");
    toast.push(
      <Notification title="Cancelled" type="info">
        Offer creation cancelled.
      </Notification>
    );
  };

  const isLoading = masterLoadingStatus === "loading";

  return (
    <>
      {/* Breadcrumbs */}
      <div className="flex gap-1 items-end mb-3">
        <NavLink to="/sales-leads/offers-demands">
          <h6 className="font-semibold hover:text-primary-600 dark:hover:text-primary-400">
            Offers & Demands
          </h6>
        </NavLink>
        <BiChevronRight size={22} className="text-gray-700 dark:text-gray-200" />
        <h6 className="font-semibold text-primary">Add New Offer</h6>
      </div>

      <Form id="createOfferForm" onSubmit={handleSubmit(onFormSubmit)}>
        <Card>
          {isLoading && !productsMasterData.length ? (
            <div className="flex justify-center p-10">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* ---MODIFICATION START--- */}
              <div className="flex justify-between items-center mb-6">
                <h4>Add Offer</h4>
                <Button
                  type="button"
                  variant="solid"
                  onClick={() =>
                    toast.push(
                      <Notification title="Info" type="info">
                        Price List feature coming soon!
                      </Notification>
                    )
                  }
                >
                  View Price List
                </Button>
              </div>
              {/* ---MODIFICATION END--- */}
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Top Level Fields */}
                <FormItem
                  label="Name"
                  invalid={!!errors.name}
                  errorMessage={errors.name?.message}
                >
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Enter Offer Name" />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Assign User"
                  invalid={!!errors.assignedUserId}
                  errorMessage={errors.assignedUserId?.message}
                >
                  <Controller
                    name="assignedUserId"
                    control={control}
                    render={({ field }) => (
                      <UiSelect
                        placeholder="Select Employee"
                        options={userOptions}
                        value={userOptions.find(
                          (opt: OptionType) => opt.value === field.value
                        )}
                        onChange={(option: OptionType | null) =>
                          field.onChange(option ? option.value : null)
                        }
                        isClearable
                      />
                    )}
                  />
                </FormItem>

                {/* Products Dropdown */}
                <FormItem
                  label="Products"
                  invalid={!!errors.productIds}
                  errorMessage={errors.productIds?.message}
                  className="md:col-span-2"
                >
                  <Controller
                    name="productIds"
                    control={control}
                    render={({ field }) => (
                      <UiSelect
                        isMulti
                        placeholder="Select Products"
                        options={productOptions}
                        value={productOptions.filter((opt: OptionType) =>
                          field.value?.includes(opt.value)
                        )}
                        onChange={(options: OptionType[]) =>
                          field.onChange(
                            options ? options.map((opt) => opt.value) : []
                          )
                        }
                        isLoading={isLoading}
                      />
                    )}
                  />
                </FormItem>

                {/* Seller Column */}
                <div className="flex flex-col gap-4">
                  <Card>
                    <h5>Seller Section</h5>
                    <div className="mt-4">
                      <FormItem
                        label="Sellers"
                        invalid={!!errors.sellers}
                        errorMessage={errors.sellers?.message}
                      >
                        <Controller
                          name="sellers"
                          control={control}
                          render={({ field }) => (
                            <UiSelect
                              isMulti
                              placeholder="Select Sellers"
                              options={memberOptions}
                              value={memberOptions.filter((opt: OptionType) =>
                                field.value?.includes(opt.value)
                              )}
                              onChange={(options: OptionType[]) =>
                                field.onChange(
                                  options ? options.map((opt) => opt.value) : []
                                )
                              }
                              isLoading={isLoading}
                            />
                          )}
                        />
                      </FormItem>
                    </div>
                  </Card>
                  <Card>
                    <h5>Group A Notes</h5>
                    <div className="mt-4">
                      <FormItem
                        invalid={!!errors.groupA_notes}
                        errorMessage={errors.groupA_notes?.message}
                      >
                        <Controller
                          name="groupA_notes"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              textArea
                              placeholder="Enter notes for Group A (Optional)"
                              rows={3}
                            />
                          )}
                        />
                      </FormItem>
                      <div className="text-right mt-1">
                        <Button
                          type="button"
                          icon={<TbCopy />}
                          onClick={() => {
                            navigator.clipboard.writeText(
                              getValues("groupA_notes") || ""
                            );
                            toast.push(
                              <Notification title="Copied" type="info">
                                Group A notes copied to clipboard.
                              </Notification>
                            );
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Buyer Column */}
                <div className="flex flex-col gap-4">
                  <Card>
                    <h5>Buyer Section</h5>
                    <div className="mt-4">
                      <FormItem
                        label="Buyers"
                        invalid={!!errors.buyers}
                        errorMessage={errors.buyers?.message}
                      >
                        <Controller
                          name="buyers"
                          control={control}
                          render={({ field }) => (
                            <UiSelect
                              isMulti
                              placeholder="Select Buyers"
                              options={memberOptions}
                              value={memberOptions.filter((opt: OptionType) =>
                                field.value?.includes(opt.value)
                              )}
                              onChange={(options: OptionType[]) =>
                                field.onChange(
                                  options ? options.map((opt) => opt.value) : []
                                )
                              }
                              isLoading={isLoading}
                            />
                          )}
                        />
                      </FormItem>
                    </div>
                  </Card>
                  <Card>
                    <h5>Group B Notes</h5>
                    <div className="mt-4">
                      <FormItem
                        invalid={!!errors.groupB_notes}
                        errorMessage={errors.groupB_notes?.message}
                      >
                        <Controller
                          name="groupB_notes"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              textArea
                              placeholder="Enter notes for Group B (Optional)"
                              rows={3}
                            />
                          )}
                        />
                      </FormItem>
                      <div className="text-right mt-1">
                        <Button
                          type="button"
                          icon={<TbCopy />}
                          onClick={() => {
                            navigator.clipboard.writeText(
                              getValues("groupB_notes") || ""
                            );
                            toast.push(
                              <Notification title="Copied" type="info">
                                Group B notes copied to clipboard.
                              </Notification>
                            );
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card bodyClass="flex justify-end gap-2" className="mt-4">
          <Button type="button" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="createOfferForm"
            variant="solid"
            loading={isSubmitting}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? "Saving..." : "Save Offer"}
          </Button>
        </Card>
      </Form>
    </>
  );
};

export default CreateOffer;
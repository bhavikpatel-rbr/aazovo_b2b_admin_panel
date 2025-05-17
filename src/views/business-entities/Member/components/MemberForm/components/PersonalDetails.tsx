import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'

type PersonalDetailSectionProps = FormSectionBaseProps
const PersonalDetails = ({
    control,
    errors,
}: PersonalDetailSectionProps) => {

    return (
        <Card id="personalDetails" className="mt-6">
      <h4 className="mb-6">Personal Details</h4>
      <div className="grid md:grid-cols-2 gap-4">

        {/* Status Dropdown */}
        <FormItem
          label="Status"
          invalid={Boolean(errors.status)}
          errorMessage={errors.status?.message}
        >
          <Controller
            name="status"
            control={control}
            render={() => (
                <Select
                    size="sm"
                    className="mb-4"
                    placeholder="Please Select"
                    options={[
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' },
                        { label: 'Pending', value: 'pending' },
                    ]}
                >
                </Select>
            )}
          />
        </FormItem>

        {/* Full Name */}
        <FormItem
          label="Full Name"
          invalid={Boolean(errors.full_name)}
          errorMessage={errors.full_name?.message}
        >
          <Controller
            name="full_name"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                autoComplete="off"
                placeholder="Member’s full name"
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Mobile Number */}
        <FormItem
          label="Mobile Number"
          invalid={Boolean(errors.mobile_number)}
          errorMessage={errors.mobile_number?.message}
        >
          <Controller
            name="mobile_number"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                autoComplete="off"
                placeholder="Primary contact number"
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Email */}
        <FormItem
          label="Email"
          invalid={Boolean(errors.email)}
          errorMessage={errors.email?.message}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                type="email"
                autoComplete="off"
                placeholder="Primary email address"
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Alternate Mobile Number */}
        <FormItem
          label="Alternate Mobile Number"
          invalid={Boolean(errors.alternate_mobile_number)}
          errorMessage={errors.alternate_mobile_number?.message}
        >
          <Controller
            name="alternate_mobile_number"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                autoComplete="off"
                placeholder="Secondary contact number"
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Alternate Email */}
        <FormItem
          label="Alternate Email"
          invalid={Boolean(errors.alternate_email)}
          errorMessage={errors.alternate_email?.message}
        >
          <Controller
            name="alternate_email"
            control={control}
            render={({ field }) => (
              <Input
                type="email"
                autoComplete="off"
                placeholder="Secondary email address"
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Password */}
        <FormItem
          label="Password"
          invalid={Boolean(errors.password)}
          errorMessage={errors.password?.message}
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Set password"
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Interested Category Dropdown */}
        <FormItem
          label="Interested Category"
          invalid={Boolean(errors.interested_category)}
          errorMessage={errors.interested_category?.message}
        >
          <Controller
            name="interested_category"
            control={control}
            render={() => (
              <Select
                    size="sm"
                    className="mb-4"
                    placeholder="Please Select"
                    options={[
                        { label: 'Category 1', value: 'category1' },
                        { label: 'Category 2', value: 'category2' },
                        { label: 'Category 3', value: 'category3' },
                    ]}
                >
                </Select>
            )}
          />
        </FormItem>

        {/* Interested Sub Category Dropdown */}
        <FormItem
          label="Interested Sub Category"
          invalid={Boolean(errors.interested_sub_category)}
          errorMessage={errors.interested_sub_category?.message}
        >
          <Controller
            name="interested_sub_category"
            control={control}
            render={() => (
              <Select
                    size="sm"
                    className="mb-4"
                    placeholder="Please Select"
                    options={[ 
                        { label: 'Sub Category 1', value: 'subcategory1' },
                        { label: 'Sub Category 2', value: 'subcategory2' },
                        { label: 'Sub Category 3', value: 'subcategory3' },
                    ]}
                >
                </Select>
            )}
          />
        </FormItem>

        {/* Favourite Brands Multi-Select */}
        <FormItem
          label="Favourite Brands"
          invalid={Boolean(errors.favourite_brands)}
          errorMessage={errors.favourite_brands?.message}
        >
          <Controller
            name="favourite_brands"
            control={control}
            render={() => (
              <Select
                    size="sm"
                    className="mb-4"
                    placeholder="Please Select"
                    options={[
                        { label: 'Brand 1', value: 'brand1' },
                        { label: 'Brand 2', value: 'brand2' },
                        { label: 'Brand 3', value: 'brand3' },
                    ]}
                >
                </Select>
            )}
          />
        </FormItem>

        {/* Company Name (Temp) */}
        <FormItem
          label="Company Name (Temp)"
          invalid={Boolean(errors.company_name_temp)}
          errorMessage={errors.company_name_temp?.message}
        >
          <Controller
            name="company_name_temp"
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                autoComplete="off"
                placeholder="Temporary input"
                {...field}
              />
            )}
          />
        </FormItem>

        {/* Business Type Dropdown */}
        <FormItem
          label="Business Type"
          invalid={Boolean(errors.business_type)}
          errorMessage={errors.business_type?.message}
        >
          <Controller
            name="business_type"
            control={control}
            render={() => (
              <Select
                    size="sm"
                    className="mb-4"
                    placeholder="Please Select"
                    options={[
                        { label: 'Type 1', value: 'type1' },
                        { label: 'Type 2', value: 'type2' },
                        { label: 'Type 3', value: 'type3' },
                    ]}
                >
                </Select>
            )}
          />
        </FormItem>

        {/* Interested For Dropdown */}
        <FormItem
          label="Interested For"
          invalid={Boolean(errors.interested_for)}
          errorMessage={errors.interested_for?.message}
        >
          <Controller
            name="interested_for"
            control={control}
            render={() => (
              <Select
                    size="sm"
                    className="mb-4"
                    placeholder="Please Select"
                    options={[
                        { label: 'Interested For 1', value: 'interested_for1' },
                        { label: 'Interested For 2', value: 'interested_for2' },
                        { label: 'Interested For 3', value: 'interested_for3' },
                    ]}
                >
                </Select>
            )}
          />
        </FormItem>

        {/* GMI (RM) Dropdown */}
        <FormItem
          label="GMI (RM)"
          invalid={Boolean(errors.gmi_rm)}
          errorMessage={errors.gmi_rm?.message}
        >
          <Controller
            name="gmi_rm"
            control={control}
render={() => (
              <Select
                    size="sm"
                    className="mb-4"
                    placeholder="Please Select"
                    options={[
                        { label: 'GMI 1', value: 'gmi1' },
                        { label: 'GMI 2', value: 'gmi2' },
                        { label: 'GMI 3', value: 'gmi3' },
                    ]}
                >
                </Select>
            )}
          />
        </FormItem>

        {/* Dealing in Bulk Checkbox */}
        <FormItem
          label="Dealing in Bulk"
          invalid={Boolean(errors.dealing_in_bulk)}
          errorMessage={errors.dealing_in_bulk?.message}
        >
          <Controller
            name="dealing_in_bulk"
            control={control}
            render={({ field }) => (
                <Checkbox
                defaultChecked={!!field.value}
                onChange={(checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => field.onChange(checked)}
                >
                Checkbox
                </Checkbox>
            )}
          />
        </FormItem>

        {/* Assigned Company Dropdown or Text Input */}
        <FormItem
          label="Assigned Company"
          invalid={Boolean(errors.assigned_company)}
          errorMessage={errors.assigned_company?.message}
        >
          <Controller
            name="assigned_company"
            control={control}
render={() => (
              <Select
                    size="sm"
                    className="mb-4"
                    placeholder="Please Select"
                    options={[
                        { label: 'Company 1', value: 'company1' },
                        { label: 'Company 2', value: 'company2' },
                        { label: 'Company 3', value: 'company3' },
                    ]}
                >
                </Select>
            )}
          />
        </FormItem>

      </div>
    </Card>
    )
}

export default PersonalDetails

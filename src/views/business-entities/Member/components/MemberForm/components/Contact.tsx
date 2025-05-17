import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'

type ContactDetailSectionProps = FormSectionBaseProps
const ContactDetails = ({
    control,
    errors,
}: ContactDetailSectionProps) => {

    return (
        <Card id="socialContactInformation" className="mt-6">
            <h4 className="mb-6">Social & Contact Information</h4>
            <div className="grid md:grid-cols-2 gap-4">
                <FormItem
                    label="WhatsApp No."
                    invalid={Boolean(errors.whatsapp_number)}
                    errorMessage={errors.whatsapp_number?.message}
                >
                    <Controller
                        name="whatsapp_number"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Enter WhatsApp number" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Office No."
                    invalid={Boolean(errors.office_number)}
                    errorMessage={errors.office_number?.message}
                >
                    <Controller
                        name="office_number"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Enter office number" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Botim ID"
                    invalid={Boolean(errors.botim_id)}
                    errorMessage={errors.botim_id?.message}
                >
                    <Controller
                        name="botim_id"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Enter Botim ID" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Skype ID"
                    invalid={Boolean(errors.skype_id)}
                    errorMessage={errors.skype_id?.message}
                >
                    <Controller
                        name="skype_id"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Enter Skype ID" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="WeChat ID"
                    invalid={Boolean(errors.wechat_id)}
                    errorMessage={errors.wechat_id?.message}
                >
                    <Controller
                        name="wechat_id"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Enter WeChat ID" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Website"
                    invalid={Boolean(errors.website)}
                    errorMessage={errors.website?.message}
                >
                    <Controller
                        name="website"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="https://yourwebsite.com" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="LinkedIn Profile"
                    invalid={Boolean(errors.linkedin_profile)}
                    errorMessage={errors.linkedin_profile?.message}
                >
                    <Controller
                        name="linkedin_profile"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="LinkedIn profile URL" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Facebook Profile"
                    invalid={Boolean(errors.facebook_profile)}
                    errorMessage={errors.facebook_profile?.message}
                >
                    <Controller
                        name="facebook_profile"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Facebook profile URL" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Twitter Handle"
                    invalid={Boolean(errors.twitter_handle)}
                    errorMessage={errors.twitter_handle?.message}
                >
                    <Controller
                        name="twitter_handle"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="@twitterhandle" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Instagram Handle"
                    invalid={Boolean(errors.instagram_handle)}
                    errorMessage={errors.instagram_handle?.message}
                >
                    <Controller
                        name="instagram_handle"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="@instagramhandle" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Telegram ID"
                    invalid={Boolean(errors.telegram_id)}
                    errorMessage={errors.telegram_id?.message}
                >
                    <Controller
                        name="telegram_id"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Enter Telegram ID" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Snapchat ID"
                    invalid={Boolean(errors.snapchat_id)}
                    errorMessage={errors.snapchat_id?.message}
                >
                    <Controller
                        name="snapchat_id"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Enter Snapchat ID" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="YouTube Channel"
                    invalid={Boolean(errors.youtube_channel)}
                    errorMessage={errors.youtube_channel?.message}
                >
                    <Controller
                        name="youtube_channel"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="YouTube channel URL" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Personal Email"
                    invalid={Boolean(errors.personal_email)}
                    errorMessage={errors.personal_email?.message}
                >
                    <Controller
                        name="personal_email"
                        control={control}
                        render={({ field }) => (
                            <Input type="email" autoComplete="off" placeholder="Enter personal email" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Alternate Email"
                    invalid={Boolean(errors.alternate_email)}
                    errorMessage={errors.alternate_email?.message}
                >
                    <Controller
                        name="alternate_email"
                        control={control}
                        render={({ field }) => (
                            <Input type="email" autoComplete="off" placeholder="Enter alternate email" {...field} />
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default ContactDetails

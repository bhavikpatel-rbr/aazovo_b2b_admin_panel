import Avatar from '@/components/ui/Avatar'
// eslint-disable-next-line import/named
import { Link } from 'react-scroll'
import { TbMicrophone, TbUsersGroup, TbBusinessplan, TbGitPullRequest, TbCertificate2, TbInfoSquare, TbFileInfo } from 'react-icons/tb'

const navigationList = [
    {
        label: 'Personal Details',
        link: 'personalDetails',
        icon: <TbFileInfo />,
    },
    {
        label: 'Social & Contact Information',
        link: 'socialContactInformation',
        icon: <TbMicrophone />,
    },
    {
        label: 'Member Accessibility',
        link: 'memberAccessibility',
        icon: <TbUsersGroup />,
    },
    {
        label: 'Membership Plan Details',
        link: 'membershipPlanDetails',
        icon: <TbBusinessplan />,
    },
        {
        label: 'Request & Feedbacks',
        link: 'requestAndFeedbacks',
        icon: <TbGitPullRequest />,
    },
]

const Navigator = () => {
    return (
        <div className="flex flex-col gap-2">
            {navigationList.map((nav) => (
                <Link
                    key={nav.label}
                    activeClass="bg-gray-100 dark:bg-gray-700 active"
                    className="cursor-pointer p-2 rounded-xl group hover:bg-gray-100 dark:hover:bg-gray-700"
                    to={nav.link}
                    spy={true}
                    smooth={true}
                    duration={500}
                    offset={-80}
                >
                    <span className="flex items-center gap-2">
                        <Avatar
                            icon={nav.icon}
                            className="bg-gray-100 dark:bg-gray-700 group-hover:bg-white group-[.active]:bg-white dark:group-hover:bg-gray-800 dark:group-[.active]:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <span className="flex flex-col flex-1">
                            <span className="heading-text font-bold">
                                {nav.label}
                            </span>
                            {/* <span>{nav.description}</span> */}
                        </span>
                    </span>
                </Link>
            ))}
        </div>
    )
}

export default Navigator

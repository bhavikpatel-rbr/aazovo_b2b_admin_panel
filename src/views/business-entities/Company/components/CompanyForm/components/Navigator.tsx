import Avatar from '@/components/ui/Avatar'
// eslint-disable-next-line import/named
import { Link } from 'react-scroll'
import { TbInfoTriangleFilled, TbTrademark, TbBrandOffice, TbCertificate, TbGitBranch, TbCertificate2 } from 'react-icons/tb'

const navigationList = [
    {
        label: 'Primary Information',
        link: 'companyDetails',
        icon: <TbInfoTriangleFilled />,
    },
    {
        label: 'Trade Information',
        link: 'tradeInformation',
        icon: <TbTrademark />,
    },
    {
        label: 'Company Information',
        link: 'companyInformation',
        icon: <TbBrandOffice />,
    },
    {
        label: 'Certificate & Licenses',
        link: 'certificateAndLicenses',
        icon: <TbCertificate />,
    },
        {
        label: 'Branches',
        link: 'branches',
        icon: <TbGitBranch />,
    },
        {
        label: 'KYC Documents',
        link: 'kycDocuments',
        icon: <TbCertificate2 />,
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

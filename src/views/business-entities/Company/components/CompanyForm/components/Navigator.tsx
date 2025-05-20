// Navigator.tsx

import classNames from 'classnames';

export const navigationList = [
    { label: 'Company Details', link: 'companyDetails' },
    { label: 'KYC Documents', link: 'kycDocuments' },
    { label: 'Bank Details', link: 'bankDetails' },
    { label: 'Accessibility', link: 'accessibility' },
    { label: 'Member Management', link: 'memberManagement' },
];

export type NavigationItem = typeof navigationList[0];

type NavigatorProps = {
    activeSection: string;
    onNavigate: (sectionKey: string) => void;
}

const Navigator = (props: NavigatorProps) => {
    const { activeSection, onNavigate } = props;

return (
        <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-hidden">
            {navigationList.map((nav) => (
                <button
                    type="button"
                    key={nav.link}
                    className={classNames(
                        'cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0',
                        'hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none',
                        {
                            // Using arbitrary value for text color:
                            'bg-indigo-50 dark:bg-indigo-700/60 text-[#2a85ff] dark:text-indigo-200 font-semibold': activeSection === nav.link,
                            'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200': activeSection !== nav.link
                        }
                    )}
                    onClick={() => onNavigate(nav.link)}
                    title={nav.label}
                >
                    <span className="font-semibold text-[10px] xxs:text-xs sm:text-sm truncate">
                        {nav.label}
                    </span>
                </button>
            ))}
        </div>
    );
}

export default Navigator;
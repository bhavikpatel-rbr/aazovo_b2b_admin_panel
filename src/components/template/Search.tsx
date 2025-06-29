import { useState, useRef, useEffect } from 'react'
import classNames from '@/utils/classNames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import ScrollBar from '@/components/ui/ScrollBar'
import navigationIcon from '@/configs/navigation-icon.config'
import {
    GUIDE_PREFIX_PATH,
    UI_COMPONENTS_PREFIX_PATH,
} from '@/constants/route.constant'
import { apiGetSearchResult } from '@/services/CommonService'
import debounce from 'lodash/debounce'
import { HiOutlineSearch, HiChevronRight } from 'react-icons/hi'
import { PiMagnifyingGlassDuotone } from 'react-icons/pi'
import { MdOutlinePushPin } from "react-icons/md";
import { Link } from 'react-router-dom'
import Highlighter from 'react-highlight-words'
import Checkbox from '../ui/Checkbox/Checkbox'

type SearchData = {
    key: string
    path: string
    title: string
    icon: string
    category: string
    categoryTitle: string
}

type SearchResult = {
    title: string
    pinned : boolean
    data: SearchData[]
}

const recommendedSearch: SearchResult[] = [
    {
        title: 'Pinned',
        pinned : true,
        data: [
            {
                key: 'Dashboard (Active',
                path: `/dashboards/active`,
                title: 'Dashboard (Active)',
                icon: 'dashboardAnalytic',
                category: 'Dashboard (Active)',
                categoryTitle: 'Dashboard (Active)',
            },
            {
                key: 'Company',
                path: `/business-entities/company`,
                title: 'Company',
                icon: 'company',
                category: 'Company',
                categoryTitle: 'Company',
            },
            {
                key: 'Member',
                path: `/business-entities/member`,
                title: 'Member',
                icon: 'account',
                category: 'Member',
                categoryTitle: 'Member',
            },
            {
                key: 'Leads',
                path: `/sales-leads/lead`,
                title: 'Leads',
                icon: 'leads',
                category: 'Leads',
                categoryTitle: 'Leads',
            },
        ],
    },
    {
        title: 'Recommended',
        pinned : false,
        data: [
            {
                key: 'Dashboard (main)',
                path: `/dashboards/main`,
                title: 'Dashboard (Main)',
                icon: 'iconDashboard',
                category: 'Dashboard (main)',
                categoryTitle: 'Dashboard (main)',
            },
            {
                key: 'Dashboard (Active)',
                path: `/dashboards/active`,
                title: 'Dashboard (Active)',
                icon: 'dashboardAnalytic',
                category: 'Dashboard (Active)',
                categoryTitle: 'Dashboard (Active)',
            },
            {
                key: 'Company',
                path: `/business-entities/company`,
                title: 'Company',
                icon: 'company',
                category: 'Company',
                categoryTitle: 'Company',
            },
            {
                key: 'Member',
                path: `/business-entities/member`,
                title: 'Member',
                icon: 'account',
                category: 'Member',
                categoryTitle: 'Member',
            },
            {
                key: 'Partners',
                path: `/business-entities/partner`,
                title: 'Partners',
                icon: 'heartHandshake',
                category: 'Partners',
                categoryTitle: 'Partners',
            },
            {
                key: 'Inquiries',
                path: `/business-entities/inquiries`,
                title: 'Inquiries',
                icon: 'userquestion',
                category: 'Inquiries',
                categoryTitle: 'Inquiries',
            },
            {
                key: 'All Documents',
                path: `/business-entities/all-documents`,
                title: 'All Documents',
                icon: 'documentation',
                category: 'All Documents',
                categoryTitle: 'All Documents',
            },
            {
                key: 'Brands',
                path: `/product-management/brands`,
                title: 'Brands',
                icon: 'badgetm',
                category: 'Brands',
                categoryTitle: 'Brands',
            },
            {
                key: 'Categories',
                path: `/product-management/categories`,
                title: 'Categories',
                icon: 'categories',
                category: 'Categories',
                categoryTitle: 'Categories',
            },
            {
                key: 'Products',
                path: `/business-entities/products`,
                title: 'Products',
                icon: 'productbox',
                category: 'Products',
                categoryTitle: 'Products',
            },
            {
                key: 'Wall Listing',
                path: `/sales-leads/wall-listing`,
                title: 'Wall Listing',
                icon: 'walllist',
                category: 'Wall Listing',
                categoryTitle: 'Wall Listing',
            },
            {
                key: 'Opportunities',
                path: `/sales-leads/opportunities`,
                title: 'Opportunities',
                icon: 'oprtunity',
                category: 'Opportunities',
                categoryTitle: 'Opportunities',
            },
            {
                key: 'Offers & Demands',
                path: `/sales-leads/offers-demands`,
                title: 'Offers & Demands',
                icon: 'offersdemands',
                category: 'Offers & Demands',
                categoryTitle: 'Offers & Demands',
            },
            {
                key: 'Leads',
                path: `/sales-leads/lead`,
                title: 'Leads',
                icon: 'leads',
                category: 'Leads',
                categoryTitle: 'Leads',
            },
            {
                key: 'Account Document',
                path: `/account-document`,
                title: 'Account Document',
                icon: 'accountDocument',
                category: 'Account Document',
                categoryTitle: 'Account Document',
            },
            {
                key: 'Requests & Feedbacks',
                path: `/user-engagement/request-feedback`,
                title: 'Requests & Feedbacks',
                icon: 'feedstar',
                category: 'Requests & Feedbacks',
                categoryTitle: 'Requests & Feedbacks',
            },
            {
                key: 'Tasks',
                path: `/task/task-list`,
                title: 'Tasks',
                icon: 'tasks',
                category: 'Email Campaigns',
                categoryTitle: 'Email Campaigns',
            },
            {
                key: 'Email Campaigns',
                path: `/email-messages/email-campaign`,
                title: 'Email Campaigns',
                icon: 'emailCamp',
                category: 'Email Campaigns',
                categoryTitle: 'Email Campaigns',
            },
            {
                key: 'Employees',
                path: `/hr-employees/employees`,
                title: 'Employees',
                icon: 'emplyeesgroup',
                category: 'Employees',
                categoryTitle: 'Employees',
            },
            {
                key: 'Job Applications',
                path: `/hr-employees/job-application`,
                title: 'Job Applications',
                icon: 'jobapp',
                category: 'Job Applications',
                categoryTitle: 'Job Applications',
            },
            {
                key: 'Roles & Permissions',
                path: `/access-control/roles`,
                title: 'Roles & Permissions',
                icon: 'roles',
                category: 'Roles & Permissions',
                categoryTitle: 'Roles & Permissions',
            },
            {
                key: 'Bug Reports',
                path: `/system-tools/bug-report`,
                title: 'Bug Reports',
                icon: 'bugs',
                category: 'Bug Reports',
                categoryTitle: 'Bug Reports',
            },
            {
                key: 'Notification',
                path: ``,
                title: 'Notification',
                icon: 'notification',
                category: 'Notification',
                categoryTitle: 'Notification',
            },
            {
                key: 'Activity Log',
                path: `/system-tools/activity-log`,
                title: 'Activity Log',
                icon: 'activetylog',
                category: 'Activity Log',
                categoryTitle: 'Activity Log',
            },
            {
                key: 'Categories Images',
                path: `/web-settings/home-category-image`,
                title: 'Categories Images',
                icon: 'catimages',
                category: 'Categories Images',
                categoryTitle: 'Categories Images',
            },
            {
                key: 'Sliders',
                path: `/web-settings/sliders`,
                title: 'Sliders',
                icon: 'slideimages',
                category: 'Sliders',
                categoryTitle: 'Sliders',
            },
            {
                key: 'Blogs',
                path: `/web-settings/blog`,
                title: 'Blogs',
                icon: 'blogs',
                category: 'Blogs',
                categoryTitle: 'Blogs',
            },
            {
                key: 'Price List',
                path: `/master/price-list`,
                title: 'Price List',
                icon: 'priceslist',
                category: 'Price List',
                categoryTitle: 'Price List',
            },
            {
                key: 'Export Mapping',
                path: `export-mapping`,
                title: 'Export Mapping ',
                icon: 'exportmap',
                category: 'Export Mapping',
                categoryTitle: 'Export Mapping',
            }
        ],
    },
]

const ListItem = (props: {
    icon: string
    label: string
    url: string
    isLast?: boolean
    keyWord: string
    onNavigate: () => void
    pinned : boolean
}) => {
    const { icon, label, url = '', keyWord, onNavigate, pinned } = props

    return (
        <div
            className={classNames(
                'flex items-center justify-between rounded-xl cursor-pointer user-select pr-3',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
            )}
        >
            <Link to={url} onClick={onNavigate} className='p-2'>
                <div className="flex items-center gap-2">
                    <div
                        className={classNames(
                            'rounded-lg border-2 border-gray-200 shadow-xs text-xl group-hover:shadow-sm h-10 w-10 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
                        )}
                    >
                        {icon && navigationIcon[icon]}
                    </div>

                    <div className="text-gray-900 dark:text-gray-300">
                        <Highlighter
                            autoEscape
                            highlightClassName={classNames(
                                'text-primary',
                                'underline bg-transparent font-semibold dark:text-white',
                            )}
                            searchWords={[keyWord]}
                            textToHighlight={label}
                        />
                    </div>
                </div>
                {/* <HiChevronRight className="text-lg" /> */}
            </Link>
            <Checkbox defaultChecked={pinned}/>
        </div>
    )
}

const _Search = ({ className }: { className?: string }) => {
    const [searchDialogOpen, setSearchDialogOpen] = useState(false)
    const [searchResult, setSearchResult] =
        useState<SearchResult[]>(recommendedSearch)
    const [noResult, setNoResult] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)

    const handleReset = () => {
        setNoResult(false)
        setSearchResult(recommendedSearch)
    }

    const handleSearchOpen = () => {
        setSearchDialogOpen(true)
    }

    const handleSearchClose = () => {
        setSearchDialogOpen(false)
        handleReset()
    }

    const debounceFn = debounce(handleDebounceFn, 200)

    async function handleDebounceFn(query: string) {
        if (!query) {
            setSearchResult(recommendedSearch)
            return
        }

        if (noResult) {
            setNoResult(false)
        }

        const respond = await apiGetSearchResult<SearchResult[]>({ query })

        if (respond) {
            if (respond.length === 0) {
                setNoResult(true)
            }
            setSearchResult(respond)
        }
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        debounceFn(e.target.value)
    }

    useEffect(() => {
        if (searchDialogOpen) {
            const timeout = setTimeout(() => inputRef.current?.focus(), 100)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [searchDialogOpen])

    const handleNavigate = () => {
        handleSearchClose()
    }

    return (
        <>
            <div
                className={classNames(className, 'text-2xl')}
                onClick={handleSearchOpen}
            >
                <MdOutlinePushPin />
            </div>
            <Dialog
                contentClassName="!p-0"
                isOpen={searchDialogOpen}
                closable={false}
                onRequestClose={handleSearchClose}
            >
                <div>
                    <div className="px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center">
                            <HiOutlineSearch className="text-xl" />
                            <input
                                ref={inputRef}
                                className="ring-0 outline-hidden block w-full p-4 text-base bg-transparent text-gray-900 dark:text-gray-100"
                                placeholder="Search..."
                                onChange={handleSearch}
                            />
                        </div>
                        <div className='flex gap-1'>
                            <Button size="xs" onClick={handleSearchClose}>
                                Esc
                            </Button>
                            <Button size="xs" onClick={handleSearchClose}>
                                <Link to="#">View</Link>
                            </Button>
                        </div>
                    </div>
                    <div className="py-6 px-5">
                        <ScrollBar className=" max-h-[350px] overflow-y-auto">
                            {searchResult.map((result) => (
                                <div key={result.title} className="mb-4">
                                    <h6 className="mb-3">{result.title}</h6>
                                    <div className='grid grid-cols-2 gap-2'>
                                        {result.data.map((data, index) => (
                                            <ListItem
                                                key={data.title + index}
                                                icon={data.icon}
                                                label={data.title}
                                                url={data.path}
                                                keyWord={
                                                    inputRef.current?.value || ''
                                                }
                                                onNavigate={handleNavigate}
                                                pinned={result.pinned}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {searchResult.length === 0 && noResult && (
                                <div className="my-10 text-center text-lg">
                                    <span>No results for </span>
                                    <span className="heading-text">
                                        {`'`}
                                        {inputRef.current?.value}
                                        {`'`}
                                    </span>
                                </div>
                            )}
                        </ScrollBar>
                    </div>
                </div>
            </Dialog>
        </>
    )
}

const Search = withHeaderItem(_Search)

export default Search

import { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import classNames from '@/utils/classNames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import ScrollBar from '@/components/ui/ScrollBar'
import Checkbox from '@/components/ui/Checkbox'
import Highlighter from 'react-highlight-words'
import Spinner from '@/components/ui/Spinner'
import Tooltip from '@/components/ui/Tooltip'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import navigationIcon from '@/configs/navigation-icon.config'
import { apiGetSearchResult } from '@/services/CommonService'
import debounce from 'lodash/debounce'
import { HiOutlineSearch } from 'react-icons/hi'
import { MdOutlinePushPin } from "react-icons/md";

// Redux Imports
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import { 
    getPinnedTabAction, 
    addPinnedAction, 
    removePinnedAction 
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
// --- TYPE DEFINITIONS ---

type SearchData = {
    key: string // A unique identifier for the module
    path: string
    title: string
    icon: string
    category: string
    categoryTitle:string
}

type SearchResult = {
    title: string
    pinned: boolean
    data: SearchData[]
}

// --- SIMULATED MASTER DATA ---
// In a real app, this would come from your navigation config, not be hardcoded here.
const allNavigationItems: SearchData[] = [
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
];


const ListItem = (props: {
    data: SearchData
    keyWord: string
    onNavigate: () => void
    pinned: boolean
    onPinToggle: (item: SearchData, isPinned: boolean) => void
}) => {
    const { data, keyWord, onNavigate, pinned, onPinToggle } = props
    const { icon, title, path } = data

    return (
        <div
            className={classNames(
                'flex items-center justify-between rounded-xl group pr-3',
                'hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
        >
            <Link to={path} onClick={onNavigate} className="p-2 flex-grow">
                <div className="flex items-center gap-2">
                    <div
                        className={classNames(
                            'rounded-lg border-2 border-gray-200 shadow-xs text-xl group-hover:shadow-sm h-10 w-10 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        )}
                    >
                        {icon && navigationIcon[icon]}
                    </div>

                    <div className="text-gray-900 dark:text-gray-300">
                        <Highlighter
                            autoEscape
                            highlightClassName="text-primary underline bg-transparent font-semibold dark:text-white"
                            searchWords={[keyWord]}
                            textToHighlight={title}
                        />
                    </div>
                </div>
            </Link>
            <Tooltip title={pinned ? 'Unpin this item' : 'Pin this item'}>
                <Checkbox checked={pinned} onChange={(checked) => onPinToggle(data, checked)} />
            </Tooltip>
        </div>
    )
}


const _Search = ({ className }: { className?: string }) => {
    const dispatch = useAppDispatch()

    const [searchDialogOpen, setSearchDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    
    // Get pinned tabs from Redux store
    // Define RootState type according to your Redux store structure
    // interface RootState {
    //     common: {
    //         pinnedTabs: any[] // Replace 'any' with the actual type if known
    //     }
    // }
    // const pinnedTabs = useSelector((state: RootState) => state.common?.pinnedTabs ?? [])
    const {
        pinnedTabs = [],
        status: masterLoadingStatus = "idle",
    } = useSelector(masterSelector, shallowEqual);
    const inputRef = useRef<HTMLInputElement>(null)
console.log("pinnedTabs", pinnedTabs)
    // --- Data Fetching ---
    useEffect(() => {
        if (searchDialogOpen) {
            setIsLoading(true)
            dispatch(getPinnedTabAction()).finally(() => {
                setIsLoading(false)
            })
            // Focus input after a short delay
            const timeout = setTimeout(() => inputRef.current?.focus(), 100)
            return () => clearTimeout(timeout)
        }
    }, [searchDialogOpen, dispatch])


    // --- Core Logic for Display ---
    const displayedResults = useMemo((): SearchResult[] => {
        // Create a Set of pinned keys for efficient lookup
        const pinnedKeys = new Set(pinnedTabs.map((tab) => tab.module_name));

        // 1. Filter all items by the search query
        const filteredItems = allNavigationItems.filter((item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // 2. Partition the filtered items into 'pinned' and 'unpinned'
        const pinnedGroupData: SearchData[] = [];
        const unpinnedGroupData: SearchData[] = [];

        filteredItems.forEach((item) => {
            if (pinnedKeys.has(item.key)) {
                pinnedGroupData.push(item);
            } else {
                unpinnedGroupData.push(item);
            }
        });
        
        // 3. Construct the final data structure for rendering
        const results: SearchResult[] = [];
        if (pinnedGroupData.length > 0) {
            results.push({ title: 'Pinned', pinned: true, data: pinnedGroupData });
        }
        if (unpinnedGroupData.length > 0) {
            // If there's a search query, 'Recommended' is confusing. 'All Items' is better.
            const title = searchQuery ? 'Search Results' : 'All Items';
            results.push({ title: title, pinned: false, data: unpinnedGroupData });
        }
        
        return results;

    }, [pinnedTabs, searchQuery]);


    // --- Handlers ---
    const handleSearchOpen = () => setSearchDialogOpen(true)

    const handleSearchClose = () => {
        setSearchDialogOpen(false)
        setSearchQuery('') // Reset search on close
    }

    const handleNavigate = () => handleSearchClose()
    // In your Search.tsx component

    const handleTogglePin = async (item: SearchData, isPinned: boolean) => {
        // Dispatch the appropriate action
        const action = isPinned ? addPinnedAction : removePinnedAction;
        const actionType = isPinned ? 'Pinned' : 'Unpinned';
        
        try {
            // MODIFICATION: Add `is_pinned` to the payload
            await dispatch(action({ module_name: item.key, is_pinned: isPinned })).unwrap();
            
            toast.push(
                <Notification title={`Item ${actionType}`} type="success">
                    {`'${item.title}' has been successfully ${actionType.toLowerCase()}.`}
                </Notification>
            );
        } catch (error) {
            toast.push(
                <Notification title="Error" type="danger">
                    {`Failed to ${isPinned ? 'pin' : 'unpin'} item. Please try again.`}
                </Notification>
            );
        }
    };
    // Debounced search handler
    const debounceFn = useMemo(() => 
        debounce((query: string) => {
            setSearchQuery(query)
        }, 300), 
    [])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        debounceFn(e.target.value)
    }

    return (
        <>
            <div
                className={classNames(className, 'text-2xl cursor-pointer')}
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
                        <div className="flex items-center w-full">
                            <HiOutlineSearch className="text-xl" />
                            <input
                                ref={inputRef}
                                className="ring-0 outline-none block w-full p-4 text-base bg-transparent text-gray-900 dark:text-gray-100"
                                placeholder="Search all items..."
                                onChange={handleSearch}
                            />
                        </div>
                        <Button size="xs" onClick={handleSearchClose}>
                            Esc
                        </Button>
                    </div>
                    <div className="py-6 px-5">
                        <ScrollBar className="max-h-[400px]">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-40">
                                    <Spinner size="lg" />
                                </div>
                            ) : (
                                <>
                                    {displayedResults.map((result) => (
                                        <div key={result.title} className="mb-6">
                                            <h6 className="mb-3">{result.title}</h6>
                                            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2'>
                                                {result.data.map((data, index) => (
                                                    <ListItem
                                                        key={data.key}
                                                        data={data}
                                                        keyWord={searchQuery}
                                                        onNavigate={handleNavigate}
                                                        pinned={result.pinned}
                                                        onPinToggle={handleTogglePin}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {displayedResults.length === 0 && (
                                        <div className="my-10 text-center text-lg">
                                            <span>No results for </span>
                                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                                                {`'${searchQuery}'`}
                                            </span>
                                        </div>
                                    )}
                                </>
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
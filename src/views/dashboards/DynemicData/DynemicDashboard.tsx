import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useAppDispatch } from '@/reduxtool/store';

// UI Components
import Card from '@/components/ui/Card';
// --- LIKELY ERROR SOURCE & FIX ---
// This error usually means Tabs or Skeleton is not exported from this file.
// Please ensure your '@/components/ui' index file exports all these components.
import { Avatar, Tag, Tooltip, Tabs, Skeleton } from '@/components/ui';
import { NumericFormat } from 'react-number-format';
import { Link } from 'react-router-dom';

// Redux Actions & Selectors
import { masterSelector } from '@/reduxtool/master/masterSlice';
import { 
    getCompanyAction, 
    getEmployeesListingAction, 
    getMemberAction, 
    getpartnerAction, 
    getProductsAction 
} from '@/reduxtool/master/middleware';

// Icons
import { MdOutlineBusinessCenter, MdQueryStats } from 'react-icons/md';
import { TbCube3dSphere, TbHeartHandshake, TbUserCircle, TbUsersGroup, TbBuildingStore, TbBrandApple } from 'react-icons/tb';
import TabList from '@/components/ui/Tabs/TabList';

// --- HELPER FUNCTIONS ---

// Safely gets a nested property from an object, preventing runtime errors.
const get = (obj: any, path: string, defaultValue: any = 0) => {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
        if (result === null || result === undefined) return defaultValue;
        result = result[key];
    }
    return result === undefined || result === null ? defaultValue : result;
};

// --- REUSABLE COMPONENTS ---

const KpiCard = ({ title, value, icon, isLoading }: { title: string; value: string | number; icon: ReactNode, isLoading?: boolean }) => (
    <Card>
        {isLoading ? (
            <div className="flex items-center gap-4 animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-12 w-12"></div>
                <div className="flex flex-col gap-2">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-16"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-24"></div>
                </div>
            </div>
        ) : (
             <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-100 text-2xl">
                    {icon}
                </div>
                <div>
                    <h4 className="font-bold text-lg">
                        <NumericFormat value={value} displayType="text" thousandSeparator />
                    </h4>
                    <p className="text-sm text-gray-500">{title}</p>
                </div>
            </div>
        )}
    </Card>
);

const Leaderboard = ({ title, items, renderItem, viewAllLink }: { title: string, items: any[], renderItem: (item: any, index: number) => ReactNode, viewAllLink: string }) => (
    <Card className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 shrink-0">
            <h5 className="font-semibold">{title}</h5>
            <Link to={viewAllLink} className="text-sm text-blue-600 hover:underline">View All</Link>
        </div>
        <div className="space-y-2 overflow-y-auto">
            {items.length > 0 
                ? items.slice(0, 5).map(renderItem)
                : <p className="text-gray-400 text-sm text-center py-4">No data to display.</p>
            }
        </div>
    </Card>
);


// --- 2. INDIVIDUAL DASHBOARD VIEWS ---

const CompaniesDashboardView = ({ data, isLoading }: { data: any, isLoading: boolean }) => {
    const chartData = useMemo(() => {
        if (isLoading || !data?.data) return null;

        const businessTypes = data.data.reduce((acc: any, company: any) => {
            const type = company.primary_business_type || 'Uncategorized';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        return {
            verification: {
                series: [get(data, 'counts.verified'), get(data, 'counts.non_verified')],
                labels: ['Verified', 'Non-Verified'],
            },
            businessTypes: {
                series: [{ name: 'Count', data: Object.values(businessTypes) }],
                categories: Object.keys(businessTypes),
            },
            leaderboard: [...data.data].sort((a,b) => get(b, 'profile_completion', 0) - get(a, 'profile_completion', 0))
        };
    }, [data, isLoading]);
    
    if (isLoading) return <Skeleton className="w-full h-96" />;
    if (!chartData) return <div className="text-center p-8">No company data available.</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <h5 className="font-semibold mb-4">Companies by Business Type</h5>
                    <ReactApexChart options={{ chart: { type: 'bar' }, xaxis: { categories: chartData.businessTypes.categories }}} series={chartData.businessTypes.series} type="bar" height={300} />
                </Card>
                <Card>
                     <h5 className="font-semibold mb-4">Verification Status</h5>
                    <ReactApexChart options={{ chart: {type: 'donut'}, labels: chartData.verification.labels, legend: { position: 'bottom' }}} series={chartData.verification.series} type="donut" height={300} />
                </Card>
            </div>
            <Leaderboard title="Top Companies by Profile Completion" items={chartData.leaderboard} viewAllLink="/app/companies" renderItem={(company, i) => (
                 <div key={i} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                        <Avatar shape="circle" src={company.company_logo} />
                        <div>
                            <p className="font-semibold text-sm">{company.company_name}</p>
                            <p className="text-xs text-gray-500">{company.primary_business_type || 'N/A'}</p>
                        </div>
                    </div>
                    <Tag className="font-bold">{company.profile_completion}%</Tag>
                </div>
            )} />
        </div>
    )
}

const MembersDashboardView = ({ data, isLoading }: { data: any, isLoading: boolean }) => {
     const chartData = useMemo(() => {
        if (isLoading || !data?.data) return null;
        
        const membersByCountry = data.data.reduce((acc: any, member: any) => {
            const country = get(member, 'country.name', 'Unknown');
            acc[country] = (acc[country] || 0) + 1;
            return acc;
        }, {});

        return {
             countryDistribution: {
                series: [{ name: 'Members', data: Object.values(membersByCountry) }],
                categories: Object.keys(membersByCountry),
            },
            leaderboard: [...data.data].sort((a,b) => get(b, 'opportunities.total', 0) - get(a, 'opportunities.total', 0))
        };
    }, [data, isLoading]);
    
    if (isLoading) return <Skeleton className="w-full h-96" />;
    if (!chartData) return <div className="text-center p-8">No member data available.</div>;
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <h5 className="font-semibold mb-4">Member Distribution by Country</h5>
                    <ReactApexChart options={{ chart: { type: 'bar' }, xaxis: { categories: chartData.countryDistribution.categories }}} series={chartData.countryDistribution.series} type="bar" height={350} />
                </Card>
                 <Leaderboard title="Top Members by Opportunities" items={chartData.leaderboard} viewAllLink="/app/members" renderItem={(member, i) => (
                     <div key={i} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                            <Avatar shape="circle" src={member.full_profile_pic} />
                            <div>
                                <p className="font-semibold text-sm">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                        </div>
                        <Tag className="font-bold">{get(member, 'opportunities.total', 0)}</Tag>
                    </div>
                )} />
            </div>
        </div>
    )
}

const ProductsDashboardView = ({ data, isLoading }: { data: any, isLoading: boolean }) => {
    const chartData = useMemo(() => {
        if (isLoading || !data?.data) return null;
        
        const productsByBrand = data.data.reduce((acc: any, product: any) => {
            const brand = get(product, 'brand.name', 'Unbranded');
            acc[brand] = (acc[brand] || 0) + 1;
            return acc;
        }, {});

        return {
            brandDistribution: {
                series: Object.values(productsByBrand),
                labels: Object.keys(productsByBrand),
            },
            leaderboard: [...data.data].sort((a,b) => get(b, 'opportunities.total', 0) - get(a, 'opportunities.total', 0))
        };
    }, [data, isLoading]);

    if (isLoading) return <Skeleton className="w-full h-96" />;
    if (!chartData) return <div className="text-center p-8">No product data available.</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <h5 className="font-semibold mb-4">Products by Brand</h5>
                <ReactApexChart options={{ chart: {type: 'donut'}, labels: chartData.brandDistribution.labels, legend: { position: 'bottom' }}} series={chartData.brandDistribution.series} type="donut" height={400} />
            </Card>
            <Leaderboard title="Top Products by Opportunities" items={chartData.leaderboard} viewAllLink="/app/products" renderItem={(product, i) => (
                <div key={i} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                    <Avatar shape="square" src={product.thumb_image_full_path} />
                    <div>
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{get(product, 'brand.name', 'N/A')}</p>
                    </div>
                </div>
                <Tag className="font-bold">{get(product, 'opportunities.total', 0)}</Tag>
            </div>
            )} />
        </div>
    )
}

// Simplified Dashboards for Partners and Teams
const PartnersDashboardView = ({ data, isLoading }: { data: any, isLoading: boolean }) => {
     const chartData = useMemo(() => {
        if (isLoading || !data?.data) return null;
        return {
            leaderboard: [...data.data].sort((a,b) => get(b, 'profile_completion', 0) - get(a, 'profile_completion', 0))
        };
    }, [data, isLoading]);

    if (isLoading) return <Skeleton className="w-full h-96" />;
    if (!chartData) return <div className="text-center p-8">No partner data available.</div>;
    
    return (
        <Leaderboard title="Top Partners by Profile Completion" items={chartData.leaderboard} viewAllLink="/app/partners" renderItem={(partner, i) => (
            <div key={i} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                    <Avatar shape="circle" src={partner.partner_logo} />
                    <div>
                        <p className="font-semibold text-sm">{partner.partner_name}</p>
                        <p className="text-xs text-gray-500">{partner.primary_business_type || 'N/A'}</p>
                    </div>
                </div>
                <Tag className="font-bold">{partner.profile_completion}%</Tag>
            </div>
        )} />
    )
}

const TeamsDashboardView = ({ data, isLoading }: { data: any, isLoading: boolean }) => {
    const chartData = useMemo(() => {
        if (isLoading || !data?.data?.data) return null;
        return {
            leaderboard: [...data.data.data].sort((a,b) => get(b, 'opportunities.total', 0) - get(a, 'opportunities.total', 0))
        };
    }, [data, isLoading]);

    if (isLoading) return <Skeleton className="w-full h-96" />;
    if (!chartData) return <div className="text-center p-8">No team data available.</div>;
    
    return (
        <Leaderboard title="Top Team Members by Opportunities" items={chartData.leaderboard} viewAllLink="/app/teams" renderItem={(member, i) => (
            <div key={i} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                    <Avatar shape="circle" src={member.profile_pic_path} />
                    <div>
                        <p className="font-semibold text-sm">{member.name}</p>
                        <p className="text-xs text-gray-500">{get(member, 'designation.name', 'N/A')}</p>
                    </div>
                </div>
                <Tag className="font-bold">{get(member, 'opportunities.total', 0)}</Tag>
            </div>
        )} />
    )
}


// --- 3. THE MAIN DASHBOARD WRAPPER ---
const DynamicDashboard = () => {
    const [activeTab, setActiveTab] = useState('companies');
    const dispatch = useAppDispatch();
    const { 
        CompanyData, 
        MemberData, 
        ProductsData, 
        partnerData, 
        EmployeesList 
    } = useSelector(masterSelector);

    const isLoading = !CompanyData || !MemberData || !ProductsData || !partnerData || !EmployeesList;

    useEffect(() => {
        dispatch(getCompanyAction());
        dispatch(getMemberAction());
        dispatch(getProductsAction());
        dispatch(getpartnerAction());
        dispatch(getEmployeesListingAction());
    }, [dispatch]);

    const renderContent = () => {
        switch (activeTab) {
            case 'companies':
                return <CompaniesDashboardView data={CompanyData} isLoading={!CompanyData} />;
            case 'members':
                return <MembersDashboardView data={MemberData} isLoading={!MemberData} />;
            case 'products':
                return <ProductsDashboardView data={ProductsData} isLoading={!ProductsData} />;
            case 'partners':
                return <PartnersDashboardView data={partnerData} isLoading={!partnerData} />;
            case 'teams':
                return <TeamsDashboardView data={EmployeesList} isLoading={!EmployeesList} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* High-Level KPI Overview */}
            <div>
                 <h3 className="text-2xl font-bold mb-4">Business Overview</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard title="Total Companies" value={get(CompanyData, 'counts.total', 0)} icon={<MdOutlineBusinessCenter />} isLoading={!CompanyData} />
                    <KpiCard title="Total Members" value={get(MemberData, 'counts.total', 0)} icon={<TbUserCircle />} isLoading={!MemberData} />
                    <KpiCard title="Total Products" value={get(ProductsData, 'counts.total', 0)} icon={<TbCube3dSphere />} isLoading={!ProductsData}/>
                    <KpiCard title="Total Partners" value={get(partnerData, 'counts.total', 0)} icon={<TbHeartHandshake />} isLoading={!partnerData}/>
                </div>
            </div>

            {/* Tabbed Detailed Dashboards */}
            <Card>
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <TabList>
                        <Tabs.Tab value="companies">Companies</Tabs.Tab>
                        <Tabs.Tab value="members">Members</Tabs.Tab>
                        <Tabs.Tab value="products">Products</Tabs.Tab>
                        <Tabs.Tab value="partners">Partners</Tabs.Tab>
                        <Tabs.Tab value="teams">Teams</Tabs.Tab>
                    </TabList>
                    <div className="p-4 mt-4">
                        {renderContent()}
                    </div>
                </Tabs>
            </Card>
        </div>
    );
};

export default DynamicDashboard;
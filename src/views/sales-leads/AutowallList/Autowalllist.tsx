import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DebounceInput from '@/components/shared/DebouceInput';
import DataTable from '@/components/shared/DataTable'; // Using the more advanced DataTable
import {
  Button,
  Tag,
  Tooltip,
  Select,
  Drawer,
  Dialog,
  Form,
  FormItem,
  Input,
  Notification,
  toast,
} from "@/components/ui";
import {
  ColumnDef,
} from "@tanstack/react-table";
import classNames from "@/utils/classNames";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useForm, Controller } from 'react-hook-form';
import Chart from 'react-apexcharts';
// Icons
import { TbChevronDown, TbChevronRight, TbSearch, TbFilter, TbReload, TbX, TbPencil, TbPlus } from "react-icons/tb";

// --- START: Types ---

interface OnSortParam {
    key: string;
    order: 'asc' | 'desc' | '';
}

interface TableQueries {
    pageIndex: number;
    pageSize: number;
    sort: OnSortParam;
    query: string;
}

interface WaMessageData {
  aiFormatted: string;
  originalMessage: string;
}

interface StaticLogItem extends WaMessageData {
  id: number;
  status: 'Success' | 'Failed';
  product: string;
  dealType: 'WTS' | 'WTB';
  memberId: string;
  qty: number;
  deal: 'Sell' | 'Buy';
  reason: string;
  createdBy: string;
  createdDate: string;
}

// --- START: Expanded Static Data ---

const staticSuccessData: StaticLogItem[] = [
    {
        id: 25,
        status: 'Success',
        product: 'IPHONE 14 PRO 256GB',
        dealType: 'WTS',
        memberId: '510112',
        qty: 50,
        deal: 'Sell',
        reason: 'Keyword found',
        createdBy: 'System AI',
        createdDate: '18-06-2025 09:30 AM',
        aiFormatted: `Member ID: 510112\nDeal Type: WTS\nProduct: iPhone 14 Pro 256GB\nCountry Spec: HK\nQty: 50\nColor: -\nStatus: Active`,
        originalMessage: `WTS\niPhone 14 Pro 256GB HK SPEC\n50 units ready stock\nMember: 510112`,
    },
    {
        id: 22,
        status: 'Success',
        product: 'SAMSUNG S23 ULTRA',
        dealType: 'WTB',
        memberId: '509876',
        qty: 200,
        deal: 'Buy',
        reason: 'Keyword found',
        createdBy: 'Ajay patel',
        createdDate: '17-06-2025 04:15 PM',
        aiFormatted: `Member ID: 509876\nDeal Type: WTB\nProduct: Samsung S23 Ultra\nCountry Spec: US\nQty: 200\nColor: -\nStatus: Active`,
        originalMessage: `Want to buy 200x S23 Ultra US spec. Contact 509876.`,
    },
    {
        id: 20,
        status: 'Success',
        product: 'IPHONE 13 128GB',
        dealType: 'WTS',
        memberId: '509923',
        qty: 150,
        deal: 'Sell',
        reason: 'Keyword found',
        createdBy: 'System AI',
        createdDate: '17-06-2025 11:00 AM',
        aiFormatted: `Member ID: 509923\nDeal Type: WTS\nProduct: iPhone 13 128GB\nCountry Spec: US\nQty: 150\nColor: -\nStatus: Active`,
        originalMessage: `*SELLING*\n150 PCS iPhone 13 128GB US SPEC. Good price. Member 509923`,
    },
    {
        id: 15,
        status: 'Success',
        product: 'MACBOOK AIR M2',
        dealType: 'WTS',
        memberId: '511234',
        qty: 20,
        deal: 'Sell',
        reason: 'Keyword found',
        createdBy: 'System AI',
        createdDate: '16-06-2025 05:20 PM',
        aiFormatted: `Member ID: 511234\nDeal Type: WTS\nProduct: Macbook Air M2\nCountry Spec: -\nQty: 20\nColor: Midnight\nStatus: Active`,
        originalMessage: `20 units Macbook Air M2 Midnight color for sale. Contact 511234.`,
    },
    {
        id: 12,
        status: 'Success',
        product: 'IPHONE 14 128GB',
        dealType: 'WTB',
        memberId: '507789',
        qty: 300,
        deal: 'Buy',
        reason: '(keyword)',
        createdBy: 'Jane Doe',
        createdDate: '16-06-2025 01:05 PM',
        aiFormatted: `Member ID: 507789\nDeal Type: WTB\nProduct: iPhone 14 128GB\nCountry Spec: JP\nQty: 300\nColor: Blue\nStatus: Active`,
        originalMessage: `WTB\niPhone 14 128gb Blue\n300 units\nJP SPEC\n507789`,
    },
    {
        id: 9,
        status: 'Success',
        product: 'IPHONE 13 128GB',
        dealType: 'WTS',
        memberId: '509923',
        qty: 100,
        deal: 'Sell',
        reason: '(keyword)',
        createdBy: 'Ajay patel',
        createdDate: '16-06-2025 10:16 AM',
        aiFormatted: `Member ID: 509923\nDeal Type: WTS\nProduct: iPhone 13 128\nCountry Spec: US\nQty: 100\nColor: -\nStatus: Active`,
        originalMessage: `*WANT TO SELL*\n\n*13 128GB @ 190 PCS US SPEC\n*13 128GB @100 PCS US SPEC\n*13PRO MAX 256GB @ 100 PCS US SPEC\n509923`,
    },
    {
        id: 8,
        status: 'Success',
        product: 'IPHONE 13 128GB',
        dealType: 'WTS',
        memberId: '509923',
        qty: 190,
        deal: 'Sell',
        reason: 'Keyword found',
        createdBy: 'Ajay patel',
        createdDate: '16-06-2025 10:16 AM',
        aiFormatted: `Member ID: 509923\nDeal Type: WTS\nProduct: iPhone 13 128\nCountry Spec: US\nQty: 190\nColor: -\nStatus: Active`,
        originalMessage: `*WANT TO SELL*\n\n*13 128GB @ 190 PCS US SPEC\n*13 128GB @100 PCS US SPEC\n*13PRO MAX 256GB @ 100 PCS US SPEC\n509923`,
    },
];

const staticFailedData: StaticLogItem[] = [
    {
        id: 26,
        status: 'Failed',
        product: '-',
        dealType: 'WTB',
        memberId: '510333',
        qty: 0,
        deal: 'Buy',
        reason: 'Quantity not found',
        createdBy: 'System AI',
        createdDate: '18-06-2025 10:45 AM',
        aiFormatted: `Member ID: 510333\nDeal Type: WTB\nProduct: iPhone 12 Mini\nReason: Quantity not found`,
        originalMessage: `Looking for iPhone 12 Mini green. Member 510333`,
    },
    {
        id: 24,
        status: 'Failed',
        product: 'IPHONE 11',
        dealType: 'WTS',
        memberId: '509999',
        qty: 10,
        deal: 'Sell',
        reason: 'Member ID not registered',
        createdBy: 'System AI',
        createdDate: '17-06-2025 08:00 PM',
        aiFormatted: `Member ID: -\nDeal Type: WTS\nProduct: iPhone 11\nQty: 10\nReason: Member ID not registered`,
        originalMessage: `Selling 10 units of iPhone 11. New condition. Contact me.`,
    },
    {
        id: 23,
        status: 'Failed',
        product: '-',
        dealType: 'WTS',
        memberId: '508868',
        qty: 0,
        deal: 'Sell',
        reason: 'Ambiguous product name',
        createdBy: 'Ajay patel',
        createdDate: '17-06-2025 05:00 PM',
        aiFormatted: `Member ID: 508868\nDeal Type: WTS\nProduct: -\nReason: Ambiguous product name`,
        originalMessage: `I have phones for sale, many models. Good price. 508868`,
    },
    {
        id: 21,
        status: 'Failed',
        product: '-',
        dealType: 'WTB',
        memberId: '511444',
        qty: 50,
        deal: 'Buy',
        reason: 'Fuzzy score too low (45%)',
        createdBy: 'System AI',
        createdDate: '17-06-2025 02:30 PM',
        aiFormatted: `Member ID: 511444\nDeal Type: WTB\nProduct: -\nQty: 50\nReason: Fuzzy score too low (45%)`,
        originalMessage: `WTB i-phone fourteen pro max deep purple 50pcs 511444`,
    },
    {
        id: 18,
        status: 'Failed',
        product: 'APPLE WATCH 8',
        dealType: 'WTS',
        memberId: '508868',
        qty: 0,
        deal: 'Sell',
        reason: 'Quantity not found',
        createdBy: 'Jane Doe',
        createdDate: '17-06-2025 09:10 AM',
        aiFormatted: `Member ID: 508868\nDeal Type: WTS\nProduct: Apple Watch 8\nReason: Quantity not found`,
        originalMessage: `Apple Watch Series 8 for sale. Multiple colors. Call 508868`,
    },
    {
        id: 16,
        status: 'Failed',
        product: '-',
        dealType: 'WTB',
        memberId: '509923',
        qty: 1000,
        deal: 'Buy',
        reason: 'Fuzzy score too low (61%)',
        createdBy: 'System AI',
        createdDate: '16-06-2025 04:00 PM',
        aiFormatted: `Member ID: 509923\nDeal Type: WTB\nProduct: -\nQty: 1000\nReason: Fuzzy score too low (61%)`,
        originalMessage: `WTB 1k units iPhne 14 Pro Mx US spec. 509923.`,
    },
    {
        id: 11,
        status: 'Failed',
        product: '-',
        dealType: 'WTS',
        memberId: '508868',
        qty: 100,
        deal: 'Sell',
        reason: 'Ambiguous product name',
        createdBy: 'System AI',
        createdDate: '16-06-2025 12:45 PM',
        aiFormatted: `Member ID: 508868\nDeal Type: WTS\nProduct: -\nQty: 100\nReason: Ambiguous product name`,
        originalMessage: `Have 100 phones available. Latest model. Contact 508868`,
    },
    {
        id: 7,
        status: 'Failed',
        product: '-',
        dealType: 'WTB',
        memberId: '508868',
        qty: 100,
        deal: 'Buy',
        reason: 'Fuzzy score too low (59%)',
        createdBy: 'Ajay patel',
        createdDate: '16-06-2025 10:14 AM',
        aiFormatted: `Member ID: 508868\nDeal Type: WTB\nProduct: -\nQty: 100\nReason: Fuzzy score too low (59%)`,
        originalMessage: `WTB\niPhone 14 Pro Max 256GB\n100 Units\nUS SPEC`,
    },
    {
        id: 4,
        status: 'Failed',
        product: '-',
        dealType: 'WTB',
        memberId: '508868',
        qty: 100,
        deal: 'Buy',
        reason: 'Fuzzy score too low (58%)',
        createdBy: 'Ajay patel',
        createdDate: '16-06-2025 10:14 AM',
        aiFormatted: `Member ID: 508868\nDeal Type: WTB\nProduct: -\nQty: 100\nReason: Fuzzy score too low (58%)`,
        originalMessage: `WTB\niPhone 14 Pro 128GB\n100 Units\nDEEP PURPLE`,
    },
];
// --- END: Expanded Static Data ---


const MessageSubRow: React.FC<{ data: WaMessageData; colSpan: number }> = ({ data, colSpan }) => {
  return (
    <tr>
        <td colSpan={colSpan} className="p-0 !border-0">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h6 className="mb-2 font-semibold">AI Formatted</h6>
                    <div className="p-3 bg-white dark:bg-gray-700/50 rounded-md border dark:border-gray-600 h-full">
                    <pre className="text-sm whitespace-pre-wrap font-sans">{data.aiFormatted}</pre>
                    </div>
                </div>
                <div>
                    <h6 className="mb-2 font-semibold">Original WA Message</h6>
                    <div className="p-3 bg-white dark:bg-gray-700/50 rounded-md border dark:border-gray-600 h-full">
                    <pre className="text-sm whitespace-pre-wrap font-sans">{data.originalMessage}</pre>
                    </div>
                </div>
            </div>
        </td>
    </tr>
  );
};

// --- START: Reusable UI Components ---

type AutoWallFilterSchema = {
    status: ('Success' | 'Failed')[];
};

const statusOptions = [
  { value: 'Success', label: 'Success' },
  { value: 'Failed', label: 'Failed' },
];

const ActiveFiltersDisplay: React.FC<{
    filterData: Partial<AutoWallFilterSchema>;
    onRemoveFilter: (key: keyof AutoWallFilterSchema, value: string) => void;
    onClearAll: () => void;
}> = ({ filterData, onRemoveFilter, onClearAll }) => {
    const activeStatuses = filterData.status || [];
    const hasActiveFilters = activeStatuses.length > 0;

    if (!hasActiveFilters) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {activeStatuses.map(status => (
                <Tag key={`status-${status}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">
                    Status: {status}
                    <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('status', status)} />
                </Tag>
            ))}
            {hasActiveFilters && <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>}
        </div>
    );
};

const AutoWallTableTools: React.FC<{
    onSearchChange: (value: string) => void;
    onApplyFilters: (data: AutoWallFilterSchema) => void;
    onClearFilters: () => void;
    activeFilters: Partial<AutoWallFilterSchema>;
    activeFilterCount: number;
    searchInputValue: string;
}> = ({ onSearchChange, onApplyFilters, onClearFilters, activeFilters, activeFilterCount, searchInputValue }) => {
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const { control, handleSubmit, setValue } = useForm<AutoWallFilterSchema>({
        defaultValues: { status: [] },
    });

    useEffect(() => {
        setValue('status', activeFilters.status || []);
    }, [activeFilters, setValue]);

    const onSubmit = (data: AutoWallFilterSchema) => {
        onApplyFilters(data);
        setIsFilterDrawerOpen(false);
    };

    const onDrawerClear = () => {
        onApplyFilters({ status: [] });
        setIsFilterDrawerOpen(false);
    };

    return (
        <>
            <div className="md:flex items-center justify-between w-full gap-2">
                <div className="flex-grow mb-2 md:mb-0">
                    <DebounceInput
                        value={searchInputValue}
                        placeholder="Search logs by ID, product, member, reason..."
                        suffix={<TbSearch className="text-lg" />}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        title="Clear Filters & Reload"
                        icon={<TbReload />}
                        onClick={onClearFilters}
                    />
                    <Button
                        icon={<TbFilter />}
                        onClick={() => setIsFilterDrawerOpen(true)}
                    >
                        Filter
                        {activeFilterCount > 0 && (
                            <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>
            <Drawer
                title="Filters"
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={onDrawerClear}>Clear</Button>
                        <Button size="sm" variant="solid" type="submit" form="filterAutoWallForm">Apply</Button>
                    </div>
                }
            >
                <Form id="filterAutoWallForm" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Status">
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select status..."
                                    options={statusOptions}
                                    value={statusOptions.filter(o => field.value?.includes(o.value as 'Success' | 'Failed'))}
                                    onChange={(val) => field.onChange(val.map(v => v.value))}
                                />
                            )}
                        />
                    </FormItem>
                </Form>
            </Drawer>
        </>
    );
};
// --- END: Reusable UI Components ---


// --- START: Enhanced Chart View Component ---

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={classNames("border rounded-lg p-4 bg-white dark:bg-gray-800/50 dark:border-gray-600 shadow-sm flex flex-col", className)}>
        <h5 className="mb-4 font-semibold text-gray-700 dark:text-gray-200">{title}</h5>
        <div className="flex-grow flex items-center justify-center">
            {children}
        </div>
    </div>
);

const ChartView: React.FC<{ data: StaticLogItem[] }> = ({ data }) => {
  
    const processedChartData = useMemo(() => {
        const logsByDay: { [key: string]: { success: number; failed: number } } = {};
        const dealTypes = { wts: 0, wtb: 0 };
        const failureReasons: { [key: string]: number } = {};
        const processingSource: { [key: string]: number } = {};
        const topProducts: { [key: string]: number } = {};
        let totalSuccess = 0;
        let totalFailed = 0;

        for (const item of data) {
            // Aggregate logs by day
            const date = item.createdDate.split(' ')[0];
            if (!logsByDay[date]) logsByDay[date] = { success: 0, failed: 0 };

            if (item.status === 'Success') {
                logsByDay[date].success++;
                totalSuccess++;
                if(item.product !== '-') {
                  topProducts[item.product] = (topProducts[item.product] || 0) + 1;
                }
            } else {
                logsByDay[date].failed++;
                totalFailed++;
                failureReasons[item.reason] = (failureReasons[item.reason] || 0) + 1;
            }

            // Aggregate deal types
            if (item.dealType === 'WTS') dealTypes.wts++;
            else dealTypes.wtb++;

            // Aggregate by creator
            processingSource[item.createdBy] = (processingSource[item.createdBy] || 0) + 1;
        }

        const sortedDays = Object.keys(logsByDay).sort((a, b) => {
            const [dayA, monthA, yearA] = a.split('-').map(Number);
            const [dayB, monthB, yearB] = b.split('-').map(Number);
            return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
        });

        const timeSeries = {
            dates: sortedDays,
            success: sortedDays.map(day => logsByDay[day].success),
            failed: sortedDays.map(day => logsByDay[day].failed),
        };

        const top5FailureReasons = Object.entries(failureReasons)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        const top5Products = Object.entries(topProducts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
            
        const sortedProcessingSource = Object.entries(processingSource)
            .sort(([, a], [, b]) => b - a);

        return { timeSeries, dealTypes, top5FailureReasons, sortedProcessingSource, top5Products, totalSuccess, totalFailed };
    }, [data]);

    // A more modern and theme-aware options generator for ApexCharts
    const getCommonOptions = (extraOptions: ApexCharts.ApexOptions = {}): ApexCharts.ApexOptions => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        return {
            chart: { 
                background: 'transparent', 
                toolbar: { show: false },
                fontFamily: 'inherit',
            },
            grid: {
                borderColor: isDarkMode ? '#4b5563' : '#e5e7eb', // gray-600 or gray-200
            },
            theme: {
                mode: isDarkMode ? 'dark' : 'light',
            },
            dataLabels: { enabled: false },
            legend: {
                labels: {
                    colors: isDarkMode ? '#9ca3af' : '#6b7280', // gray-400 or gray-500
                }
            },
            ...extraOptions,
        };
    };
    
    // 1. Time Series Chart
    const timeSeriesOptions: ApexCharts.ApexOptions = getCommonOptions({
        chart: { type: 'area', stacked: true },
        colors: ['#10b981', '#ef4444'], // emerald-500, red-500
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            type: 'category',
            categories: processedChartData.timeSeries.dates,
            labels: { style: { colors: undefined } }, // Let theme handle it
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: { labels: { style: { colors: undefined } } }, // Let theme handle it
        fill: { type: 'gradient', gradient: { opacityFrom: 0.6, opacityTo: 0.1 } },
        tooltip: { x: { format: 'dd MMM yyyy' } },
        legend: { position: 'top', horizontalAlign: 'right' },
    });
    const timeSeriesSeries = [
        { name: 'Success', data: processedChartData.timeSeries.success },
        { name: 'Failed', data: processedChartData.timeSeries.failed },
    ];

    // 2. Success Rate Radial Chart
    const totalLogs = processedChartData.totalSuccess + processedChartData.totalFailed;
    const successRate = totalLogs > 0 ? Math.round((processedChartData.totalSuccess / totalLogs) * 100) : 0;
    const successRateOptions: ApexCharts.ApexOptions = getCommonOptions({
        chart: { type: 'radialBar' },
        plotOptions: {
            radialBar: {
                hollow: { margin: 15, size: '65%' },
                track: { background: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb', strokeWidth: '100%' },
                dataLabels: {
                    showOn: 'always',
                    name: { show: true, fontSize: '14px', fontWeight: 600, color: '#6b7280', offsetY: -10 },
                    value: { show: true, fontSize: '28px', fontWeight: 700, color: document.documentElement.classList.contains('dark') ? '#f9fafb' : '#111827', offsetY: 10, formatter: (val) => `${val}%` }
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'horizontal',
                shadeIntensity: 0.5,
                gradientToColors: ['#10b981'],
                inverseColors: true,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100],
            },
        },
        stroke: { lineCap: 'round' },
        labels: ['Success Rate'],
        colors: ['#34d399'], // emerald-400
    });
    const successRateSeries = [successRate];

    // 3. Deal Type Donut Chart
    const dealTypeOptions: ApexCharts.ApexOptions = getCommonOptions({
        chart: { type: 'donut' },
        labels: ['Want to Sell (WTS)', 'Want to Buy (WTB)'],
        colors: ['#3b82f6', '#8b5cf6'], // blue-500, violet-500
        legend: { position: 'bottom' },
        plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: 'Total Deals' } } } } },
    });
    const dealTypeSeries = [processedChartData.dealTypes.wts, processedChartData.dealTypes.wtb];

    // 4. Top Failure Reasons Bar Chart
    const failureReasonOptions: ApexCharts.ApexOptions = getCommonOptions({
        chart: { type: 'bar' },
        plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '60%' } },
        xaxis: { categories: processedChartData.top5FailureReasons.map(([reason]) => reason) },
        colors: ['#f43f5e'], // rose-500
        tooltip: { x: { title: { text: 'Reason' } }, y: { title: { text: 'Count' } } },
    });
    const failureReasonSeries = [{ name: "Count", data: processedChartData.top5FailureReasons.map(([, count]) => count) }];

    // 5. Top Products Bar Chart
    const topProductsOptions: ApexCharts.ApexOptions = getCommonOptions({
        chart: { type: 'bar' },
        plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '60%' } },
        xaxis: { categories: processedChartData.top5Products.map(([product]) => product) },
        colors: ['#0ea5e9'], // sky-500
        tooltip: { y: { title: { text: 'Mentions' } } },
    });
    const topProductsSeries = [{ name: 'Count', data: processedChartData.top5Products.map(([, count]) => count) }];

    // 6. Processing Source Pie Chart
    const processingSourceOptions: ApexCharts.ApexOptions = getCommonOptions({
        chart: { type: 'pie' },
        labels: processedChartData.sortedProcessingSource.map(([name]) => name),
        colors: ['#14b8a6', '#f97316', '#a855f7'], // teal-500, orange-500, purple-500
        legend: { position: 'bottom' },
    });
    const processingSourceSeries = processedChartData.sortedProcessingSource.map(([, count]) => count);

    if (data.length === 0) {
        return (
            <div className="flex justify-center items-center h-full p-8 text-gray-500">
                No data available to display charts based on current filters.
            </div>
        );
    }

    return (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <ChartCard title="Logs Over Time" className="md:col-span-2 xl:col-span-4">
                 <div className="w-full">
                    <Chart options={timeSeriesOptions} series={timeSeriesSeries} type="area" height={300} />
                 </div>
            </ChartCard>
            
            <ChartCard title="Success Rate" className="md:col-span-1 xl:col-span-1">
                <Chart options={successRateOptions} series={successRateSeries} type="radialBar" height={300} />
            </ChartCard>

            <ChartCard title="Deal Type Distribution" className="md:col-span-1 xl:col-span-1">
                <Chart options={dealTypeOptions} series={dealTypeSeries} type="donut" height={300} />
            </ChartCard>
            
            <ChartCard title="Processing Source" className="md:col-span-2 xl:col-span-2">
                <Chart options={processingSourceOptions} series={processingSourceSeries} type="pie" height={300} />
            </ChartCard>

            <ChartCard title="Top 5 Failure Reasons" className="md:col-span-2 xl:col-span-2">
                 {processedChartData.top5FailureReasons.length > 0 ? (
                    <div className="w-full">
                        <Chart options={failureReasonOptions} series={failureReasonSeries} type="bar" height={280} />
                    </div>
                ) : <p className="text-gray-400">No failed logs to analyze.</p>}
            </ChartCard>
            
            <ChartCard title="Top 5 Products (Success Logs)" className="md:col-span-2 xl:col-span-2">
                 {processedChartData.top5Products.length > 0 ? (
                    <div className="w-full">
                        <Chart options={topProductsOptions} series={topProductsSeries} type="bar" height={280} />
                    </div>
                ) : <p className="text-gray-400">No successful logs with products.</p>}
            </ChartCard>
        </div>
    );
};
// --- END: Enhanced Chart View Component ---

// --- START: Action Modals ---

const productStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'sold_out', label: 'Sold Out' },
];

const UpdateWallDialog = ({ isOpen, onClose, logData }: { isOpen: boolean; onClose: () => void; logData: StaticLogItem }) => {
    const { control, handleSubmit, reset } = useForm();

    useEffect(() => {
        if (isOpen && logData) {
            reset({ productStatus: null });
        }
    }, [isOpen, logData, reset]);

    const onSubmit = (data: { productStatus: { label: string } }) => {
        toast.push(<Notification title="Update Success" type="success">{`Wall listing for "${logData.product}" has been updated.`}</Notification>);
        onClose();
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            title="Update Wall listing"
            footer={
                <>
                    <Button onClick={onClose}>Close</Button>
                    <Button variant="solid" type="submit" form="updateWallForm" className="ml-2">Save</Button>
                </>
            }
        >
            <Form id="updateWallForm" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <FormItem label="Member">
                     <Input disabled value={logData.memberId} />
                </FormItem>
                <FormItem label="Product">
                    <Input disabled value={logData.product} />
                </FormItem>
                <FormItem label="Product Status">
                     <Controller
                        name="productStatus"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Select
                                placeholder="Select Product Status"
                                options={productStatusOptions}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
            </Form>
        </Dialog>
    );
};

const productOptions = [
    { value: 'macbook_air_m4_18gb_256gb_sky_blue', label: 'MACBOOK AIR M4 18GB 256GB MC6T4 (SKYBLUE)' },
    { value: 'iphone_15_pro_max_256', label: 'iPhone 15 Pro Max 256GB' },
    { value: 'samsung_s24_ultra_512', label: 'Samsung S24 Ultra 512GB' },
];

const AddManualDialog = ({ isOpen, onClose, logData }: { isOpen: boolean; onClose: () => void; logData: StaticLogItem }) => {
    const { control, handleSubmit, reset } = useForm();

    useEffect(() => {
        if (isOpen && logData) {
            const keyword = logData.product && logData.product !== '-' 
                ? logData.product 
                : logData.originalMessage.split('\n')[0].trim();
            reset({ product: null, keyword });
        }
    }, [isOpen, logData, reset]);

    const onSubmit = (data: { product: { label: string } }) => {
        toast.push(<Notification title="Add Success" type="success">{`Manual wall listing for "${data.product.label}" has been added.`}</Notification>);
        onClose();
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            title="Add Manual"
            footer={
                <>
                    <Button onClick={onClose}>Close</Button>
                    <Button variant="solid" type="submit" form="addManualForm" className="ml-2">Save</Button>
                </>
            }
        >
            <Form id="addManualForm" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <FormItem label="Product">
                    <Controller
                        name="product"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Select
                                placeholder="Select a product"
                                options={productOptions}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem label="Keyword">
                    <Controller
                        name="keyword"
                        control={control}
                        render={({ field }) => (
                            <Input {...field} />
                        )}
                    />
                    <p className="text-xs text-gray-500 mt-1">Add this keyword?</p>
                </FormItem>
            </Form>
        </Dialog>
    );
};

// --- END: Action Modals ---

// --- START: Product Wise View Component ---

const ProductAccordion: React.FC<{ title: string; count: number; children: React.ReactNode }> = ({ title, count, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-2 overflow-hidden">
            <button
                className="w-full flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <h6 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h6>
                    <Tag className="bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300">{count} {count > 1 ? 'messages' : 'message'}</Tag>
                </div>
                {isOpen ? <TbChevronDown className="h-5 w-5 text-gray-500" /> : <TbChevronRight className="h-5 w-5 text-gray-500" />}
            </button>
            {isOpen && (
                <div className="p-4 bg-white dark:bg-gray-800/50">
                    <div className="space-y-4">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const ProductWiseView: React.FC<{ data: StaticLogItem[] }> = ({ data }) => {
    const productGroupedData = useMemo(() => {
        const groups: { [key: string]: StaticLogItem[] } = {};
        const successLogs = data.filter(item => item.status === 'Success' && item.product !== '-');

        for (const log of successLogs) {
            if (!groups[log.product]) {
                groups[log.product] = [];
            }
            groups[log.product].push(log);
        }

        const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
        const sortedGroups: { [key: string]: StaticLogItem[] } = {};
        for(const key of sortedKeys) {
            sortedGroups[key] = groups[key];
        }

        return sortedGroups;
    }, [data]);

    const productKeys = Object.keys(productGroupedData);

    if (productKeys.length === 0) {
        return (
            <div className="flex justify-center items-center h-full p-8 text-gray-500">
                No successful product logs found for the current filters.
            </div>
        );
    }

    return (
        <div className="p-4">
            {productKeys.map(productName => (
                <ProductAccordion key={productName} title={productName} count={productGroupedData[productName].length}>
                    {productGroupedData[productName].map(log => (
                         <div key={log.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
                            <div className="flex justify-between items-center mb-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>Member: <span className="font-semibold text-gray-700 dark:text-gray-300">{log.memberId}</span></span>
                                <span>Date: <span className="font-semibold text-gray-700 dark:text-gray-300">{log.createdDate}</span></span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h6 className="mb-2 text-sm font-semibold">AI Formatted</h6>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-600 h-full">
                                    <pre className="text-xs whitespace-pre-wrap font-sans">{log.aiFormatted}</pre>
                                    </div>
                                </div>
                                <div>
                                    <h6 className="mb-2 text-sm font-semibold">Original WA Message</h6>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-600 h-full">
                                    <pre className="text-xs whitespace-pre-wrap font-sans">{log.originalMessage}</pre>
                                    </div>
                                </div>
                            </div>
                         </div>
                    ))}
                </ProductAccordion>
            ))}
        </div>
    );
};
// --- END: Product Wise View Component ---

const TABS = {
  CHART: "chart_view",
  MESSAGE: "message_tab",
  PRODUCT_WISE: "product_wise",
  SUCCESS: "success_wall",
  FAILED: "failed_wall",
};

const AutoWallListing = () => {
    const [currentTab, setCurrentTab] = useState<string>(TABS.CHART);
    const [activeFilters, setActiveFilters] = useState<Partial<AutoWallFilterSchema>>({});
    const [tableQueries, setTableQueries] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: 'id' },
        query: '',
    });
    
    // State for modals
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<StaticLogItem | null>(null);

    const handleOpenUpdateModal = (log: StaticLogItem) => {
        setSelectedLog(log);
        setIsUpdateModalOpen(true);
    };

    const handleOpenAddModal = (log: StaticLogItem) => {
        setSelectedLog(log);
        setIsAddModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsUpdateModalOpen(false);
        setIsAddModalOpen(false);
        setSelectedLog(null);
    };


    const handleTabChange = (tabKey: string) => {
        if (tabKey !== currentTab) {
            setCurrentTab(tabKey);
            // Reset pagination when switching tabs
            setTableQueries(prev => ({ ...prev, pageIndex: 1 }));
        }
    };
    
    // --- Data Fetching & Memoization ---
    const allLogsData = useMemo(() => {
        return [...staticSuccessData, ...staticFailedData].sort((a, b) => b.id - a.id);
    }, []);

    // --- State Handlers (Callbacks) ---
    const handleSetTableQueries = useCallback((queries: Partial<TableQueries>) => {
        setTableQueries(prev => ({ ...prev, ...queries }));
    }, []);

    const handlePaginationChange = useCallback((page: number) => {
        handleSetTableQueries({ pageIndex: page });
    }, [handleSetTableQueries]);
    
    const handleSelectPageSizeChange = useCallback((value: number) => {
        handleSetTableQueries({ pageSize: value, pageIndex: 1 });
    }, [handleSetTableQueries]);
    
    const handleSort = useCallback((sort: OnSortParam) => {
        handleSetTableQueries({ sort: sort, pageIndex: 1 });
    }, [handleSetTableQueries]);
    
    const handleSearchChange = useCallback((query: string) => {
        handleSetTableQueries({ query: query, pageIndex: 1 });
    }, [handleSetTableQueries]);

    const handleApplyFilters = useCallback((filters: Partial<AutoWallFilterSchema>) => {
        setActiveFilters(filters);
        handleSetTableQueries({ pageIndex: 1 });
    }, [handleSetTableQueries]);
    
    const handleRemoveFilter = useCallback((key: keyof AutoWallFilterSchema, value: string) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            const currentValues = prev[key] as string[] | undefined;
            if (!currentValues) return prev;
            
            const newValues = currentValues.filter(item => item !== value);
            
            if (newValues.length > 0) {
                (newFilters as any)[key] = newValues;
            } else {
                delete newFilters[key];
            }
            return newFilters;
        });
        handleSetTableQueries({ pageIndex: 1 });
    }, [handleSetTableQueries]);

    const onClearFiltersAndReload = useCallback(() => {
        setActiveFilters({});
        setTableQueries(prev => ({ ...prev, query: '', pageIndex: 1, sort: { order: '', key: 'id' } }));
        toast.push(<Notification title="Filters Cleared" type="success">Data has been reloaded.</Notification>)
    }, []);

    // --- Data Processing Pipeline ---
    const globallyFilteredData = useMemo(() => {
        let processedData = [...allLogsData];

        if (activeFilters.status?.length) {
            const statuses = new Set(activeFilters.status);
            processedData = processedData.filter(item => statuses.has(item.status));
        }

        if (tableQueries.query) {
            const query = tableQueries.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(query))
            );
        }
        return processedData;
    }, [allLogsData, tableQueries.query, activeFilters]);

    const { pageData, total } = useMemo(() => {
        let data = [...globallyFilteredData];

        switch(currentTab) {
            case TABS.SUCCESS:
                data = data.filter(item => item.status === 'Success');
                break;
            case TABS.FAILED:
                data = data.filter(item => item.status === 'Failed');
                break;
            default:
                break;
        }

        const { order, key } = tableQueries.sort as OnSortParam;
        if (order && key && data.length > 0) {
            data.sort((a, b) => {
                const aValue = a[key as keyof StaticLogItem] ?? '';
                const bValue = b[key as keyof StaticLogItem] ?? '';
                 if (key === 'id' || key === 'qty') {
                     return order === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
                 }
                return order === 'asc'
                    ? String(aValue).localeCompare(String(bValue))
                    : String(bValue).localeCompare(String(aValue));
            });
        }

        const currentTotal = data.length;
        const { pageIndex, pageSize } = tableQueries;
        const startIndex = (pageIndex - 1) * pageSize;
        const paginatedData = data.slice(startIndex, startIndex + pageSize);

        return { pageData: paginatedData, total: currentTotal };
    }, [globallyFilteredData, currentTab, tableQueries]);


    const activeFilterCount = useMemo(() => (activeFilters.status?.length ? 1 : 0), [activeFilters]);
    
    const columns = useMemo((): ColumnDef<StaticLogItem>[] => [
        { id: 'expander', header: () => null, size: 40, cell: ({ row }) => (
            <div className="flex justify-center">
                <Tooltip title={row.getIsExpanded() ? 'Collapse' : 'Expand'}><Button shape="circle" variant="plain" size="sm" icon={row.getIsExpanded() ? <TbChevronDown /> : <TbChevronRight />} onClick={row.getToggleExpandedHandler()} /></Tooltip>
            </div>
        )},
        { header: 'ID', accessorKey: 'id', size: 60, enableSorting: true },
        { header: 'Status', accessorKey: 'status', enableSorting: true, cell: ({ row }) => {
            const { status } = row.original;
            const isSuccess = status === 'Success';
            return <Tag className={classNames('capitalize', isSuccess ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200')}>{status}</Tag>;
        }},
        { header: 'Product', accessorKey: 'product', enableSorting: true },
        { header: 'Deal Type', accessorKey: 'dealType', enableSorting: true },
        { header: 'Member ID', accessorKey: 'memberId', enableSorting: true },
        { header: 'Qty', accessorKey: 'qty', enableSorting: true },
        { header: 'Deal', accessorKey: 'deal', enableSorting: true },
        { header: 'Reason', accessorKey: 'reason', size: 250, enableSorting: true },
        { header: 'Created By', accessorKey: 'createdBy', enableSorting: true },
        { header: 'Created Date', accessorKey: 'createdDate', enableSorting: true },
        { id: 'action', header: 'Action', size: 100, cell: ({ row }) => {
            const log = row.original;
            return (
                <div className="flex justify-center items-center gap-2">
                    {log.status === 'Success' ? (
                        <Tooltip title="Edit Wall">
                            <Button shape="circle" variant="plain" size="sm" icon={<TbPencil />} onClick={() => handleOpenUpdateModal(log)} />
                        </Tooltip>
                    ) : (
                         <Tooltip title="Add Manual Wall">
                            <Button shape="circle" variant="plain" size="sm" icon={<TbPlus />} onClick={() => handleOpenAddModal(log)} />
                        </Tooltip>
                    )}
                </div>
            )
        }}
    ], []);

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-4">
            <h3 className="mb-4 lg:mb-0">Auto Wall Logs</h3>
          </div>

          <div className="mb-4">
            <AutoWallTableTools
              onSearchChange={handleSearchChange}
              onApplyFilters={handleApplyFilters}
              onClearFilters={onClearFiltersAndReload}
              activeFilters={activeFilters}
              activeFilterCount={activeFilterCount}
              searchInputValue={tableQueries.query}
            />
          </div>
          
          <ActiveFiltersDisplay 
            filterData={activeFilters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={onClearFiltersAndReload}
          />
          
          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
              {Object.keys(TABS).map((tabKey) => {
                const tabValue = TABS[tabKey as keyof typeof TABS];
                return (
                    <button
                        key={tabValue}
                        onClick={() => handleTabChange(tabValue)}
                        className={classNames("whitespace-nowrap pb-2 mt-2 px-1 border-b-2 font-medium text-sm capitalize", currentTab === tabValue ? "border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600")}
                    >
                        {tabValue.replace(/_/g, " ")}
                    </button>
                )
              })}
            </nav>
          </div>
          
          <div className="flex-grow overflow-auto bg-gray-50 dark:bg-gray-900/50">
            {currentTab === TABS.CHART ? (
              <ChartView data={globallyFilteredData} />
            ) : currentTab === TABS.PRODUCT_WISE ? (
              <ProductWiseView data={globallyFilteredData} />
            ) : (
              <DataTable
                columns={columns}
                data={pageData}
                skeletonAvatarColumns={[0]}
                skeletonAvatarProps={{ size: 'sm', shape: 'circle' }}
                loading={false} // Static data, no loading state
                noData={total === 0}
                pagingData={{
                    total: total,
                    pageIndex: tableQueries.pageIndex,
                    pageSize: tableQueries.pageSize,
                }}
                onPaginationChange={handlePaginationChange}
                onSelectChange={handleSelectPageSizeChange}
                onSort={handleSort}
                renderRowSubComponent={({ row, colSpan }) => <MessageSubRow data={row.original as WaMessageData} colSpan={colSpan} />}
              />
            )}
          </div>
        </AdaptiveCard>
      </Container>
      {selectedLog && (
        <>
            <UpdateWallDialog
                isOpen={isUpdateModalOpen}
                onClose={handleCloseModals}
                logData={selectedLog}
            />
            <AddManualDialog
                isOpen={isAddModalOpen}
                onClose={handleCloseModals}
                logData={selectedLog}
            />
        </>
      )}
    </>
  );
};

export default AutoWallListing;
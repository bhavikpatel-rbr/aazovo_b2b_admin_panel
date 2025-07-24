import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';

// --- ENTERPRISE-GRADE MOCK DATA WAREHOUSE (Refactored for Leads) ---
const aazovoEnterpriseData = {
    sales: {
        // Core Lead Metrics
        leadsLast30Days: 210, prevLeadsLast30Days: 180,
        opportunitiesCreated: 75, prevOpportunitiesCreated: 65,
        opportunitiesWon: 52, prevOpportunitiesWon: 48,
        winRate: 0.247, prevWinRate: 0.22,
        salesCycleDays: 28, prevSalesCycleDays: 32,
        
        // Data for Funnel and Source Analysis (by count)
        leadsBySource: { "Organic Search": 80, "Paid Campaigns": 65, "Partner Referrals": 45, "Direct": 20 },
        opportunitiesCreatedBySource: { "Organic Search": 30, "Paid Campaigns": 25, "Partner Referrals": 15, "Direct": 5 },
        wonDealsBySource: { "Partner Referrals": 22, "Paid Campaigns": 15, "Organic Search": 12, "Direct": 3 },

        // Sales Team Performance (unchanged)
        salesTeamPerformance: [
            { name: 'A. Chen', deals: 45, quota: 40 },
            { name: 'B. Singh', deals: 38, quota: 40 },
            { name: 'C. Davis', deals: 35, quota: 35 },
            { name: 'D. Miller', deals: 28, quota: 35 },
        ]
    },
    users: {
        totalActiveBuyers: 5200, totalActiveSellers: 1800,
        buyerGrowth: [{ name: 'New Buyers', data: [310, 400, 280, 510] }, { name: 'Returning Buyers', data: [1100, 1250, 1400, 1600] }],
        retentionCohort: [
            { name: 'May-24', data: [100, 65, 55, 48, 45, 42, 41] },
            { name: 'Jun-24', data: [100, 70, 62, 55, 51, 49] },
            { name: 'Jul-24', data: [100, 72, 68, 61, 58] },
            { name: 'Aug-24', data: [100, 75, 70, 68] },
            { name: 'Sep-24', data: [100, 80, 75] },
            { name: 'Oct-24', data: [100, 82] },
            { name: 'Nov-24', data: [100] },
        ]
    },
    marketplace: {
        dealVolumeByCategory: { "Electronics": 1250, "Industrial": 980, "Textiles": 750, "Chemicals": 550, "Services": 400 },
        dealVelocityHistory: [45, 42, 38, 35, 32, 28],
        wallListingTrend: [
            { name: 'Buy Listings (RFQs)', data: [1200, 1250, 1400, 1500, 1800, 1900] },
            { name: 'Sell Listings', data: [3500, 3600, 3800, 4100, 4200, 4500] }
        ],
        geoDealData: [{ x: 'USA', y: 1250 }, { x: 'China', y: 980 }, { x: 'Germany', y: 650 }, { x: 'India', y: 550 }, { x: 'Brazil', y: 420 }],
    },
    operations: {
        supportTickets: { analysis: [{ name: 'Opened', data: [460, 520] }, { name: 'Resolved', data: [455, 515] }] },
        platformUptime: 99.98,
        apiSuccessRate: 99.2,
    }
};

// --- UI & HELPER COMPONENTS (Unchanged) ---
const DashboardCard = ({ children, gridColumn, style }) => (
    <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e9ecef', gridColumn, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', ...style }}>
        {children}
    </div>
);
const CardHeader = ({ title, subtitle }) => (
    <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f3f5' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#212529' }}>{title}</h3>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6c757d' }}>{subtitle}</p>}
    </div>
);
const KpiCard = ({ title, value, trend, unit = '', color = '#212529' }) => (
    <DashboardCard gridColumn="span 2">
        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', color: '#6c757d' }}>{title}</h4>
        <div style={{ fontSize: '2rem', fontWeight: '700', color, marginTop: '8px', marginBottom: '8px' }}>{value}{unit}</div>
        <div style={{ color: trend >= 0 ? '#28a745' : '#dc3545', fontWeight: '600', marginTop: 'auto', fontSize: '0.9rem' }}>
            {trend >= 0 ? `▲` : `▼`} {Math.abs(trend)}% vs last period
        </div>
    </DashboardCard>
);

// --- VIEW COMPONENTS (Refactored) ---

const LeadFunnelView = ({ data }) => (
    <>
        <DashboardCard gridColumn="span 12"><CardHeader title="Lead to Win Funnel by Source" subtitle="Tracking conversion stages across different channels" />
            <Chart options={{ chart: { type: 'bar', stacked: true, toolbar: { show: false } }, plotOptions: { bar: { columnWidth: '60%', borderRadius: 5 } }, dataLabels: { enabled: false }, xaxis: { categories: data.sourceLabels }, legend: { position: 'top', horizontalAlign: 'right' } }} series={data.funnelSeries} type="bar" height={400} />
        </DashboardCard>
    </>
);

const SalesView = ({ data }) => (
    <>
        <DashboardCard gridColumn="span 7"><CardHeader title="Won Deals by Lead Source" subtitle="Which channels deliver the most closed deals" />
            <Chart options={{ chart: { type: 'bar' }, plotOptions: { bar: { borderRadius: 4, horizontal: true, distributed: true } }, legend: { show: false }, xaxis: { categories: data?.wonDealsBySource?.labels } }} series={[{ name: 'Won Deals', data: data.wonDealsBySource.series }]} type="bar" height={350} />
        </DashboardCard>
        <DashboardCard gridColumn="span 5"><CardHeader title="Sales Team Performance" subtitle="Deals closed vs. quota" />
            <Chart options={{ chart: { type: 'bar' }, plotOptions: { bar: { columnWidth: '60%' } }, colors: ['#0052cc', '#dc3545'], xaxis: { categories: data.salesTeamPerformance.labels }, yaxis: { title: { text: 'Deals Closed' } }, dataLabels: { enabled: false } }} series={data.salesTeamPerformance.series} type="bar" height={350} />
        </DashboardCard>
    </>
);

const UserAnalyticsView = ({ data }) => (
    <>
        <DashboardCard gridColumn="span 12"><CardHeader title="New User Retention by Monthly Cohort" subtitle="% of users active in months after signup" />
            <Chart options={{ chart: { type: 'heatmap', toolbar: { show: false } }, plotOptions: { heatmap: { enableShades: false, colorScale: { ranges: [{ from: 0, to: 20, name: 'low', color: '#FFDAB9' }, { from: 21, to: 50, name: 'medium', color: '#FFA07A' }, { from: 51, to: 80, name: 'high', color: '#F08080' }, { from: 81, to: 100, name: 'excellent', color: '#CD5C5C' }] } } }, dataLabels: { enabled: true, style: { colors: ['#000'] } }, xaxis: { title: { text: 'Months Since Signup' } } }} series={data.retentionCohort} type="heatmap" height={350} />
        </DashboardCard>
        <DashboardCard gridColumn="span 12"><CardHeader title="Monthly Active Buyers: New vs. Returning" subtitle="Indicates platform growth and loyalty" />
            <Chart options={{ chart: { type: 'bar', stacked: true, toolbar: { show: false } }, plotOptions: { bar: { columnWidth: '50%' } }, xaxis: { categories: ['Jul', 'Aug', 'Sep', 'Oct'] } }} series={data.buyerGrowth} type="bar" height={250} />
        </DashboardCard>
    </>
);

const MarketplaceHealthView = ({ data }) => (
    <>
        <DashboardCard gridColumn="span 7"><CardHeader title="Global Deal Volume Hotspots" />
            <Chart options={{ chart: { type: 'treemap', toolbar: { show: false } }, legend: { show: false }, plotOptions: { treemap: { distributed: true, enableShades: false } } }} series={[{ data: data.geoDealData }]} type="treemap" height={350} />
        </DashboardCard>
        <DashboardCard gridColumn="span 5"><CardHeader title="Deal Velocity Trend" subtitle="Average time in days from listing to close" />
            <Chart options={{ chart: { type: 'line', toolbar: { show: false } }, stroke: { curve: 'smooth' }, markers: { size: 5 }, yaxis: { reversed: true, title: { text: 'Days to Close' } } }} series={[{ name: 'Deal Velocity', data: data.dealVelocityHistory }]} type="line" height={350} />
        </DashboardCard>
        <DashboardCard gridColumn="span 12"><CardHeader title="Active Wall Listings (Buy vs. Sell)" subtitle="Shows supply and demand balance on the platform" />
            <Chart options={{ chart: { type: 'line', toolbar: { show: false } }, stroke: { curve: 'smooth', width: [3, 2] }, legend: { position: 'top' }, markers: { size: 0 }, xaxis: { categories: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'] } }} series={data.wallListingTrend} type="line" height={250} />
        </DashboardCard>
    </>
);


// --- THE ENTERPRISE DASHBOARD COMPONENT ---
const AazovoEnterpriseDashboard = () => {
    const [activeTab, setActiveTab] = useState('sales');

    const processedData = useMemo(() => {
        const { sales, users, marketplace } = aazovoEnterpriseData;
        const calculateTrend = (current, previous) => (((current - previous) / previous) * 100).toFixed(1);

        const leadSources = Object.keys(sales.leadsBySource);

        return {
            kpi: {
                // REPLACED REVENUE KPIs WITH LEAD KPIs
                newLeads: { value: sales.leadsLast30Days, trend: calculateTrend(sales.leadsLast30Days, sales.prevLeadsLast30Days), color: '#17a2b8' },
                opportunitiesWon: { value: sales.opportunitiesWon, trend: calculateTrend(sales.opportunitiesWon, sales.prevOpportunitiesWon), color: '#007bff' },
                leadConversionRate: { value: ((sales.opportunitiesCreated / sales.leadsLast30Days) * 100).toFixed(1), unit: '%', trend: 8.3, color: '#6f42c1' },
                winRate: { value: (sales.winRate * 100).toFixed(1), unit: '%', trend: calculateTrend(sales.winRate, sales.prevWinRate), color: '#28a745' },
                salesCycle: { value: sales.salesCycleDays, unit: ' Days', trend: calculateTrend(sales.salesCycleDays, sales.prevSalesCycleDays) * -1, color: '#ffc107' },
                dealVelocity: { value: marketplace.dealVelocityHistory.at(-1), unit: ' Days', trend: -7.1, color: '#fd7e14' },
            },
            // NEW LEAD FUNNEL DATA
            leadFunnel: {
                sourceLabels: leadSources,
                funnelSeries: [
                    { name: 'Leads', data: leadSources.map(s => sales.leadsBySource[s]) },
                    { name: 'Opportunities', data: leadSources.map(s => sales.opportunitiesCreatedBySource[s]) },
                    { name: 'Won Deals', data: leadSources.map(s => sales.wonDealsBySource[s]) },
                ]
            },
            sales: {
                // UPDATED to show count instead of value
                wonDealsBySource: { labels: Object.keys(sales.wonDealsBySource), series: Object.values(sales.wonDealsBySource) },
                salesTeamPerformance: {
                    labels: sales.salesTeamPerformance.map(p => p.name),
                    series: [{ name: 'Deals Closed', data: sales.salesTeamPerformance.map(p => p.deals) }, { name: 'Quota', data: sales.salesTeamPerformance.map(p => p.quota) }]
                }
            },
            users: { buyerGrowth: users.buyerGrowth, retentionCohort: users.retentionCohort },
            marketplace: {
                geoDealData: marketplace.geoDealData,
                dealVelocityHistory: marketplace.dealVelocityHistory,
                wallListingTrend: marketplace.wallListingTrend,
            },
        };
    }, []);

    return (
        <div style={{ backgroundColor: '#f8f9fa', padding: '2rem', fontFamily: '"Inter", sans-serif', minHeight: '100vh' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', margin: 0 }}>Aazovo Enterprise Dashboard</h1>
                    <p style={{ marginTop: '0.5rem', color: '#6c757d' }}>Strategic Command Center for Sales, User, and Marketplace Analytics</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '0.75rem 1rem', backgroundColor: 'white' }}>Last 30 Days</div>
                    <img src="https://i.imgur.com/5Vf3c1N.png" alt="User Avatar" style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
                </div>
            </header>

            <main>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* UPDATED KPI CARDS */}
                    <KpiCard title="New Leads" {...processedData.kpi.newLeads} />
                    <KpiCard title="Opportunities Won" {...processedData.kpi.opportunitiesWon} />
                    <KpiCard title="Lead Conv. Rate" {...processedData.kpi.leadConversionRate} />
                    <KpiCard title="Win Rate" {...processedData.kpi.winRate} />
                    <KpiCard title="Sales Cycle" {...processedData.kpi.salesCycle} />
                    <KpiCard title="Deal Velocity" {...processedData.kpi.dealVelocity} />
                </div>

                <DashboardCard gridColumn="span 12" style={{ padding: 0 }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #dee2e6', padding: '0 1.5rem' }}>
                        {/* UPDATED TABS */}
                        {['sales', 'leadFunnel', 'users', 'marketplace'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                padding: '1rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer',
                                borderBottom: activeTab === tab ? '3px solid #0052cc' : '3px solid transparent',
                                fontWeight: activeTab === tab ? 600 : 500,
                                color: activeTab === tab ? '#0052cc' : '#495057',
                                textTransform: 'capitalize', fontSize: '1rem'
                            }}>{tab === 'leadFunnel' ? 'Lead Funnel' : tab}</button>
                        ))}
                    </div>
                    <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
                        {/* UPDATED VIEW RENDERING */}
                        {activeTab === 'leadFunnel' && <LeadFunnelView data={processedData.leadFunnel} />}
                        {activeTab === 'sales' && <SalesView data={processedData.sales} />}
                        {activeTab === 'users' && <UserAnalyticsView data={processedData.users} />}
                        {activeTab === 'marketplace' && <MarketplaceHealthView data={processedData.marketplace} />}
                    </div>
                </DashboardCard>
            </main>
        </div>
    );
};

export default AazovoEnterpriseDashboard;
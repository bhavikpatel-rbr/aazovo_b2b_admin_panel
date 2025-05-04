import { useState, useCallback } from 'react'; // Import hooks
import AdaptiveCard from '@/components/shared/AdaptiveCard';
import Container from '@/components/shared/Container';
import FormListActionTools from './components/FormBuilderActionTools';
import FormListSelected from './components/FormListSelected';
import FormListTable from './components/FormListTable';
import FormListTableTools from './components/FormListTableTools';
import type { TableQueries } from '@/@types/common'; // Import type

const Units = () => {
    // --- Lifted State for Table Controls ---
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    });

    // --- Lifted Handlers ---
    const handleSetTableData = useCallback((update: Partial<TableQueries>) => { // <-- LOCAL HANDLER
        setTableData((prev) => ({ ...prev, ...update }));
    }, []); // No dependency needed
    
    // ... other handlers using the LOCAL handleSetTableData ...
    
    // --- Search Handler (to be called by FormListTableTools/FormListSearch) ---
    const handleSearch = useCallback( // <-- LOCAL SEARCH HANDLER
        (query: string) => {
            // Reset to page 1 when search query changes
            handleSetTableData({ query: query, pageIndex: 1 }); // Uses LOCAL handleSetTableData
        },
        [handleSetTableData], // Depends on LOCAL handleSetTableData
    );
    // --- End Lifted State ---


    return (
        <>
            <Container>
                <AdaptiveCard>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <h5>Units</h5>
                            {/* Add/Edit tools - Doesn't need tableData directly */}
                            <FormListActionTools />
                        </div>

                        {/* Pass search handler and query down */}
                        <FormListTableTools
                            onSearch={handleSearch}
                            initialQuery={tableData.query}
                         />

                        {/* Pass tableData state and handlers down */}
                        <FormListTable
                            tableData={tableData} // Pass state
                            onSetTableData={handleSetTableData} // Pass handler
                        />
                    </div>
                </AdaptiveCard>
            </Container>
            {/* Selection component - needs separate logic/state connection */}
            <FormListSelected />
        </>
    );
};

export default Units;
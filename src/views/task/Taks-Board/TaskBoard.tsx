// src/views/your-path/TaskBoard.tsx

import React from 'react';
import { useTaskListingLogic, TaskTableTools, ActiveFiltersDisplay, TaskTable, TaskSelected, TaskActionTools } from '../Components/component'; // Adjust import path
import Container from '@/components/shared/Container';
import AdaptiveCard from '@/components/shared/AdaptiveCard';

// Define dummy data specific to this board, or potentially fetch it
const initialTaskBoardData: TaskItem[] = [
    { id: 'TB001', status: 'in_progress', note: 'Design landing page mockup', assignTo: 'Designer Alice', createdBy: 'Project Manager Bob', createdDate: new Date(2023, 10, 4) },
    { id: 'TB002', status: 'pending', note: 'Develop API endpoint for user auth', assignTo: 'Dev Charlie', createdBy: 'Tech Lead Diana', createdDate: new Date(2023, 10, 5) },
    { id: 'TB003', status: 'review', note: 'Write documentation for API', assignTo: 'Writer Eve', createdBy: 'Tech Lead Diana', createdDate: new Date(2023, 10, 6) },
    // ... more Task Board specific tasks
];

const TaskBoard = () => {
    const pageTitle = "Task Board";
    const {
        isLoading, tasks, tableData, selectedTasks, setSelectedTasks, filterData, setFilterData,
        pageData, total, columns, handlePaginationChange, handleSelectChange, handleSort,
        handleSearchChange, handleApplyFilter, handleRemoveFilter, handleClearAllFilters,
        handleRowSelect, handleAllRowSelect, handleDeleteSelected, uniqueAssignees, uniqueStatuses
    } = useTaskListingLogic(initialTaskBoardData); // Use the hook with specific data

    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">{pageTitle}</h3>
                    <TaskActionTools allTasks={tasks} pageTitle={pageTitle}/>
                </div>
                <div className="mb-2">
                    <TaskTableTools
                        onSearchChange={handleSearchChange}
                        filterData={filterData}
                        setFilterData={handleApplyFilter}
                        uniqueAssignees={uniqueAssignees}
                        uniqueStatuses={uniqueStatuses}
                     />
                </div>
                <ActiveFiltersDisplay
                    filterData={filterData}
                    onRemoveFilter={handleRemoveFilter}
                    onClearAll={handleClearAllFilters}
                 />
                <div className="flex-grow overflow-auto">
                    <TaskTable
                        columns={columns} data={pageData} loading={isLoading}
                        pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                        selectedTasks={selectedTasks}
                        onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort}
                        onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>
            <TaskSelected
                selectedTasks={selectedTasks} setSelectedTasks={setSelectedTasks} onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    );
};

export default TaskBoard;
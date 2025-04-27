// src/views/your-path/TaskFeedback.tsx

import React from 'react'
import {
    useTaskListingLogic,
    TaskTableTools,
    ActiveFiltersDisplay,
    TaskTable,
    TaskSelected,
    TaskActionTools,
} from '../Components/component' // Adjust import path
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'

// Define dummy data specific to feedback tasks
const initialTaskFeedbackData: TaskItem[] = [
    {
        id: 'TF001',
        status: 'review',
        note: 'Review feedback on landing page design',
        assignTo: 'Project Manager Bob',
        createdBy: 'Designer Alice',
        createdDate: new Date(2023, 10, 7),
    },
    {
        id: 'TF002',
        status: 'pending',
        note: 'Address QA feedback for user auth endpoint',
        assignTo: 'Dev Charlie',
        createdBy: 'QA Frank',
        createdDate: new Date(2023, 10, 8),
    },
    {
        id: 'TF003',
        status: 'completed',
        note: 'Incorporate feedback into API documentation',
        assignTo: 'Writer Eve',
        createdBy: 'Tech Lead Diana',
        createdDate: new Date(2023, 10, 9),
    },
    // ... more Task Feedback specific tasks
]

const TaskFeedback = () => {
    const pageTitle = 'Task Feedback'
    const {
        isLoading,
        tasks,
        tableData,
        selectedTasks,
        setSelectedTasks,
        filterData,
        setFilterData,
        pageData,
        total,
        columns,
        handlePaginationChange,
        handleSelectChange,
        handleSort,
        handleSearchChange,
        handleApplyFilter,
        handleRemoveFilter,
        handleClearAllFilters,
        handleRowSelect,
        handleAllRowSelect,
        handleDeleteSelected,
        uniqueAssignees,
        uniqueStatuses,
    } = useTaskListingLogic(initialTaskFeedbackData) // Use the hook with specific data

    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">{pageTitle}</h3>
                    <TaskActionTools allTasks={tasks} pageTitle={pageTitle} />
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
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedTasks={selectedTasks}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>
            <TaskSelected
                selectedTasks={selectedTasks}
                setSelectedTasks={setSelectedTasks}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}

export default TaskFeedback

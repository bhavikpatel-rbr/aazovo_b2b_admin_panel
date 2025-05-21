// src/views/your-path/TaskList.tsx

import React from "react";
import {
  useTaskListingLogic,
  TaskTableTools,
  ActiveFiltersDisplay,
  TaskTable,
  TaskSelected,
  TaskActionTools,
} from "../Components/component"; // Adjust import path
import Container from "@/components/shared/Container";
import AdaptiveCard from "@/components/shared/AdaptiveCard";

// Define dummy data specific to a general task list
const initialTaskListData: TaskItem[] = [
  {
    id: "TL001",
    status: "completed",
    note: "Send weekly project status report",
    assignTo: "Project Manager Bob",
    createdBy: "Admin",
    createdDate: new Date(2023, 10, 3),
  },
  {
    id: "TL002",
    status: "on_hold",
    note: "Research new marketing automation tools",
    assignTo: "Marketing Lead Grace",
    createdBy: "Director Heidi",
    createdDate: new Date(2023, 10, 1),
  },
  {
    id: "TL003",
    status: "pending",
    note: "Schedule team building event for Q1 2024",
    assignTo: "HR Dept",
    createdBy: "Admin",
    createdDate: new Date(2023, 10, 5),
  },
  {
    id: "TL004",
    status: "cancelled",
    note: "Update legacy system documentation (Superseded)",
    assignTo: "Dev Charlie",
    createdBy: "Tech Lead Diana",
    createdDate: new Date(2023, 9, 15),
  },
  // ... more general tasks
];

const TaskList = () => {
  const pageTitle = "Task List";
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
  } = useTaskListingLogic(initialTaskListData); // Use the hook with specific data

  return (
    <Container className="h-full">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">{pageTitle}</h5>
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
  );
};

export default TaskList;

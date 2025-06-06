// src/views/your-path/TaskList.tsx
import React from "react";
import {
  useTaskListingLogic,
  TaskTableTools,
  ActiveFiltersDisplay,
  TaskTable,
  TaskSelected,
  // TaskActionTools, // We'll redefine or modify this
} from "../Components/component"; // Adjust import path
import Container from "@/components/shared/Container";
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Button from "@/components/ui/Button"; // Import Button
import { TbPlus } from "react-icons/tb"; // Import Icon
import { useNavigate } from "react-router-dom"; // Import for navigation

// Define dummy data specific to a general task list (TaskItem type needs to be defined or imported)
export type TaskStatus = "completed" | "on_hold" | "pending" | "cancelled" | "in_progress" | string; // Add in_progress

export interface TaskItem {
  id: string;
  status: TaskStatus;
  note: string;
  assignTo: string | string[]; // Can be single or multiple
  createdBy: string;
  createdDate: Date;
  dueDate?: Date | null;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
  category?: string;
  linkedTo?: { type: string; id: string; name: string }[]; // Example of linked items
  description?: string;
  labels?: string[];
  comments?: any[]; // Define more specific type if needed
  attachments?: any[]; // Define more specific type if needed
}


export const initialTaskListData: TaskItem[] = [
  {
    id: "TL001",
    status: "completed",
    note: "Send weekly project status report",
    assignTo: "Project Manager Bob",
    createdBy: "Admin",
    createdDate: new Date(2023, 10, 3),
    dueDate: new Date(2023, 10, 10),
    priority: "High",
    category: "Reporting",
  },
  {
    id: "TL002",
    status: "pending",
    note: "Research new marketing automation tools",
    assignTo: "Marketing Lead Grace",
    createdBy: "Director Heidi",
    createdDate: new Date(2023, 10, 1),
    priority: "Medium",
    category: "Research",
  },
  // ... more tasks
];

// Define a new TaskActionTools or modify the existing one
const TaskListActionTools = ({ pageTitle }: { pageTitle: string; /* allTasks could be passed if needed for other actions */ }) => {
  const navigate = useNavigate();

  const handleAddNewTask = () => {
    navigate("/task/task-list/create"); // Navigate to the new task page
  };

  return (
    <Button variant="solid" icon={<TbPlus />} onClick={handleAddNewTask}>
      Add New Task
    </Button>
  );
};


const TaskList = () => {
  const pageTitle = "Task List";
  const {
    isLoading,
    tasks, // This now refers to the initialTaskListData
    tableData,
    selectedTasks,
    setSelectedTasks,
    filterData,
    // setFilterData, // handleApplyFilter is used
    pageData,
    total,
    columns, // Ensure columns are compatible with TaskItem
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
  } = useTaskListingLogic(initialTaskListData, true); // Pass true if this hook should manage data internally for now

  return (
    <Container className="h-auto">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">{pageTitle}</h5>
          {/* Use the modified or new TaskActionTools */}
          <TaskListActionTools pageTitle={pageTitle} />
        </div>
        <div className="mb-2">
          <TaskTableTools
            onSearchChange={handleSearchChange}
            filterData={filterData}
            setFilterData={handleApplyFilter} // This is the callback to apply filters
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
            data={pageData} // Use pageData from the hook
            loading={isLoading}
            pagingData={{
              total,
              pageIndex: tableData.pageIndex as number,
              pageSize: tableData.pageSize as number,
            }}
            selectedTasks={selectedTasks} // Pass selectedTasks
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onRowSelect={handleRowSelect} // Pass handleRowSelect
            onAllRowSelect={handleAllRowSelect} // Pass handleAllRowSelect
          />
        </div>
      </AdaptiveCard>
      <TaskSelected
        selectedTasks={selectedTasks} // Pass selectedTasks
        setSelectedTasks={setSelectedTasks} // Pass setSelectedTasks
        onDeleteSelected={handleDeleteSelected} // Pass handleDeleteSelected
      />
    </Container>
  );
};

export default TaskList;
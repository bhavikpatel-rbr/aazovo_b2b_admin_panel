import React, {
    useMemo,
    useRef,
    useEffect,
    useState,
    useImperativeHandle,
    Fragment,
} from 'react'
import classNames from 'classnames'
import Table from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import TableRowSkeleton from '@/components/shared/loaders/TableRowSkeleton'
import Loading from '@/components/shared/Loading'
import FileNotFound from '@/assets/svg/FileNotFound'
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getExpandedRowModel,
    flexRender,
    ColumnDef,
    ColumnSort,
    Row,
    CellContext,
} from '@tanstack/react-table'
import type { TableProps } from '@/components/ui/Table'
import type { SkeletonProps } from '@/components/ui/Skeleton'
import type { Ref, ChangeEvent, ReactNode } from 'react'
import type { CheckboxProps } from '@/components/ui/Checkbox'
import type { ExpandedState } from '@tanstack/react-table'
import { Button, Dropdown } from '@/components/ui'
import { TbBrandWhatsapp, TbCopy } from 'react-icons/tb'

export type OnSortParam = { order: 'asc' | 'desc' | ''; key: string | number }

type DataTable1Props<T> = {
  columns: ColumnDef<T>[]
  customNoDataIcon?: ReactNode
  data?: T[]
  loading?: boolean
  noData?: boolean
  instanceId?: string
  onCheckBoxChange?: (checked: boolean, row: T) => void
  onIndeterminateCheckBoxChange?: (checked: boolean, rows: Row<T>[]) => void
  onPaginationChange?: (page: number) => void
  onSelectChange?: (num: number) => void
  onSort?: (sort: OnSortParamTanstack) => void
  pageSizes?: number[]
  selectable?: boolean
  skeletonAvatarColumns?: number[]
  skeletonAvatarProps?: SkeletonProps
  pagingData?: {
    total: number
    pageIndex: number
    pageSize: number
  }
  checkboxChecked?: (row: T) => boolean
  // indeterminateCheckboxChecked?: (rows: Row<T>[]) => boolean; 
  getRowCanExpand?: (row: Row<T>) => boolean
  renderRowSubComponent?: (props: { row: Row<T> }) => React.ReactNode
  state?: { expanded?: ExpandedState } // For externally controlled expansion
  onExpandedChange?: (updater: React.SetStateAction<ExpandedState>) => void // For externally controlled expansion
  ref?: Ref<DataTableResetHandle | HTMLTableElement>
}  & TableProps

type CheckBoxChangeEvent = ChangeEvent<HTMLInputElement>

interface IndeterminateCheckboxProps extends Omit<CheckboxProps, 'onChange'> {
    onChange: (event: CheckBoxChangeEvent) => void
    indeterminate: boolean
    onCheckBoxChange?: (event: CheckBoxChangeEvent) => void
    onIndeterminateCheckBoxChange?: (event: CheckBoxChangeEvent) => void
}

const { Tr, Th, Td, THead, TBody, Sorter } = Table

const IndeterminateCheckbox = (props: IndeterminateCheckboxProps) => {
    const {
        indeterminate,
        onChange,
        onCheckBoxChange,
        onIndeterminateCheckBoxChange,
        ...rest
    } = props

    const ref = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (typeof indeterminate === 'boolean' && ref.current) {
            ref.current.indeterminate = !rest.checked && indeterminate
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref, indeterminate])

    const handleChange = (e: CheckBoxChangeEvent) => {
        onChange(e)
        onCheckBoxChange?.(e)
        onIndeterminateCheckBoxChange?.(e)
    }

    return (
        <Checkbox
            ref={ref}
            className="mb-0"
            onChange={(_, e) => handleChange(e)}
            {...rest}
        />
    )
}

export type DataTableResetHandle = {
    resetSorting: () => void
    resetSelected: () => void
}

const DataTable1 = React.forwardRef(<T extends object>(props: DataTable1Props<T>, ref: Ref<DataTableResetHandle | HTMLTableElement>) => {
  const {
    skeletonAvatarColumns,
    columns: columnsProp = [],
    data = [],
    customNoDataIcon,
    loading,
    noData,
    onCheckBoxChange,
    onIndeterminateCheckBoxChange,
    onPaginationChange,
    onSelectChange,
    onSort,
    pageSizes = [10, 25, 50, 100],
    selectable = false,
    skeletonAvatarProps,
    pagingData = {
      total: 0,
      pageIndex: 1,
      pageSize: 10,
    },
    checkboxChecked,
    getRowCanExpand,
    renderRowSubComponent,
    state: controlledState, // Renamed to avoid conflict with internal state
    onExpandedChange: onControlledExpandedChange, // Renamed
    instanceId = 'data-table',
    ...rest
  } = props

  const { pageSize, pageIndex, total } = pagingData

  const [sorting, setSorting] = useState<ColumnSort[] | []>([]);
  // Use controlled expansion if `state.expanded` and `onExpandedChange` are provided
  const isManuallyExpanded = controlledState?.expanded !== undefined && onControlledExpandedChange !== undefined;
  const [internalExpanded, setInternalExpanded] = useState<ExpandedState>({})

  const expanded = isManuallyExpanded ? controlledState.expanded! : internalExpanded;
  const onExpandedChange = isManuallyExpanded ? onControlledExpandedChange! : setInternalExpanded;


  const pageSizeOption = useMemo(
    () =>
      pageSizes.map((number) => ({
        value: number,
        label: `${number} / page`,
      })),
    [pageSizes],
  )

  useEffect(() => {
    if (Array.isArray(sorting)) {
      const sortOrder =
        sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : ''
      const id = sorting.length > 0 ? sorting[0].id : ''
      onSort?.({ order: sortOrder, key: id })
    }
  }, [sorting, onSort])

  const handleIndeterminateCheckBoxChange = (
    checked: boolean,
    rows: Row<T>[],
  ) => {
    if (!loading) {
      onIndeterminateCheckBoxChange?.(checked, rows)
    }
  }

  const handleCheckBoxChange = (checked: boolean, row: T) => {
    if (!loading) {
      onCheckBoxChange?.(checked, row)
    }
  }

  const finalColumns: ColumnDef<T>[] = useMemo(() => {
    const currentColumns = [...columnsProp];

    if (selectable) {
      return [
        {
          id: 'select',
          header: ({ table }) => (
            <IndeterminateCheckbox
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={(e) => {
                table.getToggleAllRowsSelectedHandler()(e as any);
                handleIndeterminateCheckBoxChange(e.target.checked, table.getRowModel().rows);
              }}
            />
          ),
          cell: ({ row }) => (
            <IndeterminateCheckbox
              checked={checkboxChecked ? checkboxChecked(row.original) : row.getIsSelected()}
              indeterminate={row.getIsSomeSelected()}
              onChange={(e) => {
                row.getToggleSelectedHandler()(e as any);
                handleCheckBoxChange(e.target.checked, row.original);
              }}
            />
          ),
          size: 48,
        },
        ...currentColumns,
      ]
    }
    return currentColumns
  }, [columnsProp, selectable, loading, checkboxChecked, handleCheckBoxChange, handleIndeterminateCheckBoxChange])


  const table = useReactTable({
    data: data as T[],
    columns: finalColumns,
    state: {
      sorting: sorting as ColumnSort[],
      expanded, // Use the determined expanded state
    },
    onSortingChange: setSorting,
    onExpandedChange: onExpandedChange, // Use the determined handler
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand,
    manualPagination: true,
    manualSorting: true,
  })

  const resetSorting = () => table.resetSorting()
  const resetSelected = () => table.toggleAllRowsSelected(false)

  // useImperativeHandle(ref, () => ({
  //     resetSorting,
  //     resetSelected,
  // }))

  const handlePaginationChangeInternal = (page: number) => {
    if (!loading) {
      table.resetRowSelection();
      onPaginationChange?.(page)
    }
  }

  const handleSelectChangeInternal = (value?: number) => {
    if (!loading && value) {
      table.setPageSize(Number(value))
      onSelectChange?.(Number(value))
      onPaginationChange?.(1)
      table.resetRowSelection();
    }
  }

  return (
    <Loading loading={Boolean(loading && data.length !== 0)} type="cover">
      <Table {...rest}>
        <THead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <Th key={header.id} colSpan={header.colSpan} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={classNames(
                          header.column.getCanSort() &&
                          'cursor-pointer select-none point',
                          loading &&
                          'pointer-events-none',
                          (header.column.columnDef.meta as any)?.HeaderClass
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef
                            .header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <Sorter
                            sort={header.column.getIsSorted()}
                          />
                        )}
                      </div>
                    )}
                  </Th>
                )
              })}
            </Tr>
          ))}
        </THead>
        {loading && data.length === 0 ? (
          <TableRowSkeleton
            columns={finalColumns.length}
            rows={pagingData.pageSize}
            avatarInColumns={skeletonAvatarColumns}
            avatarProps={skeletonAvatarProps}
          />
        ) : (
          <TBody>
            {(noData || table.getRowModel().rows.length === 0) ? (
              <Tr>
                <Td className="hover:bg-transparent text-center" colSpan={finalColumns.length} >
                  <div className="flex flex-col items-center justify-center gap-4 my-10">
                    {customNoDataIcon ? customNoDataIcon : <FileNotFound className="grayscale" />}
                    <span className="font-semibold"> No data found! </span>
                  </div>
                </Td>
              </Tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <Tr>
                    {row.getVisibleCells().map((cell) => (
                      <Td key={cell.id} style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Td>
                    ))}
                  </Tr>
                  {row.getIsExpanded() && renderRowSubComponent && (
                    <>
                      <Tr className="expanded-row">
                        <Td colSpan={row.getVisibleCells().length} style={{ padding: "0px" }} className="hover:bg-transparent">
                          <div className="">
                            {renderRowSubComponent({ row })}
                            <div className="text-right">
                              <Button icon={<TbCopy />} className="mb-2 mr-1"></Button>
                              <Button icon={<TbBrandWhatsapp />} className="mb-2 mr-1"></Button>
                              <Dropdown title="Send Message">
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                  <div className="flex gap-2 text-xs"><Checkbox /> Default Option</div>
                                </Dropdown.Item>
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                  <div className="flex gap-2 text-xs"><Checkbox /> Master</div>
                                </Dropdown.Item>
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                  <div className="flex gap-2 text-xs"><Checkbox /> WTB</div>
                                </Dropdown.Item>
                              </Dropdown>
                              <Dropdown title="Send Options" className="text-xs">
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                  <div className="flex gap-2 text-xs"><Checkbox />Option 1</div>
                                </Dropdown.Item>
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                  <div className="flex gap-2 text-xs"><Checkbox />Option 2</div>
                                </Dropdown.Item>
                                <Dropdown.Item className="py-2" style={{ height: "auto" }}>
                                  <div className="flex gap-2 text-xs"><Checkbox />Option 3</div>
                                </Dropdown.Item>
                              </Dropdown>
                            </div>
                          </div>
                        </Td>
                      </Tr>
                    </>
                  )}
                </Fragment>
              ))
            )}
          </TBody>
        )}
      </Table>
      {total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <Pagination
            pageSize={pageSize}
            currentPage={pageIndex}
            total={total}
            onChange={handlePaginationChangeInternal}
          />
          <div style={{ minWidth: 130 }}>
            <Select
              instanceId={`${instanceId}-page-size-select`}
              size="sm"
              menuPlacement="top"
              isSearchable={false}
              value={pageSizeOption.find(
                (option) => option.value === pageSize,
              )}
              options={pageSizeOption}
              onChange={(option) => handleSelectChangeInternal(option?.value)}
            />
          </div>
        </div>
      )}
    </Loading>
  )
});

export type { ColumnDef, Row, CellContext }
export default DataTable1

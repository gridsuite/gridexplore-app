/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { type PropsWithChildren, type RefObject, useEffect, useMemo, useState } from 'react';
import type { AgGridReact } from 'ag-grid-react';
import {
    CustomAggridFilterContext,
    type CustomAggridFilterContextValue,
    CustomAggridSortContext,
    type CustomAggridSortContextValue,
    type FilterConfig,
    type SortConfig,
    updateAgGridFilters,
} from '@gridsuite/commons-ui';

export type CustomAggridLocalStateProviderProps = PropsWithChildren<{
    gridRef: RefObject<AgGridReact | null>;
}>;

/**
 * Provides the sort and the filters of the commons-ui custom headers for a single grid, and applies them to it.
 * They are kept in a local state, so they only live as long as the provider.
 */
export function CustomAggridLocalStateProvider({ gridRef, children }: Readonly<CustomAggridLocalStateProviderProps>) {
    const [sortConfig, setSortConfig] = useState<SortConfig[]>([]);
    const [filters, setFilters] = useState<FilterConfig[]>([]);

    useEffect(() => {
        gridRef.current?.api?.applyColumnState({ state: sortConfig, defaultState: { sort: null } });
    }, [gridRef, sortConfig]);

    useEffect(() => {
        updateAgGridFilters(gridRef.current?.api, filters);
    }, [gridRef, filters]);

    const sortContext = useMemo<CustomAggridSortContextValue>(
        () => ({
            // undefined for the columns that are not sortable
            getSortConfig: (sortParams) => (sortParams ? sortConfig : undefined),
            setSortConfig: (_sortParams, updatedSortConfig) => setSortConfig(updatedSortConfig),
        }),
        [sortConfig]
    );

    const filterContext = useMemo<CustomAggridFilterContextValue>(
        () => ({
            getFilters: () => filters,
            updateFilter: (_colId, _filterParams, updatedFilters) => setFilters(updatedFilters),
        }),
        [filters]
    );

    return (
        <CustomAggridSortContext.Provider value={sortContext}>
            <CustomAggridFilterContext.Provider value={filterContext}>{children}</CustomAggridFilterContext.Provider>
        </CustomAggridSortContext.Provider>
    );
}

/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { type PropsWithChildren, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type { GridApi } from 'ag-grid-community';
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
    gridApi: GridApi | undefined;
    initialFilters?: FilterConfig[];
}>;

/**
 * Provides the sort and the filters of the commons-ui custom headers for a single grid, and applies them to it.
 * They are kept in a local state, so they only live as long as the provider.
 */
const NO_FILTERS: FilterConfig[] = [];

export function CustomAggridLocalStateProvider({
    gridApi,
    initialFilters = NO_FILTERS,
    children,
}: Readonly<CustomAggridLocalStateProviderProps>) {
    const [sortConfig, setSortConfig] = useState<SortConfig[]>([]);
    const [filters, setFilters] = useState<FilterConfig[]>(initialFilters);
    const [previousInitialFilters, setPreviousInitialFilters] = useState(initialFilters);
    if (initialFilters !== previousInitialFilters) {
        // adjusted while rendering, so that they are applied in the same commit as what changed them
        setPreviousInitialFilters(initialFilters);
        setFilters(initialFilters);
    }

    useEffect(() => {
        if (gridApi && !gridApi.isDestroyed()) {
            gridApi.applyColumnState({ state: sortConfig, defaultState: { sort: null } });
        }
    }, [gridApi, sortConfig]);

    // before the browser paints, so that the rows are never shown unfiltered
    useLayoutEffect(() => {
        if (gridApi && !gridApi.isDestroyed()) {
            updateAgGridFilters(gridApi, filters);
        }
    }, [gridApi, filters]);

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

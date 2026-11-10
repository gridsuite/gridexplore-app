/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface RootNetworkColumnSelection {
    selectedTags: string[];
    toggleTag: (tag: string) => void;
}

/**
 * The headers read the selection from this context rather than from the column definitions, which would otherwise be
 * rebuilt at each change.
 */
export const RootNetworkColumnSelectionContext = createContext<RootNetworkColumnSelection>({
    selectedTags: [],
    toggleTag: () => {},
});

export const useRootNetworkColumnSelection = () => useContext(RootNetworkColumnSelectionContext);

/**
 * @return the state of the selection, to provide through RootNetworkColumnSelectionContext
 */
export function useRootNetworkColumnSelectionState(): RootNetworkColumnSelection {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const toggleTag = useCallback((tag: string) => {
        setSelectedTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));
    }, []);
    return useMemo(() => ({ selectedTags, toggleTag }), [selectedTags, toggleTag]);
}

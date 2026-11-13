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

// Read by the headers through a context, so that the columns are not rebuilt at each selection change
export const RootNetworkColumnSelectionContext = createContext<RootNetworkColumnSelection>({
    selectedTags: [],
    toggleTag: () => {},
});

export const useRootNetworkColumnSelection = () => useContext(RootNetworkColumnSelectionContext);

export function useRootNetworkColumnSelectionState(): RootNetworkColumnSelection {
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const toggleTag = useCallback((tag: string) => {
        setSelectedTags((tags) => (tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]));
    }, []);
    return useMemo(() => ({ selectedTags, toggleTag }), [selectedTags, toggleTag]);
}

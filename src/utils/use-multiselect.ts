import { useCallback, useEffect, useState } from 'react';

export const useMultiselect = (elementIds: string[]) => {
    const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set());
    // used for shift clicking selection, stores last clicked element for selection
    const [lastSelectedElementUuid, setLastSelectedElementUuid] =
        useState<string>();

    useEffect(() => {
        setSelectedUuids(new Set());
        setLastSelectedElementUuid(undefined);
    }, [elementIds]);

    /**
     * toggle selection for one element
     * @param elementId id of element to toggle
     * @param forceState if defined, it will force element state instead of toggling (false -> unselect element ; true -> select element)
     */
    const toggleSelection = useCallback(
        (elementId: string, forceState?: boolean) => {
            let element = elementIds?.find((id) => id === elementId);
            if (element === undefined) {
                return;
            }
            let newSelection = new Set(selectedUuids);

            if (forceState === undefined) {
                if (!newSelection.delete(elementId)) {
                    newSelection.add(elementId);
                }
            } else {
                if (forceState) {
                    newSelection.add(elementId);
                } else {
                    newSelection.delete(elementId);
                }
            }
            setSelectedUuids(newSelection);
            setLastSelectedElementUuid(elementId);
        },
        [selectedUuids, elementIds]
    );

    const selectElements = useCallback(
        (elementToSelectIds: string[]) => {
            const newSelection = new Set(selectedUuids);

            elementToSelectIds.forEach((elementToSelectId) => {
                let element = elementIds?.find(
                    (id) => id === elementToSelectId
                );
                if (element !== undefined) {
                    newSelection.add(elementToSelectId);
                }
            });
            setSelectedUuids(newSelection);
        },
        [selectedUuids, elementIds]
    );

    const unselectElements = useCallback(
        (elementsToUnselectIds: string[]) => {
            const newSelection = new Set(selectedUuids);

            elementsToUnselectIds.forEach((id) => {
                newSelection.delete(id);
            });
            setSelectedUuids(newSelection);
        },
        [selectedUuids]
    );

    const handleShiftClick = useCallback(
        (clickedElementId: string) => {
            // remove text selection due to shift clicking
            window.getSelection()?.empty();

            // sorted list of displayed elements

            const lastSelectedUuidIndex = lastSelectedElementUuid
                ? elementIds.indexOf(lastSelectedElementUuid)
                : -1;
            const clickedElementUuidIndex =
                elementIds.indexOf(clickedElementId);

            // if no lastSelectedUuid is found (first click, or unknown uuid), we only toggle clicked element
            if (lastSelectedUuidIndex < 0) {
                toggleSelection(clickedElementId);
                return;
            }

            // list of elements between lastClickedElement and clickedElement, both included
            const elementsToToggle = elementIds.slice(
                Math.min(lastSelectedUuidIndex, clickedElementUuidIndex),
                Math.max(lastSelectedUuidIndex, clickedElementUuidIndex) + 1
            );

            if (selectedUuids.has(clickedElementId)) {
                // if clicked element is checked, we unchecked all elements between last clicked element and clicked element
                unselectElements(elementsToToggle);
            } else {
                // if clicked element is unchecked, we check all elements between last clicked element and clicked element
                selectElements(elementsToToggle);
            }
            setLastSelectedElementUuid(clickedElementId);
        },
        [
            elementIds,
            lastSelectedElementUuid,
            selectedUuids,
            selectElements,
            unselectElements,
            toggleSelection,
        ]
    );

    const handleShiftAndCtrlClick = (
        clickEvent: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        clickedElementId: string
    ) => {
        if (clickEvent.shiftKey) {
            // if row is clicked while shift is pressed, range of rows selection is toggled, depending on clicked element state
            handleShiftClick(clickedElementId);
            // nothing else happens, hence the return
            return;
        }

        if (clickEvent.ctrlKey) {
            // if row is clicked while ctrl is pressed, row selection is toggled
            // nothing else happens, hence the return right after
            toggleSelection(clickedElementId);
            return;
        }
    };

    /**
     * toggle selection for all element depending on current selectedUuids
     * @param elementsToSelectIds if defined, it will toggle only elementsToSelectIds instead of all elementIds
     * @param forceSelectedIds if true, it will set selection to elementsToSelectIds/elementIds without checking current selectedUuids
     */
    function toggleSelectAll(
        elementsToSelectIds?: string[],
        forceSelectedIds = false
    ) {
        if (selectedUuids.size === 0 || forceSelectedIds) {
            setSelectedUuids(new Set(elementsToSelectIds ?? elementIds));
        } else {
            setSelectedUuids(new Set());
        }
    }

    return [
        selectedUuids,
        toggleSelection,
        toggleSelectAll,
        handleShiftAndCtrlClick,
    ];
};

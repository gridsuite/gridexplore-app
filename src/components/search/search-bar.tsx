/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { RefObject, useCallback } from 'react';
import { ElementSearchInput, ElementSearchInputProps, Paginated, useElementSearch } from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';
import { TextFieldProps } from '@mui/material';
import { useNavigate } from 'react-router';
import { searchElementsInfos } from '../../utils/rest-api';
import { SearchItem } from './search-item';
import { AppState, ElementAttributesES } from '../../redux/types';
import { SearchBarRenderInput } from './search-bar-render-input';
import { SearchBarPaperDisplayedElementWarning } from './search-bar-displayed-element-warning';

export interface SearchBarProps {
    inputRef: RefObject<TextFieldProps>;
}

export function SearchBar({ inputRef }: Readonly<SearchBarProps>) {
    const navigate = useNavigate();
    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);

    const fetchElementsPageable: (newSearchTerm: string) => Promise<Paginated<ElementAttributesES>> = useCallback(
        (newSearchTerm) => searchElementsInfos(newSearchTerm, selectedDirectory?.elementUuid),
        [selectedDirectory?.elementUuid]
    );
    const { elementsFound, isLoading, searchTerm, updateSearchTerm, totalElements } = useElementSearch({
        fetchElements: fetchElementsPageable,
    });
    const renderOptionItem = useCallback<ElementSearchInputProps<ElementAttributesES>['renderElement']>(
        (props) => {
            const { element, inputValue } = props;

            const matchingElement = elementsFound.find((e) => e.id === element.id)!;
            return <SearchItem {...props} key={element.id} matchingElement={matchingElement} inputValue={inputValue} />;
        },
        [elementsFound]
    );

    const handleMatchingElement = useCallback<ElementSearchInputProps<ElementAttributesES>['onSelectionChange']>(
        (data) => {
            const matchingElement = elementsFound.find((element) => element === data);
            if (!matchingElement) {
                return;
            }
            // The URL is the single source of truth: navigating expands the tree, selects the directory
            // and highlights the element (handled in TreeViewsContainer).
            navigate(`/elements/${matchingElement.id}`);
        },
        [elementsFound, navigate]
    );

    const displayComponent = useCallback<NonNullable<ElementSearchInputProps<ElementAttributesES>['PaperComponent']>>(
        (props) => (
            <SearchBarPaperDisplayedElementWarning
                elementFoundLength={elementsFound.length}
                elementFoundTotal={totalElements}
                isLoading={isLoading}
                {...props}
            />
        ),
        [elementsFound.length, isLoading, totalElements]
    );

    return (
        <ElementSearchInput
            sx={{ width: '50%', marginLeft: '14%' }}
            size="small"
            elementsFound={elementsFound}
            getOptionLabel={(element) => element.name}
            isOptionEqualToValue={(element1, element2) => element1.id === element2.id}
            onSearchTermChange={(value) => updateSearchTerm(value?.trim())}
            onSelectionChange={handleMatchingElement}
            renderElement={renderOptionItem}
            searchTerm={searchTerm}
            loading={isLoading}
            renderInput={(_value, params) => <SearchBarRenderInput inputRef={inputRef} {...params} />}
            PaperComponent={displayComponent}
        />
    );
}

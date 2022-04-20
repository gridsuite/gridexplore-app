import React from 'react';
import CreateStudyDialog from './create-study-dialog';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import '@testing-library/jest-dom/extend-expect';
import messages_en from '../../translations/en.json';
import messages_fr from '../../translations/fr.json';
import TreeViewsContainer from '../tree-views-container';
import {
    login_en,
    login_fr,
    SnackbarProvider,
    top_bar_en,
    top_bar_fr,
    table_fr,
    table_en,
    treeview_finder_fr,
    treeview_finder_en,
} from '@gridsuite/commons-ui';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { store } from '../../redux/store';

const RIGHT_CLICK_BUTTON = 2;
const messages = {
    en: {
        ...messages_en,
        ...login_en,
        ...top_bar_en,
        ...table_en,
        ...treeview_finder_en,
    },
    fr: {
        ...messages_fr,
        ...login_fr,
        ...top_bar_fr,
        ...table_fr,
        ...treeview_finder_fr,
    },
};

const lightTheme = createTheme({
    palette: {
        mode: 'light',
    },
    arrow: {
        fill: '#212121',
        stroke: '#212121',
    },
    arrow_hover: {
        fill: 'white',
        stroke: 'white',
    },
    circle: {
        stroke: 'white',
        fill: 'white',
    },
    circle_hover: {
        stroke: '#212121',
        fill: '#212121',
    },
    link: {
        color: 'black',
    },
    row: {
        primary: '#E8E8E8',
        secondary: '#F4F4F4',
        hover: '#8E9C9B',
    },
});

jest.mock('../../redux/store');
const mockState = {
    user: {
        profile: {
            sub: 'user_test',
        },
        id_token: 'test_token',
    },
    selectedFile: {
        name: 'fichier_en_cours',
    },
    currentChildren: null,
    selectedDirectory: null,
    activeDirectory: null,
    currentPath: [],
    signInCallbackError: null,
    appsAndUrls: [],
    cases: [],
    selectedCase: null,
    uploadingStudies: {},
};

function renderWithProviders(ui, locale = 'en') {
    store.getState = () => mockState;
    console.log('STORE', store.getState());
    return render(
        <Provider store={store}>
            <IntlProvider locale={locale} messages={messages.en}>
                <ThemeProvider theme={lightTheme}>
                    <SnackbarProvider>{ui}</SnackbarProvider>
                </ThemeProvider>
            </IntlProvider>
        </Provider>
    );
}

test('create study from scratch should work', () => {
    const { getByText } = renderWithProviders(
        <CreateStudyDialog open={true} onClose={() => console.log('test')} />
    );
    const validateButton = getByText('CREATE');
    expect(validateButton).toBeDisabled();
});

test('test create root folder', () => {
    const { getByText, getByTestId } = renderWithProviders(<TreeViewsContainer />);
    userEvent.click(getByTestId('treeViewsContainer'), {button: RIGHT_CLICK_BUTTON});
    const createRootFolderMenu = getByText('Create root folder');
    expect(createRootFolderMenu).toBeVisible();
    userEvent.click(createRootFolderMenu)
});

import { downloadCase, getCaseOriginalName } from '../../utils/rest-api';

export const downloadCases = async (uuids: string[]) => {
    for (const uuid of uuids) {
        const result = await downloadCase(uuid);
        let name = await getCaseOriginalName(uuid);
        const blob = await result.blob();
        const href = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.setAttribute(
            'download',
            typeof name === 'string' ? name : `${uuid}.xiidm`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

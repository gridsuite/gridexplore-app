import JSZip from 'jszip';
import { downloadCase, getCaseOriginalName } from '../../utils/rest-api';
import { saveAs } from 'file-saver';

export const downloadCases = async (uuids: string[]) => {
    const zip = new JSZip();
    const fileNames: { [fileName: string]: number } = {};
    for (const uuid of uuids) {
        const result = await downloadCase(uuid);
        let name = await getCaseOriginalName(uuid);
        const blob = await result.blob();

        if (typeof name === 'string') {
            if (fileNames[name]) {
                zip.file(
                    `${name.substring(0, name.length - 6)}(${fileNames[
                        name
                    ]++}).xiidm`,
                    blob
                );
            } else {
                fileNames[name] = 1;
                zip.file(name, blob);
            }
        } else {
            zip.file(`${uuid}.xiidm`, blob);
        }
    }
    zip.generateAsync({ type: 'blob' }).then((content) =>
        saveAs(content, 'cases.zip')
    );
};

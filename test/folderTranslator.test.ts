import { expect, test, describe } from 'vitest';
import {FolderTranslator} from '../src/translators/folderTranslator';

describe('Folder Trananslator', () => {
    // Don't currently think I'll support writing to any generic folder
    // so this is read-only for now
    test('Parsing a folder', async () => {
        const combinedData = FolderTranslator.toDataJournal('test/localTestFileDir/folder_test_folder');
    })
})

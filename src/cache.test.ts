import { ListPathsForCache, UPLOAD_CACHE_DIR } from './cache';
import * as fs from 'fs';
import * as path from 'path';


// Helper to ensure the upload dir exists
function ensureUploadDir() {
    if (!fs.existsSync(UPLOAD_CACHE_DIR)) {
        fs.mkdirSync(UPLOAD_CACHE_DIR, { recursive: true });
    }
}

describe('ListPathsForCache', () => {
    const symlinks = [
        { name: 'ls-link', target: '/bin/ls' },
        { name: 'hosts-link', target: '/etc/hosts' },
    ];

    beforeAll(() => {
        ensureUploadDir();
        // Clean up any existing symlinks
        fs.readdirSync(UPLOAD_CACHE_DIR).forEach(f => {
            fs.unlinkSync(path.join(UPLOAD_CACHE_DIR, f));
        });
        // Create symlinks
        for (const { name, target } of symlinks) {
            try {
                fs.symlinkSync(target, path.join(UPLOAD_CACHE_DIR, name));
            } catch (e) {
                // ignore if already exists
            }
        }
    });

    afterAll(() => {
        // Clean up symlinks
        fs.readdirSync(UPLOAD_CACHE_DIR).forEach(f => {
            fs.unlinkSync(path.join(UPLOAD_CACHE_DIR, f));
        });
    });

    it('should list the target paths of all symlinks in the upload dir', async () => {
        const result = await ListPathsForCache();
        expect(result).toEqual(expect.arrayContaining(symlinks.map(s => s.target)));
    });
}); 
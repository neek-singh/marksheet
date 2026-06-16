import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const mappings = [
            {
                src: 'C:/Users/as007/.gemini/antigravity-ide/brain/48bb8261-ce36-413a-ad27-57070769077d/hero_bg_1781501381498.png',
                dest: 'c:/Users/as007/school/public/hero_bg.png'
            },
            {
                src: 'C:/Users/as007/.gemini/antigravity-ide/brain/48bb8261-ce36-413a-ad27-57070769077d/about_main_1781501478021.png',
                dest: 'c:/Users/as007/school/public/about_main.png'
            },
            {
                src: 'C:/Users/as007/.gemini/antigravity-ide/brain/48bb8261-ce36-413a-ad27-57070769077d/sports_grid_1781501498662.png',
                dest: 'c:/Users/as007/school/public/sports_grid.png'
            },
            {
                src: 'C:/Users/as007/.gemini/antigravity-ide/brain/48bb8261-ce36-413a-ad27-57070769077d/art_grid_1781501517883.png',
                dest: 'c:/Users/as007/school/public/art_grid.png'
            },
            {
                src: 'C:/Users/as007/.gemini/antigravity-ide/brain/48bb8261-ce36-413a-ad27-57070769077d/science_grid_1781501539245.png',
                dest: 'c:/Users/as007/school/public/science_grid.png'
            },
            {
                src: 'C:/Users/as007/.gemini/antigravity-ide/brain/48bb8261-ce36-413a-ad27-57070769077d/gardening_grid_1781501562305.png',
                dest: 'c:/Users/as007/school/public/gardening_grid.png'
            }
        ];

        const copied = [];
        const errors = [];

        for (const mapping of mappings) {
            try {
                if (fs.existsSync(mapping.src)) {
                    // Ensure destination directory exists
                    const destDir = path.dirname(mapping.dest);
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true });
                    }
                    fs.copyFileSync(mapping.src, mapping.dest);
                    copied.push({ src: mapping.src, dest: mapping.dest });
                } else {
                    errors.push({ src: mapping.src, error: 'Source file does not exist' });
                }
            } catch (err) {
                errors.push({ src: mapping.src, error: err.message });
            }
        }

        return NextResponse.json({ success: true, copied, errors });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}

import fs from 'fs-extra';

const FILE = 'output/data.json';

export async function saveReport(entry) {
    let data = [];

    if (await fs.pathExists(FILE)) {
        data = await fs.readJson(FILE);
    }

    data.unshift(entry); // mais recente primeiro

    await fs.writeJson(FILE, data, { spaces: 2 });
}

export async function getReports() {
    if (!(await fs.pathExists(FILE))) return [];
    return fs.readJson(FILE);
}
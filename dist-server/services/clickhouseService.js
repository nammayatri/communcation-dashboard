import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function downloadData(city, variant = 'ALL') {
    const scriptPath = join(__dirname, '../../scripts/Clickhouse_connect.py');

  const outputFile = `output_${city}_${variant}.csv`;
  const command = `python3 "${scriptPath}" --city "${city}" --variant "${variant}"`;

  return new Promise((resolve, reject) => {
    const child = exec(command, {
      cwd: process.cwd(),
      env: {
        ...process.env,
      },
    });

    let stderr = '';
    child.stderr.on('data', (data) => {
      stderr += data;
    });

    child.on('close', async (code) => {
      if (code !== 0) {
        return reject(new Error(`Python script failed: ${stderr}`));
      }

      try {
        const filePath = join(process.cwd(), outputFile);
        const content = await fs.readFile(filePath, 'utf-8');
        await fs.unlink(filePath); // clean up after reading
        resolve(content);
      } catch (err) {
        reject(new Error(`CSV read error: ${err.message}`));
      }
    });
  });
}

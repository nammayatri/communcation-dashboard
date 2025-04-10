import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { city, variant } = req.query;

  if (!city || typeof city !== 'string') {
    return res.status(400).json({ error: 'City parameter is required' });
  }

  try {
    // Activate virtual environment and run Python script
    const pythonScript = path.join(process.cwd(), 'scripts', 'Clickhouse_connect.py');
    const venvPython = path.join(process.cwd(), 'venv', 'bin', 'python3');
    
    // Execute the Python script
    const { stderr } = await execAsync(`${venvPython} "${pythonScript}" "${city}" "${variant || 'ALL'}"`, {
      cwd: process.cwd()
    });

    if (stderr) {
      console.error('Python script error:', stderr);
      return res.status(500).json({ error: 'Failed to execute Python script' });
    }

    // Check if output.csv exists
    const csvPath = path.join(process.cwd(), 'output.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(500).json({ error: 'CSV file was not generated' });
    }

    // Read and send the CSV file
    const csvContent = fs.readFileSync(csvPath);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=data_${city}_${variant || 'ALL'}.csv`);
    
    // Send the file
    res.send(csvContent);

    // Clean up the CSV file
    fs.unlinkSync(csvPath);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 
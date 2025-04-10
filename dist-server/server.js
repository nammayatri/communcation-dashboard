import express from 'express';
import cors from 'cors';
import { downloadData } from './services/clickhouseService.js';
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
// Test endpoint
app.get('/api/test', async (_req, res) => {
    try {
        const data = await downloadData('Delhi', 'ALL');
        res.json(data);
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

console.log('Script starting - SYNC LOG');

// Direct test script for Clickhouse connection
import { createClient } from '@clickhouse/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting script...');

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

// Create Clickhouse client configuration
const clickhouseConfig = {
    host: 'http://10.6.155.14:8123',
    username: 'juspay_data_view',
    password: 'i8U;&%v1l-[DK.FA',
    database: 'atlas_driver_offer_bpp'
};

console.log('Config created:', {
    host: clickhouseConfig.host,
    username: clickhouseConfig.username,
    database: clickhouseConfig.database
});

// Create the Clickhouse client
console.log('Creating client...');
const clickhouseClient = createClient(clickhouseConfig);
console.log('Client created');

// Function to execute queries
async function executeQuery(query, params) {
    console.log('Executing query:', query);
    console.log('With params:', params);
    try {
        const result = await clickhouseClient.query({
            query,
            format: 'JSONEachRow',
            query_params: params,
        });
        
        console.log('Query executed successfully');
        return await result.json();
    } catch (error) {
        console.error('Error executing Clickhouse query:', error);
        throw error;
    }
}

async function testConnection() {
    console.log('Starting connection test...');
    try {
        console.log('Testing Clickhouse connection...');
        
        // Simple query to test connection
        console.log('Running test query...');
        const result = await executeQuery('SELECT 1 as test');
        
        console.log('Connection successful!');
        console.log('Test query result:', result);
        
        // Test a simple query on the person table
        console.log('Testing person table query...');
        const data = await executeQuery(`
            SELECT 
                id,
                device_token
            FROM \`atlas_driver_offer_bpp\`.\`person\` 
            LIMIT 5
        `);
        
        console.log('Sample data:', data);
        
        // Test with parameters
        console.log('Testing query with parameters...');
        const paramData = await executeQuery(`
            SELECT 
                id,
                device_token
            FROM \`atlas_driver_offer_bpp\`.\`person\` 
            WHERE device_token IS NOT NULL
            LIMIT {limit:UInt32}
        `, { limit: 3 });
        
        console.log('Parameterized query result:', paramData);
        
    } catch (error) {
        console.error('Connection failed:', error);
        console.error('Error stack:', error.stack);
    }
}

console.log('Calling testConnection()...');
await testConnection();
console.log('Script finished.'); 
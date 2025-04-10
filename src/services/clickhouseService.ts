import { createClient } from '@clickhouse/client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../../.env') });

// Create Clickhouse client configuration with native TCP connection
const clickhouseConfig = {
    host: '10.6.155.14',
    port: 9000, // Native TCP port
    username: 'juspay_data_view',
    password: 'i8U;%&v1l-[DK.FA',
    database: 'atlas_driver_offer_bpp',
    protocol: 'native' // Use native protocol instead of HTTP
};

// Create the Clickhouse client
export const clickhouseClient = createClient(clickhouseConfig);

// Define interfaces for the query result
interface DriverRecord {
    driverId: string;
    token: string;
}

// Function to execute queries
export async function executeQuery<T = any>(query: string, params?: Record<string, any>): Promise<T[]> {
    try {
        const result = await clickhouseClient.query({
            query,
            format: 'JSONEachRow',
            query_params: params,
        });
        
        return await result.json();
    } catch (error) {
        console.error('Error executing Clickhouse query:', error);
        throw error;
    }
}

// Function to download data for a specific city and variant
export async function downloadData(city: string, variant: string = 'ALL'): Promise<DriverRecord[]> {
    try {
        console.log(`Downloading data for city: ${city}, variant: ${variant}`);
        
        // Build the query based on the parameters
        let query = `
            SELECT 
                p.id as driverId,
                p.device_token as token
            FROM \`atlas_driver_offer_bpp\`.\`person\` p
            LEFT JOIN \`atlas_driver_offer_bpp\`.\`merchant_operating_city\` moc
                ON p.merchant_operating_city_id = moc.id
            LEFT JOIN \`atlas_driver_offer_bpp\`.\`vehicle\` v
                ON p.id = v.driver_id
            WHERE
                p.device_token IS NOT NULL
                AND p.device_token <> ''
                AND moc.city = {city:String}
        `;
        
        // Add variant filtering based on the parameter
        if (variant !== 'ALL') {
            if (variant === 'CAB') {
                query += `
                    AND v.variant NOT IN ('AUTO_RICKSHAW', 'BIKE')
                    AND v.variant IS NOT NULL
                `;
            } else {
                query += `
                    AND v.variant = {variant:String}
                `;
            }
        } else {
            query += `
                AND v.variant IS NOT NULL
            `;
        }
        
        const data = await executeQuery<DriverRecord>(query, { city, variant });
        console.log(`Downloaded ${data.length} records`);
        return data;
    } catch (error) {
        console.error('Error downloading data:', error);
        throw error;
    }
} 
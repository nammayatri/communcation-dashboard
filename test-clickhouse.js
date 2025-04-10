// Test script for Clickhouse connection
import { clickhouseClient, executeQuery } from './dist/services/clickhouseService.js';

async function testConnection() {
  try {
    console.log('Testing Clickhouse connection...');
    
    // Simple query to test connection
    const result = await executeQuery('SELECT 1 as test');
    
    console.log('Connection successful!');
    console.log('Test query result:', result);
    
    // Test the downloadData function
    console.log('Testing downloadData function...');
    const data = await executeQuery(`
      SELECT *
      FROM driver_data
      WHERE city = {city:String}
      LIMIT 5
    `, { city: 'BANGALORE' });
    
    console.log('Sample data:', data);
    
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection(); 
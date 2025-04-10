import { createClient } from '@clickhouse/client';
import https from 'https';

// Create a custom HTTPS agent that ignores SSL certificate validation
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Create the client with the working credentials
const client = createClient({
  host: 'https://clickhouse-prod-1.clickhouse.cloud',
  username: 'default',
  password: 'K8s@123456',
  database: 'default',
  protocol: 'https:',
  httpsAgent: httpsAgent
});

async function testConnection() {
  try {
    console.log('Testing connection to ClickHouse...');
    
    // Test query
    const result = await client.query({
      query: 'SELECT 1',
      format: 'JSONEachRow',
    });
    
    const data = await result.json();
    console.log('Connection successful!');
    console.log('Query result:', data);
    
    // Test a more complex query
    console.log('\nTesting a more complex query...');
    const complexResult = await client.query({
      query: 'SELECT * FROM system.tables LIMIT 5',
      format: 'JSONEachRow',
    });
    
    const complexData = await complexResult.json();
    console.log('Complex query result:', complexData);
    
  } catch (error) {
    console.error('Error connecting to ClickHouse:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    await client.close();
  }
}

testConnection(); 
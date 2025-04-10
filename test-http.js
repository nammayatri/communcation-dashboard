import http from 'http';

const options = {
    hostname: '10.6.155.14',
    port: 8123,
    path: '/',
    method: 'GET',
    auth: 'juspay_data_view:i8U;%&v1l-[DK.FA'
};

console.log('Making HTTP request...');

const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response:', data);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.end(); 
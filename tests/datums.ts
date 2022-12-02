import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
const db_pwd = 'kraken!';
const db_name = 'testnet_preprod';
let client: PostgresClient;

describe('datum endpoints', function () {
    this.timeout(5000); 

    before('connecto to db-sync', async () => {
        client = new PostgresClient({
            connection: {
                host: db_host,
                port: db_port,
                user: db_user,
                database: db_name,
            },
            debug: true
        });
    });

    it('should get datum', async () => {
        // arrange
        const hash = '93892d0c469bd1228f0e94621d3101e755523e97ea0a837c9b509b1aeb9d8c42';
        const valueRaw = 'd8799f9f5820464a7376a01d7f8c58cf511285077e1b359fd6ff818f4375c9de1c2ec6fc1c2e5820a05f79c041e4b2238b5301c15a8e1083e56f3600bb2483245e7b3905e0870a9458207b73c9c18235b9c8ff15ffe138173d555ff5cb1f7a9b4315a5fbbe57af20bab75820e0174b7bf4c06b975825c36170494732f50de8a4d9c21d272211ffe605875a44582034adf47f2ac91dff05eee13a4b96d584eb6730d1392b24d0684ad0bfba0e89c3ff5554726561737572794973737565726578616d706c65ff';

        // act
        const datum = await client.getDatum(hash);

        // assert
        expect(datum.value).not.null;
        expect(datum.value_raw).equal(valueRaw);
      
    });

    after('closing connection', async () => {
        await client.disconnect();
    })
})
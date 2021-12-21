import { expect } from 'chai';
import { PostgresClient } from '../../src/clients/postgres-client';

const db_host = '54.215.96.227';
const db_port = 6543;
const db_user = 'cardano';
const db_pwd = 'kraken!';
const db_name = 'testnet';
let client: PostgresClient = null;

describe('block endpoints', function () {

    before('connecto to db-sync', async () => {
        client = new PostgresClient({
            connection: {
                host: db_host,
                port: db_port,
                user: db_user,
                password: db_pwd,
                database: db_name,
                ssl: {rejectUnauthorized: false}
            },
            debug: true
        });
    });
    
    describe('blocks', function() {

        it('it should return block transactions', async () => {
            const blockId = 3377526;
            const trannsactions = await client.getBlockTransactions(blockId);
            expect(trannsactions.length).to.be.greaterThanOrEqual(0);
        });
    });

    after('close db', async () => {
        await client.disconnect();
    })

})

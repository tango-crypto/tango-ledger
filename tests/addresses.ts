import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = '54.215.96.227';
const db_port = 6543;
const db_user = 'cardano';
const db_pwd = 'kraken!';
const db_name = 'testnet';
let client: PostgresClient = null;

describe('address endpoints', function () {
    this.timeout(5000); 

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

    it('should get address txs', async () => {
        // arrange
        const address = 'addr_test1qz64dptgdaceda97vmdhguz88s54qzwwe5lxfyrtz3n52p37lhlvxx6nd442cph2avszquujnsz4rqh33zynzhhy5uvsz6mt86';

        // act
        const txs = await client.getAddressTransactions(address);

        // assert
        expect(txs).not.null;
    })

    after('closing connection', async () => {
        await client.disconnect();
    })
})
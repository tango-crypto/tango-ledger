import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
// const db_pwd = 'kraken!';
const db_name = 'testnet_new';
let client: PostgresClient;

describe('policies endpoints', function () {
    this.timeout(5000); 

    before('connecto to db-sync', async () => {
        client = new PostgresClient({
            connection: {
                host: db_host,
                port: db_port,
                user: db_user,
                // password: db_pwd,
                database: db_name,
            },
            debug: true
        });
    });

    it("should get policy's assets", async () => {
        // arrange
        const policy = '6f49bf7603e903abd6191ecbe464783425eca9562223b20fe2f6b820';

        // act
        const assets = await client.getPolicyAssets(policy);

        // assert
        expect(assets.length).to.be.greaterThanOrEqual(0)
      
    });

    after('closing connection', async () => {
        await client.disconnect();
    })
})
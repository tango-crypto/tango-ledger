import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = '54.215.96.227';
const db_port = 6543;
const db_user = 'cardano';
const db_pwd = 'kraken!';
const db_name = 'testnet';
let client: PostgresClient = null;

describe('stake endpoints', function () {
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

    it('should get stake utxos', async () => {
        // arrange
        const stakeAddress = 'stake_test1uzvwag8aca8zelm0f4hxmktnvjpz72le5fjlyux2jtfqv9gdh6xk9';

        // act
        const utxos = await client.getStakeUtxos(stakeAddress);

        // assert
        expect(utxos).not.null;
      
    });

    after('closing connection', async () => {
        await client.disconnect();
    })
})
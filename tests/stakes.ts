import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
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
                database: db_name,
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

    it('should get stake addresses', async () => {
        // arrange
        const stakeAddress = 'stake_test1urtt0tpxwxyll6gclxnz5srjx3zjr099pgrqkd3st7339tcr0u0ph';

        // act
        const addresses = await client.getStakeAddresses(stakeAddress, 4, 'desc', 58574, 0);

        // assert
        expect(addresses.length).to.be.greaterThanOrEqual(0);
      
    });

    after('closing connection', async () => {
        await client.disconnect();
    })
})
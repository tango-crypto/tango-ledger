import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
const db_pwd = 'kraken!';
const db_name = 'testnet_preprod';
let client: PostgresClient;

describe('script endpoints', function () {
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

    it('should get script (SC)', async () => {
        // arrange
        const hash = 'bfc22757138e22b5159ef2fa833520bf6f204df5f77c2fa90e7a1ae8';

        // act
        const script = await client.getScript(hash);

        // assert
        expect(script.code).not.null;
        expect(script.serialised_size).not.null;
      
    });

    it('should get script (native)', async () => {
        // arrange
        const hash = '18ed282beda4bec13226c427d4744d2642ba2cef404470b62ae184d8';

        // act
        const script = await client.getScript(hash);

        // assert
        expect(script.json).not.null;
      
    });

    it('should get script redeemers', async () => {
        // arrange
        const hash = 'bfc22757138e22b5159ef2fa833520bf6f204df5f77c2fa90e7a1ae8';

        // act
        const utxos = await client.getScriptRedeemers(hash);

        // assert
        expect(utxos).not.null;
      
    });

    it('should get script redeemers pagination', async () => {
        // arrange
        const hash = 'bfc22757138e22b5159ef2fa833520bf6f204df5f77c2fa90e7a1ae8';
        const size = 6;
        const order = 'desc';

        // act
        const utxos = await client.getScriptRedeemers(hash, size, order);

        // assert
        expect(utxos.length).equal(6);
      
    });

    it('should get script redeemers pagination offset', async () => {
        // arrange
        const hash = 'bfc22757138e22b5159ef2fa833520bf6f204df5f77c2fa90e7a1ae8';
        const size = 20;
        const order = 'desc';
        const txId = 376764;
        const index = 0;

        // act
        const utxos = await client.getScriptRedeemers(hash, size, order, txId, index);

        // assert
        expect(utxos.length).equal(3);
      
    });

    after('closing connection', async () => {
        await client.disconnect();
    })
})
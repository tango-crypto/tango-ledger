import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
const db_pwd = 'kraken!';
const db_name = 'testnet';
let client: PostgresClient = null;

describe('epoch endpoints', function () {
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

    it('should get latest epoch', async () => {
        // arrange

        // act
        const epoch = await client.getLatestEpoch();

        // assert
        expect(epoch).not.null;
      
    });

    it('should get epoch parameters', async () => {
        // arrange
        const epoch = 153;

        // act
        const parameters = await client.getEpochParamters(epoch);

        // assert
        expect(parameters).not.null;
      
    });

    after('closing connection', async () => {
        await client.disconnect();
    })
})
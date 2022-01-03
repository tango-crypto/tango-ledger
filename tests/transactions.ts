import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = '54.215.96.227';
const db_port = 6543;
const db_user = 'cardano';
const db_pwd = 'kraken!';
const db_name = 'testnet';
let client: PostgresClient = null;

describe('transaction endpoints', function () {
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

    it('should get tx', async () => {
        // arrange
        const txHash = 'ee68694c061d8cf7a99e95e8286dcad51cb487c4de313f65ef5a45013f8f00dd';

        // act
        const tx = await client.getTransaction(txHash);
        console.log('TX', tx);

        // assert
        expect(tx).not.null;
    });

    it('should get tx utxos', async () => {
        // arrange
        const txHash = 'ee68694c061d8cf7a99e95e8286dcad51cb487c4de313f65ef5a45013f8f00dd';

        // act
        const utxos = await client.getTransactionUtxos(txHash);

        // assert
        expect(utxos).not.null;
    });

    it('should get tx inputs/outputs', async () => {
        // arrange
        const txHash = 'ee68694c061d8cf7a99e95e8286dcad51cb487c4de313f65ef5a45013f8f00dd';

        // act
        const utxos = await client.getTransactionInputUtxos(txHash);

        // assert
        expect(utxos).not.null;
    })

    after('closing connection', async () => {
        await client.disconnect();
    })
})
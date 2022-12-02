import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
const db_pwd = 'kraken!';
const db_name = 'testnet_preprod';
let client: PostgresClient;

describe('transaction endpoints', function () {
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

    it('should get tx', async () => {
        // arrange
        // const txHash = 'ee68694c061d8cf7a99e95e8286dcad51cb487c4de313f65ef5a45013f8f00dd';
        const txHash = 'a6ea1b7f2c96db8f097534a17f45cfa8934c9e9d70a0737b0ad90d7549de2724';

        // act
        const tx = await client.getTransaction(txHash);

        // assert
        expect(tx).not.null;
    });

    it('should get tx shallow', async () => {
        // arrange
        const id = 1992094;

        // act
        const tx = await client.getTransaction(id, true);

        // assert
        expect(tx).not.null;
    });

    it('should get tx utxos', async () => {
        // arrange
        const txHash = 'a6ea1b7f2c96db8f097534a17f45cfa8934c9e9d70a0737b0ad90d7549de2724';

        // act
        const utxos = await client.getTransactionUtxos(txHash);

        // assert
        expect(utxos).not.null;
    });

    it('should get tx utxos with scripts', async () => {
        // arrange
        // const txHash = 'a6ea1b7f2c96db8f097534a17f45cfa8934c9e9d70a0737b0ad90d7549de2724';
        const txHash = '8d700398e7111426af585ee427f97d728c22604404478e44df6d64c3166bc389';
        // const txHash = '122128d2f72f77ab6bf8fb3f95b13f820b7c08a7ba2cab9c1d4ae5422f97d3fd';

        // act
        const utxos = await client.getTransactionUtxosFull(txHash);

        // assert
        expect(utxos).not.null;
    });

    it('should get tx utxo collaterals', async () => {
        // arrange
        const txHash = 'a6ea1b7f2c96db8f097534a17f45cfa8934c9e9d70a0737b0ad90d7549de2724';

        // act
        const utxos = await client.getTransactionCollaterals(txHash);

        // assert
        expect(utxos).not.null;
    });

    it('should get tx scripts', async () => {
        // arrange
        const txHash = 'a6ea1b7f2c96db8f097534a17f45cfa8934c9e9d70a0737b0ad90d7549de2724';

        // act
        const scripts = await client.getTransactionScripts(txHash);

        // assert
        expect(scripts).not.null;
    });

    it('should get tx mints', async () => {
        // arrange
        const txHash = '9ecc78eea93fd09240b1ccf3ea231b3c052400ca936869d078290d7717cae189';

        // act
        const assets = await client.getTransactionMints(txHash);

        // assert
        expect(assets).not.null;
    });

    it('should get tx inputs/outputs', async () => {
        // arrange
        const txHash = 'ee68694c061d8cf7a99e95e8286dcad51cb487c4de313f65ef5a45013f8f00dd';

        // act
        const utxos = await client.getTransactionInputUtxos(txHash);

        // assert
        expect(utxos).not.null;
    });

    it('should get tx metadata', async () => {
        // arrange
        const txHash = '1c8997f9f0debde5b15fe29f0f18839a64e51c19ccdbe89e2811930d777c9b68';

        // act
        const metadata = await client.getTransactionMetadata(txHash, 50, 'desc', 4);

        // assert
        expect(metadata).not.null;
    });

    after('closing connection', async () => {
        await client.disconnect();
    })
})
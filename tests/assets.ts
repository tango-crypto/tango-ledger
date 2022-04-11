import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
// const db_pwd = 'kraken!';
const db_name = 'testnet';
let client: PostgresClient = null;

describe('assets endpoints', function () {
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

    it('should get asset', async () => {
        // arrange
        const identifier = 'b3fd2e8b5764818d9b33e2bc8d9e84a61fa39e75cf0c41393ee6c7a9456e6456696f6c656e6365506c61737469633437393761';

        // act
        const asset = await client.getAsset(identifier);

        // assert
        expect(asset).not.null;
      
    });

    it('should get asset by fingerprint', async () => {
        // arrange
        const fingerprint = 'asset1uq7kmkq4re85zgxtuzweayl23lgs7tjytw24u2';

        // act
        const asset = await client.getAssetByFingerprint(fingerprint);

        // assert
        expect(asset).not.null;
      
    });

    it('should get asset addresses', async () => {
        // arrange
        const identifier = 'b3fd2e8b5764818d9b33e2bc8d9e84a61fa39e75cf0c41393ee6c7a9456e6456696f6c656e6365506c61737469633437393761';
        const address = 'addr_test1qphzuz2250w0zljmt24x37c36nu8nyhv2s8nced4u7psfegtg2ckq83t2adz9gv0y0d0hyz0yj6dmendf7enpze0y33qm8wldn';

        // act
        const addresses = await client.getAssetAddresses(identifier, 10, 'asc', address);
        console.log(addresses);

        // assert
        expect(addresses).not.null;
      
    });

    after('closing connection', async () => {
        await client.disconnect();
    })
})
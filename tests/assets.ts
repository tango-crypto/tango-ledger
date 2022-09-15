import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
// const db_pwd = 'kraken!';
const db_name = 'testnet';
let client: PostgresClient;

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
        // const identifier = '45fb072eb2d45b8be940c13d1f235fa5a8263fc8ebe8c1af5194ea9c5365636f6e6454657374746f6b656e';

        // act
        const asset = await client.getAsset(identifier);

        // assert
        expect(asset).not.null;
      
    });

    it('should get asset by fingerprint', async () => {
        // arrange
        // const fingerprint = 'asset1uq7kmkq4re85zgxtuzweayl23lgs7tjytw24u2';
        const fingerprint = 'asset1dz7d9v3xs8sf9sljw82ux0sh6x4qfq37nu7kdw';

        // act
        const asset = await client.getAssetByFingerprint(fingerprint);

        // assert
        expect(asset).not.null;
      
    });

    it('should get asset owners', async () => {
        // arrange
        const identifier = 'b3fd2e8b5764818d9b33e2bc8d9e84a61fa39e75cf0c41393ee6c7a9456e6456696f6c656e6365506c61737469633437393761';
        const address = 'addr_test1qphzuz2250w0zljmt24x37c36nu8nyhv2s8nced4u7psfegtg2ckq83t2adz9gv0y0d0hyz0yj6dmendf7enpze0y33qm8wldn';

        // act
        const owners = await client.getAssetOwners(identifier, 10, 'asc', address);

        // assert
        expect(owners).not.null;
      
    });

    it('should get asset owners by fingerprint', async () => {
        // arrange
        const fingerprint = 'asset1ee0u29k4xwauf0r7w8g30klgraxw0y4rz2t7xs';
        const address = 'addr_test1qpwd4nthqsfvjcdmj7x9y0cus4eds8s3na9ke2tmkdmjezw2nzfdp07su08s0x8egzyfdkjk0t7d45e59t4ky8x5drrsawh0d8';
        const quantity = '2';

        // act
        const owners = await client.getAssetOwnersByFingerprint(fingerprint, 4, 'asc', address, quantity);
        console.log(owners);

        // assert
        expect(owners).not.null;
      
    });

    after('closing connection', async () => {
        await client.disconnect();
    })
})
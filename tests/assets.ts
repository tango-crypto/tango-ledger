import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
// const db_pwd = 'kraken!';
const db_name = 'testnet_preprod';
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
        // const identifier = 'b3fd2e8b5764818d9b33e2bc8d9e84a61fa39e75cf0c41393ee6c7a9456e6456696f6c656e6365506c61737469633437393761';
        const identifier = 'asset1xa965epc4j0jzun4uuujrhhvwec7fyscjpxnfa';

        // act
        const asset = await client.getAsset(identifier);

        // assert
        expect(asset).not.null;
      
    });

    it('should get asset by fingerprint', async () => {
        // arrange
        // const fingerprint = 'asset1uq7kmkq4re85zgxtuzweayl23lgs7tjytw24u2';
        const fingerprint = 'asset1xa965epc4j0jzun4uuujrhhvwec7fyscjpxnfa';

        // act
        const asset = await client.getAssetByFingerprint(fingerprint);

        // assert
        expect(asset).not.null;
      
    });

    it('should get asset owners', async () => {
        // arrange
        // const identifier = 'b3fd2e8b5764818d9b33e2bc8d9e84a61fa39e75cf0c41393ee6c7a9456e6456696f6c656e6365506c61737469633437393761';
        const identifier = 'asset1xa965epc4j0jzun4uuujrhhvwec7fyscjpxnfa';
        const address = 'addr_test1vps3wzu4p22rthzx3cllq0e5ylzr0dv9mjv9s30ku23ahsqss9vw3';

        // act
        const owners = await client.getAssetOwners(identifier, 10, 'asc', address);

        // assert
        expect(owners.length).to.be.greaterThan(1);
      
    });

    it('should get asset owners by fingerprint', async () => {
        // arrange
        const fingerprint = 'asset1xa965epc4j0jzun4uuujrhhvwec7fyscjpxnfa';
        const address = 'addr_test1vps3wzu4p22rthzx3cllq0e5ylzr0dv9mjv9s30ku23ahsqss9vw3';
        const quantity = '2';

        // act
        const owners = await client.getAssetOwnersByFingerprint(fingerprint, 4, 'asc', address, quantity);

        // assert
        expect(owners.length).to.be.greaterThan(1);
      
    });

    it('should get address asset utxos', async () => {
        // arrange
        const address = 'addr_test1qp9mj7vnenx4v99hw7ztfq03n7dmmujpgtlyfjhhel9w67nk72usllcew208n60ym94xcptfrgytuy5apwp565x28jgsg0ztq3';
        const asset = 'asset1z6tx0vvw9c8hajeca8mheymy6uuznflxdlxysw'

        // act
        const utxos = await client.getAddressAssetUtxos(address, asset, 20, 'desc', 351576, 2);
        // const utxos = await client.getAddressAssetUtxos(address, asset);

        // assert
        expect(utxos.length).to.be.greaterThan(0);
    })

    after('closing connection', async () => {
        await client.disconnect();
    })
})
import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
// const db_pwd = 'kraken!';
const db_name = 'testnet';
let client: PostgresClient;

describe('address endpoints', function () {
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

    it('should get address txs', async () => {
        // arrange
        const address = 'addr_test1qz64dptgdaceda97vmdhguz88s54qzwwe5lxfyrtz3n52p37lhlvxx6nd442cph2avszquujnsz4rqh33zynzhhy5uvsz6mt86';

        // act
        const txs = await client.getAddressTransactions(address);
        // assert
        expect(txs).not.null;
    })

    it('should get address assets', async () => {
        // arrange
        const address = 'addr_test1wrsexavz37208qda7mwwu4k7hcpg26cz0ce86f5e9kul3hqzlh22t';

        // act
        const assets = await client.getAddressAssets(address, 10, 'desc', 'asset1y92pll80kekqe9kf0rczt79cm7j0tyzs5nd09j');

        // assert
        expect(assets).not.null;
       
    });

    it('should get address utxos', async () => {
        // arrange
        const address = 'addr_test1wrhtrx98lc6dc2zk0uuv0hjjcrffq5fvllq9k7u6cajfvhq0rqywz';

        // act
        const utxos = await client.getAddressUtxos(address, 30, 'desc', 2507820, 1);

        // assert
        expect(utxos).not.null;
       
    })

    after('closing connection', async () => {
        await client.disconnect();
    })
})
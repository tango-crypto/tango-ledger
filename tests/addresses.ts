import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
// const db_pwd = 'kraken!';
const db_name = 'testnet_preprod';
let client: PostgresClient;

describe('address endpoints', function () {
    this.timeout(15000); 

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
        // const address = 'addr_test1wrhtrx98lc6dc2zk0uuv0hjjcrffq5fvllq9k7u6cajfvhq0rqywz';
        const address = 'addr_test1qqe5wnjzkhrgfvntj3dndzml7003h0n5ezen924qjrrglv6648u33jzvq2msza6gyqdcnau0njhav2sv46adkc9c8wdqx5aas8';

        // act
        // const utxos = await client.getAddressUtxos(address, 30, 'desc', 2507820, 1);
        const utxos = await client.getAddressUtxos(address);

        // assert
        expect(utxos.length).to.be.greaterThanOrEqual(0)
       
    })

    it('should get address asset utxos', async () => {
        // arrange
        // const address = 'addr_test1wrhtrx98lc6dc2zk0uuv0hjjcrffq5fvllq9k7u6cajfvhq0rqywz';
        const address = 'addr_test1wzluyf6hzw8z9dg4nme04qe4yzlk7gzd7hmhctafpeap46qshz4mn';
        const asset = 'asset1gk6pv38w62xtztfavrghtj98gcuc73w07ldlwk';

        // act
        // const utxos = await client.getAddressUtxos(address, 30, 'desc', 2507820, 1);
        const utxos = await client.getAddressAssetUtxos(address, asset);

        // assert
        expect(utxos.length).to.be.greaterThanOrEqual(0)
       
    })

    after('closing connection', async () => {
        await client.disconnect();
    })
})
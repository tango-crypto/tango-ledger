import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
const db_pwd = 'kraken!';
const db_name = 'testnet_preprod';
let client: PostgresClient;

describe('pool endpoints', function () {
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
    
    it('should return pool delegations by view (bech32 pool hash)', async () => {
        const poolId = 'pool1wn6a6f23ctq06udwhw27ravdpd6zcr7jlut3yez0wzdackz3222';
        const delegations = await client.getDelegations(poolId);
        expect(delegations.length).to.be.greaterThanOrEqual(0);
    });

    it('should return pool delegations by hash', async () => {
        const poolId = '74f5dd2551c2c0fd71aebb95e1f58d0b742c0fd2ff1712644f709bdc';
        const delegations = await client.getDelegations(poolId);
        expect(delegations.length).to.be.greaterThanOrEqual(0);
    });
   
    it('should return pool by view (bech32 pool hash)', async () => {
        const poolId = 'pool1wn6a6f23ctq06udwhw27ravdpd6zcr7jlut3yez0wzdackz3222';
        const pool = await client.getPool(poolId);
        expect(pool.ticker).to.be.equal('ANGEL');
        expect(pool.description).to.be.equal('ANGEL pool at pre-production')
    }) 

    it('should return pool by hash', async () => {
        const poolId = '74f5dd2551c2c0fd71aebb95e1f58d0b742c0fd2ff1712644f709bdc';
        const pool = await client.getPool(poolId);
        expect(pool.ticker).to.be.equal('ANGEL');
        expect(pool.description).to.be.equal('ANGEL pool at pre-production')
    }) 

    it('should return pool by pool id', async () => {
        const poolId = 143;
        const pool = await client.getPool(poolId);
        expect(pool).not.null;
    })
    
    it('should return pool by slot leader id', async () => {
        // Arrange
        const slotLeaderId = 511935;
        const id = 'pool1wn6a6f23ctq06udwhw27ravdpd6zcr7jlut3yez0wzdackz3222';
        const ticker = 'ANGEL';
        const name = 'ANGEL stake pool';
        const homepage = 'https://www.angelstakepool.net';
        const description = 'ANGEL pool at pre-production';

        // Act
        const pool = await client.getPoolBySlotLeader(slotLeaderId);

        // Assert
        expect(pool.pool_id).to.be.equal(id);
        expect(pool.ticker).to.be.equal(ticker);
        expect(pool.name).to.be.equal(name);
        expect(pool.homepage).to.be.equal(homepage);
        expect(pool.description).to.be.equal(description);
    })

    after('close db', async () => {
        await client.disconnect();
    })

})

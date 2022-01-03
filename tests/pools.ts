import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = '54.215.96.227';
const db_port = 6543;
const db_user = 'cardano';
const db_pwd = 'kraken!';
const db_name = 'testnet';
let client: PostgresClient = null;

describe('pool endpoints', function () {
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
    
    it('should return pool delegations', async () => {
        const poolId = 'pool1rnsw42f2q0u9fc32ttxy9l085n736jxz07lvwutz63wpyef03zh';
        const delegations = await client.getDelegations(poolId);
        expect(delegations.length).to.be.greaterThanOrEqual(0);
    });
   
    it('should return pool by pool_hash', async () => {
        const poolId = 'pool1rnsw42f2q0u9fc32ttxy9l085n736jxz07lvwutz63wpyef03zh';
        const pool = await client.getPool(poolId);
        expect(pool.ticker).to.be.equal('KIWI');
        expect(pool.description).to.be.equal('The one and Only Kiwipool Staking. ITN OG. Freedom fighter to the end. #Liberty #Truth #Love. KIWI!')
    }) 

    it('should return pool by pool id', async () => {
        const poolId = 36730980324023;
        const pool = await client.getPool(poolId);
        expect(pool).to.be.null;
    })
    
    it('should return pool by slot leader id', async () => {
        // Arrange
        const slotLeaderId = 2484328;
        const id = 'pool1h55utk6kdv0hzcrfmsy4vlrtqp8un4cm8d4yntpfhvtag79smml';
        const ticker = 'STACK';
        const name = 'ADASTACK';
        const homepage = 'https://adastack.net';
        const description = 'ADASTACK (2 of 2)';

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

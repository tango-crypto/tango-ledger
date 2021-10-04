export interface Stake {
	active: boolean;
	active_epoch?: number,
	controlled_total_stake: number,
	rewards_sum: number,
	withdrawals_sum: number,
	reserves_sum: number,
	treasury_sum: number,
	withdraw_available: number,
	pool_id?: string
}
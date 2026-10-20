import { query, pool } from "./db.js";

export const auctionStatus = `CASE WHEN a.status='CLOSED' OR a.end_time<=clock_timestamp() THEN 'CLOSED'
 WHEN a.start_time<=clock_timestamp() THEN 'ACTIVE' ELSE 'SCHEDULED' END`;

export const accessible = async (a, user) => {
  if (
    a.visibility === "PUBLIC" ||
    a.seller_id === user?.id ||
    user?.role === "ADMIN"
  )
    return true;
  if (!user) return false;
  const r = await query(
    "SELECT 1 FROM private_auction_access WHERE auction_id=$1 AND user_id=$2",
    [a.id, user.id],
  );
  return !!r.rowCount;
};
export async function auction(id) {
  const r = await query(
    "SELECT a.*,i.seller_id,i.title FROM auctions a JOIN items i ON i.id=a.item_id WHERE a.id=$1",
    [id],
  );
  return r.rows[0];
}
export async function closeIfEnded(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query(
      "SELECT * FROM auctions WHERE id=$1 FOR UPDATE",
      [id],
    );
    if (!r.rowCount) {
      await client.query("ROLLBACK");
      return;
    }
    const a = r.rows[0];
    const time = await client.query("SELECT clock_timestamp() AS current_time");
    if (
      a.status !== "CLOSED" &&
      new Date(a.end_time) <= time.rows[0].current_time
    ) {
      const w = await client.query(
        "SELECT id FROM bids WHERE auction_id=$1 ORDER BY amount DESC,created_at ASC LIMIT 1",
        [id],
      );
      await client.query("UPDATE auctions SET status='CLOSED' WHERE id=$1", [
        id,
      ]);
      await client.query(
        "INSERT INTO auction_results(auction_id,winner_bid_id) VALUES($1,$2) ON CONFLICT(auction_id) DO NOTHING",
        [id, w.rows[0]?.id || null],
      );
    }
    await client.query(
      "UPDATE auctions SET status='ACTIVE' WHERE id=$1 AND status='SCHEDULED' AND start_time<=clock_timestamp() AND end_time>clock_timestamp()",
      [id],
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function resultFor(auctionId, userId = null) {
  const result = await query(
    `SELECT r.winner_bid_id,r.closed_at,b.amount AS winning_amount,
    CASE WHEN $2::uuid IS NULL THEN NULL ELSE COALESCE(b.bidder_id=$2,false) END AS "isWinner"
    FROM auction_results r LEFT JOIN bids b ON b.id=r.winner_bid_id AND b.auction_id=r.auction_id
    WHERE r.auction_id=$1`,
    [auctionId, userId],
  );
  return result.rows[0] || null;
}

export async function participationFor(auctionId, userId) {
  if (!userId) return null;
  // نرجع للمستخدم بيانات مشاركته فقط، بدون هوية بقية المزايدين.
  const result = await query(
    `SELECT count(*)::int AS "bidCount",max(amount) AS "highestBid",
    (SELECT id FROM bids WHERE auction_id=$1 AND bidder_id=$2 ORDER BY created_at DESC,id DESC LIMIT 1) AS "latestBidId"
    FROM bids WHERE auction_id=$1 AND bidder_id=$2`,
    [auctionId, userId],
  );
  return { ...result.rows[0], hasBid: result.rows[0].bidCount > 0 };
}

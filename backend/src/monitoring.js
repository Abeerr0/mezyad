import { Router } from "express";
import { query } from "./db.js";
import { auth, admin } from "./auth.js";
import { auctionStatus, closeIfEnded } from "./auctions.js";
import { imageLink } from "./uploads.js";

export const monitoring = Router();
const fail = (res) =>
  res.status(400).json({
    error: { code: "INVALID_INPUT", message: "Invalid monitoring filters" },
  });

monitoring.get("/admin/dashboard", auth, admin, async (_req, res, next) => {
  try {
    // أعداد فعلية من الداتا؛ حالة المزاد تعتمد على وقت السيرفر.
    const { rows } = await query(`SELECT
      (SELECT count(*)::int FROM items WHERE status='PENDING_REVIEW') AS pending,
      (SELECT count(*)::int FROM items WHERE status='APPROVED') AS approved,
      (SELECT count(*)::int FROM items WHERE status='REJECTED') AS rejected,
      count(*) FILTER (WHERE (${auctionStatus})='SCHEDULED')::int AS scheduled,
      count(*) FILTER (WHERE (${auctionStatus})='ACTIVE')::int AS active,
      count(*) FILTER (WHERE (${auctionStatus})='CLOSED')::int AS closed,
      (SELECT count(*)::int FROM bids) AS bids FROM auctions a`);
    const row = rows[0];
    res.json({
      data: {
        listings: {
          pendingReview: row.pending,
          approved: row.approved,
          rejected: row.rejected,
        },
        auctions: {
          scheduled: row.scheduled,
          active: row.active,
          closed: row.closed,
        },
        bids: { count: row.bids },
      },
    });
  } catch (error) {
    next(error);
  }
});

monitoring.get("/admin/auctions", auth, admin, async (req, res, next) => {
  try {
    const { status, visibility } = req.query;
    const limit = Number(req.query.limit ?? 50),
      offset = Number(req.query.offset ?? 0);
    if (
      (status !== undefined &&
        !["SCHEDULED", "ACTIVE", "CLOSED"].includes(status)) ||
      (visibility !== undefined &&
        !["PUBLIC", "PRIVATE"].includes(visibility)) ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isSafeInteger(offset) ||
      offset < 0
    )
      return fail(res);
    const page = await query(
      `SELECT a.id FROM auctions a
      WHERE ($1::text IS NULL OR (${auctionStatus})=$1) AND ($2::text IS NULL OR a.visibility=$2)
      ORDER BY a.end_time DESC,a.id LIMIT $3 OFFSET $4`,
      [status ?? null, visibility ?? null, limit, offset],
    );
    // نفس دالة الإغلاق؛ ما نسوي نتيجة ثانية أو نتجاوز قفل المزايدات.
    await Promise.all(page.rows.map((row) => closeIfEnded(row.id)));
    const result = await query(
      `SELECT a.id,a.item_id,a.visibility,${auctionStatus} AS status,
      a.start_time,a.end_time,a.starting_price,a.current_price,a.minimum_increment,
      i.title,i.seller_id,c.name AS category_name,
      (SELECT image_url FROM item_images WHERE item_id=i.id ORDER BY id LIMIT 1) AS image_url,
      (SELECT count(*)::int FROM bids WHERE auction_id=a.id) AS bid_count,
      (SELECT count(DISTINCT bidder_id)::int FROM bids WHERE auction_id=a.id) AS bidder_count,
      CASE WHEN r.auction_id IS NULL THEN NULL ELSE json_build_object(
        'winner_bid_id',r.winner_bid_id,'winning_amount',b.amount::text,'closed_at',r.closed_at) END AS result
      FROM auctions a JOIN items i ON i.id=a.item_id JOIN categories c ON c.id=i.category_id
      LEFT JOIN auction_results r ON r.auction_id=a.id
      LEFT JOIN bids b ON b.auction_id=r.auction_id AND b.id=r.winner_bid_id
      WHERE a.id=ANY($1::uuid[]) ORDER BY a.end_time DESC,a.id`,
      [page.rows.map((row) => row.id)],
    );
    res.json({
      data: result.rows.map((row) => ({
        ...row,
        image_url: imageLink(row.image_url),
      })),
      meta: { limit, offset },
    });
  } catch (error) {
    next(error);
  }
});

import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { query, pool } from "./db.js";
import { auth, admin, hashToken, newToken } from "./auth.js";
import { validMoney, toCents } from "./money.js";
import { listings, withImages, withListingImages } from "./listings.js";
import { imageLink, serveImage } from "./uploads.js";
import { attemptLimit } from "./limits.js";
import { startCommitment } from "./bank.js";
import {
  auction,
  accessible,
  closeIfEnded,
  auctionStatus,
  resultFor,
  participationFor,
} from "./auctions.js";

export const app = express();
app.use(
  cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }),
);
app.use(express.json({ limit: "100kb" }));

const err = (res, status, code, message) =>
  res.status(status).json({ error: { code, message } });
const validUuid = (x) =>
  typeof x === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
app.get("/health", (_req, res) => res.json({ data: { status: "ok" } }));
const accounts = express.Router();
app.use("/auth", accounts);
app.use("/api/v1/auth", accounts);
accounts.post("/register", async (req, res, next) => {
  try {
    // نتحقق من بيانات الحساب قبل ما نحفظه.
    const { name, email, password } = req.body || {};
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 8
    )
      return err(
        res,
        400,
        "INVALID_INPUT",
        "Valid name, email and password (8+ chars) required",
      );
    const hash = await bcrypt.hash(password, 12);
    // الحساب العام يطلع USER؛ ما ناخذ صلاحية الأدمن من الطلب.
    const r = await query(
      "INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email,role",
      [name.trim(), email.trim().toLowerCase(), hash],
    );
    res.status(201).json({ data: r.rows[0] });
  } catch (e) {
    if (e.code === "23505")
      return err(res, 409, "DUPLICATE_EMAIL", "Email already registered");
    next(e);
  }
});
accounts.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string")
      return err(res, 400, "INVALID_INPUT", "Email and password required");
    // هنا نطابق كلمة المرور مع البصمة المحفوظة.
    const r = await query("SELECT * FROM users WHERE email=$1", [
      email.trim().toLowerCase(),
    ]);
    if (
      !r.rowCount ||
      !(await bcrypt.compare(password, r.rows[0].password_hash))
    )
      return err(res, 401, "INVALID_CREDENTIALS", "Invalid credentials");
    const token = newToken(),
      u = r.rows[0];
    // نخزن بصمة الجلسة بدل الرمز نفسه.
    await query(
      "INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '7 days')",
      [u.id, hashToken(token)],
    );
    res.json({
      data: {
        token,
        user: { id: u.id, name: u.name, email: u.email, role: u.role },
      },
    });
  } catch (e) {
    next(e);
  }
});
accounts.post("/logout", auth, async (req, res, next) => {
  try {
    // نحذف الجلسة عشان الرمز ما عاد يدخل بعد الخروج.
    await query("DELETE FROM user_sessions WHERE token_hash=$1", [
      hashToken(req.token),
    ]);
    res.json({ data: { signedOut: true } });
  } catch (e) {
    next(e);
  }
});
const api = express.Router();
app.use("/api/v1", api);
app.use(api);
api.get("/health", (_req, res) => res.json({ data: { status: "ok" } }));
api.get("/categories", async (_req, res, next) => {
  try {
    res.json({
      data: (await query("SELECT id,name FROM categories ORDER BY name")).rows,
    });
  } catch (e) {
    next(e);
  }
});
// هنا نتأكد إن صيغة المعرّف صحيحة قبل الاستعلام.
api.param("id", (req, res, next, id) =>
  validUuid(id) ? next() : err(res, 400, "INVALID_ID", "Invalid ID"),
);
listings.param("id", (req, res, next, id) =>
  validUuid(id) ? next() : err(res, 400, "INVALID_ID", "Invalid ID"),
);
api.use(listings);

api.get("/images/:filename", serveImage);
// الأدمن يراجع الإعلان، والرفض لازم يكون معه سبب.
api.post("/admin/items/:id/review", auth, admin, async (req, res, next) => {
  try {
    const { decision, reason } = req.body || {};
    if (
      !["APPROVED", "REJECTED"].includes(decision) ||
      (decision === "REJECTED" &&
        (typeof reason !== "string" || !reason.trim() || reason.length > 2000))
    )
      return err(
        res,
        400,
        "INVALID_INPUT",
        "Valid decision and rejection reason required",
      );
    const r = await query(
      "UPDATE items SET status=$1,review_reason=$2,reviewed_by=$3,reviewed_at=now() WHERE id=$4 AND status='PENDING_REVIEW' RETURNING *",
      [
        decision,
        decision === "REJECTED" ? reason.trim() : null,
        req.user.id,
        req.params.id,
      ],
    );
    if (!r.rowCount)
      return err(res, 409, "INVALID_STATE", "Listing not pending review");
    res.json({ data: await withImages(r.rows[0]) });
  } catch (e) {
    next(e);
  }
});
api.post("/auctions", auth, async (req, res, next) => {
  try {
    const {
      itemId,
      visibility,
      startingPrice,
      minimumIncrement,
      startTime,
      endTime,
    } = req.body || {};
    if (
      !validUuid(itemId) ||
      !["PUBLIC", "PRIVATE"].includes(visibility) ||
      !validMoney(startingPrice) ||
      !validMoney(minimumIncrement) ||
      typeof startTime !== "string" ||
      typeof endTime !== "string" ||
      !startTime ||
      !endTime ||
      !Number.isFinite(Date.parse(startTime)) ||
      !Number.isFinite(Date.parse(endTime)) ||
      new Date(endTime) <= new Date(startTime)
    )
      return err(res, 400, "INVALID_INPUT", "Invalid auction parameters");
    // نحفظ بصمة كود الدخول، وما ننشئ المزاد إلا من إعلان معتمد.
    const accessCode =
      visibility === "PRIVATE" ? randomBytes(12).toString("hex") : null;
    const codeHash = accessCode ? await bcrypt.hash(accessCode, 12) : null;
    const r = await query(
      `INSERT INTO auctions(item_id,visibility,access_code_hash,starting_price,current_price,minimum_increment,start_time,end_time)
 SELECT id,$2,$3,$4,$4,$5,$6,$7 FROM items WHERE id=$1 AND seller_id=$8 AND status='APPROVED'
 RETURNING id,item_id,visibility,starting_price,current_price,minimum_increment,start_time,end_time,status`,
      [
        itemId,
        visibility,
        codeHash,
        startingPrice,
        minimumIncrement,
        startTime,
        endTime,
        req.user.id,
      ],
    );
    if (!r.rowCount)
      return err(
        res,
        403,
        "NOT_APPROVED",
        "Only approved owned items can be auctioned",
      );
    res
      .status(201)
      .json({ data: { ...r.rows[0], ...(accessCode ? { accessCode } : {}) } });
  } catch (e) {
    if (e.code === "23505")
      return err(res, 409, "DUPLICATE_AUCTION", "Item already has auction");
    next(e);
  }
});
// الحالة تنحسب بوقت قاعدة البيانات حتى لو ما أحد زايد أو فتح الصفحة.
api.get(
  "/auctions",
  (req, res, next) =>
    req.query.scope === "all" ? auth(req, res, next) : next(),
  async (req, res, next) => {
    try {
      if (req.query.scope === "all" && req.user.role !== "ADMIN")
        return err(res, 403, "FORBIDDEN", "Admin only");
      const { categoryId, status } = req.query;
      if (
        (categoryId !== undefined && !validUuid(categoryId)) ||
        (status !== undefined &&
          !["SCHEDULED", "ACTIVE", "CLOSED"].includes(status))
      )
        return err(res, 400, "INVALID_INPUT", "Invalid auction filters");
      const r = await query(
        `SELECT a.id,a.item_id,a.visibility,a.starting_price,a.current_price,a.minimum_increment,a.start_time,a.end_time,${auctionStatus} AS status,
   i.title,c.name AS category_name,
   (SELECT image_url FROM item_images WHERE item_id=i.id ORDER BY id LIMIT 1) AS image_url,
   (SELECT count(*)::int FROM bids WHERE auction_id=a.id) AS bid_count
   FROM auctions a JOIN items i ON i.id=a.item_id JOIN categories c ON c.id=i.category_id
   WHERE (a.visibility='PUBLIC' OR $1::boolean) AND ($2::uuid IS NULL OR i.category_id=$2)
   AND ($3::text IS NULL OR (${auctionStatus})=$3) ORDER BY a.start_time DESC,a.id`,
        [req.query.scope === "all", categoryId || null, status || null],
      );
      res.json({
        data: r.rows.map((a) => ({ ...a, image_url: imageLink(a.image_url) })),
      });
    } catch (e) {
      next(e);
    }
  },
);
api.get("/auctions/:id", async (req, res, next) => {
  try {
    if (!validUuid(req.params.id))
      return err(res, 400, "INVALID_ID", "Invalid ID");
    const a = await auction(req.params.id);
    if (!a) return err(res, 404, "NOT_FOUND", "Auction not found");
    const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
    let user = null;
    if (token) {
      const r = await query(
        "SELECT u.id,u.role FROM user_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()",
        [hashToken(token)],
      );
      user = r.rows[0];
    }
    if (!(await accessible(a, user)))
      return err(res, 404, "NOT_FOUND", "Auction not found");
    await closeIfEnded(a.id);
    const current = await auction(a.id);
    // بصمة كود الدخول ما تطلع في الرد.
    delete current.access_code_hash;
    const result = await resultFor(a.id, user?.id);
    const participation = await participationFor(a.id, user?.id);
    const item = await query(
      "SELECT i.description,i.category_fields,c.name AS category_name FROM items i JOIN categories c ON c.id=i.category_id WHERE i.id=$1",
      [current.item_id],
    );
    const images = await query(
      "SELECT image_url FROM item_images WHERE item_id=$1 ORDER BY id",
      [current.item_id],
    );
    res.json({
      data: {
        ...current,
        ...item.rows[0],
        images: images.rows.map((image) => imageLink(image.image_url)),
        result,
        participation,
      },
    });
  } catch (e) {
    next(e);
  }
});
api.post(
  "/auctions/:id/access",
  auth,
  attemptLimit({ key: (req) => req.user.id + ":" + req.params.id }),
  async (req, res, next) => {
    try {
      const a = await auction(req.params.id);
      if (!a || a.visibility !== "PRIVATE")
        return err(res, 403, "INVALID_CODE", "Invalid access code");
      if (a.seller_id === req.user.id)
        return err(res, 403, "OWNER", "Owner cannot join as bidder");
      if (
        typeof req.body?.accessCode !== "string" ||
        req.body.accessCode.length > 128 ||
        !(await bcrypt.compare(req.body.accessCode, a.access_code_hash))
      )
        return err(res, 403, "INVALID_CODE", "Invalid access code");
      // نحفظ السماح بالدخول بعد ما نتأكد من الكود.
      await query(
        "INSERT INTO private_auction_access(auction_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
        [a.id, req.user.id],
      );
      res.json({ data: { accessGranted: true } });
    } catch (e) {
      next(e);
    }
  },
);
api.post("/auctions/:id/commitment", auth, async (req, res, next) => {
  try {
    const a = await auction(req.params.id);
    if (!a || !(await accessible(a, req.user)))
      return err(res, 404, "NOT_FOUND", "Auction not found");
    if (a.seller_id === req.user.id)
      return err(res, 403, "OWNER", "Cannot commit to own auction");
    if (a.status === "CLOSED" || new Date(a.end_time) <= new Date())
      return err(res, 409, "AUCTION_NOT_ACTIVE", "Auction ended");
    await startCommitment({ auctionId: a.id, userId: req.user.id });
  } catch (e) {
    next(e);
  }
});
api.get("/auctions/:id/commitment", auth, async (req, res, next) => {
  try {
    const a = await auction(req.params.id);
    if (!a || !(await accessible(a, req.user)))
      return err(res, 404, "NOT_FOUND", "Auction not found");
    const r = await query(
      "SELECT id,status,sandbox_reference,created_at FROM bid_commitments WHERE auction_id=$1 AND user_id=$2",
      [req.params.id, req.user.id],
    );
    if (!r.rowCount) return err(res, 404, "NOT_FOUND", "No commitment");
    res.json({ data: r.rows[0] });
  } catch (e) {
    next(e);
  }
});
api.post("/auctions/:id/bids", auth, async (req, res, next) => {
  const { amount, requestId } = req.body || {};
  if (!validMoney(amount) || !validUuid(requestId) || !validUuid(req.params.id))
    return err(
      res,
      400,
      "INVALID_INPUT",
      "Valid amount and UUID requestId required",
    );
  // نقفل نفس صف المزاد عشان المزايدات والإغلاق ما يتعارضون.
  let c;
  try {
    c = await pool.connect();
    await c.query("BEGIN");
    const ar = await c.query(
      "SELECT a.*,i.seller_id FROM auctions a JOIN items i ON i.id=a.item_id WHERE a.id=$1 FOR UPDATE OF a",
      [req.params.id],
    );
    if (!ar.rowCount) {
      await c.query("ROLLBACK");
      return err(res, 404, "NOT_FOUND", "Auction not found");
    }
    const a = ar.rows[0];
    if (a.seller_id === req.user.id) {
      await c.query("ROLLBACK");
      return err(res, 403, "OWNER", "Cannot bid on own auction");
    }
    if (a.visibility === "PRIVATE") {
      const access = await c.query(
        "SELECT 1 FROM private_auction_access WHERE auction_id=$1 AND user_id=$2",
        [a.id, req.user.id],
      );
      if (!access.rowCount) {
        await c.query("ROLLBACK");
        return err(res, 404, "NOT_FOUND", "Auction not found");
      }
    }
    // نفس رقم الطلب ما ينقبل أكثر من مرة.
    const prior = await c.query(
      "SELECT id,amount FROM bids WHERE request_id=$1",
      [requestId],
    );
    if (prior.rowCount) {
      await c.query("ROLLBACK");
      return err(
        res,
        409,
        "DUPLICATE_REQUEST",
        "Bid request already processed",
      );
    }
    // ما نقبل المزايدة بدون التزام ناجح لهذا المستخدم والمزاد.
    const commitment = await c.query(
      "SELECT 1 FROM bid_commitments WHERE auction_id=$1 AND user_id=$2 AND status='SUCCESS'",
      [a.id, req.user.id],
    );
    if (!commitment.rowCount) {
      await c.query("ROLLBACK");
      return err(
        res,
        403,
        "COMMITMENT_REQUIRED",
        "Verified commitment required",
      );
    }
    // نتحقق من الوقت بعد القفل عشان نرفض الطلب اللي تأخر وهو ينتظر.
    const clock = await c.query("SELECT clock_timestamp() AS current_time");
    const now = clock.rows[0].current_time;
    if (
      now < new Date(a.start_time) ||
      now >= new Date(a.end_time) ||
      a.status === "CLOSED"
    ) {
      await c.query("ROLLBACK");
      return err(res, 409, "AUCTION_NOT_ACTIVE", "Auction not active");
    }
    const count = await c.query(
      "SELECT 1 FROM bids WHERE auction_id=$1 LIMIT 1",
      [a.id],
    );
    // أول عرض يبدأ من سعر البداية، وبعده نحسب أقل زيادة بالهللات.
    const minimumCents = count.rowCount
      ? toCents(a.current_price) + toCents(a.minimum_increment)
      : toCents(a.starting_price);
    if (toCents(amount) < minimumCents) {
      await c.query("ROLLBACK");
      return err(res, 409, "BID_TOO_LOW", "Bid below minimum");
    }
    // نحفظ العرض ونحدّث السعر داخل نفس المعاملة.
    const bid = await c.query(
      "INSERT INTO bids(auction_id,bidder_id,amount,request_id) VALUES($1,$2,$3,$4) RETURNING id,amount",
      [a.id, req.user.id, amount, requestId],
    );
    await c.query(
      "UPDATE auctions SET current_price=$1,status='ACTIVE' WHERE id=$2",
      [amount, a.id],
    );
    await c.query("COMMIT");
    res
      .status(201)
      .json({ data: { bidId: bid.rows[0].id, amount, currentPrice: amount } });
  } catch (e) {
    // إذا فشلت أي خطوة نرجع السعر والعرض مثل ما كانوا.
    if (c) await c.query("ROLLBACK").catch(() => {});
    if (e.code === "23505")
      return err(
        res,
        409,
        "DUPLICATE_REQUEST",
        "Bid request already processed",
      );
    next(e);
  } finally {
    c?.release();
  }
});
api.get("/auctions/:id/bids", auth, async (req, res, next) => {
  try {
    const a = await auction(req.params.id);
    if (!a || !(await accessible(a, req.user)))
      return err(res, 404, "NOT_FOUND", "Auction not found");
    const limit = Number(req.query.limit ?? 100),
      offset = Number(req.query.offset ?? 0);
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100 ||
      !Number.isSafeInteger(offset) ||
      offset < 0
    )
      return err(res, 400, "INVALID_INPUT", "Invalid paging");
    const r = await query(
      "SELECT id,amount,created_at FROM bids WHERE auction_id=$1 ORDER BY created_at DESC,id LIMIT $2 OFFSET $3",
      [a.id, limit, offset],
    );
    res.json({ data: r.rows });
  } catch (e) {
    next(e);
  }
});
api.get("/me/items", auth, async (req, res, next) => {
  try {
    res.json({
      data: await withListingImages(
        (
          await query("SELECT * FROM items WHERE seller_id=$1 ORDER BY id", [
            req.user.id,
          ])
        ).rows,
      ),
    });
  } catch (e) {
    next(e);
  }
});
api.get("/me/auctions", auth, async (req, res, next) => {
  try {
    res.json({
      data: (
        await query(
          `SELECT DISTINCT a.id,${auctionStatus} AS status,a.end_time,i.title FROM auctions a JOIN items i ON i.id=a.item_id LEFT JOIN bids b ON b.auction_id=a.id WHERE i.seller_id=$1 OR b.bidder_id=$1`,
          [req.user.id],
        )
      ).rows,
    });
  } catch (e) {
    next(e);
  }
});
app.use((_req, res) => err(res, 404, "NOT_FOUND", "Route not found"));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.apiCode)
    return err(res, error.status || 400, error.apiCode, error.message);
  if (error.name === "MulterError")
    return err(
      res,
      error.code === "LIMIT_FILE_SIZE" ? 413 : 400,
      error.code === "LIMIT_FILE_SIZE" ? "PAYLOAD_TOO_LARGE" : "INVALID_IMAGE",
      "Up to six JPG, PNG or WebP images, 5 MiB each",
    );
  if (error.type === "entity.parse.failed")
    return err(res, 400, "INVALID_JSON", "Invalid JSON body");
  if (error.type === "entity.too.large")
    return err(res, 413, "PAYLOAD_TOO_LARGE", "Request body too large");
  // تفاصيل الخطأ تبقى بالسيرفر، ونرجع رسالة عامة للمستخدم.
  console.error("API error", error.code || "INTERNAL_ERROR");
  err(res, 500, "INTERNAL_ERROR", "Unexpected server error");
});

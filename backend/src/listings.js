import { Router } from "express";
import { pool, query } from "./db.js";
import { auth } from "./auth.js";
import {
  uploadImages,
  saveImages,
  removeImages,
  imageLink,
} from "./uploads.js";

export const listings = Router();
const uuid = (value) =>
  typeof value === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const fail = (res, status, code, message) =>
  res.status(status).json({ error: { code, message } });

export async function withImages(item, connection = { query }) {
  const images = await connection.query(
    "SELECT image_url FROM item_images WHERE item_id=$1 ORDER BY id",
    [item.id],
  );
  return {
    ...item,
    images: images.rows.map((row) => imageLink(row.image_url)),
  };
}

function fields(body, editing) {
  let categoryFields = body.category_fields ?? body.categoryFields;
  if (typeof categoryFields === "string") {
    try {
      categoryFields = JSON.parse(categoryFields);
    } catch {
      return null;
    }
  }
  const { title, description } = body;
  const categoryId = body.categoryId ?? body.category;
  if (
    body.categoryId !== undefined &&
    body.category !== undefined &&
    body.categoryId !== body.category
  )
    return null;
  if (
    typeof title !== "string" ||
    !title.trim() ||
    [...title.trim()].length > 240 ||
    typeof description !== "string" ||
    !description.trim() ||
    description.length > 20000 ||
    (!editing && !uuid(categoryId)) ||
    (categoryId !== undefined && !uuid(categoryId)) ||
    (categoryFields !== undefined &&
      (!categoryFields ||
        typeof categoryFields !== "object" ||
        Array.isArray(categoryFields)))
  )
    return null;
  return {
    title: title.trim(),
    description: description.trim(),
    categoryId,
    categoryFields,
  };
}

async function writeListing(req, res, next) {
  const editing = req.method === "PATCH";
  const input = fields(req.body || {}, editing);
  if (!input)
    return fail(res, 400, "INVALID_INPUT", "Valid listing fields required");
  if (!editing && req.is("multipart/form-data") && !req.files?.length)
    return fail(res, 400, "INVALID_IMAGE", "At least one image required");
  let client,
    saved = [],
    oldImages = [],
    committed = false;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    let item;
    if (editing) {
      const result = await client.query(
        "SELECT * FROM items WHERE id=$1 FOR UPDATE",
        [req.params.id],
      );
      item = result.rows[0];
      if (!item) {
        await client.query("ROLLBACK");
        return fail(res, 404, "NOT_FOUND", "Item not found");
      }
      if (item.seller_id !== req.user.id) {
        await client.query("ROLLBACK");
        return fail(res, 403, "FORBIDDEN", "Not your item");
      }
      if (item.status !== "REJECTED") {
        await client.query("ROLLBACK");
        return fail(
          res,
          409,
          "INVALID_STATE",
          "Only rejected items can be resubmitted",
        );
      }
      if (
        input.categoryId !== undefined &&
        input.categoryId !== item.category_id
      ) {
        await client.query("ROLLBACK");
        return fail(
          res,
          400,
          "INVALID_CATEGORY",
          "Category cannot change on resubmission",
        );
      }
      item = (
        await client.query(
          `UPDATE items SET title=$1,description=$2,category_fields=$3,status='PENDING_REVIEW',
        review_reason=NULL,reviewed_by=NULL,reviewed_at=NULL WHERE id=$4 RETURNING *`,
          [
            input.title,
            input.description,
            JSON.stringify(input.categoryFields ?? item.category_fields),
            item.id,
          ],
        )
      ).rows[0];
    } else {
      item = (
        await client.query(
          `INSERT INTO items(seller_id,category_id,title,description,category_fields)
        VALUES($1,$2,$3,$4,$5) RETURNING *`,
          [
            req.user.id,
            input.categoryId,
            input.title,
            input.description,
            JSON.stringify(input.categoryFields ?? {}),
          ],
        )
      ).rows[0];
    }
    saved = await saveImages(req.files);
    if (saved.length) {
      if (editing) {
        oldImages = (
          await client.query(
            "DELETE FROM item_images WHERE item_id=$1 RETURNING image_url",
            [item.id],
          )
        ).rows.map((row) => row.image_url);
      }
      for (const path of saved)
        await client.query(
          "INSERT INTO item_images(item_id,image_url) VALUES($1,$2)",
          [item.id, path],
        );
    }
    const data = await withImages(item, client);
    // الإعلان ومراجع الصور تنحفظ مع بعض، وإذا فشل الحفظ نحذف الملفات الجديدة.
    await client.query("COMMIT");
    committed = true;
    await removeImages(oldImages);
    res.status(editing ? 200 : 201).json({ data });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    if (!committed) await removeImages(saved);
    if (error.code === "23503")
      return fail(res, 400, "INVALID_CATEGORY", "Unknown category");
    next(error);
  } finally {
    client?.release();
  }
}

listings.post("/items", auth, uploadImages, writeListing);
listings.patch("/items/:id", auth, uploadImages, writeListing);
listings.get("/items", auth, async (req, res, next) => {
  try {
    const result =
      req.user.role === "ADMIN" && req.query.status === "PENDING_REVIEW"
        ? await query(
            "SELECT * FROM items WHERE status='PENDING_REVIEW' ORDER BY id",
          )
        : await query("SELECT * FROM items WHERE seller_id=$1 ORDER BY id", [
            req.user.id,
          ]);
    res.json({
      data: await Promise.all(result.rows.map((item) => withImages(item))),
    });
  } catch (error) {
    next(error);
  }
});
listings.get("/items/:id", auth, async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM items WHERE id=$1", [
      req.params.id,
    ]);
    if (!result.rowCount) return fail(res, 404, "NOT_FOUND", "Item not found");
    const item = result.rows[0];
    if (item.seller_id !== req.user.id && req.user.role !== "ADMIN")
      return fail(res, 403, "FORBIDDEN", "Not your item");
    res.json({ data: await withImages(item) });
  } catch (error) {
    next(error);
  }
});

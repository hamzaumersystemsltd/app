import path from 'path';
import slugify from 'slugify';
import InventoryItem from '../models/Item.js';
import { supabase } from '../supabaseClient.js';

const BUCKET = process.env.SUPABASE_BUCKET || 'inventory-images';

function buildImagePath(itemCode, name, originalname) {
  const ext = path.extname(originalname || '').toLowerCase() || '.jpg';
  const safeName = slugify(name || 'item', { lower: true, strict: true });
  const ts = Date.now();
  return `${itemCode}/${ts}_${safeName}${ext}`;
}

export async function createInventoryItem(req, res) {
  try {
    const {
      itemCode,
      name,
      category,
      wsPrice,
      rtPrice,
      costPrice,
      stockQuantity,
      description
    } = req.body;

    // You likely have auth middleware: e.g., req.user.email
    const actor = req.user?.email || req.user?.id || 'system';

    let imageUrl = null;
    let imagePath = null;

    if (req.file) {
      const storagePath = buildImagePath(itemCode, name, req.file.originalname);

      const { error: uploadErr } = await supabase
        .storage
        .from(BUCKET)
        .upload(storagePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (uploadErr) {
        console.error('Supabase upload error:', uploadErr);
        return res.status(500).json({ message: 'Failed to upload image' });
      }

      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      imageUrl = publicData.publicUrl;
      imagePath = storagePath;
    }

    const item = await InventoryItem.create({
      itemCode: String(itemCode).trim(),
      name: String(name).trim(),
      category: String(category).trim(),
      wsPrice: Number(wsPrice),
      rtPrice: Number(rtPrice),
      costPrice: Number(costPrice),
      stockQuantity: Number(stockQuantity),
      description: description ? String(description).trim() : '',
      image: imageUrl,
      imagePath,
      createdBy: actor,
      updatedBy: actor
    });

    return res.status(201).json(item);
  } catch (err) {
    console.error('Create inventory error:', err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Item code already exists' });
    }
    return res.status(500).json({ message: 'Server error', error: err?.message });
  }
}
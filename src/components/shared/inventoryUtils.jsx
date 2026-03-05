/**
 * Shared inventory helpers — stacking, adding, removing items.
 */

/**
 * Add an item to inventory with proper stacking.
 * Equipment (with stats) and legendary/rare items are NOT stacked.
 * Resources and consumables stack by id.
 */
export function addItemToInventory(inventory, newItem) {
  const inv = [...(inventory || [])];

  // Equipment or high-rarity items don't stack
  if (newItem.stats || newItem.rarity === "legendary" || newItem.rarity === "rare") {
    inv.push({ ...newItem, qty: 1 });
    return inv;
  }

  // Stackable: merge by id
  const idx = inv.findIndex(i => i.id === newItem.id);
  if (idx >= 0) {
    inv[idx] = { ...inv[idx], qty: (inv[idx].qty || 1) + (newItem.qty || 1) };
  } else {
    inv.push({ ...newItem });
  }

  return inv;
}

/**
 * Remove quantity of an item from inventory. Returns new inventory.
 */
export function removeItemFromInventory(inventory, itemId, qty = 1) {
  return (inventory || [])
    .map(i => i.id === itemId ? { ...i, qty: (i.qty || 1) - qty } : i)
    .filter(i => (i.qty || 0) > 0);
}
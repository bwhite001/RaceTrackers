/**
 * Variant utility for managing component variants
 * Follows the Open/Closed Principle - open for extension, closed for modification
 */

/**
 * Get variant classes based on variant name and size
 * @param {Object} variantMap - Map of variant names to class strings
 * @param {string} variant - The variant to apply
 * @param {string} defaultVariant - Default variant if none specified
 */
export function getVariant(variantMap, variant, defaultVariant = 'default') {
  return variantMap[variant] || variantMap[defaultVariant] || '';
}

/**
 * Get size classes based on size name
 * @param {Object} sizeMap - Map of size names to class strings
 * @param {string} size - The size to apply
 * @param {string} defaultSize - Default size if none specified
 */
export function getSize(sizeMap, size, defaultSize = 'md') {
  return sizeMap[size] || sizeMap[defaultSize] || '';
}

/**
 * Combine base, variant, and size classes
 * @param {string} baseClasses - Base classes always applied
 * @param {string} variantClasses - Variant-specific classes
 * @param {string} sizeClasses - Size-specific classes
 * @param {string} additionalClasses - Additional custom classes
 */
export function combineVariants(baseClasses, variantClasses, sizeClasses, additionalClasses = '') {
  return [baseClasses, variantClasses, sizeClasses, additionalClasses]
    .filter(Boolean)
    .join(' ');
}

export default {
  getVariant,
  getSize,
  combineVariants,
};
